// ../src/vite/vite.config.ts
import { basename } from "node:path";
import { vanillaExtractPlugin } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@vanilla-extract+vite-plugin@3.9.2_@types+node@20.8.9_vite@5.0.2/node_modules/@vanilla-extract/vite-plugin/dist/vanilla-extract-vite-plugin.cjs.js";
import react from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@vitejs+plugin-react@4.2.0_vite@5.0.2/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig, splitVendorChunkPlugin } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js";

// ../src/vite/plugins/css.ts
import { accessSync } from "node:fs";
import { resolve } from "node:path";
import { default as autoprefixer } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/autoprefixer@10.4.16_postcss@8.4.31/node_modules/autoprefixer/lib/autoprefixer.js";
import { default as tailwindcss } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/tailwindcss@3.3.5/node_modules/tailwindcss/lib/index.js";
import { default as tailwindcssNesting } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/tailwindcss@3.3.5/node_modules/tailwindcss/nesting/index.js";
function css() {
  const tailwindConfig = findTailwindConfig();
  return {
    name: "css",
    config() {
      return {
        css: {
          postcss: {
            plugins: [
              autoprefixer(),
              tailwindcssNesting(),
              tailwindConfig ? tailwindcss({
                config: tailwindConfig
              }) : void 0
            ].filter(Boolean)
          }
        }
      };
    }
  };
}
function findTailwindConfig() {
  const configFiles = [
    "./tailwind.config.js",
    "./tailwind.config.cjs",
    "./tailwind.config.mjs",
    "./tailwind.config.ts"
  ];
  for (const configFile of configFiles) {
    try {
      const configPath = resolve(process.cwd(), configFile);
      accessSync(configPath);
      return configPath;
    } catch (err) {
    }
  }
  return null;
}

// ../src/vite/plugins/mdx.ts
import mdxPlugin from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/@mdx-js+rollup@3.0.0_rollup@4.5.2/node_modules/@mdx-js/rollup/index.js";
import { h as h4 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js";
import rehypeAutolinkHeadings from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-autolink-headings@7.1.0/node_modules/rehype-autolink-headings/index.js";
import rehypePrettyCode from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-pretty-code@0.10.2_shiki@0.14.5/node_modules/rehype-pretty-code/dist/rehype-pretty-code.js";
import rehypeSlug from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/rehype-slug@6.0.0/node_modules/rehype-slug/index.js";
import remarkDirective from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-directive@3.0.0/node_modules/remark-directive/index.js";
import remarkFrontmatter from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-frontmatter@5.0.0/node_modules/remark-frontmatter/index.js";
import remarkGfm from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-gfm@4.0.0/node_modules/remark-gfm/index.js";
import remarkMdxFrontmatter from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/remark-mdx-frontmatter@4.0.0/node_modules/remark-mdx-frontmatter/index.js";
import {
  createDiffProcessor,
  createFocusProcessor,
  createHighlightProcessor,
  getHighlighter
} from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/shiki-processor@0.1.3_shiki@0.14.5/node_modules/shiki-processor/dist/index.mjs";

// ../src/vite/plugins/remark/callout.ts
import { h } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js";
import { visit } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkCallout() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "containerDirective")
        return;
      if (node.name !== "callout" && node.name !== "info" && node.name !== "warning" && node.name !== "danger" && node.name !== "tip" && node.name !== "success" && node.name !== "note")
        return;
      const label = node.children.find((child) => child.data?.directiveLabel)?.children[0].value;
      const data = node.data || (node.data = {});
      const tagName = "aside";
      if (label) {
        node.children = node.children.filter((child) => !child.data?.directiveLabel);
        node.children.unshift({
          type: "paragraph",
          data: { hProperties: { "data-callout-title": true } },
          children: [
            {
              type: "strong",
              children: [{ type: "text", value: label }]
            }
          ]
        });
      }
      data.hName = tagName;
      data.hProperties = {
        ...h(tagName, node.attributes || {}).properties,
        "data-callout": node.name !== "callout" ? node.name : true
      };
    });
  };
}

