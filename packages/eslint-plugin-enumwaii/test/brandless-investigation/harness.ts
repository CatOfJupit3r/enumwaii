import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import * as ts from "typescript";

const OWNED_MARKER_NAME = "ENUMWAII_OWNED";

export interface VirtualProject {
  readonly rootDir: string;
  readonly program: ts.Program;
  dispose(): Promise<void>;
}

export interface LocatedDiagnostic {
  readonly code: number;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

export type OwnershipIssueKind =
  | "foreign-enum"
  | "raw-string"
  | "unsafe-assertion";

export interface OwnershipIssue {
  readonly kind: OwnershipIssueKind;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

export interface ProgramMetrics {
  readonly checkMs: number;
  readonly types: number;
  readonly instantiations: number;
  readonly symbols: number;
  readonly diagnostics: number;
}

export const nativeApiDeclaration = String.raw`
export declare const ENUMWAII_CONTAINER: unique symbol;

export interface NativeEnumwaii<TMember extends string> {
  readonly enum: {
    readonly [TKey in TMember]: TKey;
  } & {
    readonly [ENUMWAII_CONTAINER]: TMember;
  };
  readonly values: readonly TMember[] & {
    readonly [ENUMWAII_CONTAINER]: TMember;
  };
  readonly "~type": TMember;
  parse(input: unknown): TMember;
  derive<const TValue>(
    mapping: Readonly<Record<TMember, TValue>>,
  ): Readonly<Record<TMember, TValue>>;
}

export declare function em<
  const TValues extends readonly [string, ...string[]],
>(values: TValues): NativeEnumwaii<TValues[number]>;
`;

export const shadowApiDeclaration = String.raw`
export declare const ENUMWAII_OWNED: unique symbol;
export declare const ENUMWAII_CONTAINER: unique symbol;

export type OwnedValue<
  TRaw extends string,
  TCompleteSet extends string,
> = TRaw extends string
  ? TRaw & {
      readonly [ENUMWAII_OWNED]: {
        readonly raw: TRaw;
        readonly completeSet: TCompleteSet;
        readonly invariant: (
          value: TCompleteSet,
        ) => TCompleteSet;
      };
    }
  : never;

export interface ShadowEnumwaii<TMember extends string> {
  readonly enum: {
    readonly [TKey in TMember]: OwnedValue<TKey, TMember>;
  } & {
    readonly [ENUMWAII_CONTAINER]: TMember;
  };
  readonly values: readonly OwnedValue<TMember, TMember>[] & {
    readonly [ENUMWAII_CONTAINER]: TMember;
  };
  readonly "~type": OwnedValue<TMember, TMember>;
  parse(input: unknown): OwnedValue<TMember, TMember>;
  derive<const TValue>(
    mapping: Readonly<Record<TMember, TValue>>,
  ): Readonly<Record<TMember, TValue>>;
}

export declare function em<
  const TValues extends readonly [string, ...string[]],
>(values: TValues): ShadowEnumwaii<TValues[number]>;
`;

export async function createVirtualProject(
  files: Readonly<Record<string, string>>,
  options: ts.CompilerOptions = {},
): Promise<VirtualProject> {
  const rootDir = await mkdtemp(path.join(tmpdir(), "enumwaii-brandless-"));

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const filePath = path.join(rootDir, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
    }),
  );

  const rootNames = Object.keys(files)
    .filter((file) => /\.(?:[cm]?[jt]sx?|d\.[cm]?ts)$/u.test(file))
    .map((file) => path.join(rootDir, file));
  const program = ts.createProgram({
    rootNames,
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowJs: true,
      checkJs: true,
      noUncheckedIndexedAccess: true,
      noErrorTruncation: true,
      types: [],
      ...options,
    },
  });

  return {
    rootDir,
    program,
    async dispose(): Promise<void> {
      await rm(rootDir, { recursive: true, force: true });
    },
  };
}

