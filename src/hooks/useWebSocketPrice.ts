// WebSocket价格数据监听Hook
import { useState, useEffect } from "react";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
}

export const useWebSocketPrice = (symbol: string = "ETH/USDT") => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 监听价格更新事件
    const handlePriceUpdate = (event: CustomEvent<PriceData>) => {
      const data = event.detail;

      // 只处理当前交易对的数据
      if (data.symbol === symbol.replace("/", "")) {
        setPriceData(data);
      }
    };

    // 监听WebSocket连接状态
    const handleConnectionStatus = (event: CustomEvent<boolean>) => {
      setIsConnected(event.detail);
    };

    // 添加事件监听器
    window.addEventListener("priceUpdate", handlePriceUpdate as EventListener);
    window.addEventListener(
      "wsConnectionStatus",
      handleConnectionStatus as EventListener
    );

    // 清理函数
    return () => {
      window.removeEventListener(
        "priceUpdate",
        handlePriceUpdate as EventListener
      );
      window.removeEventListener(
        "wsConnectionStatus",
        handleConnectionStatus as EventListener
      );
    };
  }, [symbol]);

  return {
    priceData,
    isConnected,
    // 格式化价格显示
    formattedPrice: priceData?.price.toFixed(2) || "0.00",
    // 格式化涨跌幅
    formattedChange: priceData?.change
      ? `${priceData.change > 0 ? "+" : ""}${priceData.change.toFixed(2)}%`
      : "0.00%",
    // 涨跌颜色
    changeColor: priceData?.change
      ? priceData.change > 0
        ? "#00b275"
        : "#f15057"
      : "#ffffff",
  };
};
