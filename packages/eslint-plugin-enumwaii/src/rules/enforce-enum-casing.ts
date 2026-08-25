import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

const INTERNAL_MEMBER_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

export const enforceEnumCasingRule = createRule({
  name: "enforce-enum-casing",
  meta: {
    type: "problem",
    docs: {
      description: "Require CONSTANT_CASE members in enumwaii declarations",
    },
    messages: {
      invalidInternalMember:
        "Enumwaii member {{member}} must use CONSTANT_CASE. Disable this rule locally for an intentional external wire value.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkDeclaration(
      node: TSESTree.CallExpression | TSESTree.NewExpression,
    ): void {
      const isEmCall =
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === "em";
      const isEnumwaiiConstructor =
        node.type === AST_NODE_TYPES.NewExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === "Enumwaii";
      const values = node.arguments[0];
      if (
        (!isEmCall && !isEnumwaiiConstructor) ||
        values?.type !== AST_NODE_TYPES.ArrayExpression
      )
        return;

      for (const member of values.elements) {
        if (
          member?.type === AST_NODE_TYPES.Literal &&
          typeof member.value === "string" &&
          !INTERNAL_MEMBER_PATTERN.test(member.value)
        ) {
          context.report({
            node: member,
            messageId: "invalidInternalMember",
            data: { member: context.sourceCode.getText(member) },
          });
        }
      }
    }

    return {
      CallExpression: checkDeclaration,
      NewExpression: checkDeclaration,
    };
  },
});
