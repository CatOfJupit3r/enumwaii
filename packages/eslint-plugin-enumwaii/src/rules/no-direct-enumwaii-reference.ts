import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

const MEMBER_VIEW_NAMES = new Set(["cases", "enum", "rawEnum"]);

function doesTypeCarryMarker(type: Type, markerName: string): boolean {
  if (type.isUnionOrIntersection()) {
    return type.types.some((member) => doesTypeCarryMarker(member, markerName));
  }
  return type
    .getProperties()
    .some((property) => String(property.escapedName).includes(markerName));
}

function getStaticPropertyName(
  node: TSESTree.MemberExpression,
): string | undefined {
  if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
    return node.property.name;
  }
  if (
    node.computed &&
    node.property.type === AST_NODE_TYPES.Literal &&
    typeof node.property.value === "string"
  ) {
    return node.property.value;
  }
  return undefined;
}

function isExtractedMemberView(node: TSESTree.MemberExpression): boolean {
  let current: TSESTree.Node = node;
  while (
    current.parent.type === AST_NODE_TYPES.TSAsExpression ||
    current.parent.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.parent.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    current = current.parent;
  }
  return (
    current.parent.type === AST_NODE_TYPES.VariableDeclarator &&
    current.parent.init === current
  );
}

export const noDirectEnumwaiiReferenceRule = createRule({
  name: "no-direct-enumwaii-reference",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require Enumwaii member views to be extracted before their members are referenced",
    },
    messages: {
      directMemberView:
        "Extract .{{view}} from the Enumwaii declaration before using it. Reference members through the extracted constant.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    function isEnumwaiiInstance(node: TSESTree.Expression): boolean {
      const type = services.getTypeAtLocation(node);
      const rawValuesProperty = checker.getPropertyOfType(type, "rawValues");
      if (!rawValuesProperty) {
        return false;
      }
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      return doesTypeCarryMarker(
        checker.getTypeOfSymbolAtLocation(rawValuesProperty, tsNode),
        "ENUMWAII_VALUES_BRAND",
      );
    }

    return {
      MemberExpression(node) {
        const view = getStaticPropertyName(node);
        if (
          !view ||
          !MEMBER_VIEW_NAMES.has(view) ||
          !isEnumwaiiInstance(node.object) ||
          isExtractedMemberView(node)
        ) {
          return;
        }
        context.report({
          node,
          messageId: "directMemberView",
          data: { view },
        });
      },
    };
  },
});
