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

/**
 * Require extracting an enumwaii member view before referencing its members.
 *
 * This type-aware rule uses TypeScript parser services to identify enumwaii
 * instances and reports direct access to `.enum`, `.rawEnum`, or `.cases`.
 * Extract one of those views into a variable first, then reference members
 * through that stable constant; a TypeScript `as`, `satisfies`, or non-null
 * wrapper around the extraction is also recognized. The rule does not block
 * ordinary instance APIs such as `parse`, `safeParse`, `is`, `derive`, or
 * `values`, and it does not make direct access a runtime restriction.
 *
 * The rule requires parser services (use the type-checked preset), has no
 * options, and currently provides no autofix. It reports the
 * `directMemberView` message ID. A deliberately direct integration or one-off
 * use can be retained with a local disable; normal application code should
 * extract the view once as described in {@link https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md
 * member-surfaces.md}.
 *
 * @example Incorrect: members are referenced through the enumwaii instance.
 * ```ts
 * import { em } from "enumwaii";
 * const roles = em(["ADMIN", "USER"]);
 * const admin = roles.enum.ADMIN;
 * ```
 *
 * @example Correct: extract each view before using its members; other instance
 * APIs remain available directly.
 * ```ts
 * import { em } from "enumwaii";
 * const roles = em(["ADMIN", "USER"]);
 * const ROLE = roles.enum;
 * const admin = ROLE.ADMIN;
 * const parsed = roles.parse("ADMIN");
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
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
