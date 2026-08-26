import ts from "typescript";

export type BrandlessDiagnosticKind = "foreign" | "raw" | "unowned";

export interface BrandlessDiagnostic {
  readonly kind: BrandlessDiagnosticKind;
  readonly node: ts.Node;
  readonly expectedMembers: readonly string[];
  readonly actualMembers?: readonly string[];
  readonly message: string;
}

interface Provenance {
  readonly owned: ReadonlySet<string>;
  readonly raw: boolean;
  readonly unknown: boolean;
}

interface AbstractValue {
  readonly aggregate: Provenance;
  readonly byType: ReadonlyMap<string, Provenance>;
  readonly properties: ReadonlyMap<string, AbstractValue>;
  readonly tuple: readonly AbstractValue[];
}

interface AssignmentSource {
  readonly expression: ts.Expression;
  readonly position: number;
  readonly sourceFile: ts.SourceFile;
}

interface EvaluationContext {
  readonly environment: ReadonlyMap<ts.Symbol, AbstractValue>;
  readonly callStack: ReadonlySet<ts.Symbol>;
}

const emptyProvenance: Provenance = {
  owned: new Set<string>(),
  raw: false,
  unknown: false,
};

function createProvenance(options: {
  readonly owned?: Iterable<string>;
  readonly raw?: boolean;
  readonly unknown?: boolean;
}): Provenance {
  return {
    owned: new Set(options.owned ?? []),
    raw: options.raw ?? false,
    unknown: options.unknown ?? false,
  };
}

function joinProvenance(values: Iterable<Provenance>): Provenance {
  const owned = new Set<string>();
  let raw = false;
  let unknown = false;

  for (const value of values) {
    for (const identity of value.owned) owned.add(identity);
    raw ||= value.raw;
    unknown ||= value.unknown;
  }

  return { owned, raw, unknown };
}

function emptyValue(): AbstractValue {
  return {
    aggregate: emptyProvenance,
    byType: new Map<string, Provenance>(),
    properties: new Map<string, AbstractValue>(),
    tuple: [],
  };
}

function joinTypeMaps(
  values: Iterable<AbstractValue>,
): ReadonlyMap<string, Provenance> {
  const grouped = new Map<string, Provenance[]>();
  for (const value of values) {
    for (const [key, provenance] of value.byType) {
      const bucket = grouped.get(key) ?? [];
      bucket.push(provenance);
      grouped.set(key, bucket);
    }
  }

  return new Map(
    [...grouped].map(([key, bucket]) => [key, joinProvenance(bucket)]),
  );
}

function joinValues(values: Iterable<AbstractValue>): AbstractValue {
  const collected = [...values];
  const propertyBuckets = new Map<string, AbstractValue[]>();
  const maxTupleLength = collected.reduce(
    (length, value) => Math.max(length, value.tuple.length),
    0,
  );

  for (const value of collected) {
    for (const [name, propertyValue] of value.properties) {
      const bucket = propertyBuckets.get(name) ?? [];
      bucket.push(propertyValue);
      propertyBuckets.set(name, bucket);
    }
  }

  return {
    aggregate: joinProvenance(collected.map((value) => value.aggregate)),
    byType: joinTypeMaps(collected),
    properties: new Map(
      [...propertyBuckets].map(([name, bucket]) => [name, joinValues(bucket)]),
    ),
    tuple: Array.from({ length: maxTupleLength }, (_, index) =>
      joinValues(
        collected
          .map((value) => value.tuple[index])
          .filter((value): value is AbstractValue => value !== undefined),
      ),
    ),
  };
}

function canonicalIdentity(members: Iterable<string>): string {
  return [...new Set(members)].sort().join("\u0000");
}

function identityMembers(identity: string): readonly string[] {
  return identity === "" ? [] : identity.split("\u0000");
}

function isProjectSourceFile(sourceFile: ts.SourceFile): boolean {
  return (
    !sourceFile.isDeclarationFile &&
    !sourceFile.fileName.includes("/node_modules/") &&
    !sourceFile.fileName.includes("\\node_modules\\")
  );
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  if (
    ts.isComputedPropertyName(name) &&
    (ts.isStringLiteral(name.expression) ||
      ts.isNoSubstitutionTemplateLiteral(name.expression))
  ) {
    return name.expression.text;
  }
  return undefined;
}

function getStringLiteralValues(type: ts.Type): readonly string[] {
  if (type.isUnion()) {
    return type.types.flatMap((member) => getStringLiteralValues(member));
  }
  if (type.isStringLiteral()) return [type.value];

  const value = (type as ts.Type & { readonly value?: unknown }).value;
  return typeof value === "string" ? [value] : [];
}

export class BrandlessProvenanceAnalyzer {
  readonly #program: ts.Program;
  readonly #checker: ts.TypeChecker;
  readonly #knownIdentities: ReadonlyMap<string, string>;
  readonly #assignments = new Map<ts.Symbol, readonly AssignmentSource[]>();

  public constructor(program: ts.Program) {
    this.#program = program;
    this.#checker = program.getTypeChecker();
    this.#knownIdentities = this.#collectKnownIdentities();
    this.#collectAssignments();
  }

