import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (ruleName) =>
    `https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/#${ruleName}`,
);

const INTERNAL_MEMBER_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u;

type MessageIds = "invalidInternalMember";
type Options = [
  {
    ignoredFilePatterns?: string[];
    ignoredNamePatterns?: string[];
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
 * Require `CONSTANT_CASE` string members in direct enumwaii declarations.
 *
 * This syntax-only rule checks the first array argument of a direct `em([...])`
 * call or `new Enumwaii([...])` expression. It does not need TypeScript parser
 * services, so it can run in a parser-only or syntax-only configuration. The
 * convention keeps internal member names predictable while leaving the runtime
 * API free to represent external wire formats. Deliberate lowercase,
 * kebab-case, or otherwise fixed external names can be excluded by declaration
 * name or normalized file path.
 *
 * `ignoredNamePatterns` matches wildcard patterns against identifiers directly
 * bound to a declaration, such as `wireStatus` in
 * `const wireStatus = em([...])`. `ignoredFilePatterns` matches normalized
 * forward-slash file paths. `*` matches within one path segment, `**` crosses
 * path separators, and `?` matches one non-separator character. The rule
 * provides no autofix.
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
export const enforceEnumCasingRule = createRule<Options, MessageIds>({
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
        },
      },
    ],
  },
  defaultOptions: [
    {
      ignoredFilePatterns: [],
      ignoredNamePatterns: [],
    },
  ],
  create(context, [options]) {
    const ignoredFilePatterns = (options.ignoredFilePatterns ?? []).map(
      wildcardPattern,
    );
    const ignoredNamePatterns = (options.ignoredNamePatterns ?? []).map(
      wildcardPattern,
    );
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
      const values = node.arguments[0];
      if (
        (!isEmCall && !isEnumwaiiConstructor) ||
        values?.type !== AST_NODE_TYPES.ArrayExpression
      )
        return;

      const name = declarationName(node);
      if (name !== undefined && matchesAnyPattern(name, ignoredNamePatterns)) {
        return;
      }

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
