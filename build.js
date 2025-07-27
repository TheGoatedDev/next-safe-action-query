#!/usr/bin/env node
import { build } from "esbuild";
import { execSync } from "child_process";
import { writeFileSync, rmSync, mkdirSync } from "fs";
import { glob } from "glob";

// Clean dist directory
try {
	rmSync("dist", { recursive: true, force: true });
} catch {}

// Create dist directory
mkdirSync("dist", { recursive: true });

// Get all TypeScript files
const entryPoints = glob.sync("src/**/*.ts", {
	ignore: ["src/**/*.test.ts", "src/**/*.spec.ts"],
});

async function buildPackage() {
	console.log("🔨 Building next-safe-action-query with pnpm...");

	if (entryPoints.length === 0) {
		console.log("⚠️  No TypeScript files found in src/");
		return;
	}

	console.log(`📁 Found ${entryPoints.length} source files`);

	try {
		// Build ESM
		console.log("📦 Building ESM...");
		await build({
			entryPoints,
			outdir: "dist/esm",
			format: "esm",
			platform: "node",
			target: "node18",
			sourcemap: true,
			tsconfig: "./tsconfig.json",
			bundle: false, // Don't bundle dependencies
			splitting: false,
			minify: false,
		});

		// Build CJS
		console.log("📦 Building CJS...");
		await build({
			entryPoints,
			outdir: "dist/cjs",
			format: "cjs",
			platform: "node",
			target: "node18",
			sourcemap: true,
			outExtension: { ".js": ".cjs" },
			tsconfig: "./tsconfig.json",
			bundle: false, // Don't bundle dependencies
			splitting: false,
			minify: false,
		});

		// Add package.json files to specify module type
		console.log("📝 Adding package.json files...");
		writeFileSync(
			"dist/esm/package.json",
			JSON.stringify({ type: "module" }, null, 2),
		);
		writeFileSync(
			"dist/cjs/package.json",
			JSON.stringify({ type: "commonjs" }, null, 2),
		);

		// Generate TypeScript declarations
		console.log("📝 Generating type declarations...");
		execSync("pnpm exec tsc -p tsconfig.build.json", { stdio: "inherit" });

		console.log("✅ Build complete!");
		console.log("📊 Output:");
		console.log("  - dist/esm/     (ES Modules)");
		console.log("  - dist/cjs/     (CommonJS)");
		console.log("  - dist/types/   (TypeScript declarations)");
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

buildPackage();
