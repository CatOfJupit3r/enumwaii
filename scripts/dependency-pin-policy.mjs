const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const numericIdentifier = "(?:0|[1-9]\\d*)";
const prereleaseIdentifier = "(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)";
const exactVersionPattern = new RegExp(
  `^${numericIdentifier}\\.${numericIdentifier}\\.${numericIdentifier}` +
    `(?:-${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*)?` +
    "(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$",
);

function isExactVersion(specifier) {
  return exactVersionPattern.test(specifier);
}

function isCaretRange(specifier) {
  return specifier.startsWith("^") && isExactVersion(specifier.slice(1));
}

function expectedSpecifier(manifest, section) {
  if (section === "peerDependencies") {
    return "a consumer compatibility range";
  }

  if (manifest.private === true || section === "devDependencies") {
    return "an exact SemVer version, workspace:*, or a local file: dependency";
  }

  return "a caret SemVer range or workspace:^";
}

function isAllowedSpecifier(manifest, section, specifier) {
  if (typeof specifier !== "string") {
    return false;
  }

  if (section === "peerDependencies") {
    return specifier !== "workspace:*" && !isExactVersion(specifier);
  }

  if (manifest.private === true || section === "devDependencies") {
    return (
      specifier === "workspace:*" ||
      specifier.startsWith("file:") ||
      isExactVersion(specifier)
    );
  }

  return specifier === "workspace:^" || isCaretRange(specifier);
}

export function dependencyVersionViolations(manifest, path) {
  const violations = [];

  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (!isAllowedSpecifier(manifest, section, specifier)) {
        violations.push({
          expected: expectedSpecifier(manifest, section),
          name,
          path,
          section,
          specifier,
        });
      }
    }
  }

  return violations;
}
