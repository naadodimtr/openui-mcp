import { createParser, enrichErrors } from "@openuidev/lang-core";
import { registerLibrary, type LibraryProfile } from "./index.js";

let cached: LibraryProfile | null = null;

async function load(): Promise<LibraryProfile> {
  if (cached) return cached;

  const { openuiLibrary, openuiPromptOptions } = await import(
    "@openuidev/react-ui/genui-lib"
  );

  const schema = openuiLibrary.toJSONSchema();
  const parser = createParser(schema);
  const componentNames = Object.keys(openuiLibrary.components || {});

  cached = {
    id: "openui-default",
    name: "OpenUI Default",
    description:
      "Default OpenUI component library — charts, tables, forms, cards, and layout primitives",

    async getPrompt() {
      return openuiLibrary.prompt(openuiPromptOptions);
    },

    async getComponents() {
      const components: Array<{
        name: string;
        description: string;
        props: string[];
      }> = [];

      for (const [name, def] of Object.entries(
        openuiLibrary.components || {},
      )) {
        const comp = def as {
          description?: string;
          props?: { shape?: Record<string, unknown> };
        };
        components.push({
          name,
          description: comp.description || "",
          props: comp.props?.shape ? Object.keys(comp.props.shape) : [],
        });
      }

      return components;
    },

    async validate(spec: string) {
      const result = parser.parse(spec);
      const enriched = enrichErrors(
        result.meta.errors,
        schema,
        componentNames,
      );

      return {
        valid:
          enriched.length === 0 &&
          result.meta.unresolved.length === 0 &&
          result.root !== null,
        errors: enriched,
        meta: {
          statementCount: result.meta.statementCount,
          unresolved: result.meta.unresolved,
          orphaned: result.meta.orphaned,
          incomplete: result.meta.incomplete,
        },
      };
    },
  };

  return cached;
}

export function registerOpenUIDefault() {
  registerLibrary({
    id: "openui-default",
    name: "OpenUI Default",
    description:
      "Default OpenUI component library — charts, tables, forms, cards, and layout primitives",
    loader: load,
  });
}
