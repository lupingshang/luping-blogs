"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWalletStore } from "@/store/wallet";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import NftFile from "@/components/NftFile";
import { nftProxyToArray } from "@/utils/common";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Abi } from "@/types/generated";
import type { ProcessedNFT } from "@/utils/common";
import { Abi__factory } from "@/types/generated";

const contractAddress = "0x7487930938A719a495b688B7f1BC047A53ed720c";

export default function Marketplace() {
  useWalletReconnect();
  const { signer } = useWalletStore();
  const [nfts, setNfts] = useState<ProcessedNFT[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 使用懒加载 Hook，初始显示 10 条，每次加载 10 条
  const { displayedItems, isLoading, hasMore, displayCount, totalCount } =
    useInfiniteScroll(nfts, 10, 10);

  useEffect(() => {
    let isMounted = true;

    const fetchNFTs = async (): Promise<void> => {
      if (!signer || !isMounted) return;

      try {
        setLoading(true);

        // 🚀 使用TypeChain生成的类型安全合约
        const contract: Abi = Abi__factory.connect(contractAddress, signer);

        // 🔒 完全类型安全的合约调用
        const mynfts = await contract.getAllNFTs();

        // 验证返回数据的类型
        if (!Array.isArray(mynfts)) {
          throw new Error("getAllNFTs 返回的数据格式不正确");
        }
        console.log("mynfts==----->", mynfts);

        // 将 Proxy 对象转换为普通数组并获取完整数据
        const nftArray = await nftProxyToArray(
          mynfts,
          contract as unknown as ethers.Contract
        );

        console.log("完整的 NFT 数据:", nftArray);
        setNfts(nftArray);
      } catch (error) {
        console.error("获取 NFT 失败:", error);

        // 类型安全的错误处理
        if (error instanceof Error) {
          console.error("错误详情:", error.message);
        } else {
          console.error("未知错误:", error);
        }
      } finally {
        setLoading(false);
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
