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
import { getImageUrl, uploadImageToPinata } from "@/utils/pinata";
import { ethers } from "ethers";
export default function WagmiPage() {
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadPinataLoading, setUploadPinataLoading] =
    useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [imgToken, setImgToken] = useState<string>("");
  useEffect(() => {
    // testFn();
  }, []);
  const testFn = async () => {
    // getImageUrl 现在直接返回 URL，不需要 await
    const imageUrl: string = await getImageUrl(
      "bafybeicxumutydd4xqegz3bpgjiodhjxdv2o3s3q54uzaqwfxwqsgmeity"
    );
    console.log("=====图片 URL:", imageUrl);
    // setImgURl(imageUrl);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadPinataLoading(true);
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      try {
        const res: string = await uploadImageToPinata(e.target.files[0]);
        console.log(res, "----上传图片成功");
        setOpen(true);
        setUploadPinataLoading(false);
        setImgToken(res);
      } catch (error) {
        console.log(error, "----上传图片失败");
        setUploadPinataLoading(false);
      }
    }
  };

  const handleListNFT = () => {
    const params = {
      nftName,
      nftDescription,
      price: ethers.parseEther(price),
      imgToken,
    };
    console.log(params, "----params上传数据到ipfs");
  };

  return (
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
            Upload Image (&lt;500 KB)
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
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={1500}
      >
        <Alert
          onClose={() => {
            setOpen(false);
          }}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          上传图片成功
        </Alert>
      </Snackbar>
    </Box>
  );
}
