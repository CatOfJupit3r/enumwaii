import type { TSESLint } from "@typescript-eslint/utils";

const EXCEPTION_REASON = {
  EXTERNAL_CONTRACT: "external-contract",
  COMPATIBILITY: "compatibility",
} as const;
const VALUE_TYPE = {
  OBJECT: "object",
  ARRAY: "array",
  STRING: "string",
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
export type NameExceptionOptions = [{ ignore?: Exception[] }];

export const nameExceptionSchema: TSESLint.RuleMetaData<string>["schema"] = [
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
];

export function createNameMatchers(
  options: NameExceptionOptions[0],
  ruleName: string,
) {
  return (options.ignore ?? []).map(({ name }) => {
    if (name.regex === undefined)
      return (value: string) =>
        (name.startsWith === undefined || value.startsWith(name.startsWith)) &&
        (name.endsWith === undefined || value.endsWith(name.endsWith)) &&
        (name.contains === undefined || value.includes(name.contains));
    let pattern: RegExp;
    try {
      pattern = new RegExp(name.regex, REGEX.UNICODE);
    } catch {
      throw new Error(
        `${ruleName}: invalid ignore regex ${JSON.stringify(name.regex)}`,
      );
    }
    return (value: string) => pattern.test(value);
  });
}
