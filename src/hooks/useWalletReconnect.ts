"use client";
import { useEffect } from "react";
import { useWalletStore } from "@/store/wallet";

export function useWalletReconnect() {
  const { walletAdress, signer, reconnectWallet } = useWalletStore();

  useEffect(() => {
    // 如果有地址但没有 signer，自动重连
    if (walletAdress && !signer) {
      reconnectWallet();
    }
  }, [walletAdress, signer, reconnectWallet]);
}
