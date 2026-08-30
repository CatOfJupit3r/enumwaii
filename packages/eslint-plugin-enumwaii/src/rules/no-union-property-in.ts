import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { TypeFlags } from "typescript";
import type { Type } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

function getStaticPropertyName(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
): string | undefined {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  ) {
    return node.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function isUnavailablePropertyType(type: Type): boolean {
  if (!type.isUnion()) {
    return (
      type.flags === TypeFlags.Never ||
      type.flags === TypeFlags.Undefined ||
      type.flags === TypeFlags.Null
    );
  }
  return type.types.every(
    (member) =>
      member.flags === TypeFlags.Never ||
      member.flags === TypeFlags.Undefined ||
      member.flags === TypeFlags.Null,
  );
}

function isNullishOrNever(type: Type): boolean {
  return (
    type.flags === TypeFlags.Never ||
    type.flags === TypeFlags.Undefined ||
    type.flags === TypeFlags.Null
  );
}

/**
 * Prefer enumwaii discriminants over structural property-presence narrowing.
 *
 * This type-aware rule requires TypeScript parser services and checks a static
 * string (or no-expression template) on the left side of `in`. It reports only
 * when the right-hand type is an object union with at least two non-nullish
 * members and the property is available on some members but unavailable on
 * others. Ordinary `in` checks, non-unions, and unions that do not structurally
 * separate their members remain allowed.
 *
 * Add an enumwaii `.cases` discriminant and narrow with equality, `if`, or
 * `switch` when a union represents a closed set of variants. The rule has no
 * options and currently provides no autofix; its message ID is
 * `structuralUnionNarrowing`. An existence check that is not being used to
 * distinguish an object union is an intended use case and is not reported.
 *
 * @example Incorrect: property presence is used to distinguish object-union
 * members.
 * ```ts
 * type Scope =
 *   | { kind: "STORY"; storyId: string; chatId?: never }
 *   | { kind: "CHAT"; storyId: string; chatId: string };
 * declare const scope: Scope;
 * const hasChat = "chatId" in scope;
 * ```
 *
 * @example Correct: an enumwaii cases discriminant drives native narrowing.
 * ```ts
 * import { em } from "enumwaii";
 * const SCOPE_KIND = em(["STORY", "CHAT"]);
 * const SCOPE_CASES = SCOPE_KIND.cases;
 * type Scope =
 *   | { kind: typeof SCOPE_CASES.STORY; storyId: string }
 *   | { kind: typeof SCOPE_CASES.CHAT; chatId: string };
 * declare const scope: Scope;
 * if (scope.kind === SCOPE_CASES.CHAT) scope.chatId;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
export const noUnionPropertyInRule = createRule({
  name: "no-union-property-in",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow using property presence to narrow object unions",
    },
    messages: {
      structuralUnionNarrowing:
        "Do not narrow an object union with {{property}} in value. Add or use an Enumwaii cases discriminant and narrow with switch or if.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      BinaryExpression(node) {
        if (
          node.operator !== "in" ||
          node.left.type === AST_NODE_TYPES.PrivateIdentifier
        ) {
          return;
        }
        const propertyName = getStaticPropertyName(node.left);
        const rightType = services.getTypeAtLocation(node.right);
        if (!propertyName || !rightType.isUnion()) {
          return;
        }

        const members = rightType.types.filter(
          (member) => !isNullishOrNever(member),
        );
        if (members.length < 2) {
          return;
        }

        const tsRight = services.esTreeNodeToTSNodeMap.get(node.right);
        const availability = members.map((member) => {
          const property = member.getProperty(propertyName);
          if (!property) {
            return member.getStringIndexType() !== undefined;
          }
          return !isUnavailablePropertyType(
            checker.getTypeOfSymbolAtLocation(property, tsRight),
          );
        });

        if (
          availability.some(Boolean) &&
          availability.some((isAvailable) => !isAvailable)
        ) {
          context.report({
            node,
            messageId: "structuralUnionNarrowing",
            data: { property: context.sourceCode.getText(node.left) },
          });
        }
      },
    };
  },
});
