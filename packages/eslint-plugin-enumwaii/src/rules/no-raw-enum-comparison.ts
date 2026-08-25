import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import {
  forEachChild,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isQualifiedName,
  isTypeQueryNode,
  TypeFlags,
} from "typescript";
import type { EntityName, Node, Type } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

const COMPARISON_OPERATORS = new Set(["==", "===", "!=", "!=="]);

/**
 * The brand property is declared as a computed unique-symbol key, which the
 * checker names `__@ENUMWAII_BRAND@<id>`; matching on the symbol name is the
 * only structural handle the brand exposes.
 */
function doesTypeCarryBrand(type: Type): boolean {
  if (type.isUnion()) {
    return type.types.some((member) => doesTypeCarryBrand(member));
  }
  return type
    .getProperties()
    .some((property) =>
      String(property.escapedName).includes("ENUMWAII_BRAND"),
    );
}

function doesTypeCarryCasesBrand(type: Type): boolean {
  if (type.isUnionOrIntersection()) {
    return type.types.some((member) => doesTypeCarryCasesBrand(member));
  }
  return type
    .getProperties()
    .some((property) =>
      String(property.escapedName).includes("ENUMWAII_CASES_BRAND"),
    );
}

function isNullishOrNever(type: Type): boolean {
  return (
    type.flags === TypeFlags.Null ||
    type.flags === TypeFlags.Undefined ||
    type.flags === TypeFlags.Never
  );
}

/**
 * Raw Enumwaii cases intentionally have ordinary string-literal types so
 * TypeScript can narrow unions natively. The closed-set check is paired with
 * declaration provenance below; external library unions are not enum-owned.
 */
function isClosedStringLiteralSet(type: Type): boolean {
  if (type.isStringLiteral()) {
    return true;
  }
  if (!type.isUnion()) {
    return false;
  }

  let literalCount = 0;
  let hasNullishMember = false;
  for (const member of type.types) {
    if (isNullishOrNever(member)) {
      hasNullishMember = true;
      continue;
    }
    if (!member.isStringLiteral()) {
      return false;
    }
    literalCount += 1;
  }
  return literalCount >= 2 || (literalCount === 1 && hasNullishMember);
}

function isRawStringNode(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") ||
    (node.type === AST_NODE_TYPES.TemplateLiteral &&
      node.expressions.length === 0)
  );
}

function getStaticPropertyName(
  node: TSESTree.Property["key"],
): string | undefined {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }
  return undefined;
}

export const noRawEnumComparisonRule = createRule({
  name: "no-raw-enum-comparison",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw string use for enumwaii values and native case discriminants",
    },
    messages: {
      rawComparison:
        "Do not compare an enumwaii value with the raw string {{literal}}. Use the owning .enum member, or the owning .cases member for a union discriminant.",
      rawSwitchCase:
        "Do not switch with the raw case {{literal}}. Use the owning .cases member for a union discriminant.",
      rawCaseValue:
        "Do not construct or assign the raw enumwaii case {{literal}}. Use the owning .cases member.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    function getRootEntityName(entityName: EntityName): EntityName {
      let current = entityName;
      while (isQualifiedName(current)) {
        current = current.left;
      }
      return current;
    }

    function doesDeclarationReferenceCases(declaration: Node): boolean {
      let hasCasesReference = false;
      function visit(node: Node): void {
        if (hasCasesReference) {
          return;
        }
        if (isTypeQueryNode(node)) {
          const rootEntityName = getRootEntityName(node.exprName);
          hasCasesReference = doesTypeCarryCasesBrand(
            checker.getTypeAtLocation(rootEntityName),
          );
          if (hasCasesReference) {
            return;
          }
        }
        forEachChild(node, visit);
      }
      visit(declaration);
      return hasCasesReference;
    }

    function isCasesDiscriminantExpression(node: TSESTree.Node): boolean {
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const symbol = checker.getSymbolAtLocation(
        isPropertyAccessExpression(tsNode) ? tsNode.name : tsNode,
      );
      return symbol?.declarations?.some(doesDeclarationReferenceCases) ?? false;
    }

    function isEnumwaiiExpression(node: TSESTree.Node): boolean {
      const type = services.getTypeAtLocation(node);
      return (
        doesTypeCarryBrand(type) ||
        (isClosedStringLiteralSet(type) && isCasesDiscriminantExpression(node))
      );
    }

    function doesTypePropertyReferenceCases(
      type: Type,
      propertyName: string,
    ): boolean {
      if (type.isUnionOrIntersection()) {
        return type.types.some((member) =>
          doesTypePropertyReferenceCases(member, propertyName),
        );
      }
      const property = checker.getPropertyOfType(type, propertyName);
      return (
        property?.declarations?.some(doesDeclarationReferenceCases) ?? false
      );
    }

    function isCasesContextualProperty(node: TSESTree.Property): boolean {
      const propertyName = getStaticPropertyName(node.key);
      if (
        !propertyName ||
        node.parent.type !== AST_NODE_TYPES.ObjectExpression
      ) {
        return false;
      }
      const tsObject = services.esTreeNodeToTSNodeMap.get(node.parent);
      if (!isObjectLiteralExpression(tsObject)) {
        return false;
      }
      const contextualType = checker.getContextualType(tsObject);
      return contextualType
        ? doesTypePropertyReferenceCases(contextualType, propertyName)
        : false;
    }

    function reportRawNode(
      rawNode: TSESTree.Node,
      messageId: "rawCaseValue" | "rawComparison" | "rawSwitchCase",
    ): void {
      const literal = context.sourceCode.getText(rawNode);
      context.report({
        node: rawNode,
        messageId,
        data: { literal, member: literal.replaceAll(/['"`]/gu, "") },
      });
    }

    return {
      BinaryExpression(node) {
        if (
          !COMPARISON_OPERATORS.has(node.operator) ||
          node.left.type === AST_NODE_TYPES.PrivateIdentifier
        ) {
          return;
        }
        if (
          (node.left.type === AST_NODE_TYPES.UnaryExpression &&
            node.left.operator === "typeof") ||
          (node.right.type === AST_NODE_TYPES.UnaryExpression &&
            node.right.operator === "typeof")
        ) {
          return;
        }
        if (isRawStringNode(node.left) && isEnumwaiiExpression(node.right)) {
          reportRawNode(node.left, "rawComparison");
        } else if (
          isRawStringNode(node.right) &&
          isEnumwaiiExpression(node.left)
        ) {
          reportRawNode(node.right, "rawComparison");
        }
      },
      AssignmentExpression(node) {
        if (
          node.operator === "=" &&
          isRawStringNode(node.right) &&
          (node.left.type === AST_NODE_TYPES.Identifier ||
            node.left.type === AST_NODE_TYPES.MemberExpression) &&
          isCasesDiscriminantExpression(node.left)
        ) {
          reportRawNode(node.right, "rawCaseValue");
        }
      },
      Property(node) {
        if (isRawStringNode(node.value) && isCasesContextualProperty(node)) {
          reportRawNode(node.value, "rawCaseValue");
        }
      },
      SwitchStatement(node) {
        if (!isEnumwaiiExpression(node.discriminant)) {
          return;
        }
        for (const switchCase of node.cases) {
          if (switchCase.test && isRawStringNode(switchCase.test)) {
            reportRawNode(switchCase.test, "rawSwitchCase");
          }
        }
      },
    };
  },
});
