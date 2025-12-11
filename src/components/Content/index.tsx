"use client";
import React, { useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import { useWalletStore } from "@/store/wallet";
import { useWalletReconnect } from "@/hooks/useWalletReconnect";
import { ethers } from "ethers";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
export default function Content({ children }: { children: React.ReactNode }) {
  const {
    connectLoading,
    walletAdress,
    setSigner,
    setConnectLoading,
    setWalletAdress,
    clearWallet,
  } = useWalletStore();
  const handleConnect = async () => {
    setConnectLoading(true);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    // 连接钱包和合约
    const accounts = await provider.send("eth_requestAccounts", []);
    setWalletAdress(accounts[0]);
    setSigner(signer);
    setConnectLoading(false);
  };
  useWalletReconnect();

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // 用户断开连接或退出账号
        console.log("钱包已断开连接");
        clearWallet();
      } else if (accounts[0] !== walletAdress) {
        // 用户切换了账号
        console.log("账号已切换:", accounts[0]);
        handleConnect();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [walletAdress]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
      }}
    >
      <div className="w-full py-4 box-border flex flex-row justify-end items-center ">
        {walletAdress ? (
          <div className="bg-[rgba(147,176,236,0.1)] h-9 flex justify-center items-center px-4 py-2 rounded-sm mr-8">
            <div className="w-5 h-5 bg-amber-200 mr-1 rounded-full " />
            <span className="mr-1">
              {walletAdress.slice(0, 6) + "..." + walletAdress.slice(-4)}
            </span>
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(walletAdress);
              }}
              title="复制完整地址"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </div>
        ) : (
          <div
            onClick={handleConnect}
            className="bg-sky-500 h-9 flex justify-center items-center hover:bg-sky-700 px-4 py-2 rounded-sm mr-8 "
          >
            {connectLoading ? "connect..." : "Connect Wellat"}
          </div>
        )}
      </div>
      <div className="h-screen overflow-y-auto p-2">{children}</div>
    </Box>
  );
}
