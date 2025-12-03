"use client";
import { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  getImageUrl,
  getJsonFromPinata,
  uploadImageToPinata,
  uploadJsonToPinata,
} from "@/utils/pinata";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import nftAbi from "@/common/abi.json";
import { useWalletStore } from "@/store/wallet";

const contractAddress = "0x7487930938A719a495b688B7f1BC047A53ed720c";
export default function ListNft() {
  useWalletReconnect();
  const router = useRouter();
  //nft名称
  const [nftName, setNftName] = useState("");
  //nft描述
  const [nftDescription, setNftDescription] = useState("");
  //价格
  const [price, setPrice] = useState("");
  //图片信息
  const [imageFile, setImageFile] = useState<File | null>(null);
  //上传图片loading
  const [uploadPinataLoading, setUploadPinataLoading] =
    useState<boolean>(false);
  //创建nft
  const [listBtnLoading, setlistBtnLoading] = useState<boolean>(false);
  //pinata返回图片cid
  const [imgToken, setImgToken] = useState<string>("");
  //合约
  const [contract, setContract] = useState<any>(null);
  const { signer } = useWalletStore();
  //获取合约
  useEffect(() => {
    const co = new ethers.Contract(contractAddress, nftAbi.abi, signer);
    setContract(co);
  }, []);
  // Snackbar 状态
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  //上传图片到pinata
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadPinataLoading(true);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      try {
        const res: string = await uploadImageToPinata(e.target.files[0]);
        setSnackbar({
          open: true,
          message: "img upload success",
          severity: "success",
        });
        setUploadPinataLoading(false);
        setImgToken(res);
      } catch (error) {
        setUploadPinataLoading(false);
      }
    }
  };
  //上传json数据到pinata
  const uploadjsonDataToPinata = async () => {
    const priceInWei = ethers.parseEther(price);
    const ntfData = {
      nftName,
      nftDescription,
      price: priceInWei.toString(), // 将 BigInt 转换为字符串
      imgToken,
    };
    try {
      const res = await uploadJsonToPinata(ntfData);
      // const json = await getJsonFromPinata(res);
      // console.log("拿到pinata的数据", json);
      return res;
    } catch (error) {
      setlistBtnLoading(false);
    }
  };
  //使用合约创建nft
  const handleListNFT = async () => {
    if (!nftName || !nftDescription || !price || !imgToken) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields",
        severity: "warning",
      });
      return;
    }

    if (!contract) {
      setSnackbar({
        open: true,
        message: "Contract not initialized. Please connect wallet.",
        severity: "error",
      });
      return;
    }

    try {
      setlistBtnLoading(true);
      console.log("contract---》", contract);
      const jsonData = await uploadjsonDataToPinata();
      console.log("签名", signer);

      const priceInWei = ethers.parseEther(price);
      let listingPrice = await contract.getListPrice();
      listingPrice = listingPrice.toString();

      const tx = await contract.createToken(jsonData, priceInWei, {
        value: listingPrice,
      });
      await tx.wait();
      setSnackbar({
        open: true,
        message: "NFT listed success",
        severity: "success",
      });
      setTimeout(() => {
        router.push("/profile");
      }, 500);
      setNftName("");
      setNftDescription("");
      setPrice("");
      setImgToken("");
      setlistBtnLoading(false);
    } catch (error) {
      console.log(error, "---error");

      setlistBtnLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          p: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 520,
            width: "100%",
            p: 4,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              mb: 4,
              color: "#764ba2",
            }}
          >
            Upload your NFT to the marketplace
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: "#764ba2" }}>
              NFT Name
            </Typography>
            <TextField
              fullWidth
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="Wayne#001"
              size="small"
              sx={{
                bgcolor: "#f0f4ff",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "none" },
                  "& input": { color: "#000" },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, color: "#764ba2", fontWeight: 500 }}
            >
              NFT Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              placeholder="Wayne#001"
              sx={{
                bgcolor: "#ffffff",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e0e0e0" },
                  "& textarea": { color: "#000" },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, color: "#764ba2", fontWeight: 500 }}
            >
              Price (in ETH)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.01"
              size="small"
              slotProps={{
                htmlInput: { step: "0.01", min: "0" },
              }}
              sx={{
                bgcolor: "#ffffff",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#e0e0e0" },
                  "& input": { color: "#000" },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, color: "#764ba2", fontWeight: 500 }}
            >
              Upload Image (&lt;1000 KB)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              loading={uploadPinataLoading}
              sx={{
                color: "#666",
                borderColor: "#e0e0e0",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#764ba2",
                  bgcolor: "#f9f9f9",
                },
              }}
            >
              选择图片
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            <Typography
              variant="body2"
              sx={{ ml: 2, display: "inline", color: "#999" }}
            >
              {imageFile ? imageFile.name : "未选择任何文件"}
            </Typography>
            <div>{uploadPinataLoading ? "uploading pinata... " : ""}</div>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleListNFT}
            loading={listBtnLoading}
            sx={{
              bgcolor: "#a855f7",
              color: "white",
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                bgcolor: "#9333ea",
              },
            }}
          >
            List NFT
          </Button>
        </Card>
      </Box>

      {/* Snackbar 提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
