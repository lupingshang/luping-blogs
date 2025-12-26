import { defineConfig } from "@typechain/hardhat";

export default defineConfig({
  allFiles: "src/common/**/*.json",
  outDir: "src/types/generated",
  target: "ethers-v6",
  alwaysGenerateOverloads: false,
});
