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

/**
 * Keep raw `.cases` members confined to discriminated-union authoring and
 * narrowing.
 *
 * This type-aware rule requires TypeScript parser services. It permits cases
 * in discriminant declarations and values, `z.literal(...)` declarations,
 * equality comparisons, and `switch`/`if` narrowing. Extract a cases object
 * once into the exported-container naming pattern: an uppercase binding whose
 * name ends in `_CASES` (for example `ROLE_CASES`). The rule validates that
 * naming pattern on the extraction; the export keyword itself is not inspected,
 * so exporting the binding is the intended way to make the discriminants a
 * shared public surface.
 *
 * Directly exposing the cases object, accessing a case with a computed raw key,
 * or using a case member as a general application value is reported. Use the
 * branded `.enum` member for ordinary values. The rule has no options and
 * currently provides no autofix. Its message IDs are `caseObjectEscape`,
 * `computedCaseMember`, and `caseValueEscape`. A narrowly justified boundary
 * use may be locally disabled, but `.cases` should remain limited to native
 * discriminated-union flows.
 *
 * @example Incorrect: the cases object is aliased incorrectly, a case uses a
 * computed key, and a raw case is leaked as an ordinary value.
 * ```ts
 * import { em } from "enumwaii";
 * const roles = em(["ADMIN", "USER"]);
 * const ROLE_CASES = roles.cases;
 * export const BAD_ALIAS = roles.cases;
 * export const computed = ROLE_CASES["ADMIN"];
 * export const leaked = ROLE_CASES.USER;
 * ```
 *
 * @example Correct: the named cases container supplies a union discriminant
 * and native control-flow narrowing, while ordinary values use `.enum`.
 * ```ts
 * import { em } from "enumwaii";
 * const roles = em(["ADMIN", "USER"]);
 * export const ROLE_CASES = roles.cases;
 * const ROLE = roles.enum;
 * type Event =
 *   | { type: typeof ROLE_CASES.ADMIN; role: typeof ROLE.ADMIN }
 *   | { type: typeof ROLE_CASES.USER; role: typeof ROLE.USER };
 * declare const event: Event;
 * if (event.type === ROLE_CASES.ADMIN) event.role;
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/member-surfaces.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
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
