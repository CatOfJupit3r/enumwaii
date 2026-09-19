import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

describe("member JSDoc", () => {
  it("preserves documented object members on the enum view", () => {
    const configPath = path.join(packageRoot, "tsconfig.json");
    const config = ts.parseJsonConfigFileContent(
      ts.readConfigFile(configPath, (fileName) => ts.sys.readFile(fileName))
        .config,
      ts.sys,
      packageRoot,
    );
    const program = ts.createProgram(config.fileNames, config.options);
    const fixture = program.getSourceFile(
      path.join(packageRoot, "test/fixtures/member-jsdoc.fixture.ts"),
    );
    expect(fixture).toBeDefined();

    const checker = program.getTypeChecker();
    const documentation = new Map<string, string>();
    function visit(node: ts.Node): void {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "enum"
      ) {
        const symbol = checker.getSymbolAtLocation(node.name);
        documentation.set(
          node.name.text,
          ts.displayPartsToString(
            symbol?.getDocumentationComment(checker) ?? [],
          ),
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(fixture!);

    expect(Object.fromEntries(documentation)).toEqual({
      NONE: "Default state.\n\nUsed when the user is not in a special condition.",
      ACTIVE: "Active state,\nused while the user is participating.",
    });
  });
});
