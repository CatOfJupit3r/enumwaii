import {
  AST_NODE_TYPES,
  ESLintUtils,
  ASTUtils,
} from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

const RULE = { NAME: "no-object-em", TYPE: "suggestion" } as const;
const MESSAGE_ID = {
  OBJECT_INPUT: "objectInput",
  REDUNDANT_OBJECT: "redundantObject",
} as const;
const EXCEPTION_REASON = {
  EXTERNAL_CONTRACT: "external-contract",
  COMPATIBILITY: "compatibility",
} as const;
const VALUE_TYPE = {
  OBJECT: "object",
  ARRAY: "array",
  STRING: "string",
} as const;
const DEFINITION_TYPE = {
  IMPORT_BINDING: "ImportBinding",
  VARIABLE: "Variable",
  TS_ENUM_NAME: "TSEnumName",
} as const;
const SYNTAX_KIND = { CONST: "const", INIT: "init" } as const;
const ENUMWAII = {
  MODULE: "enumwaii",
  FACTORY: "em",
  CONSTRUCTOR: "Enumwaii",
} as const;
const MATCHER_KEY = {
  STARTS_WITH: "startsWith",
  ENDS_WITH: "endsWith",
  CONTAINS: "contains",
  REGEX: "regex",
} as const;
const OPTION_KEY = {
  NAME: "name",
  REASON: "reason",
  JUSTIFICATION: "justification",
} as const;
const REGEX = { UNICODE: "u", NONBLANK: "\\S" } as const;

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${name}`,
);

type StringMatcher = {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
} & ({ startsWith: string } | { endsWith: string } | { contains: string });
type Matcher =
  | (StringMatcher & { regex?: never })
  | {
      regex: string;
      startsWith?: never;
      endsWith?: never;
      contains?: never;
    };
type Exception = {
  name: Matcher;
  reason: (typeof EXCEPTION_REASON)[keyof typeof EXCEPTION_REASON];
  justification: string;
};
type Options = [{ ignore?: Exception[] }];
type MessageIds = (typeof MESSAGE_ID)[keyof typeof MESSAGE_ID];
type Declaration = TSESTree.CallExpression | TSESTree.NewExpression;

function unwrap(node: TSESTree.Node): TSESTree.Node {
  while (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    node = node.expression;
  }
  return node;
}

function nameOf(node: Declaration): string | undefined {
  let outer: TSESTree.Node = node;
  while (outer.parent && unwrap(outer.parent) === node) outer = outer.parent;
  const parent = outer.parent;
  return parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.id.type === AST_NODE_TYPES.Identifier
    ? parent.id.name
    : undefined;
}

/**
 * Prefer array declarations and reserve object inputs for documented external
 * contracts or existing compatibility constraints. All recommended presets
 * enable this rule without requiring type services; when present, type services
 * also identify imported or dynamically produced object inputs. Name exemptions never permit redundant literal
 * key/value mappings and do not disable casing or usage-site rules.
 *
 * @example Use array identity instead of an unnecessary object mapping.
 * ```ts
 * const progressType = em(["IN_PROGRESS", "COMPLETED"]);
 * ```
 *
 * @see https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#no-object-em
 */
export const noObjectEmRule = createRule<Options, MessageIds>({
  name: RULE.NAME,
  meta: {
    type: RULE.TYPE,
    docs: {
      description:
        "Prefer em([...]) with CONSTANT_CASE identities, including APIs you control. Keep display labels separate and use enumwaii composition for derived enums. Allow distinct object keys/values only for a documented external contract (such as SDK/protocol values) or existing compatibility requirement via a narrowly configured name exception; never silence the rule merely for lowercase values or serialization.",
    },
    messages: {
      [MESSAGE_ID.OBJECT_INPUT]:
        "Avoid object input to enumwaii. Use em(['IN_PROGRESS', 'COMPLETED']) for identities, keep display labels in a separate map, or use composition APIs for derived enums. Public APIs you control should also use CONSTANT_CASE. Only a required external contract or existing compatibility constraint with distinct keys/values warrants a documented, narrow no-object-em ignore entry; do not disable lint rules.",
      [MESSAGE_ID.REDUNDANT_OBJECT]:
        "This object repeats its keys as values. Use em([...]) with those CONSTANT_CASE members instead; even external-contract and compatibility exceptions do not justify redundant mappings.",
    },
    schema: [
      {
        type: VALUE_TYPE.OBJECT,
        additionalProperties: false,
        properties: {
          ignore: {
            type: VALUE_TYPE.ARRAY,
            items: {
              type: VALUE_TYPE.OBJECT,
              additionalProperties: false,
              required: Object.values(OPTION_KEY),
              properties: {
                name: {
                  oneOf: [
                    {
                      type: VALUE_TYPE.OBJECT,
                      additionalProperties: false,
                      minProperties: 1,
                      properties: {
                        [MATCHER_KEY.STARTS_WITH]: {
                          type: VALUE_TYPE.STRING,
                          minLength: 1,
                        },
                        [MATCHER_KEY.ENDS_WITH]: {
                          type: VALUE_TYPE.STRING,
                          minLength: 1,
                        },
                        [MATCHER_KEY.CONTAINS]: {
                          type: VALUE_TYPE.STRING,
                          minLength: 1,
                        },
                      },
                    },
                    {
                      type: VALUE_TYPE.OBJECT,
                      additionalProperties: false,
                      required: [MATCHER_KEY.REGEX],
                      properties: {
                        [MATCHER_KEY.REGEX]: {
                          type: VALUE_TYPE.STRING,
                          minLength: 1,
                        },
                      },
                    },
                  ],
                },
                reason: {
                  type: VALUE_TYPE.STRING,
                  enum: Object.values(EXCEPTION_REASON),
                },
                justification: {
                  type: VALUE_TYPE.STRING,
                  pattern: REGEX.NONBLANK,
                  minLength: 1,
                },
              },
            },
          },
        },
      },
    ],
  },
  defaultOptions: [{ ignore: [] }],
  create(context, [options]) {
    const services = context.sourceCode.parserServices;
    const checker = services?.program?.getTypeChecker();
    const matchers = (options.ignore ?? []).map(({ name }) => {
      if (name.regex === undefined)
        return (value: string) =>
          (name.startsWith === undefined ||
            value.startsWith(name.startsWith)) &&
          (name.endsWith === undefined || value.endsWith(name.endsWith)) &&
          (name.contains === undefined || value.includes(name.contains));
      let pattern: RegExp;
      try {
        pattern = new RegExp(name.regex, REGEX.UNICODE);
      } catch {
        throw new Error(
          `${RULE.NAME}: invalid ignore regex ${JSON.stringify(name.regex)}`,
        );
      }
      return (value: string) => pattern.test(value);
    });

    function variable(node: TSESTree.Identifier) {
      return ASTUtils.findVariable(
        context.sourceCode.getScope(node),
        node.name,
      );
    }

    function factory(node: TSESTree.Node, expected: string): boolean {
      if (node.type === AST_NODE_TYPES.Identifier) {
        const binding = variable(node);
        if (!binding) return node.name === expected;
        return binding.defs.some(
          (def) =>
            def.type === DEFINITION_TYPE.IMPORT_BINDING &&
            def.parent.type === AST_NODE_TYPES.ImportDeclaration &&
            def.parent.source.value === ENUMWAII.MODULE &&
            def.node.type === AST_NODE_TYPES.ImportSpecifier &&
            (def.node.imported.type === AST_NODE_TYPES.Identifier
              ? def.node.imported.name
              : def.node.imported.value) === expected,
        );
      }
      if (
        node.type !== AST_NODE_TYPES.MemberExpression ||
        node.object.type !== AST_NODE_TYPES.Identifier
      )
        return false;
      const member =
        !node.computed && node.property.type === AST_NODE_TYPES.Identifier
          ? node.property.name
          : node.property.type === AST_NODE_TYPES.Literal
            ? node.property.value
            : undefined;
      return (
        member === expected &&
        !!variable(node.object)?.defs.some(
          (def) =>
            def.type === DEFINITION_TYPE.IMPORT_BINDING &&
            def.parent.type === AST_NODE_TYPES.ImportDeclaration &&
            def.parent.source.value === ENUMWAII.MODULE &&
            def.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
        )
      );
    }

    function resolve(
      node: TSESTree.Node,
      seen = new Set<TSESTree.Node>(),
    ): TSESTree.Node {
      node = unwrap(node);
      if (seen.has(node)) return node;
      seen.add(node);
      if (node.type !== AST_NODE_TYPES.Identifier) return node;
      const binding = variable(node);
      const definition = binding?.defs[0];
      if (
        definition?.type === DEFINITION_TYPE.VARIABLE &&
        definition.parent.kind === SYNTAX_KIND.CONST &&
        definition.node.id.type === AST_NODE_TYPES.Identifier &&
        definition.node.init &&
        !binding?.references.some(
          (reference) => reference.isWrite() && !reference.init,
        )
      ) {
        return resolve(definition.node.init, seen);
      }
      if (definition?.type === DEFINITION_TYPE.TS_ENUM_NAME)
        return definition.node;
      return node;
    }

    function check(node: Declaration): void {
      if (
        !factory(
          unwrap(node.callee),
          node.type === AST_NODE_TYPES.NewExpression
            ? ENUMWAII.CONSTRUCTOR
            : ENUMWAII.FACTORY,
        )
      )
        return;
      const argument = node.arguments[0];
      if (!argument) return;
      const input = resolve(argument);
      let isObject =
        input.type === AST_NODE_TYPES.ObjectExpression ||
        input.type === AST_NODE_TYPES.TSEnumDeclaration;
      if (!isObject && checker && services?.esTreeNodeToTSNodeMap) {
        const type = checker.getTypeAtLocation(
          services.esTreeNodeToTSNodeMap.get(argument),
        );
        const parts = type.isUnion() ? type.types : [type];
        isObject = parts.some(
          (part) =>
            (part.flags & ts.TypeFlags.Object) !== 0 &&
            !checker.isArrayType(part) &&
            !checker.isTupleType(part),
        );
      }
      if (!isObject) return;
      const redundant =
        input.type === AST_NODE_TYPES.ObjectExpression &&
        input.properties.length > 0 &&
        input.properties.every((property) => {
          if (
            property.type !== AST_NODE_TYPES.Property ||
            property.method ||
            property.kind !== SYNTAX_KIND.INIT
          )
            return false;
          const key =
            !property.computed &&
            property.key.type === AST_NODE_TYPES.Identifier
              ? property.key.name
              : property.key.type === AST_NODE_TYPES.Literal
                ? property.key.value
                : undefined;
          const value = unwrap(property.value);
          return (
            typeof key === VALUE_TYPE.STRING &&
            value.type === AST_NODE_TYPES.Literal &&
            value.value === key
          );
        });
      const name = nameOf(node);
      if (
        !redundant &&
        name !== undefined &&
        matchers.some((match) => match(name))
      )
        return;
      context.report({
        node: argument,
        messageId: redundant
          ? MESSAGE_ID.REDUNDANT_OBJECT
          : MESSAGE_ID.OBJECT_INPUT,
      });
    }
    return { CallExpression: check, NewExpression: check };
  },
});