  public analyzeSourceFile(sourceFile: ts.SourceFile): readonly BrandlessDiagnostic[] {
    const diagnostics: BrandlessDiagnostic[] = [];
    const seen = new Set<string>();
    const context: EvaluationContext = {
      environment: new Map<ts.Symbol, AbstractValue>(),
      callStack: new Set<ts.Symbol>(),
    };

    const report = (
      node: ts.Node,
      expectedIdentity: string,
      value: AbstractValue,
    ): void => {
      const diagnostic = this.#classify(
        node,
        expectedIdentity,
        value,
        ts.isExpression(node) ? this.#checker.getTypeAtLocation(node) : undefined,
      );
      if (!diagnostic) return;
      const key = `${diagnostic.kind}:${node.getSourceFile().fileName}:${node.getStart()}:${expectedIdentity}`;
      if (seen.has(key)) return;
      seen.add(key);
      diagnostics.push(diagnostic);
    };

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        this.#checkCallArguments(node, context, report);
        this.#checkHigherOrderArguments(node, context, report);
      } else if (ts.isReturnStatement(node) && node.expression) {
        const functionLike = this.#findEnclosingFunction(node);
        const expectedIdentity = functionLike
          ? this.#identityFromFunctionReturn(functionLike)
          : undefined;
        if (expectedIdentity) {
          report(
            node.expression,
            expectedIdentity,
            this.#evaluate(node.expression, context),
          );
        }
      } else if (ts.isYieldExpression(node) && node.expression) {
        const functionLike = this.#findEnclosingFunction(node);
        const expectedIdentity = functionLike
          ? this.#identityFromFunctionReturn(functionLike)
          : undefined;
        if (expectedIdentity) {
          report(
            node.expression,
            expectedIdentity,
            this.#evaluate(node.expression, context),
          );
        }
      } else if (ts.isVariableDeclaration(node) && node.initializer) {
        const expectedIdentity = node.type
          ? this.#identityFromTypeNode(node.type)
          : this.#identityFromContextualType(node.initializer);
        if (expectedIdentity && ts.isIdentifier(node.name)) {
          report(
            node.initializer,
            expectedIdentity,
            this.#evaluate(node.initializer, context),
          );
        }
      } else if (ts.isPropertyAssignment(node)) {
        const expectedIdentity = this.#identityFromContextualType(node.initializer);
        if (expectedIdentity) {
          report(
            node.initializer,
            expectedIdentity,
            this.#evaluate(node.initializer, context),
          );
        }
      } else if (ts.isSpreadAssignment(node)) {
        this.#checkContextualSpread(node, context, report);
      } else if (
        ts.isBinaryExpression(node) &&
        this.#isAssignmentOperator(node.operatorToken.kind)
      ) {
        const expectedIdentity = this.#identityExpectedFromExpression(node.left);
        if (expectedIdentity) {
          report(
            node.right,
            expectedIdentity,
            this.#evaluate(node.right, context),
          );
        }
      } else if (
        ts.isBinaryExpression(node) &&
        this.#isEqualityOperator(node.operatorToken.kind)
      ) {
        const leftIdentity = this.#identityExpectedFromExpression(node.left);
        const rightIdentity = this.#identityExpectedFromExpression(node.right);
        if (leftIdentity) {
          report(
            node.right,
            leftIdentity,
            this.#evaluate(node.right, context),
          );
        } else if (rightIdentity) {
          report(
            node.left,
            rightIdentity,
            this.#evaluate(node.left, context),
          );
        }
      } else if (ts.isCaseClause(node)) {
        const switchStatement = node.parent.parent;
        const expectedIdentity = this.#identityExpectedFromExpression(
          switchStatement.expression,
        );
        if (expectedIdentity) {
          report(
            node.expression,
            expectedIdentity,
            this.#evaluate(node.expression, context),
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return diagnostics.sort(
      (left, right) => left.node.getStart() - right.node.getStart(),
    );
  }

  #collectKnownIdentities(): ReadonlyMap<string, string> {
    const identities = new Map<string, string>();

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const identity = this.#identityFromEnumFactoryCall(node);
        if (identity) identities.set(identity, identity);
      }
      ts.forEachChild(node, visit);
    };

    for (const sourceFile of this.#program.getSourceFiles()) {
      if (isProjectSourceFile(sourceFile)) visit(sourceFile);
    }
    return identities;
  }

  #collectAssignments(): void {
    const mutable = new Map<ts.Symbol, AssignmentSource[]>();
    const add = (symbol: ts.Symbol | undefined, expression: ts.Expression): void => {
      const resolved = this.#resolveSymbol(symbol);
      if (!resolved) return;
      const bucket = mutable.get(resolved) ?? [];
      bucket.push({
        expression,
        position: expression.getStart(),
        sourceFile: expression.getSourceFile(),
      });
      mutable.set(resolved, bucket);
    };

    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer
      ) {
        add(this.#checker.getSymbolAtLocation(node.name), node.initializer);
      } else if (
        ts.isBinaryExpression(node) &&
        this.#isAssignmentOperator(node.operatorToken.kind) &&
        ts.isIdentifier(node.left)
      ) {
        add(this.#checker.getSymbolAtLocation(node.left), node.right);
      }
      ts.forEachChild(node, visit);
    };

    for (const sourceFile of this.#program.getSourceFiles()) {
      if (isProjectSourceFile(sourceFile)) visit(sourceFile);
    }

    for (const [symbol, assignments] of mutable) {
      this.#assignments.set(
        symbol,
        assignments.sort((left, right) => left.position - right.position),
      );
    }
  }

  #resolveSymbol(symbol: ts.Symbol | undefined): ts.Symbol | undefined {
    if (!symbol) return undefined;
    if (symbol.flags & ts.SymbolFlags.Alias) {
      return this.#checker.getAliasedSymbol(symbol);
    }
    return symbol;
  }

  #identityFromEnumFactoryCall(call: ts.CallExpression): string | undefined {
    const firstArgument = call.arguments[0];
    if (!firstArgument || !ts.isArrayLiteralExpression(firstArgument)) {
      return undefined;
    }

    const callType = this.#checker.getTypeAtLocation(call);
    if (
      !this.#checker.getPropertyOfType(callType, "enum") ||
      !this.#checker.getPropertyOfType(callType, "~type")
    ) {
      return undefined;
    }

    const members: string[] = [];
    for (const element of firstArgument.elements) {
      if (
        ts.isStringLiteral(element) ||
        ts.isNoSubstitutionTemplateLiteral(element)
      ) {
        members.push(element.text);
      } else {
        return undefined;
      }
    }
    return members.length === 0 ? undefined : canonicalIdentity(members);
  }

  #identityFromMarkedType(
    type: ts.Type,
    markerName: string,
    location: ts.Node,
  ): string | undefined {
    const marker = type
      .getProperties()
      .find((property) => String(property.escapedName).includes(markerName));
    if (!marker) return undefined;

    const markerType = this.#checker.getTypeOfSymbolAtLocation(marker, location);
    const members = markerType
      .getProperties()
      .map((property) => String(property.escapedName))
      .filter((name) => !name.startsWith("__@"));
    return members.length === 0 ? undefined : canonicalIdentity(members);
  }

  #identityFromEnumContainerExpression(
    expression: ts.Expression,
  ): string | undefined {
    const unwrapped = unwrapExpression(expression);
    const directType = this.#checker.getTypeAtLocation(unwrapped);
    const direct = this.#identityFromMarkedType(
      directType,
      "ENUMWAII_ENUM_IDENTITY",
      unwrapped,
    );
    if (direct) return direct;

    const enumProperty = this.#checker.getPropertyOfType(directType, "enum");
    if (enumProperty) {
      const enumType = this.#checker.getTypeOfSymbolAtLocation(
        enumProperty,
        unwrapped,
      );
      const fromDeclaration = this.#identityFromMarkedType(
        enumType,
        "ENUMWAII_ENUM_IDENTITY",
        unwrapped,
      );
      if (fromDeclaration) return fromDeclaration;
    }

    if (ts.isIdentifier(unwrapped)) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(unwrapped),
      );
      for (const declaration of symbol?.declarations ?? []) {
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          const fromInitializer = this.#identityFromEnumContainerExpression(
            declaration.initializer,
          );
          if (fromInitializer) return fromInitializer;
        }
      }
    }

    if (
      ts.isPropertyAccessExpression(unwrapped) &&
      unwrapped.name.text === "enum"
    ) {
      return this.#identityFromEnumContainerExpression(unwrapped.expression);
    }

    if (ts.isCallExpression(unwrapped)) {
      return this.#identityFromEnumFactoryCall(unwrapped);
    }

    return undefined;
  }

  #identityFromProducerExpression(
    expression: ts.Expression,
  ): string | undefined {
    const unwrapped = unwrapExpression(expression);
    const type = this.#checker.getTypeAtLocation(unwrapped);
    const marked = this.#identityFromMarkedType(
      type,
      "ENUMWAII_PARSE_IDENTITY",
      unwrapped,
    );
    if (marked) return marked;

    if (ts.isIdentifier(unwrapped)) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(unwrapped),
      );
      for (const declaration of symbol?.declarations ?? []) {
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          const fromInitializer = this.#identityFromProducerExpression(
            declaration.initializer,
          );
          if (fromInitializer) return fromInitializer;
        }
      }
    }
    return undefined;
  }

  #identityFromType(type: ts.Type): string | undefined {
    const members = getStringLiteralValues(type);
    if (members.length === 0) return undefined;
    const identity = canonicalIdentity(members);
    return this.#knownIdentities.get(identity);
  }

  #identityFromContextualType(expression: ts.Expression): string | undefined {
    const contextualType = this.#checker.getContextualType(expression);
    return contextualType ? this.#identityFromType(contextualType) : undefined;
  }

  #identityFromTypeNode(
    node: ts.TypeNode,
    seenSymbols = new Set<ts.Symbol>(),
  ): string | undefined {
    const direct = this.#identityFromType(this.#checker.getTypeFromTypeNode(node));
    if (direct) return direct;

    if (ts.isTypeReferenceNode(node)) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(node.typeName),
      );
      if (symbol && !seenSymbols.has(symbol)) {
        seenSymbols.add(symbol);
        for (const declaration of symbol.declarations ?? []) {
          if (ts.isTypeAliasDeclaration(declaration)) {
            const fromAlias = this.#identityFromTypeNode(
              declaration.type,
              seenSymbols,
            );
            if (fromAlias) return fromAlias;
          }
        }
      }
      for (const argument of node.typeArguments ?? []) {
        const fromArgument = this.#identityFromTypeNode(argument, seenSymbols);
        if (fromArgument) return fromArgument;
      }
    }

    if (ts.isTypeQueryNode(node)) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(node.exprName),
      );
      for (const declaration of symbol?.declarations ?? []) {
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          const identity = this.#identityFromEnumContainerExpression(
            declaration.initializer,
          );
          if (identity) return identity;
        }
      }
    }

    let result: string | undefined;
    node.forEachChild((child) => {
      if (!result && ts.isTypeNode(child)) {
        result = this.#identityFromTypeNode(child, seenSymbols);
      }
    });
    return result;
  }

  #identityExpectedFromExpression(
    expression: ts.Expression,
  ): string | undefined {
    const unwrapped = unwrapExpression(expression);
    const directContainerIdentity =
      ts.isPropertyAccessExpression(unwrapped) ||
      ts.isElementAccessExpression(unwrapped)
        ? this.#identityFromEnumMemberExpression(unwrapped)
        : undefined;
    if (directContainerIdentity) return directContainerIdentity;

    const typeIdentity = this.#identityFromType(
      this.#checker.getTypeAtLocation(unwrapped),
    );
    if (typeIdentity) return typeIdentity;

    if (ts.isIdentifier(unwrapped)) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(unwrapped),
      );
      for (const declaration of symbol?.declarations ?? []) {
        if (
          (ts.isVariableDeclaration(declaration) ||
            ts.isParameter(declaration) ||
            ts.isPropertyDeclaration(declaration) ||
            ts.isPropertySignature(declaration)) &&
          declaration.type
        ) {
          const fromAnnotation = this.#identityFromTypeNode(declaration.type);
          if (fromAnnotation) return fromAnnotation;
        }
        if (ts.isBindingElement(declaration)) {
          const variableDeclaration = declaration.parent.parent;
          if (
            ts.isVariableDeclaration(variableDeclaration) &&
            variableDeclaration.type
          ) {
            const fromBinding = this.#identityFromTypeNode(
              variableDeclaration.type,
            );
            if (fromBinding) return fromBinding;
          }
        }
      }
    }

    return this.#identityFromContextualType(unwrapped);
  }

  #identityFromEnumMemberExpression(
    expression: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  ): string | undefined {
    const objectExpression = expression.expression;
    const memberName = ts.isPropertyAccessExpression(expression)
      ? expression.name.text
      : expression.argumentExpression &&
          (ts.isStringLiteral(expression.argumentExpression) ||
            ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression))
        ? expression.argumentExpression.text
        : undefined;
    if (!memberName) return undefined;

    const identity = this.#identityFromEnumContainerExpression(objectExpression);
    return identity && identityMembers(identity).includes(memberName)
      ? identity
      : undefined;
  }

  #typeLeafKeys(type: ts.Type, seen = new Set<ts.Type>()): readonly string[] {
    if (seen.has(type)) return [];
    seen.add(type);

    if (type.isUnionOrIntersection()) {
      return [...new Set(type.types.flatMap((member) => this.#typeLeafKeys(member, seen)))];
    }
    if (type.isStringLiteral()) return [`string:${type.value}`];

    const literalValue = (type as ts.Type & { readonly value?: unknown }).value;
    if (typeof literalValue === "string") return [`string:${literalValue}`];

    if (type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = this.#checker.getBaseConstraintOfType(type);
      return constraint ? this.#typeLeafKeys(constraint, seen) : [];
    }

    if (type.flags & ts.TypeFlags.String) return ["string:*"];

    if (type.flags & ts.TypeFlags.Object) {
      const typeArguments = this.#checker.getTypeArguments(type as ts.TypeReference);
      if (typeArguments.length > 0) {
        return [
          ...new Set(
            typeArguments.flatMap((argument) => this.#typeLeafKeys(argument, seen)),
          ),
        ];
      }
    }

    return [];
  }

  #scalarValue(type: ts.Type, provenance: Provenance): AbstractValue {
    const keys = this.#typeLeafKeys(type);
    return {
      aggregate: provenance,
      byType: new Map(keys.map((key) => [key, provenance])),
      properties: new Map<string, AbstractValue>(),
      tuple: [],
    };
  }

  #unknownValue(type: ts.Type): AbstractValue {
    return this.#scalarValue(type, createProvenance({ unknown: true }));
  }

  #ownedValue(type: ts.Type, identity: string): AbstractValue {
    return this.#scalarValue(type, createProvenance({ owned: [identity] }));
  }

  #rawValue(type: ts.Type): AbstractValue {
    return this.#scalarValue(type, createProvenance({ raw: true }));
  }

  #transferToType(
    sources: Iterable<AbstractValue>,
    resultType: ts.Type,
  ): AbstractValue {
    const collected = [...sources];
    const sourceMap = joinTypeMaps(collected);
    const resultMap = new Map<string, Provenance>();
    for (const key of this.#typeLeafKeys(resultType)) {
      const source = sourceMap.get(key);
      if (source) resultMap.set(key, source);
    }

    const mapped = [...resultMap.values()];
    return {
      aggregate:
        mapped.length > 0
          ? joinProvenance(mapped)
          : createProvenance({ unknown: true }),
      byType: resultMap,
      properties: new Map<string, AbstractValue>(),
      tuple: [],
    };
  }

  #evaluate(
    expression: ts.Expression,
    context: EvaluationContext,
  ): AbstractValue {
    const unwrapped = unwrapExpression(expression);
    const type = this.#checker.getTypeAtLocation(unwrapped);

    if (
      ts.isStringLiteral(unwrapped) ||
      ts.isNoSubstitutionTemplateLiteral(unwrapped) ||
      (ts.isTemplateExpression(unwrapped) && unwrapped.templateSpans.length === 0)
    ) {
      return this.#rawValue(type);
    }

    if (
      ts.isPropertyAccessExpression(unwrapped) ||
      ts.isElementAccessExpression(unwrapped)
    ) {
      const ownedIdentity = this.#identityFromEnumMemberExpression(unwrapped);
      if (ownedIdentity) return this.#ownedValue(type, ownedIdentity);

      const markedValuesIdentity = this.#identityFromMarkedType(
        type,
        "ENUMWAII_VALUES_IDENTITY",
        unwrapped,
      );
      if (markedValuesIdentity) {
        const byType = new Map<string, Provenance>();
        for (const member of identityMembers(markedValuesIdentity)) {
          byType.set(
            `string:${member}`,
            createProvenance({ owned: [markedValuesIdentity] }),
          );
        }
        return {
          aggregate: createProvenance({ owned: [markedValuesIdentity] }),
          byType,
          properties: new Map<string, AbstractValue>(),
          tuple: [],
        };
      }

      const objectValue = this.#evaluate(unwrapped.expression, context);
      const name = ts.isPropertyAccessExpression(unwrapped)
        ? unwrapped.name.text
        : unwrapped.argumentExpression && ts.isStringLiteral(unwrapped.argumentExpression)
          ? unwrapped.argumentExpression.text
          : undefined;
      if (name) {
        const propertyValue = objectValue.properties.get(name);
        if (propertyValue) return propertyValue;
      }
      if (
        ts.isElementAccessExpression(unwrapped) &&
        unwrapped.argumentExpression &&
        ts.isNumericLiteral(unwrapped.argumentExpression)
      ) {
        const tupleValue = objectValue.tuple[Number(unwrapped.argumentExpression.text)];
        if (tupleValue) return tupleValue;
      }
      return this.#transferToType([objectValue], type);
    }

    if (ts.isIdentifier(unwrapped)) {
      return this.#evaluateIdentifier(unwrapped, context);
    }

    if (ts.isConditionalExpression(unwrapped)) {
      return joinValues([
        this.#evaluate(unwrapped.whenTrue, context),
        this.#evaluate(unwrapped.whenFalse, context),
      ]);
    }

    if (
      ts.isBinaryExpression(unwrapped) &&
      (unwrapped.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
        unwrapped.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        unwrapped.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
    ) {
      return joinValues([
        this.#evaluate(unwrapped.left, context),
        this.#evaluate(unwrapped.right, context),
      ]);
    }

    if (ts.isArrayLiteralExpression(unwrapped)) {
      return this.#evaluateArray(unwrapped, context);
    }

    if (ts.isObjectLiteralExpression(unwrapped)) {
      return this.#evaluateObject(unwrapped, context);
    }

    if (ts.isCallExpression(unwrapped)) {
      return this.#evaluateCall(unwrapped, context);
    }

    if (ts.isNewExpression(unwrapped)) {
      const sources = (unwrapped.arguments ?? []).map((argument) =>
        this.#evaluate(argument, context),
      );
      return this.#transferToType(sources, type);
    }

    if (ts.isAwaitExpression(unwrapped)) {
      return this.#transferToType(
        [this.#evaluate(unwrapped.expression, context)],
        type,
      );
    }

    if (ts.isCommaListExpression(unwrapped)) {
      const last = unwrapped.elements.at(-1);
      return last ? this.#evaluate(last, context) : emptyValue();
    }

    return this.#unknownValue(type);
  }

  #evaluateIdentifier(
    identifier: ts.Identifier,
    context: EvaluationContext,
  ): AbstractValue {
    const symbol = this.#resolveSymbol(this.#checker.getSymbolAtLocation(identifier));
    const type = this.#checker.getTypeAtLocation(identifier);
    if (!symbol) return this.#unknownValue(type);

    const fromEnvironment = context.environment.get(symbol);
    if (fromEnvironment) return fromEnvironment;

    for (const declaration of symbol.declarations ?? []) {
      if (ts.isBindingElement(declaration)) {
        const fromBinding = this.#evaluateBindingElement(declaration, context);
        if (fromBinding) return fromBinding;
      }
      if (ts.isParameter(declaration)) {
        const fromCallback = this.#evaluateCallbackParameter(declaration, context);
        if (fromCallback) return fromCallback;
        if (declaration.type) {
          const identity = this.#identityFromTypeNode(declaration.type);
          if (identity) return this.#ownedValue(type, identity);
        }
      }
      if (
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer === undefined &&
        ts.isVariableDeclarationList(declaration.parent) &&
        ts.isForOfStatement(declaration.parent.parent)
      ) {
        const iterable = this.#evaluate(
          declaration.parent.parent.expression,
          context,
        );
        return this.#transferToType([iterable], type);
      }
    }

    const assignments = this.#assignments.get(symbol) ?? [];
    const reaching = assignments.filter((assignment) => {
      if (assignment.sourceFile !== identifier.getSourceFile()) return true;
      return assignment.position <= identifier.getStart();
    });
    if (reaching.length > 0) {
      return joinValues(
        reaching.map((assignment) =>
          this.#evaluate(assignment.expression, context),
        ),
      );
    }

    for (const declaration of symbol.declarations ?? []) {
      if (
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isPropertyDeclaration(declaration) ||
          ts.isPropertySignature(declaration)) &&
        declaration.type
      ) {
        const identity = this.#identityFromTypeNode(declaration.type);
        if (
          identity &&
          (declaration.getSourceFile().isDeclarationFile ||
            (ts.isVariableDeclaration(declaration) &&
              declaration.initializer === undefined))
        ) {
          return this.#ownedValue(type, identity);
        }
      }
    }

    return this.#unknownValue(type);
  }

  #evaluateBindingElement(
    binding: ts.BindingElement,
    context: EvaluationContext,
  ): AbstractValue | undefined {
    const variableDeclaration = binding.parent.parent;
    if (!ts.isVariableDeclaration(variableDeclaration) || !variableDeclaration.initializer) {
      return undefined;
    }
    const source = this.#evaluate(variableDeclaration.initializer, context);
    const name = binding.propertyName
      ? propertyNameText(binding.propertyName)
      : ts.isIdentifier(binding.name)
        ? binding.name.text
        : undefined;
    if (name) return source.properties.get(name);

    if (ts.isArrayBindingPattern(binding.parent)) {
      const index = binding.parent.elements.indexOf(binding);
      return source.tuple[index];
    }
    return undefined;
  }

  #evaluateCallbackParameter(
    parameter: ts.ParameterDeclaration,
    context: EvaluationContext,
  ): AbstractValue | undefined {
    const functionLike = parameter.parent;
    if (
      !ts.isArrowFunction(functionLike) &&
      !ts.isFunctionExpression(functionLike)
    ) {
      return undefined;
    }
    const call = functionLike.parent;
    if (!ts.isCallExpression(call) && !ts.isNewExpression(call)) return undefined;
    const callbackIndex = call.arguments?.indexOf(functionLike) ?? -1;
    if (callbackIndex < 0) return undefined;

    const sources = this.#callTransferSources(call, context, callbackIndex);
    return this.#transferToType(
      sources,
      this.#checker.getTypeAtLocation(parameter.name),
    );
  }

  #evaluateArray(
    array: ts.ArrayLiteralExpression,
    context: EvaluationContext,
  ): AbstractValue {
    const tuple: AbstractValue[] = [];
    for (const element of array.elements) {
      if (ts.isSpreadElement(element)) {
        const spread = this.#evaluate(element.expression, context);
        if (spread.tuple.length > 0) tuple.push(...spread.tuple);
        else tuple.push(spread);
      } else {
        tuple.push(this.#evaluate(element, context));
      }
    }
    const combined = joinValues(tuple);
    return {
      aggregate: combined.aggregate,
      byType: combined.byType,
      properties: new Map<string, AbstractValue>(),
      tuple,
    };
  }

  #evaluateObject(
    object: ts.ObjectLiteralExpression,
    context: EvaluationContext,
  ): AbstractValue {
    const properties = new Map<string, AbstractValue>();
    const allValues: AbstractValue[] = [];

    for (const property of object.properties) {
      if (ts.isPropertyAssignment(property)) {
        const name = propertyNameText(property.name);
        const value = this.#evaluate(property.initializer, context);
        if (name) properties.set(name, value);
        allValues.push(value);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        const value = this.#evaluate(property.name, context);
        properties.set(property.name.text, value);
        allValues.push(value);
      } else if (ts.isSpreadAssignment(property)) {
        const spread = this.#evaluate(property.expression, context);
        for (const [name, value] of spread.properties) properties.set(name, value);
        allValues.push(spread);
      }
    }

    const combined = joinValues(allValues);
    return {
      aggregate: combined.aggregate,
      byType: combined.byType,
      properties,
      tuple: [],
    };
  }

  #evaluateCall(
    call: ts.CallExpression,
    context: EvaluationContext,
  ): AbstractValue {
    const type = this.#checker.getTypeAtLocation(call);
    const producerIdentity = this.#identityFromProducerExpression(call.expression);
    if (producerIdentity) return this.#ownedValue(type, producerIdentity);

    if (ts.isPropertyAccessExpression(call.expression)) {
      const receiverIdentity = this.#identityFromEnumContainerExpression(
        call.expression.expression,
      );
      if (call.expression.name.text === "parse" && receiverIdentity) {
        return this.#ownedValue(type, receiverIdentity);
      }
    }

    const implementation = this.#getFunctionImplementation(call.expression);
    if (implementation) {
      const symbol = this.#resolveSymbol(
        this.#checker.getSymbolAtLocation(call.expression),
      );
      if (!symbol || !context.callStack.has(symbol)) {
        const environment = new Map(context.environment);
        implementation.parameters.forEach((parameter, index) => {
          if (!ts.isIdentifier(parameter.name)) return;
          const parameterSymbol = this.#resolveSymbol(
            this.#checker.getSymbolAtLocation(parameter.name),
          );
          const argument = call.arguments[index];
          if (parameterSymbol && argument) {
            environment.set(parameterSymbol, this.#evaluate(argument, context));
          }
        });

        const nextStack = new Set(context.callStack);
        if (symbol) nextStack.add(symbol);
        const returnValues = this.#functionOutputValues(implementation, {
          environment,
          callStack: nextStack,
        });
        if (returnValues.length > 0) {
          return this.#transferToType(returnValues, type);
        }
      }
    }

    const signature = this.#checker.getResolvedSignature(call);
    const declaration = signature?.getDeclaration();
    const declarationHasBody =
      declaration !== undefined &&
      (ts.isFunctionDeclaration(declaration) ||
        ts.isMethodDeclaration(declaration) ||
        ts.isConstructorDeclaration(declaration) ||
        ts.isGetAccessorDeclaration(declaration) ||
        ts.isSetAccessorDeclaration(declaration)) &&
      declaration.body !== undefined;
    if (signature && declaration && !declarationHasBody) {
      const identity = declaration.type
        ? this.#identityFromTypeNode(declaration.type)
        : this.#identityFromType(signature.getReturnType());
      if (identity && call.arguments.length === 0) {
        return this.#ownedValue(type, identity);
      }
    }

    return this.#transferToType(this.#callTransferSources(call, context), type);
  }

  #callTransferSources(
    call: ts.CallExpression | ts.NewExpression,
    context: EvaluationContext,
    excludedArgumentIndex = -1,
  ): readonly AbstractValue[] {
    const sources: AbstractValue[] = [];
    if (ts.isCallExpression(call) && ts.isPropertyAccessExpression(call.expression)) {
      sources.push(this.#evaluate(call.expression.expression, context));
    }
    (call.arguments ?? []).forEach((argument, index) => {
      if (index === excludedArgumentIndex) return;
      if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) {
        const callbackEnvironment = new Map(context.environment);
        argument.parameters.forEach((parameter) => {
          if (!ts.isIdentifier(parameter.name)) return;
          const symbol = this.#resolveSymbol(
            this.#checker.getSymbolAtLocation(parameter.name),
          );
          if (!symbol) return;
          callbackEnvironment.set(
            symbol,
            this.#transferToType(
              sources,
              this.#checker.getTypeAtLocation(parameter.name),
            ),
          );
        });
        sources.push(
          ...this.#functionOutputValues(argument, {
            environment: callbackEnvironment,
            callStack: context.callStack,
          }),
        );
      } else {
        sources.push(this.#evaluate(argument, context));
      }
    });
    return sources;
  }

  #getFunctionImplementation(
    expression: ts.Expression,
  ): ts.FunctionLikeDeclaration | undefined {
    const symbol = this.#resolveSymbol(this.#checker.getSymbolAtLocation(expression));
    for (const declaration of symbol?.declarations ?? []) {
      if (
        (ts.isFunctionDeclaration(declaration) ||
          ts.isMethodDeclaration(declaration) ||
          ts.isFunctionExpression(declaration) ||
          ts.isArrowFunction(declaration)) &&
        declaration.body
      ) {
        return declaration;
      }
      if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
        if (
          ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer)
        ) {
          return declaration.initializer;
        }
      }
    }
    return undefined;
  }

  #functionOutputValues(
    functionLike: ts.FunctionLikeDeclaration,
    context: EvaluationContext,
  ): readonly AbstractValue[] {
    if (!functionLike.body) return [];
    if (!ts.isBlock(functionLike.body)) {
      return [this.#evaluate(functionLike.body, context)];
    }

    const values: AbstractValue[] = [];
    const visit = (node: ts.Node): void => {
      if (node !== functionLike && ts.isFunctionLike(node)) return;
      if (ts.isReturnStatement(node) && node.expression) {
        values.push(this.#evaluate(node.expression, context));
        return;
      }
      if (ts.isYieldExpression(node) && node.expression) {
        values.push(this.#evaluate(node.expression, context));
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(functionLike.body);
    return values;
  }

  #findEnclosingFunction(node: ts.Node): ts.FunctionLikeDeclaration | undefined {
    let current = node.parent;
    while (current) {
      if (
        ts.isFunctionDeclaration(current) ||
        ts.isMethodDeclaration(current) ||
        ts.isConstructorDeclaration(current) ||
        ts.isGetAccessorDeclaration(current) ||
        ts.isSetAccessorDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current)
      ) {
        return current;
      }
      current = current.parent;
    }
    return undefined;
  }

  #identityFromFunctionReturn(
    functionLike: ts.FunctionLikeDeclaration,
  ): string | undefined {
    if (functionLike.type) {
      const fromTypeNode = this.#identityFromTypeNode(functionLike.type);
      if (fromTypeNode) return fromTypeNode;
    }
    const signature = this.#checker.getSignatureFromDeclaration(functionLike);
    return signature
      ? this.#identityFromType(this.#checker.getReturnTypeOfSignature(signature))
      : undefined;
  }

  #checkCallArguments(
    call: ts.CallExpression | ts.NewExpression,
    context: EvaluationContext,
    report: (
      node: ts.Node,
      expectedIdentity: string,
      value: AbstractValue,
    ) => void,
  ): void {
    const signature = ts.isCallExpression(call)
      ? this.#checker.getResolvedSignature(call)
      : this.#checker.getResolvedSignature(call);
    if (!signature) return;
    const declaration = signature.getDeclaration();
    const parameters = declaration?.parameters ?? [];

    (call.arguments ?? []).forEach((argument, index) => {
      const parameter = parameters[Math.min(index, parameters.length - 1)];
      const expectedIdentity = parameter?.type
        ? this.#identityFromTypeNode(parameter.type)
        : this.#identityFromContextualType(argument);
      if (expectedIdentity) {
        report(argument, expectedIdentity, this.#evaluate(argument, context));
      }
    });
  }

  #checkHigherOrderArguments(
    call: ts.CallExpression | ts.NewExpression,
    context: EvaluationContext,
    report: (
      node: ts.Node,
      expectedIdentity: string,
      value: AbstractValue,
    ) => void,
  ): void {
    for (const [index, argument] of (call.arguments ?? []).entries()) {
      if (
        ts.isArrowFunction(argument) ||
        ts.isFunctionExpression(argument)
      ) {
        continue;
      }
      const implementation = this.#getFunctionImplementation(argument);
      const symbol = this.#resolveSymbol(this.#checker.getSymbolAtLocation(argument));
      const declarations = implementation
        ? [implementation]
        : (symbol?.declarations ?? []).filter(ts.isFunctionLike);
      const target = declarations.find((declaration) => {
        const first = declaration.parameters[0];
        return first?.type && this.#identityFromTypeNode(first.type);
      });
      const firstParameter = target?.parameters[0];
      const expectedIdentity = firstParameter?.type
        ? this.#identityFromTypeNode(firstParameter.type)
        : undefined;
      if (!expectedIdentity || !firstParameter) continue;

      const value = this.#transferToType(
        this.#callTransferSources(call, context, index),
        this.#checker.getTypeAtLocation(firstParameter.name),
      );
      report(argument, expectedIdentity, value);
    }
  }

  #checkContextualSpread(
    spread: ts.SpreadAssignment,
    context: EvaluationContext,
    report: (
      node: ts.Node,
      expectedIdentity: string,
      value: AbstractValue,
    ) => void,
  ): void {
    const targetType = this.#checker.getContextualType(spread.parent);
    if (!targetType) return;
    const source = this.#evaluate(spread.expression, context);
    for (const property of targetType.getProperties()) {
      const propertyType = this.#checker.getTypeOfSymbolAtLocation(property, spread);
      const expectedIdentity = this.#identityFromType(propertyType);
      if (!expectedIdentity) continue;
      const propertyValue = source.properties.get(String(property.escapedName));
      if (propertyValue) report(spread.expression, expectedIdentity, propertyValue);
    }
  }

  #classify(
    node: ts.Node,
    expectedIdentity: string,
    value: AbstractValue,
    type: ts.Type | undefined,
  ): BrandlessDiagnostic | undefined {
    const relevant = type
      ? this.#typeLeafKeys(type)
          .map((key) => value.byType.get(key))
          .filter((entry): entry is Provenance => entry !== undefined)
      : [];
    const provenance =
      relevant.length > 0 ? joinProvenance(relevant) : value.aggregate;
    const expectedMembers = identityMembers(expectedIdentity);

    if (provenance.raw) {
      return {
        kind: "raw",
        node,
        expectedMembers,
        message: `Raw string flow cannot satisfy enumwaii [${expectedMembers.join(", ")}]. Use the owning .enum member or parser result.`,
      };
    }

    const foreign = [...provenance.owned].filter(
      (identity) => identity !== expectedIdentity,
    );
    if (foreign.length > 0) {
      const actualMembers = identityMembers(foreign[0] ?? "");
      return {
        kind: "foreign",
        node,
        expectedMembers,
        actualMembers,
        message: `Value belongs to enumwaii [${actualMembers.join(", ")}], not [${expectedMembers.join(", ")}].`,
      };
    }

    if (
      provenance.unknown ||
      !provenance.owned.has(expectedIdentity) ||
      provenance.owned.size !== 1
    ) {
      return {
        kind: "unowned",
        node,
        expectedMembers,
        message: `Ownership of enumwaii [${expectedMembers.join(", ")}] could not be proven. Parse it or preserve provenance through a trusted identity contract.`,
      };
    }

    return undefined;
  }

  #isAssignmentOperator(kind: ts.SyntaxKind): boolean {
    return (
      kind >= ts.SyntaxKind.FirstAssignment &&
      kind <= ts.SyntaxKind.LastAssignment
    );
  }

  #isEqualityOperator(kind: ts.SyntaxKind): boolean {
    return (
      kind === ts.SyntaxKind.EqualsEqualsToken ||
      kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsToken ||
      kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
    );
  }
}
