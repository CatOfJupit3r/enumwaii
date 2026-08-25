import type { ESLint, Linter } from "eslint";

import { enforceEnumCasingRule } from "./rules/enforce-enum-casing";
import { noEnumwaiiCaseMisuseRule } from "./rules/no-enumwaii-case-misuse";
import { noRawEnumComparisonRule } from "./rules/no-raw-enum-comparison";
import { noRawEnumMemberRule } from "./rules/no-raw-enum-member";
import { noUnionPropertyInRule } from "./rules/no-union-property-in";

export const rules = {
  "enforce-enum-casing": enforceEnumCasingRule,
  "no-enumwaii-case-misuse": noEnumwaiiCaseMisuseRule,
  "no-raw-enum-comparison": noRawEnumComparisonRule,
  "no-raw-enum-member": noRawEnumMemberRule,
  "no-union-property-in": noUnionPropertyInRule,
} as const;

const syntaxRules = {
  "enumwaii/enforce-enum-casing": "error",
} as const;

const typeCheckedRules = {
  ...syntaxRules,
  "enumwaii/no-enumwaii-case-misuse": "error",
  "enumwaii/no-raw-enum-comparison": "error",
  "enumwaii/no-raw-enum-member": "error",
  "enumwaii/no-union-property-in": "error",
} as const;

export interface EnumwaiiPlugin extends Omit<ESLint.Plugin, "rules"> {
  rules: typeof rules;
  configs: {
    recommended: ESLint.ConfigData;
    "recommended-type-checked": ESLint.ConfigData;
    "flat/recommended": Linter.Config[];
    "flat/recommended-type-checked": Linter.Config[];
  };
}

const plugin = {
  meta: { name: "eslint-plugin-enumwaii" },
  rules,
  configs: {
    recommended: { plugins: ["enumwaii"], rules: syntaxRules },
    "recommended-type-checked": {
      plugins: ["enumwaii"],
      rules: typeCheckedRules,
    },
    "flat/recommended": [
      {
        name: "enumwaii/recommended",
        plugins: { enumwaii: {} },
        rules: syntaxRules,
      },
    ],
    "flat/recommended-type-checked": [
      {
        name: "enumwaii/recommended-type-checked",
        plugins: { enumwaii: {} },
        rules: typeCheckedRules,
      },
    ],
  },
} satisfies EnumwaiiPlugin;

plugin.configs["flat/recommended"][0]!.plugins!.enumwaii = plugin;
plugin.configs["flat/recommended-type-checked"][0]!.plugins!.enumwaii = plugin;

export default plugin;
export {
  enforceEnumCasingRule,
  noEnumwaiiCaseMisuseRule,
  noRawEnumComparisonRule,
  noRawEnumMemberRule,
  noUnionPropertyInRule,
};
