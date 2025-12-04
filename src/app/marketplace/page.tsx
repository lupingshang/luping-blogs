"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "@/store/wallet";
import nftAbi from "@/common/abi.json";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import NftFile from "@/components/NftFile";
import { nftProxyToArray } from "@/utils/common";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const contractAddress = "0xeCC1F28e7dc83D4430FeDEfd1A2605441AD1A731";

export default function Marketplace() {
  useWalletReconnect();
  const { signer } = useWalletStore();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 使用懒加载 Hook，初始显示 10 条，每次加载 10 条
  const { displayedItems, isLoading, hasMore, displayCount, totalCount } =
    useInfiniteScroll(nfts, 10, 10);

  useEffect(() => {
    let isMounted = true;
    const fetchNFTs = async () => {
      if (signer && isMounted) {
        try {
          setLoading(true);
          const contract = new ethers.Contract(
            contractAddress,
            nftAbi.abi,
            signer
          );
          const mynfts = await contract.getAllNFTs();

          // 将 Proxy 对象转换为普通数组并获取完整数据
          const nftArray = await nftProxyToArray(mynfts, contract);

          console.log("完整的 NFT 数据:", nftArray);
          setNfts(nftArray);
        } catch (error) {
          console.error("获取 NFT 失败:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchNFTs();

    return () => {
      isMounted = false;
    };
  }, [signer]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1 className="mb-2">My NFTs ({displayedItems.length})</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        <NftFile nfts={displayedItems} />
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>加载中...</p>
        </div>
      )}

      {/* 全部加载完成提示 */}
      {!hasMore && totalCount > 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          <p>已加载全部 {displayedItems.length} 条数据</p>
        </div>
      )}
    </div>
  );
}
