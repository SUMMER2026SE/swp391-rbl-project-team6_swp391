// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      port: 8081,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
      // Improve HMR in development
      hmr: {
        overlay: true,  // Show errors in overlay
      },
      watch: {
        ignored: ["**/routeTree.gen.ts"],  // Ignore auto-generated file
      },
    },
    optimizeDeps: {
      include: ["xlsx"],
      // Force pre-bundle these dependencies for faster dev startup
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      // Disable CSS source map in production for cleaner builds
      cssSourceMap: true,
      // Improve build performance
      minify: "esbuild",
      target: "esnext",
    },
    // Disable cache for faster HMR updates during development
    cache: false,
  },
  // Add cache-busting via content hash in filenames
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
});
