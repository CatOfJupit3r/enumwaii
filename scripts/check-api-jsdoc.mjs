import path from "node:path";
import process from "node:process";

import ts from "typescript";

const repositoryRoot = process.cwd();
const entrypoints = {
  core: "packages/enumwaii/dist/index.d.mts",
  zod: "packages/enumwaii/dist/adapters/zod.d.mts",
  valibot: "packages/enumwaii/dist/adapters/valibot.d.mts",
  deriveWith: "packages/enumwaii/dist/derive-with/index.d.mts",
  eslint: "packages/eslint-plugin-enumwaii/dist/index.d.mts",
};
const rootNames = Object.values(entrypoints).map((entrypoint) =>
  path.resolve(repositoryRoot, entrypoint),
);
const program = ts.createProgram(rootNames, {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
});
const checker = program.getTypeChecker();
const failures = [];

function formatDocumentation(parts) {
  return ts.displayPartsToString(parts).replaceAll(/\s+/gu, " ").trim();
}

function getNodeDocumentation(node) {
  return ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .map((jsdoc) => {
      if (typeof jsdoc.comment === "string") return jsdoc.comment;
      return jsdoc.comment?.map((part) => part.text).join("") ?? "";
    })
    .join(" ")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

function getNodeTags(node, tagName) {
  return ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .flatMap((jsdoc) => jsdoc.tags ?? [])
    .filter((tag) => tag.tagName.text === tagName);
}

function requireDocumentation(label, documentation) {
  if (documentation.length < 20) {
    failures.push(`${label} has no meaningful emitted JSDoc.`);
  }
}

function requireNodeDocumentation(label, node, options = {}) {
  requireDocumentation(label, getNodeDocumentation(node));
  if (options.example && getNodeTags(node, "example").length === 0) {
    failures.push(`${label} has no emitted @example.`);
  }
}

function getModuleSymbol(entrypointKey) {
  const fileName = path.resolve(repositoryRoot, entrypoints[entrypointKey]);
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) {
    throw new Error(
      `Missing ${entrypoints[entrypointKey]}; run the package builds first.`,
    );
  }
  const symbol = checker.getSymbolAtLocation(sourceFile);
  if (!symbol)
    throw new Error(`Could not inspect ${entrypoints[entrypointKey]}.`);
  return symbol;
}

function resolveExport(entrypointKey, exportName) {
  const exported = checker
    .getExportsOfModule(getModuleSymbol(entrypointKey))
    .find((symbol) => symbol.name === exportName);
  if (!exported) {
    failures.push(
      `${entrypointKey}.${exportName} is missing from declarations.`,
    );
    return undefined;
  }
  return exported.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(exported)
    : exported;
}

function getSymbolType(symbol) {
  if (
    symbol.flags &
    (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)
  ) {
    return checker.getDeclaredTypeOfSymbol(symbol);
  }
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) return undefined;
  return checker.getTypeOfSymbolAtLocation(symbol, declaration);
}

function requireSymbolDocumentation(label, symbol, options = {}) {
  requireDocumentation(
    label,
    formatDocumentation(symbol.getDocumentationComment(checker)),
  );
  if (options.example) {
    const examples = symbol
      .getJsDocTags(checker)
      .filter((tag) => tag.name === "example");
    if (examples.length < (options.exampleCount ?? 1)) {
      failures.push(`${label} has too few emitted @example tags.`);
    }
  }
}

function isPrivate(node) {
  return (
    ts.canHaveModifiers(node) &&
    ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword)
  );
}

function inspectPublicDeclaration(entrypointKey, exportName, symbol) {
  for (const declaration of symbol.declarations ?? []) {
    if (ts.isClassDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (isPrivate(member)) continue;
        if (ts.isConstructorDeclaration(member)) {
          requireNodeDocumentation(
            `${entrypointKey}.${exportName}.constructor`,
            member,
            { example: exportName === "Enumwaii" },
          );
          continue;
        }
        if (!member.name) continue;
        requireNodeDocumentation(
          `${entrypointKey}.${exportName}.${member.name.getText()}`,
          member,
          { example: exportName === "Enumwaii" },
        );
      }
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      inspectTypeElements(
        `${entrypointKey}.${exportName}`,
        declaration.members,
      );
    }

    if (
      exportName === "EnumwaiiSafeParseResult" &&
      ts.isTypeAliasDeclaration(declaration)
    ) {
      inspectInlineTypeLiterals(
        `${entrypointKey}.${exportName}`,
        declaration.type,
      );
    }
  }
}

