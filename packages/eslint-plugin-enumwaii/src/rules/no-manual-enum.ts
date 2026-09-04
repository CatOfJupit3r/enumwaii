import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";
import {
  createNameMatchers,
  nameExceptionSchema,
  type NameExceptionOptions,
} from "../utils/name-exceptions";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${name}`,
);

/**
 * Require categorical string vocabularies to be declared through enumwaii.
 * Inspects union assembly, shared discriminants and const-container extraction
 * using TypeScript parser services. Property selection and derived references
 * are allowed. The `ignore` option accepts documented name exceptions matching
 * the nearest enclosing declaration, independently of other rules.
 * No automatic migration is provided because values may be persisted.
 *
 * @example
 * ```ts
 * const statuses = em(["READY", "DONE"]);
 * type Status = typeof statuses["~type"];
 * ```
 */
export const noManualEnumRule = createRule<
  NameExceptionOptions,
  "manualUnion" | "manualContainer" | "manualDiscriminant"
>({
  name: "no-manual-enum",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require enumwaii to own categorical string vocabularies",
    },
    schema: nameExceptionSchema,
    messages: {
      manualUnion:
        "Declare this string vocabulary with enumwaii and derive its type from the declaration.",
      manualContainer:
        "This const container defines an enum vocabulary. Use enumwaii instead of a hand-built enum replacement.",
      manualDiscriminant:
        "Declare the {{name}} tag vocabulary with enumwaii and reference canonical case members.",
    },
  },
  defaultOptions: [{ ignore: [] }],
  create(context, [options]) {
    const matchers = createNameMatchers(options, "no-manual-enum");
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    function ignored(node: ts.Node): boolean {
      for (
        let current: ts.Node | undefined = node.parent;
        current;
        current = current.parent
      ) {
        if (
          ts.isTypeAliasDeclaration(current) ||
          ts.isInterfaceDeclaration(current) ||
          ts.isFunctionDeclaration(current) ||
          ts.isFunctionExpression(current) ||
          ts.isVariableDeclaration(current) ||
          ts.isMethodDeclaration(current) ||
          ts.isMethodSignature(current)
        ) {
          const name = current.name;
          // Stop at the nearest declaration; outer scopes must not exempt local domains.
          return (
            !!name &&
            (ts.isIdentifier(name) || ts.isStringLiteral(name)) &&
            matchers.some((matches) => matches(name.text))
          );
        }
      }
      return false;
    }

    function symbolAt(node: ts.Node) {
      const symbol = checker.getSymbolAtLocation(node);
      return symbol && symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    }

    // Resolve only explicit literal aliases, never arbitrary resolved unions:
    // keyof, SDK references and enumwaii projections must keep their origin.
    function literals(node: ts.TypeNode, seen = new Set<ts.Node>()): string[] {
      if (seen.has(node)) return [];
      seen.add(node);
      if (ts.isParenthesizedTypeNode(node)) return literals(node.type, seen);
      if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal))
        return [node.literal.text];
      if (ts.isUnionTypeNode(node))
        return node.types.flatMap((part) => literals(part, new Set(seen)));
      if (ts.isTypeReferenceNode(node)) {
        const declaration = symbolAt(node.typeName)?.declarations?.find(
          ts.isTypeAliasDeclaration,
        );
        if (declaration) {
          const values = literals(declaration.type, seen);
          return new Set(values).size === 1 ? values : [];
        }
      }
      return [];
    }

    function owned(type: ts.Type): boolean {
      if (type.isUnionOrIntersection()) return type.types.some(owned);
      return type.getProperties().some((property) =>
        property.getDeclarations()?.some((declaration) => {
          const file = declaration
            .getSourceFile()
            .fileName.replaceAll("\\", "/");
          return (
            /\/(?:node_modules\/enumwaii|packages\/enumwaii)\//u.test(file) &&
            ts.isPropertySignature(declaration) &&
            ts.isComputedPropertyName(declaration.name) &&
            declaration.name.expression.getText() === "ENUMWAII_BRAND"
          );
        }),
      );
    }

    function selection(node: ts.UnionTypeNode): boolean {
      let current: ts.Node = node;
      while (ts.isParenthesizedTypeNode(current.parent))
        current = current.parent;
      const parent = current.parent;
      if (ts.isIndexedAccessTypeNode(parent) && parent.indexType === current)
        return true;
      if (
        !ts.isTypeReferenceNode(parent) ||
        parent.typeArguments?.[1] !== current
      )
        return false;
      const symbol = symbolAt(parent.typeName);
      return (
        (symbol?.name === "Pick" || symbol?.name === "Omit") &&
        !!symbol.declarations?.some((declaration) =>
          /[\\/]lib\.es5\.d\.ts$/u.test(declaration.getSourceFile().fileName),
        )
      );
    }

    function checkUnion(node: TSESTree.TSUnionType) {
      const union = services.esTreeNodeToTSNodeMap.get(
        node,
      ) as ts.UnionTypeNode;
      if (ignored(union) || selection(union)) return;
      const raw = new Set(union.types.flatMap((part) => literals(part)));
      if (
        raw.size >= 2 ||
        (raw.size > 0 &&
          union.types.some((part) => owned(checker.getTypeAtLocation(part))))
      ) {
        context.report({ node, messageId: "manualUnion" });
        return;
      }
      const types = union.types.map((part) => checker.getTypeAtLocation(part));
      for (const property of types[0]?.getProperties() ?? []) {
        const tags = types.map((type) => type.getProperty(property.name));
        if (tags.some((tag) => !tag || tag.flags & ts.SymbolFlags.Optional))
          continue;
        const values = tags.flatMap(
          (tag) =>
            tag?.declarations?.flatMap((declaration) =>
              ts.isPropertySignature(declaration) && declaration.type
                ? literals(declaration.type)
                : [],
            ) ?? [],
        );
        if (values.length === types.length && new Set(values).size >= 2) {
          context.report({
            node,
            messageId: "manualDiscriminant",
            data: { name: property.name },
          });
          return;
        }
      }
    }

    return {
      TSUnionType: checkUnion,
      TSIndexedAccessType(node) {
        const indexed = services.esTreeNodeToTSNodeMap.get(
          node,
        ) as ts.IndexedAccessTypeNode;
        if (ignored(indexed)) return;
        let object = indexed.objectType;
        while (ts.isParenthesizedTypeNode(object)) object = object.type;
        if (!ts.isTypeQueryNode(object)) return;
        const declaration = symbolAt(object.exprName)?.valueDeclaration;
        if (
          !declaration ||
          !ts.isVariableDeclaration(declaration) ||
          !declaration.initializer
        )
          return;
        const initializer = declaration.initializer;
        if (
          !ts.isAsExpression(initializer) ||
          initializer.type.getText() !== "const"
        )
          return;
        if (
          !ts.isArrayLiteralExpression(initializer.expression) &&
          !ts.isObjectLiteralExpression(initializer.expression)
        )
          return;
        const type = checker.getTypeAtLocation(indexed);
        if (
          type.isUnion() &&
          type.types.length >= 2 &&
          type.types.every((part) => part.isStringLiteral())
        ) {
          context.report({ node, messageId: "manualContainer" });
        }
      },
    };
  },
});