export function collectDiagnostics(
  project: VirtualProject,
): readonly LocatedDiagnostic[] {
  return ts
    .getPreEmitDiagnostics(project.program)
    .filter(
      (diagnostic): diagnostic is ts.DiagnosticWithLocation =>
        diagnostic.file !== undefined && diagnostic.start !== undefined,
    )
    .map((diagnostic) => {
      const position = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      return {
        code: diagnostic.code,
        file: path.relative(project.rootDir, diagnostic.file.fileName),
        line: position.line + 1,
        column: position.character + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      };
    });
}

export function measureProgram(project: VirtualProject): ProgramMetrics {
  const start = performance.now();
  const diagnostics = project.program.getSemanticDiagnostics();
  const checkMs = performance.now() - start;
  return {
    checkMs,
    types: project.program.getTypeCount(),
    instantiations: project.program.getInstantiationCount(),
    symbols: project.program.getSymbolCount(),
    diagnostics: diagnostics.length,
  };
}

export function analyzeOwnership(project: VirtualProject): readonly OwnershipIssue[] {
  const checker = project.program.getTypeChecker();
  const issues: OwnershipIssue[] = [];
  const reported = new Set<string>();

  function containsOwnedMarker(
    type: ts.Type,
    seen: Set<ts.Type> = new Set(),
  ): boolean {
    if (seen.has(type)) return false;
    seen.add(type);

    if (
      type
        .getProperties()
        .some((property) =>
          String(property.escapedName).includes(OWNED_MARKER_NAME),
        )
    ) {
      return true;
    }
    if (type.isUnionOrIntersection()) {
      return type.types.some((member) => containsOwnedMarker(member, seen));
    }
    const constraint = checker.getBaseConstraintOfType(type);
    return constraint !== undefined && containsOwnedMarker(constraint, seen);
  }

  function containsTypeParameter(
    type: ts.Type,
    seen: Set<ts.Type> = new Set(),
  ): boolean {
    if (seen.has(type)) return false;
    seen.add(type);
    if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) return true;
    if (type.isUnionOrIntersection()) {
      return type.types.some((member) => containsTypeParameter(member, seen));
    }
    return false;
  }

  function isStringLike(type: ts.Type): boolean {
    if ((type.flags & ts.TypeFlags.StringLike) !== 0) return true;
    return type.isUnionOrIntersection()
      ? type.types.every((member) => isStringLike(member))
      : false;
  }

  function issueLocation(node: ts.Node): {
    readonly file: string;
    readonly line: number;
    readonly column: number;
  } {
    const sourceFile = node.getSourceFile();
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return {
      file: path.relative(project.rootDir, sourceFile.fileName),
      line: position.line + 1,
      column: position.character + 1,
    };
  }

  function report(
    node: ts.Node,
    kind: OwnershipIssueKind,
    message: string,
  ): void {
    const location = issueLocation(node);
    const key = `${location.file}:${location.line}:${kind}`;
    if (reported.has(key)) return;
    reported.add(key);
    issues.push({ ...location, kind, message });
  }

  function checkOwnedTarget(expression: ts.Expression, target: ts.Type): void {
    if (!containsOwnedMarker(target)) return;
    const source = checker.getTypeAtLocation(expression);
    if (checker.isTypeAssignableTo(source, target)) return;
    const kind = containsOwnedMarker(source) ? "foreign-enum" : "raw-string";
    report(
      expression,
      kind,
      kind === "foreign-enum"
        ? "Value belongs to an enumwaii declaration with a different complete member set."
        : "Use an enumwaii member or parser result instead of a raw string value.",
    );
  }

  function enclosingReturnType(node: ts.ReturnStatement): ts.Type | undefined {
    let current: ts.Node | undefined = node.parent;
    while (current !== undefined && !ts.isFunctionLike(current)) {
      current = current.parent;
    }
    if (current === undefined || !ts.isFunctionLike(current)) return undefined;
    const signature = checker.getSignatureFromDeclaration(current);
    return signature === undefined
      ? undefined
      : checker.getReturnTypeOfSignature(signature);
  }

  function checkAssertion(node: ts.AsExpression | ts.TypeAssertion): void {
    const source = checker.getTypeAtLocation(node.expression);
    const target = checker.getTypeFromTypeNode(node.type);
    if (checker.isTypeAssignableTo(source, target)) return;
    if (
      containsOwnedMarker(target) ||
      (containsTypeParameter(target) && isStringLike(source))
    ) {
      report(
        node,
        "unsafe-assertion",
        "A type assertion must not manufacture enumwaii ownership from an unowned string.",
      );
    }
  }

  const comparisonOperators = new Set([
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ]);

  function checkComparison(node: ts.BinaryExpression): void {
    if (!comparisonOperators.has(node.operatorToken.kind)) return;
    const leftType = checker.getTypeAtLocation(node.left);
    const rightType = checker.getTypeAtLocation(node.right);
    const leftOwned = containsOwnedMarker(leftType);
    const rightOwned = containsOwnedMarker(rightType);
    if (leftOwned && rightOwned) {
      if (
        !checker.isTypeAssignableTo(leftType, rightType) &&
        !checker.isTypeAssignableTo(rightType, leftType)
      ) {
        report(
          node.right,
          "foreign-enum",
          "Comparison mixes enumwaii declarations with different complete member sets.",
        );
      }
      return;
    }
    if (leftOwned) checkOwnedTarget(node.right, leftType);
    if (rightOwned) checkOwnedTarget(node.left, rightType);
  }

  function checkSwitchCase(node: ts.CaseClause): void {
    const switchStatement = node.parent.parent;
    if (!ts.isSwitchStatement(switchStatement)) return;
    const target = checker.getTypeAtLocation(switchStatement.expression);
    checkOwnedTarget(node.expression, target);
  }

  function visit(node: ts.Node): void {
    const parent = node.parent;
    const isPropertyName =
      parent !== undefined &&
      ((ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node) ||
        (ts.isMethodDeclaration(parent) && parent.name === node));
    const isInsideAssertion =
      parent !== undefined &&
      (ts.isAsExpression(parent) || ts.isTypeAssertionExpression(parent));
    if (
      ts.isExpression(node) &&
      !isPropertyName &&
      !isInsideAssertion &&
      !ts.isObjectLiteralExpression(node) &&
      !ts.isArrayLiteralExpression(node) &&
      !ts.isAsExpression(node) &&
      !ts.isTypeAssertionExpression(node)
    ) {
      const contextual = checker.getContextualType(node);
      if (contextual !== undefined) checkOwnedTarget(node, contextual);
    }
    if (ts.isReturnStatement(node) && node.expression !== undefined) {
      const returnType = enclosingReturnType(node);
      if (returnType !== undefined) checkOwnedTarget(node.expression, returnType);
    }
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      checkAssertion(node);
    }
    if (ts.isBinaryExpression(node)) checkComparison(node);
    if (ts.isCaseClause(node)) checkSwitchCase(node);
    ts.forEachChild(node, visit);
  }

  for (const sourceFile of project.program.getSourceFiles()) {
    if (
      sourceFile.isDeclarationFile ||
      !path.resolve(sourceFile.fileName).startsWith(path.resolve(project.rootDir))
    ) {
      continue;
    }
    visit(sourceFile);
  }

  return issues.sort((left, right) =>
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.column - right.column,
  );
}

export function expectedIssueLocations(
  files: Readonly<Record<string, string>>,
): readonly { readonly file: string; readonly line: number; readonly tag: string }[] {
  const expected: { file: string; line: number; tag: string }[] = [];
  for (const [file, source] of Object.entries(files)) {
    for (const [index, line] of source.split("\n").entries()) {
      const match = /@owned-error\s+([\w-]+)/u.exec(line);
      if (match?.[1] !== undefined) {
        expected.push({ file, line: index + 1, tag: match[1] });
      }
    }
  }
  return expected;
}
