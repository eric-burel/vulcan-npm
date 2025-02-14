import { defineConfig } from "tsup";
import path from "path";

const commonConfig = {
  clean: true,
  splitting: false,
  // Skip until .d.ts.map is also supported https://github.com/egoist/tsup/issues/564
  // dts: true,
  sourcemap: true,
  tsconfig: path.resolve(__dirname, "./tsconfig.build.json"),
};
export default defineConfig([
  {
    entry: ["index.ts"],
    ...commonConfig,
    format: ["esm"],
    outDir: "dist",
  },
  // testing utils use a separated entry point
  {
    entry: ["testing.ts"],
    ...commonConfig,
    format: ["esm"],
    outDir: "dist",
  },
  /*
  There is no server/client specific code in this package yet,
  every component is isomorphic (work on client and server)
  {
    entry: ["server/index.ts"],
    ...commonConfig,
    format: ["cjs"],
    outDir: "dist/server",
  },
  {
    entry: ["client/index.ts"],
    ...commonConfig,
    format: ["esm", "iife"],
    outDir: "dist/client",
  },*/
]);