function inspectTypeElements(label, members) {
  for (const member of members) {
    const memberName = member.name?.getText() ?? "call";
    requireNodeDocumentation(`${label}.${memberName}`, member);
    if (member.type && ts.isTypeLiteralNode(member.type)) {
      inspectTypeElements(`${label}.${memberName}`, member.type.members);
    }
  }
}

function inspectInlineTypeLiterals(label, node) {
  if (ts.isTypeLiteralNode(node)) {
    inspectTypeElements(label, node.members);
    return;
  }
  ts.forEachChild(node, (child) => inspectInlineTypeLiterals(label, child));
}

function inspectAllExports(entrypointKey) {
  for (const exported of checker.getExportsOfModule(
    getModuleSymbol(entrypointKey),
  )) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    const label = `${entrypointKey}.${exported.name}`;
    requireSymbolDocumentation(label, symbol);
    inspectPublicDeclaration(entrypointKey, exported.name, symbol);
  }
}

function requirePropertyPath(entrypointKey, exportName, pathSegments) {
  const exported = resolveExport(entrypointKey, exportName);
  if (!exported) return;
  let type = getSymbolType(exported);
  let label = `${entrypointKey}.${exportName}`;
  for (const segment of pathSegments) {
    label += `.${segment}`;
    const property = type?.getProperty(segment);
    if (!property) {
      failures.push(`${label} is missing from declarations.`);
      return;
    }
    requireSymbolDocumentation(label, property);
    type = getSymbolType(property);
  }
}

for (const entrypointKey of Object.keys(entrypoints)) {
  inspectAllExports(entrypointKey);
}

for (const [entrypointKey, exportName] of [
  ["core", "em"],
  ["core", "Enumwaii"],
  ["core", "EnumwaiiError"],
  ["core", "EnumwaiiParseError"],
  ["zod", "zodSchema"],
  ["valibot", "valibotSchema"],
  ["deriveWith", "lowercase"],
  ["deriveWith", "uppercase"],
  ["eslint", "default"],
]) {
  const symbol = resolveExport(entrypointKey, exportName);
  if (symbol) {
    requireSymbolDocumentation(`${entrypointKey}.${exportName}`, symbol, {
      example: true,
    });
  }
}

for (const ruleName of [
  "enforceEnumCasingRule",
  "noDirectEnumwaiiReferenceRule",
  "noEnumwaiiCaseMisuseRule",
  "noRawEnumComparisonRule",
  "noRawEnumMemberRule",
  "noUnionPropertyInRule",
]) {
  const symbol = resolveExport("eslint", ruleName);
  if (symbol) {
    requireSymbolDocumentation(`eslint.${ruleName}`, symbol, {
      example: true,
      exampleCount: 2,
    });
  }
}

for (const ruleName of [
  "enforce-enum-casing",
  "no-direct-enumwaii-reference",
  "no-enumwaii-case-misuse",
  "no-raw-enum-comparison",
  "no-raw-enum-member",
  "no-union-property-in",
]) {
  requirePropertyPath("eslint", "rules", [ruleName]);
}

for (const pathSegments of [
  ["meta"],
  ["meta", "name"],
  ["rules"],
  ["configs"],
  ["configs", "recommended"],
  ["configs", "recommended-type-checked"],
  ["configs", "flat/recommended"],
  ["configs", "flat/recommended-type-checked"],
]) {
  requirePropertyPath("eslint", "default", pathSegments);
}

if (failures.length > 0) {
  console.error("Public API JSDoc validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("All emitted public API declarations include meaningful JSDoc.");
}
