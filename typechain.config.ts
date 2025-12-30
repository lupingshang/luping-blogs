// TypeChain 配置 - 用于生成以太坊合约类型
export default {
  allFiles: "src/common/**/*.json",
  outDir: "src/types/generated",
  target: "ethers-v6",
  alwaysGenerateOverloads: false,
};