// ../src/vite/plugins/remark/code-group.ts
import { h as h2 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js";
import { visit as visit2 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkCodeGroup() {
  return (tree) => {
    visit2(tree, (node) => {
      if (node.type !== "containerDirective")
        return;
      if (node.name !== "code-group")
        return;
      const data = node.data || (node.data = {});
      const tagName = "div";
      node.attributes = {
        ...node.attributes,
        class: "code-group"
      };
      data.hName = tagName;
      data.hProperties = h2(tagName, node.attributes || {}).properties;
      node.children = node.children.map((child) => {
        const match = "meta" in child && child?.meta?.match(/^\[(.*)\]/);
        return {
          type: "paragraph",
          children: [child],
          data: {
            hName: "div",
            hProperties: match ? {
              "data-title": match[1]
            } : void 0
          }
        };
      }).filter(Boolean);
    });
  };
}

// ../src/vite/plugins/remark/code.ts
import { visit as visit3 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkCode() {
  return (tree) => {
    visit3(tree, (node, _, parent) => {
      if (node.type !== "code")
        return;
      if (parent?.type === "containerDirective" && parent.name !== "steps")
        return;
      const [match, title] = node.meta?.match(/\[(.*)\]/) || [];
      if (match)
        node.meta = node.meta?.replace(match, `title="${title}"`);
    });
  };
}

// ../src/vite/plugins/remark/details.ts
import { visit as visit4 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkDetails() {
  return (tree) => {
    visit4(tree, (node) => {
      if (node.type !== "containerDirective")
        return;
      if (node.name !== "details")
        return;
      const data = node.data || (node.data = {});
      const tagName = "details";
      const summaryChild = node.children[0];
      if (summaryChild.type === "paragraph" && summaryChild.data?.directiveLabel)
        summaryChild.data.hName = "summary";
      else
        node.children.unshift({
          type: "paragraph",
          children: [{ type: "text", value: "Details" }],
          data: { hName: "summary" }
        });
      data.hName = tagName;
    });
  };
}

// ../src/vite/plugins/remark/inferred-frontmatter.ts
import { visit as visit5 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkInferFrontmatter() {
  return (tree) => {
    visit5(tree, (node, _, parent) => {
      if (parent?.type !== "root")
        return;
      if (node.type === "heading" && node.depth === 1) {
        if (node.children.length === 0)
          return;
        const child = node.children[0];
        if (!("value" in child))
          return;
        const value = child.value;
        const [, title, description] = value.includes("[") ? value.match(/(.*) \[(.*)\]/) || [] : [void 0, value];
        const frontmatterIndex = parent.children.findIndex((child2) => child2.type === "yaml");
        const index = frontmatterIndex > 0 ? frontmatterIndex : 0;
        const frontmatter = {
          ...parent.children[frontmatterIndex] || {
            value: "",
            type: "yaml"
          }
        };
        if (!frontmatter.value.includes("title"))
          frontmatter.value += `
title: ${title}
`;
        if (!frontmatter.value.includes("description"))
          frontmatter.value += `
description: ${description}
`;
        if (frontmatterIndex === -1)
          tree.children.unshift(frontmatter);
        else
          parent.children.splice(index, 1, frontmatter);
      }
    });
  };
}

// ../src/vite/plugins/remark/steps.ts
import { h as h3 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/hastscript@8.0.0/node_modules/hastscript/index.js";
import { visit as visit6 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkSteps() {
  return (tree) => {
    visit6(tree, (node) => {
      if (node.type !== "containerDirective")
        return;
      if (node.name !== "steps")
        return;
      const data = node.data || (node.data = {});
      const tagName = "div";
      node.attributes = {
        ...node.attributes,
        "data-vocs-steps": "true"
      };
      data.hName = tagName;
      data.hProperties = h3(tagName, node.attributes || {}).properties;
      const depth = node.children.find((child) => child.type === "heading")?.depth ?? 2;
      let currentChild;
      const children = [];
      for (const child of node.children) {
        if (child.type === "heading" && child.depth === depth) {
          if (currentChild && currentChild.children.length > 0)
            children.push(currentChild);
          currentChild = {
            type: "paragraph",
            children: [],
            data: {
              hName: "div",
              hProperties: {
                "data-depth": depth
              }
            }
          };
        }
        currentChild.children.push(child);
      }
      children.push(currentChild);
      node.children = children;
    });
  };
}

// ../src/vite/plugins/remark/strong-block.ts
import { visit as visit7 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkStrongBlock() {
  return (tree) => {
    visit7(tree, "strong", (node, _, parent) => {
      if (!parent)
        return;
      if (parent.type !== "paragraph")
        return;
      if (parent.children.length > 1)
        return;
      parent.type = "strong";
      parent.children = node.children;
    });
  };
}

// ../src/vite/plugins/remark/subheading.ts
import { visit as visit8 } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/unist-util-visit@5.0.0/node_modules/unist-util-visit/index.js";
function remarkSubheading() {
  return (tree) => {
    visit8(tree, "heading", (node, index, parent) => {
      if (!index)
        return;
      if (node.depth !== 1)
        return;
      if (node.children.length === 0)
        return;
      const subheadingRegex = / \[(.*)\]$/;
      const subheadingChild = node.children.find(
        (child) => "value" in child && typeof child.value === "string" && child.value.match(subheadingRegex)
      );
      const [match, subheading] = subheadingChild?.value?.match(subheadingRegex) ?? [];
      if (subheadingChild)
        subheadingChild.value = subheadingChild?.value?.replace(match, "");
      parent?.children.splice(index, 1);
      const header = {
        type: "paragraph",
        data: {
          hName: "header"
        },
        children: [
          node,
          subheading ? {
            type: "paragraph",
            children: [{ type: "text", value: subheading }],
            data: {
              hName: "div",
              hProperties: {
                role: "doc-subtitle"
              }
            }
          } : void 0
        ].filter(Boolean)
      };
      parent?.children.splice(index, 0, header);
    });
  };
}

// ../src/vite/plugins/mdx.ts
function mdx() {
  return mdxPlugin({
    remarkPlugins: [
      remarkDirective,
      remarkInferFrontmatter,
      remarkFrontmatter,
      remarkMdxFrontmatter,
      remarkGfm,
      remarkCallout,
      remarkCode,
      remarkCodeGroup,
      remarkDetails,
      remarkSteps,
      remarkStrongBlock,
      remarkSubheading
    ],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          keepBackground: false,
          getHighlighter(options) {
            return getHighlighter({
              ...options,
              processors: [
                createDiffProcessor(),
                createFocusProcessor(),
                createHighlightProcessor()
              ]
            });
          },
          theme: {
            dark: "github-dark-dimmed",
            light: "github-light"
          }
        }
      ],
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content() {
            return [
              h4("div", {
                dataAutolinkIcon: true
              })
            ];
          }
        }
      ]
    ]
  });
}

// ../src/vite/plugins/virtual-config.ts
import "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js";

// ../src/vite/utils.ts
import { existsSync } from "node:fs";
import { resolve as resolve2 } from "node:path";
import { loadConfigFromFile } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js";
var extensions = ["js", "ts", "mjs", "mts"];
var defaultConfigPaths = [".vocs/config", "vocs.config"];
async function resolveVocsConfig(parameters = {}) {
  const { command = "serve", mode = "development" } = parameters;
  const configPath = (() => {
    for (const ext of extensions) {
      if (parameters.configPath)
        return parameters.configPath;
      for (const filePath of defaultConfigPaths)
        if (existsSync(resolve2(process.cwd(), `${filePath}.${ext}`)))
          return `${filePath}.${ext}`;
    }
    return;
  })();
  const result = await loadConfigFromFile({ command, mode }, configPath);
  return {
    config: result ? result.config : {},
    configPath
  };
}

// ../src/vite/plugins/virtual-config.ts
function virtualConfig() {
  const virtualModuleId = "virtual:config";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: "vocs-config",
    async configureServer(server) {
      const { configPath } = await resolveVocsConfig();
      if (configPath) {
        server.watcher.add(configPath);
        server.watcher.on("change", async () => {
          server.ws.send("vocs:config", (await resolveVocsConfig()).config);
        });
      }
    },
    resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId;
      return;
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const { config } = await resolveVocsConfig();
        return `export const config = ${JSON.stringify(config)}`;
      }
      return;
    },
    handleHotUpdate() {
      return;
    }
  };
}

// ../src/vite/plugins/virtual-root.ts
import { existsSync as existsSync2 } from "node:fs";
import { resolve as resolve3 } from "node:path";
function virtualRoot({
  root = resolve3(process.cwd(), "./root.tsx")
} = {}) {
  const virtualModuleId = "virtual:root";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: "routes",
    resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!existsSync2(root))
          return "export const Root = ({ children }) => children;";
        return `export { default as Root } from "${root}";`;
      }
      return;
    }
  };
}

// ../src/vite/plugins/virtual-routes.ts
import { resolve as resolve4 } from "node:path";
import { globby } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/globby@13.2.2/node_modules/globby/index.js";
function virtualRoutes() {
  const virtualModuleId = "virtual:routes";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  let glob;
  let paths = [];
  return {
    name: "routes",
    async configureServer(server) {
      const { config } = await resolveVocsConfig();
      const { root } = config;
      const pagesPath = resolve4(root, "pages");
      server.watcher.add(pagesPath);
      server.watcher.on("add", () => server.restart());
      server.watcher.on("unlink", () => server.restart());
    },
    resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId;
      return;
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = "export const routes = [";
        for (const path2 of paths) {
          const type = path2.split(".").pop()?.match(/(mdx|md)/) ? "mdx" : "jsx";
          const replacer = glob.split("*")[0];
          let pagePath = path2.replace(replacer, "").replace(/\.(.*)/, "");
          if (pagePath.endsWith("index"))
            pagePath = pagePath.replace("index", "").replace(/\/$/, "");
          code += `  { lazy: () => import("${path2}"), path: "/${pagePath}", type: "${type}" },`;
          if (pagePath)
            code += `  { lazy: () => import("${path2}"), path: "/${pagePath}.html", type: "${type}" },`;
        }
        code += "]";
        return code;
      }
      return;
    },
    async buildStart() {
      const { config } = await resolveVocsConfig();
      const { root } = config;
      const pagesPath = resolve4(root, "pages");
      glob = `${pagesPath}/**/*.{md,mdx,ts,tsx,js,jsx}`;
      paths = await globby(glob);
    },
    handleHotUpdate() {
      return;
    }
  };
}

// ../src/vite/plugins/docgen.ts
import path from "path";
import { Project } from "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/ts-morph@20.0.0/node_modules/ts-morph/dist/ts-morph.js";
import "file:///Users/tmm/Developer/vocs/node_modules/.pnpm/vite@5.0.2_@types+node@20.8.9/node_modules/vite/dist/node/index.js";
var project = new Project({ tsConfigFilePath: "../tsconfig.json" });
function docgen() {
  const virtualModuleId = "virtual:docgen";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: "docgen",
    async configureServer(server) {
      const sourceFiles = project.getSourceFiles();
      if (sourceFiles.length) {
        const rootDirs = /* @__PURE__ */ new Set();
        for (const sourceFile of sourceFiles) {
          const key = sourceFile.getFilePath().replace(`${path.dirname(process.cwd())}/`, "").split("/")[0];
          rootDirs.add(path.resolve(process.cwd(), `../${key}/**`));
        }
        rootDirs.add(path.resolve(process.cwd(), "../src/hello.ts"));
        server.watcher.add([...rootDirs]);
        server.watcher.on("change", () => server.ws.send("vocs:docgen", getFiles()));
        setTimeout(() => {
        }, 1e3);
      }
    },
    resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId;
      return;
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId)
        return;
      const files = getFiles();
      return `export const docgen = ${JSON.stringify(files)}`;
    }
  };
}
function getFiles() {
  const sourceFiles = project.getSourceFiles();
  const files = {};
  for (const sourceFile of sourceFiles) {
    const key = sourceFile.getFilePath().replace(`${path.dirname(process.cwd())}/`, "");
    files[key] = sourceFile.getFullText();
  }
  return files;
}

