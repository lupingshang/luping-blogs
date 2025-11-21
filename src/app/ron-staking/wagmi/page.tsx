"use client";
import { use, useEffect } from "react";
import { ethers } from "ethers";
export default function WagmiPage() {
  useEffect(() => {
    init();
  }, []);
  const init = () => {
    const wallet = ethers.Wallet.createRandom(); // 创建一个随机钱包
    const address = wallet.getAddress();

    console.log(address, "------当前地址");
  };
  return <div>测试</div>;
}
