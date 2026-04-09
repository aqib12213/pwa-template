import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
// Constants to satisfy lint rules

const config = defineConfig({
	// optimizeDeps: {
	// 	exclude: ["sqlocal"],
	// },
	// assetsInclude: ["**/*.sqlite", "**/*.wasm"],
	plugins: [
		// sqlocal(),
		lingui(),
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact({
			babel: {
				plugins: [
					"babel-plugin-react-compiler",
					"@lingui/babel-plugin-lingui-macro",
				],
			},
		}),
		VitePWA({
			strategies: "injectManifest",
			registerType: "prompt",
			injectRegister: "auto",
			srcDir: "src",
			filename: "sw.ts",

			pwaAssets: {
				disabled: false,
				config: true,
			},

			manifest: {
				name: "DONATIONS-CLIENT",
				short_name: "D-CLIENT",
				description:
					"DONATIONS-CLIENT is an offline-first Donation Managment app",
				theme_color: "#fafafa",
			},

			injectManifest: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico,data,po}"],
				sourcemap: true,
			},

			devOptions: {
				enabled: true,
				navigateFallback: "index.html",
				suppressWarnings: true,
				type: "module",
			},
		}),
	],
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
});

export default config;
