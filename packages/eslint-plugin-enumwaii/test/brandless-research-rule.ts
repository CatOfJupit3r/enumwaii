import { ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type ts from "typescript";

import { BrandlessProvenanceAnalyzer } from "../../../experiments/brandless-research/provenance-analyzer";

const analyzers = new WeakMap<ts.Program, BrandlessProvenanceAnalyzer>();

const createRule = ESLintUtils.RuleCreator(
  () => "https://github.com/CatOfJupit3r/enumwaii",
);

export const brandlessResearchRule = createRule({
  name: "brandless-research-provenance",
  meta: {
    type: "problem",
    docs: {
      description:
        "Prototype provenance checking for enumwaii values that remain native string literals",
    },
    messages: {
      foreign:
        "This value comes from enumwaii [{{actual}}], but [{{expected}}] is required.",
      raw: "This raw string is not owned by enumwaii [{{expected}}]. Use the owning .enum member or parser result.",
      unowned:
        "Ownership of enumwaii [{{expected}}] could not be proven. Parse the value or use a trusted identity-preserving boundary.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    let analyzer = analyzers.get(services.program);
    if (!analyzer) {
      analyzer = new BrandlessProvenanceAnalyzer(services.program);
      analyzers.set(services.program, analyzer);
    }

    return {
      "Program:exit"(programNode) {
        const sourceFile = services.esTreeNodeToTSNodeMap.get(
          programNode,
        ) as ts.SourceFile;
        for (const diagnostic of analyzer.analyzeSourceFile(sourceFile)) {
          const reportNode = services.tsNodeToESTreeNodeMap.get(
            diagnostic.node,
          ) as TSESTree.Node | undefined;
          if (!reportNode) continue;
          context.report({
            node: reportNode,
            messageId: diagnostic.kind,
            data: {
              actual: diagnostic.actualMembers?.join(", ") ?? "unknown",
              expected: diagnostic.expectedMembers.join(", "),
            },
          });
        }
      },
    };
  },
});
