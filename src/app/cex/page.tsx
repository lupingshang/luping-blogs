"use client";
import React, { useState, useEffect } from "react";
import TvChart from "@/components/tv";

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

export default function CexPage() {
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

  // 格式化数字
  const toFixed = (value: number, digits: number = 2): string => {
    return Number(value).toFixed(digits);
  };

  // 初始化TradingView
  const initTradingView = () => {
    // TradingView组件会自动初始化
  };

  // 启动价格更新
  const startPriceUpdate = () => {
    setInterval(() => {
      setCurrentCoin((prev) => {
        const change = (Math.random() - 0.5) * 4; // -2 到 +2 的随机变化
        const newClose = prev.close + change;

        // 更新24小时高低价
        const newHigh = newClose > prev.high ? newClose : prev.high;
        const newLow = newClose < prev.low ? newClose : prev.low;

        // 更新涨跌幅
        const chgPercent = (change / (newClose - change)) * 100;
        const newRose =
          chgPercent > 0
            ? `+${chgPercent.toFixed(2)}%`
            : `${chgPercent.toFixed(2)}%`;

        // 更新成交量
        const newVolume = prev.volume + Math.random() * 100;

        return {
          ...prev,
          close: newClose,
          high: newHigh,
          low: newLow,
          change: change,
          chg: chgPercent,
          rose: newRose,
          volume: newVolume,
        };
      });
    }, 3000); // 每3秒更新一次价格信息
  };

  useEffect(() => {
    // 初始化 TradingView 图表
    initTradingView();
    // 启动价格更新
    startPriceUpdate();
  }, []);

  return (
    <div className=" text-white">
      {/* 头部 */}
      <div className="bg-[#161a1e] border-b border-[#2a2e39]">
        <h1 className="text-white text-center py-5 text-2xl font-bold">
          CEX 交易所 TradingView K线图演示 - {currentCoin.symbol}
        </h1>
      </div>

      <div className="p-5 max-w-6xl mx-auto">
        {/* 价格信息头部 */}
        <div className="flex flex-col lg:flex-row lg:items-center py-5 border-b border-[#2a2e39] mb-8 gap-5 lg:gap-0">
          <div className="mr-0 lg:mr-10">
            <div
              className={`text-3xl font-bold ${
                currentCoin.change > 0
                  ? "text-[#00b275]"
                  : currentCoin.change < 0
                  ? "text-[#f15057]"
                  : "text-white"
              }`}
            >
              {toFixed(currentCoin.close, 2)}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 lg:gap-8">
            <div className="flex flex-col">
              <div className="text-xs text-[#8392a5] mb-1">24h涨跌</div>
              <div
                className={`text-base ${
                  currentCoin.change > 0
                    ? "text-[#00b275]"
                    : currentCoin.change < 0
                    ? "text-[#f15057]"
                    : "text-white"
                }`}
              >
                {currentCoin.rose}
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
              使用真实的 TradingView
              图表库，支持多种时间周期、技术指标和绘图工具
            </p>
          </div>
          <div className="h-130">
            <TvChart symbol={currentCoin.symbol} />
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-[#161a1e] rounded-lg p-5 mb-8">
          <h3 className="text-white text-xl font-semibold mb-5">功能特点</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                📈 专业K线图
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                基于 TradingView 图表库，提供专业级的K线图显示
              </p>
            </div>

            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                ⏰ 多时间周期
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                支持
                1分钟、5分钟、15分钟、30分钟、1小时、4小时、1天等多种时间周期
              </p>
            </div>

            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                📊 技术指标
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                内置移动平均线(MA5、MA10、MA30、MA60)等常用技术指标
              </p>
            </div>

            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                🎨 绘图工具
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                支持趋势线、水平线等多种绘图工具
              </p>
            </div>

            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                🌙 主题切换
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                支持日间和夜间主题切换
              </p>
            </div>

            <div className="bg-[#1a1d29] p-5 rounded-lg border-l-4 border-[#00b275]">
              <h4 className="text-[#00b275] mb-2 text-base font-semibold">
                📱 响应式设计
              </h4>
              <p className="text-[#8392a5] leading-6 m-0">
                完美适配桌面端和移动端设备
              </p>
            </div>
          </div>
        </div>

        {/* 实时数据说明 */}
        <div className="bg-[#161a1e] rounded-lg p-5">
          <h3 className="text-white text-xl font-semibold mb-5">数据说明</h3>
          <div className="bg-[#1a1d29] p-5 rounded-lg mt-5">
            <p className="text-[#8392a5] leading-7 mb-2">
              🔄 <strong className="text-[#00b275]">实时更新：</strong>
              K线数据每2秒更新一次，模拟真实交易环境
            </p>
            <p className="text-[#8392a5] leading-7 mb-2">
              📊 <strong className="text-[#00b275]">历史数据：</strong>
              自动生成100个历史K线数据点
            </p>
            <p className="text-[#8392a5] leading-7 mb-2">
              💹 <strong className="text-[#00b275]">价格波动：</strong>
              基于ETH/USDT交易对，价格围绕2450 USDT波动
            </p>
            <p className="text-[#8392a5] leading-7 mb-0">
              📈 <strong className="text-[#00b275]">成交量：</strong>
              随机生成成交量数据，模拟真实交易活跃度
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
