"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Box, Card, Typography, Button, CircularProgress } from "@mui/material";
import { getJsonFromPinata, getImageUrl } from "@/utils/pinata";
import { useWalletStore } from "@/store/wallet";
import nftAbi from "@/common/abi.json";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import { useRouter } from "next/navigation";

const contractAddress = "0x7487930938A719a495b688B7f1BC047A53ed720c";

export default function nftPage() {
  useWalletReconnect();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("tokenId") as string;
  const { signer } = useWalletStore();

  const [nft, setNft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentAdress, setCurrentAdress] = useState("");
  const [contract, setContract] = useState<any>(null);
  useEffect(() => {
    //获取nft详情
    const fetchNFTDetail = async () => {
      if (!signer || !id) return;

      try {
        setLoading(true);
        const co = new ethers.Contract(contractAddress, nftAbi.abi, signer);
        setContract(co);
        const account = await signer.getAddress();
        // 获取 NFT 详情
        const nftData = await co.getListedTokenForId(id);

        // 获取 tokenURI
        const tokenURI = await co.tokenURI(id);

        // 从 Pinata 获取元数据
        const metadata = await getJsonFromPinata(tokenURI);

        setNft({
          tokenId: nftData.tokenId?.toString(),
          price: ethers.formatEther(nftData.price || 0),
          seller: nftData.seller,
          owner: nftData.owner,
          currentlyListed: nftData.curentlyListed,
          name: metadata?.nftName || "Unknown",
          description: metadata?.nftDescription || "",
          image: metadata?.imgToken || "",
        });
        setCurrentAdress(account);
      } catch (err: any) {
        console.error("获取 NFT 详情失败:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetail();
  }, [signer, id]);
  //购买nft
  const handleBuyNft = async () => {
    if (!contract || !id) return;
    try {
      setBuyLoading(true);
      const tx = await contract.executeSale(id, {
        value: ethers.parseEther(nft.price),
      });
      await tx.wait();
      router.push("/profile");
    } catch (err: any) {
      console.error("购买 NFT 失败:", err);
      setError(err.message);
    } finally {
      setBuyLoading(false);
    }
  };
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!nft) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>NFT not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Card
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
          p: 4,
        }}
      >
        {/* 左侧：图片 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {nft.image && (
            <img
              src={`https://gateway.pinata.cloud/ipfs/${nft.image}`}
              alt={nft.name}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "600px",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />
          )}
        </Box>

        {/* 右侧：详情 */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            {nft.name}
          </Typography>

          <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {nft.price} ETH
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {nft.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Token ID
            </Typography>
            <Typography variant="body1">#{nft.tokenId}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Owner
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Seller
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {nft.seller?.slice(0, 6)}...{nft.seller?.slice(-4)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: nft.currentlyListed ? "success.main" : "text.secondary",
                fontWeight: "bold",
              }}
            >
              {nft.currentlyListed ? "🟢 On Sale" : "⚫ Sold"}
            </Typography>
          </Box>
          {/* 不是发售者 不是合约的owner 并且此nft可以售卖 才会有购买按钮 */}
          {nft.currentlyListed &&
            currentAdress !== nft.owner &&
            currentAdress !== nft.seller && (
              <Button
                variant="contained"
                size="large"
                sx={{ mt: 2 }}
                loading={buyLoading}
                onClick={handleBuyNft}
              >
                Buy Now
              </Button>
            )}
        </Box>
      </Card>
    </Box>
  );
}
