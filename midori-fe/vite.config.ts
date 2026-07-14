// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { unpluginRouterGeneratorFactory } from "@tanstack/router-plugin";

// Route tree generator plugin - required for TanStack Router code generation
const RouteGenerator = unpluginRouterGeneratorFactory({
  target: "react-start",
  routesDirectory: "./src/routes",
  generatedRouteTree: "./src/routeTree.gen.ts",
});

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig({
  plugins: [RouteGenerator as never],
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
    },
    optimizeDeps: {
      include: ["xlsx"],
    },
    build: {
      // Disable CSS source map in production for cleaner builds
      cssSourceMap: true,
    },
    // Disable cache for faster HMR updates during development
    cache: false,
  },
  // Add cache-busting via content hash in filenames
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
});
