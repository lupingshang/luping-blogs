"use client";
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";

// 订单数据接口
interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
  id?: string;
}

// 扩展接口包含累积深度
interface OrderBookItemWithDepth extends OrderBookItem {
  cumulativeAmount: number;
}

// 市场数据接口
interface MarketData {
  symbol: string;
  lastPrice: number;
  change24h: number;
  changePercent: string;
  high24h: number;
  low24h: number;
  volume24h: number;
}

// 优化的订单行组件
const OrderRow = memo(
  ({
    order,
    depthPercentage,
    isBid,
    formatNumber,
    formatPrice,
  }: {
    order: OrderBookItemWithDepth;
    depthPercentage: number;
    isBid: boolean;
    formatNumber: (num: number, decimals?: number) => string;
    formatPrice: (price: number) => string;
  }) => {
    const bgColor = isBid ? "from-[#00b275]/20" : "from-[#f15057]/20";
    const priceColor = isBid ? "text-[#00b275]" : "text-[#f15057]";
    const cumulativeColor = isBid ? "text-[#00b275]/60" : "text-[#f15057]/60";

    return (
      <div className="relative grid grid-cols-2 gap-4 px-4 py-2 hover:bg-[#1a1d29] transition-colors border-b border-[#2a2e39]/30">
        {/* 深度背景条 */}
        <div
          className={`absolute inset-0 bg-linear-to-r ${bgColor} to-transparent`}
          style={{ width: `${depthPercentage}%` }}
        />

        {/* 内容层 */}
        <div className="relative z-10 text-white text-sm">
          {formatNumber(order.amount)}
        </div>
        <div
          className={`relative z-10 text-center ${priceColor} font-medium text-sm`}
        >
          {formatPrice(order.price)}
        </div>

        {/* 累积量显示 - 移到右侧角落 */}
        <div
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs ${cumulativeColor} z-20`}
        >
          {formatNumber(order.cumulativeAmount, 2)}
        </div>
      </div>
    );
  }
);

OrderRow.displayName = "OrderRow";

export default function OrderBookPage() {
  // 状态
  const [bids, setBids] = useState<OrderBookItem[]>([]);
  const [asks, setAsks] = useState<OrderBookItem[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({
    symbol: "ETH/USDT",
    lastPrice: 2920.25,
    change24h: 45.32,
    changePercent: "+1.58%",
    high24h: 2950.8,
    low24h: 2875.15,
    volume24h: 125847.32,
  });

  // 性能监控
  const [updateCount, setUpdateCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0); // 强制更新计数器

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({
    frames: 0,
    lastTime: Date.now(),
  });

  // 数据缓冲区
  const bidsBufferRef = useRef<Map<string, OrderBookItem>>(new Map());
  const asksBufferRef = useRef<Map<string, OrderBookItem>>(new Map());

  // 常量
  const THROTTLE_MS = 50; // 降低节流频率，允许更多更新
  const MAX_QUEUE_SIZE = 100;

  // 批处理更新函数
  const processBatchUpdates = useCallback(() => {
    console.log(
      "🔄 processBatchUpdates 被调用，缓冲区大小 - 买单:",
      bidsBufferRef.current.size,
      "卖单:",
      asksBufferRef.current.size
    );

    const now = Date.now();

    // 节流控制
    if (now - lastUpdateTimeRef.current < THROTTLE_MS) {
      console.log("⏸️ 节流中，跳过更新");
      return;
    }

    lastUpdateTimeRef.current = now;

    let hasUpdates = false;

    // 批量更新买单
    if (bidsBufferRef.current.size > 0) {
      hasUpdates = true;
      setBids((prevBids) => {
        const newBids = [...prevBids];
        const bufferMap = new Map(bidsBufferRef.current);

        bufferMap.forEach((order, id) => {
          // 总是替换一个随机位置的订单，确保有视觉变化
          const randomIndex = Math.floor(Math.random() * newBids.length);
          newBids[randomIndex] = order;
        });

        bidsBufferRef.current.clear();
        const sortedBids = newBids
          .sort((a, b) => b.price - a.price)
          .slice(0, 25);
        console.log(
          "💚 买单更新:",
          bufferMap.size,
          "条，当前总数:",
          sortedBids.length,
          "价格范围:",
          sortedBids[0]?.price,
          "-",
          sortedBids[sortedBids.length - 1]?.price
        );
        return sortedBids;
      });
    }

    // 批量更新卖单
    if (asksBufferRef.current.size > 0) {
      hasUpdates = true;
      setAsks((prevAsks) => {
        const newAsks = [...prevAsks];
        const bufferMap = new Map(asksBufferRef.current);

        bufferMap.forEach((order, id) => {
          // 总是替换一个随机位置的订单，确保有视觉变化
          const randomIndex = Math.floor(Math.random() * newAsks.length);
          newAsks[randomIndex] = order;
        });

        asksBufferRef.current.clear();
        const sortedAsks = newAsks
          .sort((a, b) => a.price - b.price)
          .slice(0, 25);
        console.log(
          "❤️ 卖单更新:",
          bufferMap.size,
          "条，当前总数:",
          sortedAsks.length,
          "价格范围:",
          sortedAsks[0]?.price,
          "-",
          sortedAsks[sortedAsks.length - 1]?.price
        );
        return sortedAsks;
      });
    }

    if (hasUpdates) {
      // 更新计数器
      setUpdateCount((prev) => prev + 1);

      // 强制UI更新
      setForceUpdate((prev) => prev + 1);

      // FPS 计算
      fpsCounterRef.current.frames++;
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
        console.log(
          "📊 FPS:",
          fpsCounterRef.current.frames,
          "更新次数:",
          updateCount
        );
      }
    }
  }, [updateCount]);

  // 组件初始化
  useEffect(() => {
    console.log("🚀 初始化订单簿数据流...");

    // 初始化数据
    const basePrice = 2920.25;
    const initialBids: OrderBookItem[] = [];
    const initialAsks: OrderBookItem[] = [];

    for (let i = 0; i < 25; i++) {
      const bidPrice = basePrice - i * 0.1 - Math.random() * 2;
      const bidAmount = Math.random() * 10 + 0.001;
      initialBids.push({
        id: `bid-init-${i}`,
        price: Number(bidPrice.toFixed(2)),
        amount: Number(bidAmount.toFixed(4)),
        total: Number((bidPrice * bidAmount).toFixed(4)),
      });

      const askPrice = basePrice + i * 0.1 + Math.random() * 2;
      const askAmount = Math.random() * 10 + 0.001;
      initialAsks.push({
        id: `ask-init-${i}`,
        price: Number(askPrice.toFixed(2)),
        amount: Number(askAmount.toFixed(4)),
        total: Number((askPrice * askAmount).toFixed(4)),
      });
    }

    setBids(initialBids.sort((a, b) => b.price - a.price));
    setAsks(initialAsks.sort((a, b) => a.price - b.price));

    console.log(
      "✅ 初始数据设置完成，买单:",
      initialBids.length,
      "卖单:",
      initialAsks.length
    );

    // 启动高频数据流
    let updateCounter = 0;
    intervalRef.current = setInterval(() => {
      console.log("📊 启动新一轮高频更新...");

      const highFreqInterval = setInterval(() => {
        updateCounter++;
        const currentBasePrice = 2920.25 + (Math.random() - 0.5) * 10;

        if (Math.random() > 0.5) {
          // 买单更新
          const price = currentBasePrice - Math.random() * 5;
          const amount = Math.random() * 10 + 0.001;
          const newBid: OrderBookItem = {
            id: `bid-${Date.now()}-${Math.random()}`,
            price: Number(price.toFixed(2)),
            amount: Number(amount.toFixed(4)),
            total: Number((price * amount).toFixed(4)),
          };
          bidsBufferRef.current.set(newBid.id!, newBid);

          if (updateCounter % 50 === 0) {
            console.log("💚 买单缓冲区大小:", bidsBufferRef.current.size);
          }
        } else {
          // 卖单更新
          const price = currentBasePrice + Math.random() * 5;
          const amount = Math.random() * 10 + 0.001;
          const newAsk: OrderBookItem = {
            id: `ask-${Date.now()}-${Math.random()}`,
            price: Number(price.toFixed(2)),
            amount: Number(amount.toFixed(4)),
            total: Number((price * amount).toFixed(4)),
          };
          asksBufferRef.current.set(newAsk.id!, newAsk);

          if (updateCounter % 50 === 0) {
            console.log("❤️ 卖单缓冲区大小:", asksBufferRef.current.size);
          }
        }

        // 调度更新 - 使用更直接的方式
        setTimeout(() => {
          console.log("⚡ 直接调用 processBatchUpdates");
          processBatchUpdates();
        }, 0);
      }, 5); // 每5ms一次，1秒200次

      setTimeout(() => {
        clearInterval(highFreqInterval);
      }, 1000);
    }, 1000);

    return () => {
      console.log("🛑 清理数据流...");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // 空依赖数组，避免重复执行

  // 格式化函数
  const formatNumber = useCallback(
    (num: number, decimals: number = 4): string => {
      return num.toFixed(decimals);
    },
    []
  );

  const formatPrice = useCallback((price: number): string => {
    return price.toFixed(2);
  }, []);

  // 计算深度
  const calculateDepth = useCallback(
    (orders: OrderBookItem[]): OrderBookItemWithDepth[] => {
      let cumulative = 0;
      return orders.map((order) => {
        cumulative += order.amount;
        return { ...order, cumulativeAmount: cumulative };
      });
    },
    []
  );

  const getMaxCumulative = useCallback(
    (orders: OrderBookItem[]) => {
      const withDepth = calculateDepth(orders);
      return Math.max(...withDepth.map((item) => item.cumulativeAmount));
    },
    [calculateDepth]
  );

  const getDepthPercentage = useCallback(
    (cumulative: number, maxCumulative: number) => {
      return Math.min((cumulative / maxCumulative) * 100, 100);
    },
    []
  );

  // 使用 useMemo 优化计算
  const bidsWithDepth = useMemo(
    () => calculateDepth(bids),
    [bids, calculateDepth]
  );
  const maxBidCumulative = useMemo(
    () => getMaxCumulative(bids),
    [bids, getMaxCumulative]
  );
  const asksWithDepth = useMemo(
    () => calculateDepth(asks),
    [asks, calculateDepth]
  );
  const maxAskCumulative = useMemo(
    () => getMaxCumulative(asks),
    [asks, getMaxCumulative]
  );

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* 头部 */}
      <div className="bg-[#161a1e] border-b border-[#2a2e39]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center mb-4">
            订单薄 - 高频数据流演示 (1秒200次更新)
          </h1>

          {/* 市场数据概览 */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#8392a5]">交易对:</span>
              <span className="font-semibold">{marketData.symbol}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8392a5]">最新价:</span>
              <span
                className={`font-semibold ${
                  marketData.change24h >= 0
                    ? "text-[#00b275]"
                    : "text-[#f15057]"
                }`}
              >
                {formatPrice(marketData.lastPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8392a5]">FPS:</span>
              <span
                className={`font-semibold ${
                  fps >= 50
                    ? "text-[#00b275]"
                    : fps >= 30
                    ? "text-yellow-500"
                    : "text-[#f15057]"
                }`}
              >
                {fps}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 买单区域 */}
          <div className="bg-[#161a1e] rounded-lg overflow-hidden">
            <div className="bg-[#1a1d29] px-4 py-3 border-b border-[#2a2e39]">
              <h3 className="text-lg font-semibold text-[#00b275] flex items-center gap-2">
                📈 买单 (Bids)
                <span className="text-xs bg-[#00b275] text-black px-2 py-1 rounded">
                  {bids.length}
                </span>
              </h3>
            </div>

            {/* 表头 */}
            <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-[#1a1d29] text-xs text-[#8392a5] font-medium">
              <div>数量</div>
              <div className="text-center">价格</div>
            </div>

            {/* 买单列表 */}
            <div className="max-h-[600px] overflow-y-auto">
              {bidsWithDepth.map((bid, index) => {
                const depthPercentage = getDepthPercentage(
                  bid.cumulativeAmount,
                  maxBidCumulative
                );
                return (
                  <OrderRow
                    key={bid.id || `bid-${index}-${bid.price}`}
                    order={bid}
                    depthPercentage={depthPercentage}
                    isBid={true}
                    formatNumber={formatNumber}
                    formatPrice={formatPrice}
                  />
                );
              })}
            </div>
          </div>

          {/* 中间价格区域 */}
          <div className="bg-[#161a1e] rounded-lg p-6 flex flex-col justify-center items-center">
            <div className="text-center mb-6">
              <div className="text-[#8392a5] text-sm mb-2">最新成交价</div>
              <div
                className={`text-4xl font-bold mb-2 ${
                  marketData.change24h >= 0
                    ? "text-[#00b275]"
                    : "text-[#f15057]"
                }`}
              >
                {formatPrice(marketData.lastPrice)}
              </div>
              <div
                className={`text-lg ${
                  marketData.change24h >= 0
                    ? "text-[#00b275]"
                    : "text-[#f15057]"
                }`}
              >
                {marketData.changePercent}
              </div>
            </div>

            {/* 性能监控 */}
            <div className="mt-6 p-4 bg-[#1a1d29] rounded-lg w-full">
              <div className="text-center">
                <div className="text-[#00b275] text-sm mb-1">🔄 高频数据流</div>
                <div className="text-xs text-[#8392a5]">
                  每秒推送 200 条更新
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00b275] rounded-full animate-pulse"></div>
                    <span className="text-xs text-[#8392a5]">连接正常</span>
                  </div>
                  <div className="text-xs text-[#8392a5]">渲染: {fps} FPS</div>
                </div>

                {/* 调试信息 */}
                <div className="mt-3 p-2 bg-[#0b0e11] rounded text-xs">
                  <div className="text-[#8392a5]">调试信息:</div>
                  <div className="text-white">
                    买单: {bids.length} | 卖单: {asks.length}
                  </div>
                  <div className="text-white">
                    缓冲区: 买{bidsBufferRef.current?.size || 0} | 卖
                    {asksBufferRef.current?.size || 0}
                  </div>
                </div>

                {/* 测试按钮 */}
                <button
                  onClick={() => {
                    console.log("🧪 手动触发更新测试");
                    // 手动添加一些测试数据
                    const testBid: OrderBookItem = {
                      id: `test-bid-${Date.now()}`,
                      price: 2900 + Math.random() * 40,
                      amount: Math.random() * 5,
                      total: 0,
                    };
                    testBid.total = testBid.price * testBid.amount;

                    bidsBufferRef.current.set(testBid.id!, testBid);

                    // 立即触发更新
                    processBatchUpdates();
                  }}
                  className="mt-2 px-3 py-1 bg-[#00b275] text-black text-xs rounded hover:bg-[#00b275]/80"
                >
                  测试更新
                </button>
              </div>
            </div>
          </div>

          {/* 卖单区域 */}
          <div className="bg-[#161a1e] rounded-lg overflow-hidden">
            <div className="bg-[#1a1d29] px-4 py-3 border-b border-[#2a2e39]">
              <h3 className="text-lg font-semibold text-[#f15057] flex items-center gap-2">
                📉 卖单 (Asks)
                <span className="text-xs bg-[#f15057] text-white px-2 py-1 rounded">
                  {asks.length}
                </span>
              </h3>
            </div>

            {/* 表头 */}
            <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-[#1a1d29] text-xs text-[#8392a5] font-medium">
              <div>数量</div>
              <div className="text-center">价格</div>
            </div>

            {/* 卖单列表 */}
            <div className="max-h-[600px] overflow-y-auto">
              {asksWithDepth.map((ask, index) => {
                const depthPercentage = getDepthPercentage(
                  ask.cumulativeAmount,
                  maxAskCumulative
                );
                return (
                  <OrderRow
                    key={ask.id || `ask-${index}-${ask.price}`}
                    order={ask}
                    depthPercentage={depthPercentage}
                    isBid={false}
                    formatNumber={formatNumber}
                    formatPrice={formatPrice}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
