import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${ruleName}`,
);

const INTERNAL_MEMBER_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

/**
 * Require `CONSTANT_CASE` string members in direct enumwaii declarations.
 *
 * This syntax-only rule checks the first array argument of a direct `em([...])`
 * call or `new Enumwaii([...])` expression. It does not need TypeScript parser
 * services, so it can run in a parser-only or syntax-only configuration. The
 * convention keeps internal member names predictable while leaving the runtime
 * API free to represent external wire formats. Disable this rule locally for a
 * deliberate lowercase, kebab-case, or otherwise fixed external name.
 *
 * The rule has no options and currently provides no autofix. It reports the
 * `invalidInternalMember` message ID for each string literal that is not
 * `CONSTANT_CASE`; non-literal elements and declarations whose first argument
 * is not an array are outside this rule's scope.
 *
 * @example Incorrect member casing
 * The declaration contains an internal member that is not `CONSTANT_CASE`.
 * ```ts
 * import { em } from "enumwaii";
 * const status = em(["READY", "in-progress"]);
 * ```
 *
 * @example Correct internal names and an intentional wire value
 * Internal names use `CONSTANT_CASE`; an intentional wire name can opt out at
 * its declaration site.
 * ```ts
 * import { em } from "enumwaii";
 * const status = em(["READY", "IN_PROGRESS"]);
 * // eslint-disable-next-line enumwaii/enforce-enum-casing -- external wire value
 * const wireStatus = em(["in-progress"]);
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
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
