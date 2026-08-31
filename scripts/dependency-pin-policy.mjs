const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
];
const numericIdentifier = "(?:0|[1-9]\\d*)";
const prereleaseIdentifier = "(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)";
const exactVersionPattern = new RegExp(
  `^${numericIdentifier}\\.${numericIdentifier}\\.${numericIdentifier}` +
    `(?:-${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*)?` +
    "(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$",
);

function isAllowedSpecifier(specifier) {
  return specifier === "workspace:*" || exactVersionPattern.test(specifier);
}

export function dependencyPinViolations(manifest, path) {
  const violations = [];

  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (typeof specifier !== "string" || !isAllowedSpecifier(specifier)) {
        violations.push({ name, path, section, specifier });
      }
    }
  }

  return violations;
}
