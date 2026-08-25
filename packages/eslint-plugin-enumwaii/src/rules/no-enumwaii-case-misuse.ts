import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type { Type } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

const COMPARISON_OPERATORS = new Set(["==", "===", "!=", "!=="]);
const DISCRIMINANT_PROPERTY_NAMES = new Set([
  "action",
  "group",
  "kind",
  "outcome",
  "state",
  "status",
  "type",
]);

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

function getStaticPropertyName(
  node: TSESTree.Property["key"] | TSESTree.Expression,
): string | undefined {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") {
    return node.value;
  }
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.property.name;
  }
  return undefined;
}

function unwrapUsageNode(node: TSESTree.Node): TSESTree.Node {
  let current = node;
  while (
    current.parent?.type === AST_NODE_TYPES.TSAsExpression ||
    current.parent?.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    current.parent?.type === AST_NODE_TYPES.TSNonNullExpression ||
    current.parent?.type === AST_NODE_TYPES.ConditionalExpression
  ) {
    current = current.parent;
  }
  return current;
}

function isInsideEnumwaiiClass(node: TSESTree.Node): boolean {
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ClassDeclaration &&
      current.id?.type === AST_NODE_TYPES.Identifier &&
      current.id.name === "Enumwaii"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isInsideTypeQuery(node: TSESTree.Node): boolean {
  let current = node.parent;
  while (current?.type === AST_NODE_TYPES.TSQualifiedName) {
    current = current.parent;
  }
  return current?.type === AST_NODE_TYPES.TSTypeQuery;
}

function isParameterBinding(node: TSESTree.Identifier): boolean {
  const parentWithParameters = node.parent as TSESTree.Node & {
    params?: readonly TSESTree.Node[];
  };
  return (
    parentWithParameters.params?.some((parameter) => parameter === node) ??
    false
  );
}

function isTypeIdentifierUsage(node: TSESTree.Identifier): boolean {
  switch (node.parent.type) {
    case AST_NODE_TYPES.TSInterfaceDeclaration:
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSTypeReference:
    case AST_NODE_TYPES.TSQualifiedName:
      return true;
    default:
      return false;
  }
}

export const noEnumwaiiCaseMisuseRule = createRule({
  name: "no-enumwaii-case-misuse",
  meta: {
    type: "problem",
    docs: {
      description:
        "Reserve raw Enumwaii cases for discriminated-union declarations, values, and narrowing",
    },
    messages: {
      caseObjectEscape:
        "Do not expose the raw cases object here. Export it once as an UPPER_CASE name ending in _CASES.",
      computedCaseMember:
        "Do not access an Enumwaii case with a raw computed key. Use the named case member.",
      caseValueEscape:
        "Raw Enumwaii cases are only for union tags, z.literal declarations, and switch/if narrowing. Use the branded .enum member for ordinary values.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const isEnumwaiiImplementationFile =
      /[\\/]packages[\\/]enumwaii[\\/]src[\\/]enumwaii\.ts$/u.test(
        context.physicalFilename,
      );

    function isAllowedCaseValueUsage(node: TSESTree.MemberExpression): boolean {
      const usageNode = unwrapUsageNode(node);
      const { parent } = usageNode;
      if (!parent) {
        return false;
      }
      if (
        parent.type === AST_NODE_TYPES.TSTypeQuery ||
        (parent.type === AST_NODE_TYPES.SwitchCase && parent.test === usageNode)
      ) {
        return true;
      }
      if (
        parent.type === AST_NODE_TYPES.BinaryExpression &&
        COMPARISON_OPERATORS.has(parent.operator)
      ) {
        return true;
      }
      if (
        parent.type === AST_NODE_TYPES.CallExpression &&
        parent.arguments.includes(usageNode as TSESTree.Expression)
      ) {
        return (
          parent.callee.type === AST_NODE_TYPES.MemberExpression &&
          !parent.callee.computed &&
          parent.callee.property.type === AST_NODE_TYPES.Identifier &&
          parent.callee.property.name === "literal"
        );
      }
      if (
        parent.type === AST_NODE_TYPES.Property &&
        parent.value === usageNode
      ) {
        return DISCRIMINANT_PROPERTY_NAMES.has(
          getStaticPropertyName(parent.key) ?? "",
        );
      }
      if (
        parent.type === AST_NODE_TYPES.AssignmentExpression &&
        parent.right === usageNode
      ) {
        return DISCRIMINANT_PROPERTY_NAMES.has(
          getStaticPropertyName(parent.left) ?? "",
        );
      }
      return false;
    }

    return {
      Identifier(node) {
        if (
          !doesTypeCarryCasesBrand(services.getTypeAtLocation(node)) ||
          (isEnumwaiiImplementationFile && isInsideEnumwaiiClass(node)) ||
          isInsideTypeQuery(node) ||
          isParameterBinding(node) ||
          isTypeIdentifierUsage(node)
        ) {
          return;
        }
        const { parent } = node;
        if (
          (parent.type === AST_NODE_TYPES.VariableDeclarator &&
            parent.id === node) ||
          parent.type === AST_NODE_TYPES.ImportSpecifier ||
          parent.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
          parent.type === AST_NODE_TYPES.ImportNamespaceSpecifier ||
          parent.type === AST_NODE_TYPES.ExportSpecifier ||
          (parent.type === AST_NODE_TYPES.MemberExpression &&
            (parent.object === node ||
              (!parent.computed && parent.property === node))) ||
          (parent.type === AST_NODE_TYPES.PropertyDefinition &&
            parent.key === node) ||
          (parent.type === AST_NODE_TYPES.TSPropertySignature &&
            parent.key === node)
        ) {
          return;
        }
        context.report({ node, messageId: "caseObjectEscape" });
      },
      MemberExpression(node) {
        if (
          !node.computed &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === "cases"
        ) {
          if (!doesTypeCarryCasesBrand(services.getTypeAtLocation(node))) {
            return;
          }
          if (node.object.type === AST_NODE_TYPES.ThisExpression) {
            return;
          }
          if (
            node.parent.type === AST_NODE_TYPES.MemberExpression &&
            node.parent.object === node
          ) {
            return;
          }
          if (
            node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
            node.parent.init === node &&
            node.parent.id.type === AST_NODE_TYPES.Identifier &&
            /^[A-Z][A-Z0-9_]*_CASES$/u.test(node.parent.id.name)
          ) {
            return;
          }
          context.report({ node, messageId: "caseObjectEscape" });
          return;
        }

        if (!doesTypeCarryCasesBrand(services.getTypeAtLocation(node.object))) {
          return;
        }
        if (node.computed) {
          context.report({ node, messageId: "computedCaseMember" });
          return;
        }
        if (!isAllowedCaseValueUsage(node)) {
          context.report({ node, messageId: "caseValueEscape" });
        }
      },
    };
  },
});
