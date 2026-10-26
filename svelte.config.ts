import adapter from "@sveltejs/adapter-node";
import type { Config } from "@sveltejs/kit";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config: Config = {
    preprocess: vitePreprocess(),
    compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
            filename.split(/[/\\]/).includes("node_modules") ? undefined : true
    },
    kit: {
        adapter: adapter(),
        typescript: {
            config: (config) => {
                config.include.push("../drizzle.config.ts");
            }
        }
    }
};

export default config;
