import { ethers } from "ethers";

// NFT 数据结构类型定义
export interface ListedToken {
  tokenId: bigint;
  owner: string;
  seller: string;
  price: bigint;
  curentlyListed: boolean;
}

// 简化的合约类型定义，使用类型断言而不是继承
export interface NFTMarketplaceContract {
  // 查询方法
  getAllNFTs(): Promise<ListedToken[]>;
  tokenURI(tokenId: string | bigint): Promise<string>;
  getListedTokenForId(tokenId: bigint): Promise<ListedToken>;

  // 写入方法（需要gas）
  createToken(
    tokenURI: string,
    price: bigint
  ): Promise<ethers.ContractTransactionResponse>;
  executeSale(
    tokenId: bigint,
    options: { value: bigint }
  ): Promise<ethers.ContractTransactionResponse>;

  // 继承ethers.Contract的基本属性
  address: string;
  interface: ethers.Interface;
  runner: ethers.ContractRunner | null;
}

// 类型保护函数
export function isNFTMarketplaceContract(
  contract: ethers.Contract
): contract is ethers.Contract & NFTMarketplaceContract {
  return (
    typeof (contract as any).getAllNFTs === "function" &&
    typeof (contract as any).tokenURI === "function"
  );
}

// 安全的合约创建函数
export function createNFTMarketplaceContract(
  address: string,
  abi: ethers.InterfaceAbi,
  signer: ethers.Signer
): ethers.Contract & NFTMarketplaceContract {
  const contract = new ethers.Contract(address, abi, signer);

  if (!isNFTMarketplaceContract(contract)) {
    throw new Error("合约不包含必要的NFT Marketplace方法");
  }

  return contract as ethers.Contract & NFTMarketplaceContract;
}