// ../src/vite/vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    splitVendorChunkPlugin(),
    virtualConfig(),
    react(),
    vanillaExtractPlugin({
      identifiers({ filePath, debugId }) {
        const scope = basename(filePath).replace(".css.ts", "");
        return `vocs_${scope}${debugId ? `_${debugId}` : ""}`;
      },
      emitCssInSsr: true
    }),
    css(),
    docgen(),
    mdx(),
    virtualRoutes(),
    virtualRoot()
  ],
  server: {
    fs: {
      allow: [".."]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ZpdGUvdml0ZS5jb25maWcudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9jc3MudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9tZHgudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvY2FsbG91dC50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLWdyb3VwLnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvZGV0YWlscy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9pbmZlcnJlZC1mcm9udG1hdHRlci50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdGVwcy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdHJvbmctYmxvY2sudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvc3ViaGVhZGluZy50cyIsICIuLi9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtY29uZmlnLnRzIiwgIi4uL3NyYy92aXRlL3V0aWxzLnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb290LnRzIiwgIi4uL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMudHMiLCAiLi4vc3JjL3ZpdGUvcGx1Z2lucy9kb2NnZW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IHZhbmlsbGFFeHRyYWN0UGx1Z2luIH0gZnJvbSAnQHZhbmlsbGEtZXh0cmFjdC92aXRlLXBsdWdpbidcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgc3BsaXRWZW5kb3JDaHVua1BsdWdpbiB9IGZyb20gJ3ZpdGUnXG5cbmltcG9ydCB7IGNzcyB9IGZyb20gJy4vcGx1Z2lucy9jc3MuanMnXG5pbXBvcnQgeyBtZHggfSBmcm9tICcuL3BsdWdpbnMvbWR4LmpzJ1xuaW1wb3J0IHsgdmlydHVhbENvbmZpZyB9IGZyb20gJy4vcGx1Z2lucy92aXJ0dWFsLWNvbmZpZy5qcydcbmltcG9ydCB7IHZpcnR1YWxSb290IH0gZnJvbSAnLi9wbHVnaW5zL3ZpcnR1YWwtcm9vdC5qcydcbmltcG9ydCB7IHZpcnR1YWxSb3V0ZXMgfSBmcm9tICcuL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMuanMnXG5pbXBvcnQgeyBkb2NnZW4gfSBmcm9tICcuL3BsdWdpbnMvZG9jZ2VuLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgc3BsaXRWZW5kb3JDaHVua1BsdWdpbigpLFxuICAgIHZpcnR1YWxDb25maWcoKSxcbiAgICByZWFjdCgpLFxuICAgIHZhbmlsbGFFeHRyYWN0UGx1Z2luKHtcbiAgICAgIGlkZW50aWZpZXJzKHsgZmlsZVBhdGgsIGRlYnVnSWQgfSkge1xuICAgICAgICBjb25zdCBzY29wZSA9IGJhc2VuYW1lKGZpbGVQYXRoKS5yZXBsYWNlKCcuY3NzLnRzJywgJycpXG4gICAgICAgIHJldHVybiBgdm9jc18ke3Njb3BlfSR7ZGVidWdJZCA/IGBfJHtkZWJ1Z0lkfWAgOiAnJ31gXG4gICAgICB9LFxuICAgICAgZW1pdENzc0luU3NyOiB0cnVlLFxuICAgIH0pLFxuICAgIGNzcygpLFxuICAgIGRvY2dlbigpLFxuICAgIG1keCgpLFxuICAgIHZpcnR1YWxSb3V0ZXMoKSxcbiAgICB2aXJ0dWFsUm9vdCgpLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBmczoge1xuICAgICAgYWxsb3c6IFsnLi4nXSxcbiAgICB9LFxuICB9LFxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvY3NzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9jc3MudHNcIjtpbXBvcnQgeyBhY2Nlc3NTeW5jIH0gZnJvbSAnbm9kZTpmcydcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIGF1dG9wcmVmaXhlciB9IGZyb20gJ2F1dG9wcmVmaXhlcidcbmltcG9ydCB7IGRlZmF1bHQgYXMgdGFpbHdpbmRjc3MgfSBmcm9tICd0YWlsd2luZGNzcydcbmltcG9ydCB7IGRlZmF1bHQgYXMgdGFpbHdpbmRjc3NOZXN0aW5nIH0gZnJvbSAndGFpbHdpbmRjc3MvbmVzdGluZydcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGNzcygpOiBQbHVnaW5PcHRpb24ge1xuICBjb25zdCB0YWlsd2luZENvbmZpZyA9IGZpbmRUYWlsd2luZENvbmZpZygpXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnY3NzJyxcbiAgICBjb25maWcoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjc3M6IHtcbiAgICAgICAgICBwb3N0Y3NzOiB7XG4gICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgIGF1dG9wcmVmaXhlcigpLFxuICAgICAgICAgICAgICB0YWlsd2luZGNzc05lc3RpbmcoKSxcbiAgICAgICAgICAgICAgdGFpbHdpbmRDb25maWdcbiAgICAgICAgICAgICAgICA/ICh0YWlsd2luZGNzcyBhcyBhbnkpKHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiB0YWlsd2luZENvbmZpZyxcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIH0sXG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFRhaWx3aW5kXG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kVGFpbHdpbmRDb25maWcoKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGVzID0gW1xuICAgICcuL3RhaWx3aW5kLmNvbmZpZy5qcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLmNqcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLm1qcycsXG4gICAgJy4vdGFpbHdpbmQuY29uZmlnLnRzJyxcbiAgXVxuICBmb3IgKGNvbnN0IGNvbmZpZ0ZpbGUgb2YgY29uZmlnRmlsZXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29uZmlnUGF0aCA9IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgY29uZmlnRmlsZSlcbiAgICAgIGFjY2Vzc1N5bmMoY29uZmlnUGF0aClcbiAgICAgIHJldHVybiBjb25maWdQYXRoXG4gICAgfSBjYXRjaCAoZXJyKSB7fVxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvbWR4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9tZHgudHNcIjtpbXBvcnQgbWR4UGx1Z2luIGZyb20gJ0BtZHgtanMvcm9sbHVwJ1xuaW1wb3J0IHsgaCB9IGZyb20gJ2hhc3RzY3JpcHQnXG5pbXBvcnQgcmVoeXBlQXV0b2xpbmtIZWFkaW5ncyBmcm9tICdyZWh5cGUtYXV0b2xpbmstaGVhZGluZ3MnXG5pbXBvcnQgcmVoeXBlUHJldHR5Q29kZSBmcm9tICdyZWh5cGUtcHJldHR5LWNvZGUnXG5pbXBvcnQgcmVoeXBlU2x1ZyBmcm9tICdyZWh5cGUtc2x1ZydcbmltcG9ydCByZW1hcmtEaXJlY3RpdmUgZnJvbSAncmVtYXJrLWRpcmVjdGl2ZSdcbmltcG9ydCByZW1hcmtGcm9udG1hdHRlciBmcm9tICdyZW1hcmstZnJvbnRtYXR0ZXInXG5pbXBvcnQgcmVtYXJrR2ZtIGZyb20gJ3JlbWFyay1nZm0nXG5pbXBvcnQgcmVtYXJrTWR4RnJvbnRtYXR0ZXIgZnJvbSAncmVtYXJrLW1keC1mcm9udG1hdHRlcidcbmltcG9ydCB7XG4gIGNyZWF0ZURpZmZQcm9jZXNzb3IsXG4gIGNyZWF0ZUZvY3VzUHJvY2Vzc29yLFxuICBjcmVhdGVIaWdobGlnaHRQcm9jZXNzb3IsXG4gIGdldEhpZ2hsaWdodGVyLFxufSBmcm9tICdzaGlraS1wcm9jZXNzb3InXG5pbXBvcnQgdHlwZSB7IFBsdWdpbk9wdGlvbiB9IGZyb20gJ3ZpdGUnXG5cbmltcG9ydCB7IHJlbWFya0NhbGxvdXQgfSBmcm9tICcuL3JlbWFyay9jYWxsb3V0LmpzJ1xuaW1wb3J0IHsgcmVtYXJrQ29kZUdyb3VwIH0gZnJvbSAnLi9yZW1hcmsvY29kZS1ncm91cC5qcydcbmltcG9ydCB7IHJlbWFya0NvZGUgfSBmcm9tICcuL3JlbWFyay9jb2RlLmpzJ1xuaW1wb3J0IHsgcmVtYXJrRGV0YWlscyB9IGZyb20gJy4vcmVtYXJrL2RldGFpbHMuanMnXG5pbXBvcnQgeyByZW1hcmtJbmZlckZyb250bWF0dGVyIH0gZnJvbSAnLi9yZW1hcmsvaW5mZXJyZWQtZnJvbnRtYXR0ZXIuanMnXG5pbXBvcnQgeyByZW1hcmtTdGVwcyB9IGZyb20gJy4vcmVtYXJrL3N0ZXBzLmpzJ1xuaW1wb3J0IHsgcmVtYXJrU3Ryb25nQmxvY2sgfSBmcm9tICcuL3JlbWFyay9zdHJvbmctYmxvY2suanMnXG5pbXBvcnQgeyByZW1hcmtTdWJoZWFkaW5nIH0gZnJvbSAnLi9yZW1hcmsvc3ViaGVhZGluZy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIG1keCgpIHtcbiAgcmV0dXJuIG1keFBsdWdpbih7XG4gICAgcmVtYXJrUGx1Z2luczogW1xuICAgICAgcmVtYXJrRGlyZWN0aXZlLFxuICAgICAgcmVtYXJrSW5mZXJGcm9udG1hdHRlcixcbiAgICAgIHJlbWFya0Zyb250bWF0dGVyLFxuICAgICAgcmVtYXJrTWR4RnJvbnRtYXR0ZXIsXG4gICAgICByZW1hcmtHZm0sXG4gICAgICByZW1hcmtDYWxsb3V0LFxuICAgICAgcmVtYXJrQ29kZSxcbiAgICAgIHJlbWFya0NvZGVHcm91cCxcbiAgICAgIHJlbWFya0RldGFpbHMsXG4gICAgICByZW1hcmtTdGVwcyxcbiAgICAgIHJlbWFya1N0cm9uZ0Jsb2NrLFxuICAgICAgcmVtYXJrU3ViaGVhZGluZyxcbiAgICBdLFxuICAgIHJlaHlwZVBsdWdpbnM6IFtcbiAgICAgIFtcbiAgICAgICAgcmVoeXBlUHJldHR5Q29kZSBhcyBhbnksXG4gICAgICAgIHtcbiAgICAgICAgICBrZWVwQmFja2dyb3VuZDogZmFsc2UsXG4gICAgICAgICAgZ2V0SGlnaGxpZ2h0ZXIob3B0aW9uczogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0SGlnaGxpZ2h0ZXIoe1xuICAgICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgICBwcm9jZXNzb3JzOiBbXG4gICAgICAgICAgICAgICAgY3JlYXRlRGlmZlByb2Nlc3NvcigpLFxuICAgICAgICAgICAgICAgIGNyZWF0ZUZvY3VzUHJvY2Vzc29yKCksXG4gICAgICAgICAgICAgICAgY3JlYXRlSGlnaGxpZ2h0UHJvY2Vzc29yKCksXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGhlbWU6IHtcbiAgICAgICAgICAgIGRhcms6ICdnaXRodWItZGFyay1kaW1tZWQnLFxuICAgICAgICAgICAgbGlnaHQ6ICdnaXRodWItbGlnaHQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVoeXBlU2x1ZyxcbiAgICAgIFtcbiAgICAgICAgcmVoeXBlQXV0b2xpbmtIZWFkaW5ncyxcbiAgICAgICAge1xuICAgICAgICAgIGJlaGF2aW9yOiAnYXBwZW5kJyxcbiAgICAgICAgICBjb250ZW50KCkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgaCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIGRhdGFBdXRvbGlua0ljb246IHRydWUsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIF0sXG4gIH0pIGFzIFBsdWdpbk9wdGlvblxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NhbGxvdXQudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jYWxsb3V0LnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtDYWxsb3V0KCkge1xuICByZXR1cm4gKHRyZWU6IFJvb3QpID0+IHtcbiAgICB2aXNpdCh0cmVlLCAobm9kZSkgPT4ge1xuICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NvbnRhaW5lckRpcmVjdGl2ZScpIHJldHVyblxuICAgICAgaWYgKFxuICAgICAgICBub2RlLm5hbWUgIT09ICdjYWxsb3V0JyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICdpbmZvJyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICd3YXJuaW5nJyAmJlxuICAgICAgICBub2RlLm5hbWUgIT09ICdkYW5nZXInICYmXG4gICAgICAgIG5vZGUubmFtZSAhPT0gJ3RpcCcgJiZcbiAgICAgICAgbm9kZS5uYW1lICE9PSAnc3VjY2VzcycgJiZcbiAgICAgICAgbm9kZS5uYW1lICE9PSAnbm90ZSdcbiAgICAgIClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICAgIGNvbnN0IGxhYmVsID0gbm9kZS5jaGlsZHJlbi5maW5kKChjaGlsZCkgPT4gY2hpbGQuZGF0YT8uZGlyZWN0aXZlTGFiZWwpPy5jaGlsZHJlblswXS52YWx1ZVxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnYXNpZGUnXG5cbiAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICBub2RlLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5maWx0ZXIoKGNoaWxkOiBhbnkpID0+ICFjaGlsZC5kYXRhPy5kaXJlY3RpdmVMYWJlbClcbiAgICAgICAgbm9kZS5jaGlsZHJlbi51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICBkYXRhOiB7IGhQcm9wZXJ0aWVzOiB7ICdkYXRhLWNhbGxvdXQtdGl0bGUnOiB0cnVlIH0gfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiAnc3Ryb25nJyxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IGxhYmVsIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBkYXRhLmhOYW1lID0gdGFnTmFtZVxuICAgICAgZGF0YS5oUHJvcGVydGllcyA9IHtcbiAgICAgICAgLi4uaCh0YWdOYW1lLCBub2RlLmF0dHJpYnV0ZXMgfHwge30pLnByb3BlcnRpZXMsXG4gICAgICAgICdkYXRhLWNhbGxvdXQnOiBub2RlLm5hbWUgIT09ICdjYWxsb3V0JyA/IG5vZGUubmFtZSA6IHRydWUsXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUtZ3JvdXAudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLWdyb3VwLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBCbG9ja0NvbnRlbnQsIERlZmluaXRpb25Db250ZW50LCBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtDb2RlR3JvdXAoKSB7XG4gIHJldHVybiAodHJlZTogUm9vdCkgPT4ge1xuICAgIHZpc2l0KHRyZWUsIChub2RlKSA9PiB7XG4gICAgICBpZiAobm9kZS50eXBlICE9PSAnY29udGFpbmVyRGlyZWN0aXZlJykgcmV0dXJuXG4gICAgICBpZiAobm9kZS5uYW1lICE9PSAnY29kZS1ncm91cCcpIHJldHVyblxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnZGl2J1xuXG4gICAgICBub2RlLmF0dHJpYnV0ZXMgPSB7XG4gICAgICAgIC4uLm5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgY2xhc3M6ICdjb2RlLWdyb3VwJyxcbiAgICAgIH1cblxuICAgICAgZGF0YS5oTmFtZSA9IHRhZ05hbWVcbiAgICAgIGRhdGEuaFByb3BlcnRpZXMgPSBoKHRhZ05hbWUsIG5vZGUuYXR0cmlidXRlcyB8fCB7fSkucHJvcGVydGllc1xuXG4gICAgICBub2RlLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlblxuICAgICAgICAubWFwKChjaGlsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gJ21ldGEnIGluIGNoaWxkICYmIGNoaWxkPy5tZXRhPy5tYXRjaCgvXlxcWyguKilcXF0vKVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbY2hpbGRdLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBoTmFtZTogJ2RpdicsXG4gICAgICAgICAgICAgIGhQcm9wZXJ0aWVzOiBtYXRjaFxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS10aXRsZSc6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbikgYXMgKEJsb2NrQ29udGVudCB8IERlZmluaXRpb25Db250ZW50KVtdXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2NvZGUudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9jb2RlLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrQ29kZSgpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NvZGUnKSByZXR1cm5cbiAgICAgIGlmIChwYXJlbnQ/LnR5cGUgPT09ICdjb250YWluZXJEaXJlY3RpdmUnICYmIHBhcmVudC5uYW1lICE9PSAnc3RlcHMnKSByZXR1cm5cblxuICAgICAgY29uc3QgW21hdGNoLCB0aXRsZV0gPSBub2RlLm1ldGE/Lm1hdGNoKC9cXFsoLiopXFxdLykgfHwgW11cbiAgICAgIGlmIChtYXRjaCkgbm9kZS5tZXRhID0gbm9kZS5tZXRhPy5yZXBsYWNlKG1hdGNoLCBgdGl0bGU9XFxcIiR7dGl0bGV9XFxcImApXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2RldGFpbHMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9kZXRhaWxzLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrRGV0YWlscygpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUpID0+IHtcbiAgICAgIGlmIChub2RlLnR5cGUgIT09ICdjb250YWluZXJEaXJlY3RpdmUnKSByZXR1cm5cbiAgICAgIGlmIChub2RlLm5hbWUgIT09ICdkZXRhaWxzJykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IGRhdGEgPSBub2RlLmRhdGEgfHwgKG5vZGUuZGF0YSA9IHt9KVxuICAgICAgY29uc3QgdGFnTmFtZSA9ICdkZXRhaWxzJ1xuXG4gICAgICBjb25zdCBzdW1tYXJ5Q2hpbGQgPSBub2RlLmNoaWxkcmVuWzBdXG4gICAgICBpZiAoc3VtbWFyeUNoaWxkLnR5cGUgPT09ICdwYXJhZ3JhcGgnICYmIHN1bW1hcnlDaGlsZC5kYXRhPy5kaXJlY3RpdmVMYWJlbClcbiAgICAgICAgc3VtbWFyeUNoaWxkLmRhdGEuaE5hbWUgPSAnc3VtbWFyeSdcbiAgICAgIGVsc2VcbiAgICAgICAgbm9kZS5jaGlsZHJlbi51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICBjaGlsZHJlbjogW3sgdHlwZTogJ3RleHQnLCB2YWx1ZTogJ0RldGFpbHMnIH1dLFxuICAgICAgICAgIGRhdGE6IHsgaE5hbWU6ICdzdW1tYXJ5JyB9LFxuICAgICAgICB9KVxuXG4gICAgICBkYXRhLmhOYW1lID0gdGFnTmFtZVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9pbmZlcnJlZC1mcm9udG1hdHRlci50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL2luZmVycmVkLWZyb250bWF0dGVyLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB0eXBlIHsgUm9vdCwgWWFtbCB9IGZyb20gJ21kYXN0J1xuaW1wb3J0IHsgdmlzaXQgfSBmcm9tICd1bmlzdC11dGlsLXZpc2l0J1xuXG5leHBvcnQgZnVuY3Rpb24gcmVtYXJrSW5mZXJGcm9udG1hdHRlcigpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKHBhcmVudD8udHlwZSAhPT0gJ3Jvb3QnKSByZXR1cm5cblxuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ2hlYWRpbmcnICYmIG5vZGUuZGVwdGggPT09IDEpIHtcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGRyZW5bMF1cbiAgICAgICAgaWYgKCEoJ3ZhbHVlJyBpbiBjaGlsZCkpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gY2hpbGQudmFsdWVcbiAgICAgICAgY29uc3QgWywgdGl0bGUsIGRlc2NyaXB0aW9uXSA9IHZhbHVlLmluY2x1ZGVzKCdbJylcbiAgICAgICAgICA/IHZhbHVlLm1hdGNoKC8oLiopIFxcWyguKilcXF0vKSB8fCBbXVxuICAgICAgICAgIDogW3VuZGVmaW5lZCwgdmFsdWVdXG5cbiAgICAgICAgY29uc3QgZnJvbnRtYXR0ZXJJbmRleCA9IHBhcmVudC5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkKSA9PiBjaGlsZC50eXBlID09PSAneWFtbCcpXG4gICAgICAgIGNvbnN0IGluZGV4ID0gZnJvbnRtYXR0ZXJJbmRleCA+IDAgPyBmcm9udG1hdHRlckluZGV4IDogMFxuXG4gICAgICAgIGNvbnN0IGZyb250bWF0dGVyID0ge1xuICAgICAgICAgIC4uLihwYXJlbnQuY2hpbGRyZW5bZnJvbnRtYXR0ZXJJbmRleF0gfHwge1xuICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgdHlwZTogJ3lhbWwnLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9IGFzIFlhbWxcbiAgICAgICAgaWYgKCFmcm9udG1hdHRlci52YWx1ZS5pbmNsdWRlcygndGl0bGUnKSkgZnJvbnRtYXR0ZXIudmFsdWUgKz0gYFxcbnRpdGxlOiAke3RpdGxlfVxcbmBcbiAgICAgICAgaWYgKCFmcm9udG1hdHRlci52YWx1ZS5pbmNsdWRlcygnZGVzY3JpcHRpb24nKSlcbiAgICAgICAgICBmcm9udG1hdHRlci52YWx1ZSArPSBgXFxuZGVzY3JpcHRpb246ICR7ZGVzY3JpcHRpb259XFxuYFxuXG4gICAgICAgIGlmIChmcm9udG1hdHRlckluZGV4ID09PSAtMSkgdHJlZS5jaGlsZHJlbi51bnNoaWZ0KGZyb250bWF0dGVyKVxuICAgICAgICBlbHNlIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEsIGZyb250bWF0dGVyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdGVwcy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0ZXBzLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLXRvLWhhc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJtZGFzdC11dGlsLWRpcmVjdGl2ZVwiIC8+XG5cbmltcG9ydCB7IGggfSBmcm9tICdoYXN0c2NyaXB0J1xuaW1wb3J0IHR5cGUgeyBIZWFkaW5nLCBSb290IH0gZnJvbSAnbWRhc3QnXG5pbXBvcnQgeyB2aXNpdCB9IGZyb20gJ3VuaXN0LXV0aWwtdmlzaXQnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW1hcmtTdGVwcygpIHtcbiAgcmV0dXJuICh0cmVlOiBSb290KSA9PiB7XG4gICAgdmlzaXQodHJlZSwgKG5vZGUpID0+IHtcbiAgICAgIGlmIChub2RlLnR5cGUgIT09ICdjb250YWluZXJEaXJlY3RpdmUnKSByZXR1cm5cbiAgICAgIGlmIChub2RlLm5hbWUgIT09ICdzdGVwcycpIHJldHVyblxuXG4gICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhIHx8IChub2RlLmRhdGEgPSB7fSlcbiAgICAgIGNvbnN0IHRhZ05hbWUgPSAnZGl2J1xuXG4gICAgICBub2RlLmF0dHJpYnV0ZXMgPSB7XG4gICAgICAgIC4uLm5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgJ2RhdGEtdm9jcy1zdGVwcyc6ICd0cnVlJyxcbiAgICAgIH1cblxuICAgICAgZGF0YS5oTmFtZSA9IHRhZ05hbWVcbiAgICAgIGRhdGEuaFByb3BlcnRpZXMgPSBoKHRhZ05hbWUsIG5vZGUuYXR0cmlidXRlcyB8fCB7fSkucHJvcGVydGllc1xuXG4gICAgICBjb25zdCBkZXB0aCA9IChub2RlLmNoaWxkcmVuLmZpbmQoKGNoaWxkKSA9PiBjaGlsZC50eXBlID09PSAnaGVhZGluZycpIGFzIEhlYWRpbmcpPy5kZXB0aCA/PyAyXG5cbiAgICAgIGxldCBjdXJyZW50Q2hpbGRcbiAgICAgIGNvbnN0IGNoaWxkcmVuID0gW11cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQudHlwZSA9PT0gJ2hlYWRpbmcnICYmIGNoaWxkLmRlcHRoID09PSBkZXB0aCkge1xuICAgICAgICAgIGlmIChjdXJyZW50Q2hpbGQgJiYgY3VycmVudENoaWxkLmNoaWxkcmVuLmxlbmd0aCA+IDApIGNoaWxkcmVuLnB1c2goY3VycmVudENoaWxkKVxuICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBoTmFtZTogJ2RpdicsXG4gICAgICAgICAgICAgIGhQcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgJ2RhdGEtZGVwdGgnOiBkZXB0aCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSBhcyBhbnlcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50Q2hpbGQhLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICB9XG4gICAgICBjaGlsZHJlbi5wdXNoKGN1cnJlbnRDaGlsZClcblxuICAgICAgbm9kZS5jaGlsZHJlbiA9IGNoaWxkcmVuXG4gICAgfSlcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0cm9uZy1ibG9jay50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvcmVtYXJrL3N0cm9uZy1ibG9jay50c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC10by1oYXN0XCIgLz5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC1kaXJlY3RpdmVcIiAvPlxuXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICdtZGFzdCdcbmltcG9ydCB7IHZpc2l0IH0gZnJvbSAndW5pc3QtdXRpbC12aXNpdCdcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFya1N0cm9uZ0Jsb2NrKCkge1xuICByZXR1cm4gKHRyZWU6IFJvb3QpID0+IHtcbiAgICB2aXNpdCh0cmVlLCAnc3Ryb25nJywgKG5vZGUsIF8sIHBhcmVudCkgPT4ge1xuICAgICAgaWYgKCFwYXJlbnQpIHJldHVyblxuICAgICAgaWYgKHBhcmVudC50eXBlICE9PSAncGFyYWdyYXBoJykgcmV0dXJuXG4gICAgICBpZiAocGFyZW50LmNoaWxkcmVuLmxlbmd0aCA+IDEpIHJldHVyblxuXG4gICAgICBwYXJlbnQudHlwZSA9ICdzdHJvbmcnIGFzIGFueVxuICAgICAgcGFyZW50LmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlblxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3JlbWFyay9zdWJoZWFkaW5nLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9yZW1hcmsvc3ViaGVhZGluZy50c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC10by1oYXN0XCIgLz5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibWRhc3QtdXRpbC1kaXJlY3RpdmVcIiAvPlxuXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICdtZGFzdCdcbmltcG9ydCB7IHZpc2l0IH0gZnJvbSAndW5pc3QtdXRpbC12aXNpdCdcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbWFya1N1YmhlYWRpbmcoKSB7XG4gIHJldHVybiAodHJlZTogUm9vdCkgPT4ge1xuICAgIHZpc2l0KHRyZWUsICdoZWFkaW5nJywgKG5vZGUsIGluZGV4LCBwYXJlbnQpID0+IHtcbiAgICAgIGlmICghaW5kZXgpIHJldHVyblxuICAgICAgaWYgKG5vZGUuZGVwdGggIT09IDEpIHJldHVyblxuICAgICAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAgICAgY29uc3Qgc3ViaGVhZGluZ1JlZ2V4ID0gLyBcXFsoLiopXFxdJC9cbiAgICAgIGNvbnN0IHN1YmhlYWRpbmdDaGlsZCA9IG5vZGUuY2hpbGRyZW4uZmluZChcbiAgICAgICAgKGNoaWxkKSA9PlxuICAgICAgICAgICd2YWx1ZScgaW4gY2hpbGQgJiYgdHlwZW9mIGNoaWxkLnZhbHVlID09PSAnc3RyaW5nJyAmJiBjaGlsZC52YWx1ZS5tYXRjaChzdWJoZWFkaW5nUmVnZXgpLFxuICAgICAgKSBhcyBhbnlcbiAgICAgIGNvbnN0IFttYXRjaCwgc3ViaGVhZGluZ10gPSBzdWJoZWFkaW5nQ2hpbGQ/LnZhbHVlPy5tYXRjaChzdWJoZWFkaW5nUmVnZXgpID8/IFtdXG4gICAgICBpZiAoc3ViaGVhZGluZ0NoaWxkKSBzdWJoZWFkaW5nQ2hpbGQudmFsdWUgPSBzdWJoZWFkaW5nQ2hpbGQ/LnZhbHVlPy5yZXBsYWNlKG1hdGNoLCAnJylcblxuICAgICAgLy8gcmVtb3ZlIG9yaWdpbmFsIGhlYWRpbmdcbiAgICAgIHBhcmVudD8uY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKVxuXG4gICAgICBjb25zdCBoZWFkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgaE5hbWU6ICdoZWFkZXInLFxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgc3ViaGVhZGluZ1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFt7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IHN1YmhlYWRpbmcgfV0sXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgaE5hbWU6ICdkaXYnLFxuICAgICAgICAgICAgICAgICAgaFByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgcm9sZTogJ2RvYy1zdWJ0aXRsZScsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICAgIH0gYXMgYW55XG4gICAgICBwYXJlbnQ/LmNoaWxkcmVuLnNwbGljZShpbmRleCwgMCwgaGVhZGVyKVxuICAgIH0pXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtY29uZmlnLnRzXCI7aW1wb3J0IHsgdHlwZSBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZVZvY3NDb25maWcgfSBmcm9tICcuLi91dGlscy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHZpcnR1YWxDb25maWcoKTogUGx1Z2luT3B0aW9uIHtcbiAgY29uc3QgdmlydHVhbE1vZHVsZUlkID0gJ3ZpcnR1YWw6Y29uZmlnJ1xuICBjb25zdCByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZCA9IGBcXDAke3ZpcnR1YWxNb2R1bGVJZH1gXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndm9jcy1jb25maWcnLFxuICAgIGFzeW5jIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIGNvbnN0IHsgY29uZmlnUGF0aCB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgaWYgKGNvbmZpZ1BhdGgpIHtcbiAgICAgICAgc2VydmVyLndhdGNoZXIuYWRkKGNvbmZpZ1BhdGgpXG4gICAgICAgIHNlcnZlci53YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgc2VydmVyLndzLnNlbmQoJ3ZvY3M6Y29uZmlnJywgKGF3YWl0IHJlc29sdmVWb2NzQ29uZmlnKCkpLmNvbmZpZylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBhc3luYyBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKSB7XG4gICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSBhd2FpdCByZXNvbHZlVm9jc0NvbmZpZygpXG4gICAgICAgIC8vIFRPRE86IHNlcmlhbGl6ZSBmbnNcbiAgICAgICAgcmV0dXJuIGBleHBvcnQgY29uc3QgY29uZmlnID0gJHtKU09OLnN0cmluZ2lmeShjb25maWcpfWBcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH0sXG4gICAgaGFuZGxlSG90VXBkYXRlKCkge1xuICAgICAgLy8gVE9ETzogaGFuZGxlIGNoYW5nZXNcbiAgICAgIHJldHVyblxuICAgIH0sXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS91dGlscy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3V0aWxzLnRzXCI7aW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ25vZGU6ZnMnXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHsgdHlwZSBDb25maWdFbnYsIGxvYWRDb25maWdGcm9tRmlsZSB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdHlwZSB7IFBhcnNlZENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy5qcydcblxuY29uc3QgZXh0ZW5zaW9ucyA9IFsnanMnLCAndHMnLCAnbWpzJywgJ210cyddXG5jb25zdCBkZWZhdWx0Q29uZmlnUGF0aHMgPSBbJy52b2NzL2NvbmZpZycsICd2b2NzLmNvbmZpZyddXG5cbnR5cGUgUmVzb2x2ZVZvY3NDb25maWdQYXJhbWV0ZXJzID0ge1xuICBjb21tYW5kPzogQ29uZmlnRW52Wydjb21tYW5kJ11cbiAgY29uZmlnUGF0aD86IHN0cmluZ1xuICBtb2RlPzogQ29uZmlnRW52Wydtb2RlJ11cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVWb2NzQ29uZmlnKHBhcmFtZXRlcnM6IFJlc29sdmVWb2NzQ29uZmlnUGFyYW1ldGVycyA9IHt9KSB7XG4gIGNvbnN0IHsgY29tbWFuZCA9ICdzZXJ2ZScsIG1vZGUgPSAnZGV2ZWxvcG1lbnQnIH0gPSBwYXJhbWV0ZXJzXG5cbiAgY29uc3QgY29uZmlnUGF0aCA9ICgoKSA9PiB7XG4gICAgZm9yIChjb25zdCBleHQgb2YgZXh0ZW5zaW9ucykge1xuICAgICAgaWYgKHBhcmFtZXRlcnMuY29uZmlnUGF0aCkgcmV0dXJuIHBhcmFtZXRlcnMuY29uZmlnUGF0aFxuICAgICAgZm9yIChjb25zdCBmaWxlUGF0aCBvZiBkZWZhdWx0Q29uZmlnUGF0aHMpXG4gICAgICAgIGlmIChleGlzdHNTeW5jKHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYCR7ZmlsZVBhdGh9LiR7ZXh0fWApKSkgcmV0dXJuIGAke2ZpbGVQYXRofS4ke2V4dH1gXG4gICAgfVxuICAgIHJldHVyblxuICB9KSgpXG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbG9hZENvbmZpZ0Zyb21GaWxlKHsgY29tbWFuZCwgbW9kZSB9LCBjb25maWdQYXRoKVxuXG4gIHJldHVybiB7XG4gICAgY29uZmlnOiAocmVzdWx0ID8gcmVzdWx0LmNvbmZpZyA6IHt9KSBhcyBQYXJzZWRDb25maWcsXG4gICAgY29uZmlnUGF0aCxcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy92aXJ0dWFsLXJvb3QudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtcm9vdC50c1wiO2ltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcblxudHlwZSBSb3V0ZXNQYXJhbWV0ZXJzID0geyByb290Pzogc3RyaW5nIH1cblxuZXhwb3J0IGZ1bmN0aW9uIHZpcnR1YWxSb290KHtcbiAgcm9vdCA9IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vcm9vdC50c3gnKSxcbn06IFJvdXRlc1BhcmFtZXRlcnMgPSB7fSk6IFBsdWdpbk9wdGlvbiB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOnJvb3QnXG4gIGNvbnN0IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkID0gYFxcMCR7dmlydHVhbE1vZHVsZUlkfWBcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdyb3V0ZXMnLFxuICAgIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKSB7XG4gICAgICAgIGlmICghZXhpc3RzU3luYyhyb290KSkgcmV0dXJuICdleHBvcnQgY29uc3QgUm9vdCA9ICh7IGNoaWxkcmVuIH0pID0+IGNoaWxkcmVuOydcbiAgICAgICAgcmV0dXJuIGBleHBvcnQgeyBkZWZhdWx0IGFzIFJvb3QgfSBmcm9tIFwiJHtyb290fVwiO2BcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH0sXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnMvdmlydHVhbC1yb3V0ZXMudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL3ZpcnR1YWwtcm91dGVzLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGdsb2JieSB9IGZyb20gJ2dsb2JieSdcbmltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHJlc29sdmVWb2NzQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB2aXJ0dWFsUm91dGVzKCk6IFBsdWdpbk9wdGlvbiB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOnJvdXRlcydcbiAgY29uc3QgcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQgPSBgXFwwJHt2aXJ0dWFsTW9kdWxlSWR9YFxuXG4gIGxldCBnbG9iOiBzdHJpbmdcbiAgbGV0IHBhdGhzOiBzdHJpbmdbXSA9IFtdXG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAncm91dGVzJyxcbiAgICBhc3luYyBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBjb25zdCB7IGNvbmZpZyB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgY29uc3QgeyByb290IH0gPSBjb25maWdcbiAgICAgIGNvbnN0IHBhZ2VzUGF0aCA9IHJlc29sdmUocm9vdCwgJ3BhZ2VzJylcbiAgICAgIHNlcnZlci53YXRjaGVyLmFkZChwYWdlc1BhdGgpXG4gICAgICBzZXJ2ZXIud2F0Y2hlci5vbignYWRkJywgKCkgPT4gc2VydmVyLnJlc3RhcnQoKSlcbiAgICAgIHNlcnZlci53YXRjaGVyLm9uKCd1bmxpbmsnLCAoKSA9PiBzZXJ2ZXIucmVzdGFydCgpKVxuICAgIH0sXG4gICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkgcmV0dXJuIHJlc29sdmVkVmlydHVhbE1vZHVsZUlkXG4gICAgICByZXR1cm5cbiAgICB9LFxuICAgIGFzeW5jIGxvYWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQpIHtcbiAgICAgICAgbGV0IGNvZGUgPSAnZXhwb3J0IGNvbnN0IHJvdXRlcyA9IFsnXG4gICAgICAgIGZvciAoY29uc3QgcGF0aCBvZiBwYXRocykge1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBwYXRoXG4gICAgICAgICAgICAuc3BsaXQoJy4nKVxuICAgICAgICAgICAgLnBvcCgpXG4gICAgICAgICAgICA/Lm1hdGNoKC8obWR4fG1kKS8pXG4gICAgICAgICAgICA/ICdtZHgnXG4gICAgICAgICAgICA6ICdqc3gnXG4gICAgICAgICAgY29uc3QgcmVwbGFjZXIgPSBnbG9iLnNwbGl0KCcqJylbMF1cbiAgICAgICAgICBsZXQgcGFnZVBhdGggPSBwYXRoLnJlcGxhY2UocmVwbGFjZXIsICcnKS5yZXBsYWNlKC9cXC4oLiopLywgJycpXG4gICAgICAgICAgaWYgKHBhZ2VQYXRoLmVuZHNXaXRoKCdpbmRleCcpKVxuICAgICAgICAgICAgcGFnZVBhdGggPSBwYWdlUGF0aC5yZXBsYWNlKCdpbmRleCcsICcnKS5yZXBsYWNlKC9cXC8kLywgJycpXG4gICAgICAgICAgY29kZSArPSBgICB7IGxhenk6ICgpID0+IGltcG9ydChcIiR7cGF0aH1cIiksIHBhdGg6IFwiLyR7cGFnZVBhdGh9XCIsIHR5cGU6IFwiJHt0eXBlfVwiIH0sYFxuICAgICAgICAgIGlmIChwYWdlUGF0aClcbiAgICAgICAgICAgIGNvZGUgKz0gYCAgeyBsYXp5OiAoKSA9PiBpbXBvcnQoXCIke3BhdGh9XCIpLCBwYXRoOiBcIi8ke3BhZ2VQYXRofS5odG1sXCIsIHR5cGU6IFwiJHt0eXBlfVwiIH0sYFxuICAgICAgICB9XG4gICAgICAgIGNvZGUgKz0gJ10nXG4gICAgICAgIHJldHVybiBjb2RlXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9LFxuICAgIGFzeW5jIGJ1aWxkU3RhcnQoKSB7XG4gICAgICBjb25zdCB7IGNvbmZpZyB9ID0gYXdhaXQgcmVzb2x2ZVZvY3NDb25maWcoKVxuICAgICAgY29uc3QgeyByb290IH0gPSBjb25maWdcbiAgICAgIGNvbnN0IHBhZ2VzUGF0aCA9IHJlc29sdmUocm9vdCwgJ3BhZ2VzJylcbiAgICAgIGdsb2IgPSBgJHtwYWdlc1BhdGh9LyoqLyoue21kLG1keCx0cyx0c3gsanMsanN4fWBcbiAgICAgIHBhdGhzID0gYXdhaXQgZ2xvYmJ5KGdsb2IpXG4gICAgfSxcbiAgICBoYW5kbGVIb3RVcGRhdGUoKSB7XG4gICAgICAvLyBUT0RPOiBoYW5kbGUgY2hhbmdlc1xuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdG1tL0RldmVsb3Blci92b2NzL3NyYy92aXRlL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90bW0vRGV2ZWxvcGVyL3ZvY3Mvc3JjL3ZpdGUvcGx1Z2lucy9kb2NnZW4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3RtbS9EZXZlbG9wZXIvdm9jcy9zcmMvdml0ZS9wbHVnaW5zL2RvY2dlbi50c1wiO2ltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBQcm9qZWN0IH0gZnJvbSAndHMtbW9ycGgnXG5pbXBvcnQgeyB0eXBlIFBsdWdpbk9wdGlvbiB9IGZyb20gJ3ZpdGUnXG5cbmNvbnN0IHByb2plY3QgPSBuZXcgUHJvamVjdCh7IHRzQ29uZmlnRmlsZVBhdGg6ICcuLi90c2NvbmZpZy5qc29uJyB9KVxuXG5leHBvcnQgZnVuY3Rpb24gZG9jZ2VuKCk6IFBsdWdpbk9wdGlvbiB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9ICd2aXJ0dWFsOmRvY2dlbidcbiAgY29uc3QgcmVzb2x2ZWRWaXJ0dWFsTW9kdWxlSWQgPSBgXFwwJHt2aXJ0dWFsTW9kdWxlSWR9YFxuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2RvY2dlbicsXG4gICAgYXN5bmMgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9qZWN0LmdldFNvdXJjZUZpbGVzKClcbiAgICAgIGlmIChzb3VyY2VGaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qgcm9vdERpcnMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZUZpbGUgb2Ygc291cmNlRmlsZXMpIHtcbiAgICAgICAgICBjb25zdCBrZXkgPSBzb3VyY2VGaWxlXG4gICAgICAgICAgICAuZ2V0RmlsZVBhdGgoKVxuICAgICAgICAgICAgLnJlcGxhY2UoYCR7cGF0aC5kaXJuYW1lKHByb2Nlc3MuY3dkKCkpfS9gLCAnJylcbiAgICAgICAgICAgIC5zcGxpdCgnLycpWzBdXG4gICAgICAgICAgcm9vdERpcnMuYWRkKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBgLi4vJHtrZXl9LyoqYCkpXG4gICAgICAgIH1cbiAgICAgICAgcm9vdERpcnMuYWRkKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLi4vc3JjL2hlbGxvLnRzJykpXG5cbiAgICAgICAgc2VydmVyLndhdGNoZXIuYWRkKFsuLi5yb290RGlyc10pXG4gICAgICAgIHNlcnZlci53YXRjaGVyLm9uKCdjaGFuZ2UnLCAoKSA9PiBzZXJ2ZXIud3Muc2VuZCgndm9jczpkb2NnZW4nLCBnZXRGaWxlcygpKSlcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coc2VydmVyLndhdGNoZXIuZ2V0V2F0Y2hlZCgpKVxuICAgICAgICB9LCAxXzAwMClcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlc29sdmVJZChpZCkge1xuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHJldHVybiByZXNvbHZlZFZpcnR1YWxNb2R1bGVJZFxuICAgICAgcmV0dXJuXG4gICAgfSxcbiAgICBhc3luYyBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgIT09IHJlc29sdmVkVmlydHVhbE1vZHVsZUlkKSByZXR1cm5cblxuICAgICAgY29uc3QgZmlsZXMgPSBnZXRGaWxlcygpXG5cbiAgICAgIHJldHVybiBgZXhwb3J0IGNvbnN0IGRvY2dlbiA9ICR7SlNPTi5zdHJpbmdpZnkoZmlsZXMpfWBcbiAgICB9LFxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVzKCkge1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2plY3QuZ2V0U291cmNlRmlsZXMoKVxuXG4gIGNvbnN0IGZpbGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgZm9yIChjb25zdCBzb3VyY2VGaWxlIG9mIHNvdXJjZUZpbGVzKSB7XG4gICAgY29uc3Qga2V5ID0gc291cmNlRmlsZS5nZXRGaWxlUGF0aCgpLnJlcGxhY2UoYCR7cGF0aC5kaXJuYW1lKHByb2Nlc3MuY3dkKCkpfS9gLCAnJylcbiAgICBmaWxlc1trZXldID0gc291cmNlRmlsZS5nZXRGdWxsVGV4dCgpXG4gIH1c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QUFDdEQsZUFBTyxRQUFRLEtBQUssR0FBRyxVQUFVLElBQUksT0FBTyxLQUFLLEVBQUU7QUFBQSxNQUNyRDtBQUFBLE1BQ0EsY0FBYztBQUFBLElBQ2hCLENBQUM7QUFBQSxJQUNELElBQUk7QUFBQSxJQUNKLE9BQU87QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLGNBQWM7QUFBQSxJQUNkLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixPQUFPLENBQUMsSUFBSTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiaCIsICJoIiwgInZpc2l0IiwgInZpc2l0IiwgImgiLCAidmlzaXQiLCAidmlzaXQiLCAidmlzaXQiLCAidmlzaXQiLCAidmlzaXQiLCAidmlzaXQiLCAiY2hpbGQiLCAiaCIsICJ2aXNpdCIsICJ2aXNpdCIsICJoIiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgInZpc2l0IiwgImgiLCAicmVzb2x2ZSIsICJyZXNvbHZlIiwgImV4aXN0c1N5bmMiLCAicmVzb2x2ZSIsICJyZXNvbHZlIiwgImV4aXN0c1N5bmMiLCAicmVzb2x2ZSIsICJyZXNvbHZlIiwgInBhdGgiXQp9Cg==
