import { useEffect, useState } from "react";
import nftAbi from "./abi.json";
import { useWalletStore } from "@/store/wallet";
import { useWalletReconnect } from "./useWalletReconnect";
import { ethers } from "ethers";
const contractAddress = "0x7487930938A719a495b688B7f1BC047A53ed720c";
export default function useContract() {
  useWalletReconnect();
  const { signer } = useWalletStore();
  //链接合约
  const co = new ethers.Contract(contractAddress, nftAbi.abi, signer);

  return co;
}
