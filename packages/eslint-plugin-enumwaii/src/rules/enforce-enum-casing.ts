import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${ruleName}`,
);

const INTERNAL_MEMBER_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;
const VALUE_CASING_PATTERNS = {
  constant: INTERNAL_MEMBER_PATTERN,
  kebab: /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u,
  snake: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u,
} as const;
const VALUE_CASING_LABELS = {
  constant: "CONSTANT_CASE",
  kebab: "kebab-case",
  snake: "snake_case",
} as const;

type MessageIds = "invalidInternalMember";
type ValueCasing = keyof typeof VALUE_CASING_PATTERNS;
type Options = [
  {
    ignoredFilePatterns?: string[];
    ignoredNamePatterns?: string[];
    valueCasing?: ValueCasing;
  },
];

function escapeRegularExpressionCharacter(character: string): string {
  return /[\\^$.*+?()[\]{}|]/u.test(character) ? `\\${character}` : character;
}

function wildcardPattern(pattern: string): RegExp {
  let source = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]!;

    if (character === "*") {
      if (pattern[index + 1] === "*") {
        if (pattern[index + 2] === "/") {
          source += "(?:.*/)?";
          index += 2;
        } else {
          source += ".*";
          index += 1;
        }
      } else {
        source += "[^/]*";
      }
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += escapeRegularExpressionCharacter(character);
    }
  }

  return new RegExp(`${source}$`, "u");
}

function matchesAnyPattern(
  value: string,
  patterns: readonly RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function declarationName(
  node: TSESTree.CallExpression | TSESTree.NewExpression,
): string | undefined {
  const parent = node.parent;

  if (
    parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.init === node &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return parent.id.name;
  }

  return undefined;
}

/**
 * Enforce key and value casing in direct enumwaii declarations.
 *
 * This syntax-only rule checks the first array or object argument of a direct
 * `em(...)` call or `new Enumwaii(...)` expression. Object keys always use
 * `CONSTANT_CASE`; tuple members and object values use the configured
 * `valueCasing`, which defaults to `constant` and also supports `kebab` and
 * `snake`. It does not need TypeScript parser services.
 *
 * `ignoredNamePatterns` matches wildcard patterns against identifiers directly
 * bound to a declaration, such as `wireStatus` in
 * `const wireStatus = em([...])`. `ignoredFilePatterns` matches normalized
 * forward-slash file paths. `*` matches within one path segment, `**` crosses
 * path separators, and `?` matches one non-separator character. Ignored
 * declarations skip both key and value checks. The rule provides no autofix.
 *
 * @example Incorrect member casing
 * The declaration contains an internal member that is not `CONSTANT_CASE`.
 * ```ts
 * import { em } from "enumwaii";
 * const status = em(["READY", "in-progress"]);
 * ```
 *
 * @example Correct aliased wire values
 * Object keys use `CONSTANT_CASE`, while values follow `valueCasing`.
 * ```ts
 * import { em } from "enumwaii";
 * const status = em({
 *   IN_PROGRESS: "in-progress",
 *   COMPLETE: "complete",
 * });
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
export const enforceEnumCasingRule = createRule<Options, MessageIds>({
  name: "enforce-enum-casing",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce key and value casing in enumwaii declarations",
    },
    messages: {
      invalidInternalMember:
        "Enumwaii declaration string {{member}} must use {{casing}}.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          ignoredFilePatterns: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          ignoredNamePatterns: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          valueCasing: {
            type: "string",
            enum: ["constant", "kebab", "snake"],
          },
        },
      },
    ],
  },
  defaultOptions: [
    {
      ignoredFilePatterns: [],
      ignoredNamePatterns: [],
      valueCasing: "constant",
    },
  ],
  create(context, [options]) {
    const ignoredFilePatterns = (options.ignoredFilePatterns ?? []).map(
      wildcardPattern,
    );
    const ignoredNamePatterns = (options.ignoredNamePatterns ?? []).map(
      wildcardPattern,
    );
    const valueCasing = options.valueCasing ?? "constant";
    const valuePattern = VALUE_CASING_PATTERNS[valueCasing];
    const filename = context.physicalFilename.replaceAll("\\", "/");

    if (matchesAnyPattern(filename, ignoredFilePatterns)) {
      return {};
    }

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
      if (!isEmCall && !isEnumwaiiConstructor) return;

      const name = declarationName(node);
      if (name !== undefined && matchesAnyPattern(name, ignoredNamePatterns)) {
        return;
      }

      const members = node.arguments[0];
      if (members?.type === AST_NODE_TYPES.ArrayExpression) {
        for (const member of members.elements) {
          if (
            member?.type === AST_NODE_TYPES.Literal &&
            typeof member.value === "string" &&
            !valuePattern.test(member.value)
          ) {
            context.report({
              node: member,
              messageId: "invalidInternalMember",
              data: {
                member: context.sourceCode.getText(member),
                casing: VALUE_CASING_LABELS[valueCasing],
              },
            });
          }
        }
        return;
      }

      if (members?.type !== AST_NODE_TYPES.ObjectExpression) return;

      for (const member of members.properties) {
        if (member.type !== AST_NODE_TYPES.Property) continue;

        const key =
          !member.computed && member.key.type === AST_NODE_TYPES.Identifier
            ? member.key.name
            : member.key.type === AST_NODE_TYPES.Literal
              ? String(member.key.value)
              : undefined;

        if (key !== undefined && !INTERNAL_MEMBER_PATTERN.test(key)) {
          context.report({
            node: member.key,
            messageId: "invalidInternalMember",
            data: {
              member: context.sourceCode.getText(member.key),
              casing: VALUE_CASING_LABELS.constant,
            },
          });
        }

        if (
          member.value.type === AST_NODE_TYPES.Literal &&
          typeof member.value.value === "string" &&
          !valuePattern.test(member.value.value)
        ) {
          context.report({
            node: member.value,
            messageId: "invalidInternalMember",
            data: {
              member: context.sourceCode.getText(member.value),
              casing: VALUE_CASING_LABELS[valueCasing],
            },
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
