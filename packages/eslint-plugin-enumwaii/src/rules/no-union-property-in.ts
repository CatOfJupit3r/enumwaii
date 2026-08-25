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
