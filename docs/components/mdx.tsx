import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import * as Twoslash from "fumadocs-twoslash/ui";
import type { MDXComponents } from "mdx/types";

import { BrandIcons, ExampleCard } from "./brand-icons";
import {
  DocumentationBuildDiagram,
  DocumentationContentDiagram,
} from "./documentation-diagrams";

/** Merge Fumadocs defaults with page-specific MDX components. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...Twoslash,
    BrandIcons,
    DocumentationBuildDiagram,
    DocumentationContentDiagram,
    ExampleCard,
    Tab,
    Tabs,
    ...components,
  };
}
