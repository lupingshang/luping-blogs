import { getJsonFromPinata } from "./pinata";
import { ethers } from "ethers";
import type { NFTMarketplace } from "@/types/generated/Abi";

// NFT 元数据接口
interface NFTMetadata {
  nftName?: string;
  nftDescription?: string;
  imgToken?: string;
  thumImgToken?: string;
}

// 处理后的 NFT 数据接口
export interface ProcessedNFT {
  tokenId: string;
  price: string;
  seller: string;
  owner: string;
  currentlyListed: boolean;
  tokenURI: string;
  name: string;
  description: string;
  image: string;
  thumImage: string;
}

export async function nftProxyToArray(
  mynfts: NFTMarketplace.ListedTokenStructOutput[],
  contract: ethers.Contract
): Promise<ProcessedNFT[]> {
  const nftArray: ProcessedNFT[] = await Promise.all(
    mynfts.map(
      async (
        nft: NFTMarketplace.ListedTokenStructOutput
      ): Promise<ProcessedNFT> => {
        // 先拿到tokenID (bigint转string)
        const tokenId = nft.tokenId.toString();

        // 通过tokenid拿到 tokenurl
        const tokenURI = await (contract as any).tokenURI(tokenId);

        // 从 Pinata 获取 JSON 元数据
        let metadata: NFTMetadata | null = null;
        try {
          // 从pinata中拿到原数据
          metadata = await getJsonFromPinata(tokenURI);
        } catch (error) {
          console.error(`获取 token ${tokenId} 元数据失败:`, error);
        }

        return {
          tokenId,
          price: ethers.formatEther(nft.price),
          seller: nft.seller,
          owner: nft.owner,
          currentlyListed: nft.curentlyListed,
          tokenURI,
          // 元数据
          name: metadata?.nftName || "Unknown",
          description: metadata?.nftDescription || "",
          image: metadata?.imgToken || "",
          thumImage: metadata?.thumImgToken || "",
        };
      }
    )
  );
  return nftArray;
}
