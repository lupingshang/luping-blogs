import { getJsonFromPinata } from "./pinata";
import { ethers } from "ethers";
export async function nftProxyToArray(mynfts: any, contract: any) {
  const nftArray = await Promise.all(
    Array.from(mynfts).map(async (nft: any) => {
      //先拿到tokenID
      const tokenId = nft.tokenId?.toString();

      //通过tokenid拿到 tokenurl
      const tokenURI = await contract.tokenURI(tokenId);

      // 从 Pinata 获取 JSON 元数据
      let metadata = null;
      try {
        //从pinata中拿到原数据
        metadata = await getJsonFromPinata(tokenURI);
      } catch (error) {
        console.error(`获取 token ${tokenId} 元数据失败:`, error);
      }

      return {
        tokenId,
        price: ethers.formatEther(nft.price || 0),
        seller: nft.seller,
        owner: nft.owner,
        currentlyListed: nft.curentlyListed,
        tokenURI,
        // 元数据
        name: metadata?.nftName || "Unknown",
        description: metadata?.nftDescription || "",
        image: metadata?.imgToken || "",
      };
    })
  );
  return nftArray;
}
