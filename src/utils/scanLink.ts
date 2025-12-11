const { ethers } = require("ethers");
//扫链程序示例：监听以太坊区块链上的交易并解析交易信息
// 1. 配置 Provider（连接到以太坊网络）
// 这里使用 Infura 的 RPC 地址作为示例，你需要替换成自己的
const provider = new ethers.providers.JsonRpcProvider(
  "https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY"
);

// 或者使用 Alchemy
// const provider = new ethers.providers.JsonRpcProvider(
//   "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY"
// );

// 2. 定义要监听的合约地址（可选，如果你只关心特定合约的交易）
// const TARGET_CONTRACT_ADDRESS = "0x...";

// 3. 监听新区块
async function startBlockListening() {
  console.log("开始监听新区块...");

  // 获取当前最新区块号
  let latestBlockNumber = await provider.getBlockNumber();
  console.log(`当前最新区块号: ${latestBlockNumber}`);

  // 定期检查新区块（每 15 秒，因为以太坊出块时间约 12-15 秒）
  setInterval(async () => {
    try {
      const currentBlockNumber = await provider.getBlockNumber();

      // 如果有新区块
      if (currentBlockNumber > latestBlockNumber) {
        // 处理从 latestBlockNumber + 1 到 currentBlockNumber 的所有区块
        for (let i = latestBlockNumber + 1; i <= currentBlockNumber; i++) {
          await processBlock(i);
        }

        latestBlockNumber = currentBlockNumber;
      }
    } catch (error) {
      console.error("监听区块时出错:", error);
    }
  }, 15000); // 15 秒
}

// 4. 处理单个区块
async function processBlock(blockNumber: number) {
  console.log(`\n正在处理区块: ${blockNumber}`);

  try {
    // 获取区块详情，包括交易列表
    const block = await provider.getBlockWithTransactions(blockNumber);

    if (!block || !block.transactions || block.transactions.length === 0) {
      console.log(`区块 ${blockNumber} 中没有交易`);
      return;
    }

    console.log(`区块 ${blockNumber} 包含 ${block.transactions.length} 笔交易`);

    // 遍历区块中的所有交易
    for (const tx of block.transactions) {
      await processTransaction(tx);
    }
  } catch (error) {
    console.error(`处理区块 ${blockNumber} 时出错:`, error);
  }
}

// 5. 处理单个交易
async function processTransaction(tx: any) {
  // 打印交易的基本信息
  console.log(`\n交易哈希: ${tx.hash}`);
  console.log(`发送方: ${tx.from}`);
  console.log(`接收方: ${tx.to || "合约创建"}`);
  console.log(`交易金额: ${ethers.utils.formatEther(tx.value)} ETH`);
  console.log(
    `燃气价格: ${ethers.utils.formatUnits(tx.gasPrice, "gwei")} gwei`
  );
  console.log(`燃气限制: ${tx.gasLimit.toString()}`);

  // 如果是合约交互，可以解析输入数据
  if (tx.data && tx.data !== "0x") {
    console.log(`输入数据长度: ${tx.data.length} 字节`);

    // 这里可以添加更复杂的逻辑，比如：
    // 1. 检查 tx.to 是否是你关心的合约地址
    // 2. 使用合约 ABI 解码输入数据
    // 3. 提取函数名和参数

    // 示例：检查是否是 ERC20 转账交易（简单判断） 解析交易的信息
    if (tx.data.length === 68) {
      // transfer 函数的输入数据通常是 68 字节
      const functionSignature = tx.data.slice(0, 10);
      if (functionSignature === "0xa9059cbb") {
        // transfer 函数的签名
        const toAddress = "0x" + tx.data.slice(10, 74);
        const amountHex = tx.data.slice(74);
        const amount = ethers.BigNumber.from(amountHex);

        console.log(`这是一笔 ERC20 转账交易`);
        console.log(`转账目标地址: ${toAddress}`);
        console.log(`转账金额: ${amount.toString()}`);
      }
    }
  }

  // 可以在这里添加更多的逻辑，比如：
  // - 检查交易是否成功（需要获取交易收据）
  // - 记录交易到数据库
  // - 触发某些事件
}

// 6. 启动扫链程序
startBlockListening();
