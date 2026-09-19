import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${ruleName}`,
);

const ENUMWAII_VIEW_NAMES = new Set([
  "cases",
  "enum",
  "rawEnum",
  "rawValues",
  "values",
]);

const SCHEMA_FACTORIES = {
  zod: new Set(["enum", "nativeEnum"]),
  valibot: new Set(["enum", "picklist"]),
} as const;

type SchemaLibrary = keyof typeof SCHEMA_FACTORIES;

function doesTypeCarryMarker(type: ts.Type, markerName: string): boolean {
  if (type.isUnionOrIntersection()) {
    return type.types.some((member) => doesTypeCarryMarker(member, markerName));
  }
  return type
    .getProperties()
    .some((property) => String(property.escapedName).includes(markerName));
}

function staticPropertyName(node: ts.Node): string | undefined {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteral(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }
  return undefined;
}

/**
 * Prefer enumwaii's schema integrations over rebuilding schemas from member views.
 *
 * This type-aware rule reports Zod and Valibot enum factories whose input can be traced to an enumwaii `.enum`, `.rawEnum`, `.cases`, `.values`, or `.rawValues` view.
 * Use `emToZodSchema` or `emToValibotSchema` when that library's concrete schema type is required.
 * When an integration accepts Standard Schema, pass the enumwaii declaration itself.
 *
 * Extracted and imported view aliases are traced through TypeScript symbols,
 * while unrelated arrays and objects remain valid inputs.
 * The rule has no autofix because changing a schema can affect inferred types and error output.
 *
 * @example Incorrect: rebuilding a Zod schema from a raw view.
 * ```ts
 * const RAW_ROLE = roles.rawEnum;
 * const roleSchema = z.enum(RAW_ROLE);
 * ```
 *
 * @example Correct: use the native adapter or Standard Schema declaration.
 * ```ts
 * import { emToZodSchema } from "enumwaii/zod";
 * const roleSchema = emToZodSchema(roles);
 * standardSchemaConsumer(roles);
 * ```
 */
export const preferNativeSchemaAdaptersRule = createRule({
  name: "prefer-native-schema-adapters",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer enumwaii schema adapters over rebuilding schemas from member views",
    },
    messages: {
      preferAdapter:
        "Do not rebuild an enumwaii schema with {{library}}. Use {{adapter}} from enumwaii/{{library}}, or pass the declaration directly to a Standard Schema consumer.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    function symbolAt(node: ts.Node): ts.Symbol | undefined {
      const symbol = checker.getSymbolAtLocation(node);
      return symbol && symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    }

    function isEnumwaiiInstance(node: ts.Expression): boolean {
      const type = checker.getTypeAtLocation(node);
      const rawValues = checker.getPropertyOfType(type, "rawValues");
      return (
        rawValues !== undefined &&
        doesTypeCarryMarker(
          checker.getTypeOfSymbolAtLocation(rawValues, node),
          "ENUMWAII_VALUES_BRAND",
        )
      );
    }

    function isEnumwaiiView(
      node: ts.Expression,
      seen = new Set<ts.Node>(),
    ): boolean {
      if (seen.has(node)) return false;
      seen.add(node);

      if (
        ts.isAsExpression(node) ||
        ts.isSatisfiesExpression(node) ||
        ts.isNonNullExpression(node) ||
        ts.isParenthesizedExpression(node)
      ) {
        return isEnumwaiiView(node.expression, seen);
      }

      const type = checker.getTypeAtLocation(node);
      if (
        doesTypeCarryMarker(type, "ENUMWAII_VALUES_BRAND") ||
        doesTypeCarryMarker(type, "ENUMWAII_CASES_BRAND")
      ) {
        return true;
      }

      if (
        (ts.isPropertyAccessExpression(node) ||
          ts.isElementAccessExpression(node)) &&
        ENUMWAII_VIEW_NAMES.has(staticPropertyName(node) ?? "") &&
        isEnumwaiiInstance(node.expression)
      ) {
        return true;
      }

      if (ts.isIdentifier(node)) {
        return (
          symbolAt(node)?.declarations?.some(
            (declaration) =>
              ts.isVariableDeclaration(declaration) &&
              declaration.initializer !== undefined &&
              isEnumwaiiView(declaration.initializer, seen),
          ) ?? false
        );
      }

      return false;
    }

    function schemaLibrary(
      node: TSESTree.CallExpression,
      tsNode: ts.CallExpression,
    ): SchemaLibrary | undefined {
      if (
        node.callee.type !== AST_NODE_TYPES.MemberExpression ||
        node.callee.computed ||
        node.callee.property.type !== AST_NODE_TYPES.Identifier
      ) {
        return undefined;
      }
      const factoryName = node.callee.property.name;
      const declaration = checker.getResolvedSignature(tsNode)?.declaration;
      const fileName = declaration
        ?.getSourceFile()
        .fileName.replaceAll("\\", "/");
      if (!fileName) return undefined;

      for (const library of Object.keys(SCHEMA_FACTORIES) as SchemaLibrary[]) {
        if (
          SCHEMA_FACTORIES[library].has(factoryName as never) &&
          new RegExp(
            `/node_modules/(?:\\.pnpm/[^/]+/node_modules/)?${library}/`,
          ).test(fileName)
        ) {
          return library;
        }
      }
      return undefined;
    }

    return {
      CallExpression(node) {
        const input = node.arguments[0];
        if (!input || input.type === AST_NODE_TYPES.SpreadElement) return;
        const tsNode = services.esTreeNodeToTSNodeMap.get(
          node,
        ) as ts.CallExpression;
        const library = schemaLibrary(node, tsNode);
        const tsInput = services.esTreeNodeToTSNodeMap.get(input);
        if (!library || !ts.isExpression(tsInput) || !isEnumwaiiView(tsInput)) {
          return;
        }
        context.report({
          node,
          messageId: "preferAdapter",
          data: {
            library,
            adapter: library === "zod" ? "emToZodSchema" : "emToValibotSchema",
          },
        });
      },
    };
  },
});
