/**
 * ESLint presets and rule implementations for enumwaii authoring conventions.
 *
 * Most consumers should use one of the exported plugin presets. Individual
 * rule implementations remain public for custom ESLint configurations and
 * tooling integrations.
 *
 * @module
 */

import type { ESLint, Linter } from "eslint";

import packageMetadata from "../package.json" with { type: "json" };
import { enforceEnumCasingRule } from "./rules/enforce-enum-casing";
import { noDirectEnumwaiiReferenceRule } from "./rules/no-direct-enumwaii-reference";
import { noEnumwaiiCaseMisuseRule } from "./rules/no-enumwaii-case-misuse";
import { noObjectEmRule } from "./rules/no-object-em";
import { noRawEnumComparisonRule } from "./rules/no-raw-enum-comparison";
import { noRawEnumMemberRule } from "./rules/no-raw-enum-member";
import { noUnionPropertyInRule } from "./rules/no-union-property-in";

/**
 * Rule implementations published by `eslint-plugin-enumwaii`, keyed by the
 * names used after the `enumwaii/` configuration prefix.
 *
 * `enforce-enum-casing` and `no-object-em` use syntax-only analysis. The other five rules inspect
 * type and declaration provenance through a type-aware `typescript-eslint`
 * parser configuration. Configure these implementations directly when
 * composing a custom eslintrc or flat config, or use one of the presets exposed
 * by {@link plugin}.
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://eslint.org/docs/latest/extend/custom-rules
 */
export const rules = {
  /** Syntax-only rule enforcing declaration-key and configurable value casing. */
  "enforce-enum-casing": enforceEnumCasingRule,
  /** Prefer array identities, reserving object inputs for documented contracts. */
  "no-object-em": noObjectEmRule,
  /** Type-aware rule requiring extracted `.enum`, `.rawEnum`, or `.cases` views. */
  "no-direct-enumwaii-reference": noDirectEnumwaiiReferenceRule,
  /** Type-aware rule limiting raw `.cases` use to discriminated-union flows. */
  "no-enumwaii-case-misuse": noEnumwaiiCaseMisuseRule,
  /** Type-aware rule replacing raw comparison and discriminant literals with owned members. */
  "no-raw-enum-comparison": noRawEnumComparisonRule,
  /** Type-aware rule requiring owned members and composition APIs for derived declarations. */
  "no-raw-enum-member": noRawEnumMemberRule,
  /** Type-aware rule steering object-union narrowing toward enumwaii cases discriminants. */
  "no-union-property-in": noUnionPropertyInRule,
} as const;

/** Rule map for the syntax-only recommended eslintrc configuration. */
const syntaxRules = {
  /** Enable the parser-independent CONSTANT_CASE convention. */
  "enumwaii/enforce-enum-casing": "error",
  /** Reserve object declarations for documented external or compatibility needs. */
  "enumwaii/no-object-em": "error",
} as const;

/** Rule map containing every recommended type-aware eslintrc rule. */
const typeCheckedRules = {
  /** Enable the parser-independent CONSTANT_CASE convention in this preset too. */
  ...syntaxRules,
  /** Require extracted member views before member references. */
  "enumwaii/no-direct-enumwaii-reference": "error",
  /** Keep raw cases limited to discriminated-union declarations and narrowing. */
  "enumwaii/no-enumwaii-case-misuse": "error",
  /** Replace raw enum and case literals in comparisons and union values. */
  "enumwaii/no-raw-enum-comparison": "error",
  /** Require owned members and composition APIs for subset and derivation operations. */
  "enumwaii/no-raw-enum-member": "error",
  /** Prefer enumwaii cases discriminants over structural `in` narrowing. */
  "enumwaii/no-union-property-in": "error",
} as const;

