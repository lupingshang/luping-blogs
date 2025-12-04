"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ethers } from "ethers";

interface UserState {
  connectLoading: boolean;
  walletAdress: string;
  signer: any;
  setConnectLoading: (connectLoading: boolean) => void;
  setWalletAdress: (walletAdress: string) => void;
  setSigner: (signer: any) => void;
  reconnectWallet: () => Promise<void>;
  clearWallet: () => void;
}

export const useWalletStore = create<UserState>()(
  persist(
    (set, get) => ({
      connectLoading: false,
      walletAdress: "",
      signer: null,
      setConnectLoading: (connectLoading: boolean) => set({ connectLoading }),
      setWalletAdress: (walletAdress: string) => set({ walletAdress }),
      setSigner: (signer: any) => set({ signer }),
      reconnectWallet: async () => {
        try {
          if (typeof window !== "undefined" && window.ethereum) {
            //todo. 判断链
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            set({ signer });
          }
        } catch (error) {
          console.error("Failed to reconnect wallet:", error);
        }
      },
      clearWallet: () => {
        set({
          walletAdress: "",
          signer: null,
          connectLoading: false,
        });
      },
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walletAdress: state.walletAdress,
      }),
    }
  )
);
