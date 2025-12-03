"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getJsonFromPinata } from "@/utils/pinata";
import { useWalletStore } from "@/store/wallet";
import nftAbi from "@/common/abi.json";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import NftFile from "@/components/NftFile";
import { nftProxyToArray } from "@/utils/common";
const contractAddress = "0x7487930938A719a495b688B7f1BC047A53ed720c";
export default function Profile() {
  useWalletReconnect();
  const { signer } = useWalletStore();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
          // ****重要链路 核心
          //1.拿到nft信息
          //2.拿到对应tokenid
          //4.拿到tokenurl
          //5.拿到mate拿到pinata数据
          const mynfts = await contract.getMyNFTs();

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
      <h1 className="mb-2">My NFTs ({nfts.length})</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        <NftFile nfts={nfts} />
      </div>
    </div>
  );
}
