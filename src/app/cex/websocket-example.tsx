"use client";
import React, { useState, useEffect } from "react";
import TvChart from "@/components/tv";
import { useWebSocketPrice } from "@/hooks/useWebSocketPrice";

interface CoinData {
  symbol: string;
  close: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  chg: number;
  rose: string;
  coin: string;
  base: string;
}

export default function WebSocketCexPage() {
  const [currentCoin, setCurrentCoin] = useState<CoinData>({
    symbol: "ETH/USDT",
    close: 2450.5,
    high: 2480.0,
    low: 2420.3,
    volume: 15420.5,
    change: 25.3,
    chg: 1.04,
    rose: "+1.04%",
    coin: "ETH",
    base: "USDT",
  });

  // 使用WebSocket价格数据Hook
  const {
    priceData,
    isConnected,
    formattedPrice,
    formattedChange,
    changeColor,
  } = useWebSocketPrice(currentCoin.symbol);

  // 当接收到WebSocket价格数据时更新状态
  useEffect(() => {
    if (priceData) {
      setCurrentCoin((prev) => ({
        ...prev,
        close: priceData.price,
        high: Math.max(prev.high, priceData.high),
        low: Math.min(prev.low, priceData.low),
        volume: priceData.volume,
        change: priceData.change,
        chg: priceData.change,
        rose:
          priceData.change > 0
            ? `+${priceData.change.toFixed(2)}%`
            : `${priceData.change.toFixed(2)}%`,
      }));
    }
  }, [priceData]);

  const toFixed = (value: number, digits: number = 2): string => {
    return Number(value).toFixed(digits);
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0b0e11] text-white">
      {/* 头部 */}
      <div className="bg-[#161a1e] border-b border-[#2a2e39]">
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="text-white text-xl font-bold">
            CEX 交易所 TradingView K线图演示 - {currentCoin.symbol}
          </h1>

          {/* WebSocket连接状态指示器 */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-400">
              {isConnected ? "WebSocket已连接" : "WebSocket未连接"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* 价格信息头部 */}
        <div className="flex flex-col lg:flex-row lg:items-center py-5 border-b border-[#2a2e39] mb-8 gap-5 lg:gap-0">
          <div className="mr-0 lg:mr-10">
            <div className="text-3xl font-bold" style={{ color: changeColor }}>
              {formattedPrice}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 lg:gap-8">
            <div className="flex flex-col">
              <div className="text-xs text-[#8392a5] mb-1">24h涨跌</div>
              <div className="text-base" style={{ color: changeColor }}>
                {formattedChange}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-[#8392a5] mb-1">24h最高</div>
              <div className="text-base text-white">
                {toFixed(currentCoin.high, 2)}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-[#8392a5] mb-1">24h最低</div>
              <div className="text-base text-white">
                {toFixed(currentCoin.low, 2)}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs text-[#8392a5] mb-1">24h成交量</div>
              <div className="text-base text-white">
                {toFixed(currentCoin.volume, 1)} {currentCoin.coin}
              </div>
            </div>
          </div>
        </div>

        {/* TradingView K线图 */}
        <div className="bg-[#161a1e] rounded-lg p-5 mb-8">
          <div className="mb-5">
            <h3 className="text-white text-xl font-semibold mb-5">
              TradingView 专业K线图
            </h3>
            <p className="text-[#8392a5] mb-5">
              使用真实的 WebSocket 数据源，支持实时K线更新和多种技术指标
            </p>
          </div>
          <div className="h-[800px] md:h-[600px] lg:h-[800px] rounded overflow-hidden">
            {/* 这里需要修改TvChart组件来使用真实的WebSocket数据源 */}
            <TvChart symbol={currentCoin.symbol} />
          </div>
        </div>

        {/* WebSocket配置说明 */}
        <div className="bg-[#161a1e] rounded-lg p-5 mb-8">
          <h3 className="text-white text-xl font-semibold mb-5">
            WebSocket数据源配置
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#1a1d29] p-4 rounded-lg">
              <h4 className="text-[#00b275] mb-2 font-semibold">实时K线数据</h4>
              <p className="text-[#8392a5] text-sm">
                通过WebSocket订阅 {currentCoin.symbol.toLowerCase()}@kline_1m
                获取实时K线数据
              </p>
            </div>

            <div className="bg-[#1a1d29] p-4 rounded-lg">
              <h4 className="text-[#00b275] mb-2 font-semibold">价格统计</h4>
              <p className="text-[#8392a5] text-sm">
                通过WebSocket订阅 {currentCoin.symbol.toLowerCase()}@ticker
                获取24小时价格统计
              </p>
            </div>

            <div className="bg-[#1a1d29] p-4 rounded-lg">
              <h4 className="text-[#00b275] mb-2 font-semibold">历史数据</h4>
              <p className="text-[#8392a5] text-sm">
                通过REST API获取历史K线数据，支持多种时间周期
              </p>
            </div>

            <div className="bg-[#1a1d29] p-4 rounded-lg">
              <h4 className="text-[#00b275] mb-2 font-semibold">自动重连</h4>
              <p className="text-[#8392a5] text-sm">
                WebSocket断线自动重连，采用指数退避策略，最大重试5次
              </p>
            </div>
          </div>
        </div>

        {/* 数据格式说明 */}
        <div className="bg-[#161a1e] rounded-lg p-5">
          <h3 className="text-white text-xl font-semibold mb-5">
            数据格式说明
          </h3>
          <div className="bg-[#1a1d29] p-5 rounded-lg">
            <h4 className="text-[#00b275] mb-3 font-semibold">
              WebSocket K线数据格式：
            </h4>
            <pre className="text-[#8392a5] text-sm overflow-x-auto">
              {`{
  "stream": "ethusdt@kline_1m",
  "data": {
    "k": {
      "t": 1640995200000,    // 开盘时间
      "o": "2450.50",        // 开盘价
      "h": "2480.00",        // 最高价
      "l": "2420.30",        // 最低价
      "c": "2465.80",        // 收盘价
      "v": "15420.5"         // 成交量
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
