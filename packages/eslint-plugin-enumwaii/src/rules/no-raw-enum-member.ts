import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import { SignatureKind } from "typescript";
import type { Type } from "typescript";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) => `https://github.com/CatOfJupit3r/enumwaii#${ruleName}`,
);

function isRawStringNode(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") ||
    (node.type === AST_NODE_TYPES.TemplateLiteral &&
      node.expressions.length === 0)
  );
}

function doesTypeCarryMarker(type: Type, markerName: string): boolean {
  if (type.isUnionOrIntersection()) {
    return type.types.some((member) => doesTypeCarryMarker(member, markerName));
  }
  return type
    .getProperties()
    .some((property) => String(property.escapedName).includes(markerName));
}

export const noRawEnumMemberRule = createRule({
  name: "no-raw-enum-member",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require enumwaii member accessors and composition APIs for subsets and targeted mappings",
    },
    messages: {
      rawSubsetMember:
        "Do not use the raw enum member {{member}}. Reference the owning enum member instead.",
      rawTargetMember:
        "Do not map to the raw enum value {{member}}. Reference the target enum member instead.",
      derivedConstructorMember:
        "Do not construct an enum from members of another enum. Use the owning Enumwaii combine, pick, omit, or extend API.",
      derivedConstructorValues:
        "Do not construct an enum from another enum's values. Use the owning Enumwaii combine, pick, omit, or extend API.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const isEnumwaiiImplementationFile =
      /[\\/]packages[\\/]enumwaii[\\/]src[\\/]enumwaii\.ts$/u.test(
        context.physicalFilename,
      );

    function isOwnedEnumMember(node: TSESTree.Node): boolean {
      if (
        doesTypeCarryMarker(services.getTypeAtLocation(node), "ENUMWAII_BRAND")
      ) {
        return true;
      }
      return (
        node.type === AST_NODE_TYPES.MemberExpression &&
        doesTypeCarryMarker(
          services.getTypeAtLocation(node.object),
          "ENUMWAII_CASES_BRAND",
        )
      );
    }

    function isEnumwaiiValuesCollection(node: TSESTree.Node): boolean {
      return doesTypeCarryMarker(
        services.getTypeAtLocation(node),
        "ENUMWAII_VALUES_BRAND",
      );
    }

    function isEnumwaiiConstructor(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.Identifier && node.name === "Enumwaii") {
        return true;
      }
      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      return checker
        .getSignaturesOfType(
          checker.getTypeAtLocation(tsNode),
          SignatureKind.Construct,
        )
        .some((signature) => {
          const returnType = checker.getReturnTypeOfSignature(signature);
          const rawValuesProperty = checker.getPropertyOfType(
            returnType,
            "rawValues",
          );
          return (
            rawValuesProperty !== undefined &&
            doesTypeCarryMarker(
              checker.getTypeOfSymbolAtLocation(rawValuesProperty, tsNode),
              "ENUMWAII_VALUES_BRAND",
            )
          );
        });
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

    function checkDeclaration(
      node: TSESTree.CallExpression | TSESTree.NewExpression,
    ): void {
      const isDirectEmCall =
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === "em";
      const isConstructor =
        node.type === AST_NODE_TYPES.NewExpression &&
        isEnumwaiiConstructor(node.callee);
      if (
        (!isDirectEmCall && !isConstructor) ||
        (isEnumwaiiImplementationFile && isInsideEnumwaiiClass(node))
      ) {
        return;
      }
      const members = node.arguments[0];
      if (!members) {
        return;
      }
      if (members.type !== AST_NODE_TYPES.ArrayExpression) {
        if (isEnumwaiiValuesCollection(members)) {
          context.report({
            node: members,
            messageId: "derivedConstructorValues",
          });
        }
        return;
      }
      for (const member of members.elements) {
        if (member?.type === AST_NODE_TYPES.SpreadElement) {
          if (isEnumwaiiValuesCollection(member.argument)) {
            context.report({
              node: member.argument,
              messageId: "derivedConstructorValues",
            });
          }
        } else if (member && isOwnedEnumMember(member)) {
          context.report({
            node: member,
            messageId: "derivedConstructorMember",
          });
        }
      }
    }

    function reportRawTargetMembers(node: TSESTree.Node): void {
      if (isRawStringNode(node)) {
        context.report({
          node,
          messageId: "rawTargetMember",
          data: { member: context.sourceCode.getText(node) },
        });
        return;
      }
      if (node.type !== AST_NODE_TYPES.ArrayExpression) {
        return;
      }
      for (const element of node.elements) {
        if (element && element.type !== AST_NODE_TYPES.SpreadElement) {
          reportRawTargetMembers(element);
        }
      }
    }

    return {
      CallExpression: checkDeclaration,
      NewExpression: checkDeclaration,
      "CallExpression:exit"(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.computed
        ) {
          return;
        }
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        const methodName = node.callee.property.name;
        if (methodName === "deriveTo") {
          const mappingArgument = node.arguments[1];
          if (mappingArgument?.type !== AST_NODE_TYPES.ObjectExpression) {
            return;
          }
          for (const property of mappingArgument.properties) {
            if (property.type === AST_NODE_TYPES.Property) {
              reportRawTargetMembers(property.value);
            }
          }
          return;
        }

        if (methodName === "derive") {
          return;
        }

        if (methodName !== "pick" && methodName !== "omit") {
          return;
        }
        const members = node.arguments[0];
        if (members?.type !== AST_NODE_TYPES.ArrayExpression) {
          return;
        }
        for (const member of members.elements) {
          if (member && isRawStringNode(member)) {
            context.report({
              node: member,
              messageId: "rawSubsetMember",
              data: { member: context.sourceCode.getText(member) },
            });
          }
        }
      },
    };
  },
});