/**
 * Public type of the enumwaii ESLint plugin.
 *
 * The plugin exposes the {@link rules} registry and four presets. The
 * `recommended` and `recommended-type-checked` entries use the eslintrc
 * `plugins`/`rules` shape. The `flat/recommended` and
 * `flat/recommended-type-checked` entries are arrays for ESLint flat config;
 * the latter two still differ by whether TypeScript parser services are
 * available in the consumer's surrounding configuration.
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */
export interface EnumwaiiPlugin extends Omit<ESLint.Plugin, "rules"> {
  /** Rule implementations keyed by their `enumwaii/<name>` configuration names. */
  rules: typeof rules;
  /** Eslintrc and flat preset configurations supplied by the plugin. */
  configs: {
    /** Eslintrc preset that enables the syntax-only declaration rules. */
    recommended: ESLint.ConfigData;
    /** Eslintrc preset that enables casing plus all parser-service rules. */
    "recommended-type-checked": ESLint.ConfigData;
    /** Flat-config array for the syntax-only recommended rules. */
    "flat/recommended": Linter.Config[];
    /** Flat-config array for the complete type-aware recommended rules. */
    "flat/recommended-type-checked": Linter.Config[];
  };
}

/**
 * The default `eslint-plugin-enumwaii` plugin instance.
 *
 * Register this value under the `enumwaii` plugin key. Eslintrc users can
 * programmatically spread `plugin.configs.recommended` or
 * `plugin.configs["recommended-type-checked"]` into an eslintrc configuration
 * object; flat-config users can spread the corresponding `flat/...` array. The
 * syntax-only presets need no TypeScript project, while the type-checked
 * presets require `typescript-eslint` parser services and a project-aware
 * parser setup.
 *
 * @example Programmatically composed eslintrc value for syntax-only checks.
 * ```js
 * import enumwaii from "eslint-plugin-enumwaii";
 * const eslintrcConfig = { ...enumwaii.configs.recommended };
 * ```
 *
 * @example ESLint flat configuration for type-aware checks.
 * ```js
 * import enumwaii from "eslint-plugin-enumwaii";
 * import tsParser from "@typescript-eslint/parser";
 * const [typeCheckedPreset] =
 *   enumwaii.configs["flat/recommended-type-checked"];
 * export default [
 *   {
 *     ...typeCheckedPreset,
 *     files: ["**" + "/*.ts", "**" + "/*.tsx"],
 *     languageOptions: {
 *       parser: tsParser,
 *       parserOptions: { projectService: true },
 *     },
 *   },
 * ];
 * ```
 *
 * @see https://github.com/CatOfJupit3r/enumwaii/blob/main/docs/linting.md
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */
const plugin = {
  /** Package metadata used by ESLint when identifying the plugin. */
  meta: {
    /** Canonical package name shown in ESLint diagnostics and tooling. */
    name: packageMetadata.name,
    /** Published package version shown in ESLint diagnostics and tooling. */
    version: packageMetadata.version,
  },
  /** Public rule registry exposed to eslintrc and flat ESLint configurations. */
  rules,
  /** Eslintrc and flat recommended configurations. */
  configs: {
    /**
     * Eslintrc preset for the parser-independent CONSTANT_CASE convention.
     */
    recommended: { plugins: ["enumwaii"], rules: syntaxRules },
    /**
     * Eslintrc preset for all rules. Configure TypeScript parser services and a
     * project-aware parser before enabling this type-checked variant.
     */
    "recommended-type-checked": {
      plugins: ["enumwaii"],
      rules: typeCheckedRules,
    },
    /** Flat-config preset for the parser-independent declaration rules. */
    "flat/recommended": [
      {
        name: "enumwaii/recommended",
        plugins: { enumwaii: {} },
        rules: syntaxRules,
      },
    ],
    /** Flat-config preset for casing plus all parser-service rules. */
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
  noDirectEnumwaiiReferenceRule,
  noEnumwaiiCaseMisuseRule,
  noObjectEmRule,
  noRawEnumComparisonRule,
  noRawEnumMemberRule,
  noUnionPropertyInRule,
};
