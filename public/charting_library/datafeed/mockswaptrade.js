var $ = require("jquery");

// 生成模拟K线数据
function generateMockKlineData(from, to, resolution) {
  const bars = [];
  const interval = getIntervalInMs(resolution);
  let currentTime = from * 1000;
  let currentPrice = 2450; // ETH/USDT 基础价格

  while (currentTime <= to * 1000) {
    const open = currentPrice;
    const change = (Math.random() - 0.5) * 20; // -10 到 +10 的随机变化
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    const volume = Math.random() * 1000 + 100;

    bars.push({
      time: currentTime,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
    });

    currentPrice = close;
    currentTime += interval;
  }

  return bars;
}

function getIntervalInMs(resolution) {
  switch (resolution) {
    case "1":
      return 60 * 1000; // 1分钟
    case "5":
      return 5 * 60 * 1000; // 5分钟
    case "15":
      return 15 * 60 * 1000; // 15分钟
    case "30":
      return 30 * 60 * 1000; // 30分钟
    case "60":
      return 60 * 60 * 1000; // 1小时
    case "240":
      return 4 * 60 * 60 * 1000; // 4小时
    case "1D":
      return 24 * 60 * 60 * 1000; // 1天
    case "1W":
      return 7 * 24 * 60 * 60 * 1000; // 1周
    case "1M":
      return 30 * 24 * 60 * 60 * 1000; // 1月
    default:
      return 60 * 1000;
  }
}

var MockWebsockFeed = function (url, coin, stompClient, scale) {
  this._datafeedURL = url;
  this.coin = coin || { symbol: "ETH/USDT" };
  this.stompClient = stompClient;
  this.lastBar = null;
  this.currentBar = null;
  this.subscribe = true;
  this.scale = scale || 2;
  this.realtimeCallbacks = [];

  // 启动实时数据模拟
  this.startRealTimeSimulation();
};

MockWebsockFeed.prototype.onReady = function (callback) {
  var config = {};
  config.exchanges = [];
  config.supported_resolutions = [
    "1",
    "5",
    "15",
    "30",
    "60",
    "240",
    "1D",
    "1W",
    "1M",
  ];
  config.supports_group_request = false;
  config.supports_marks = false;
  config.supports_search = false;
  config.supports_time = true;
  config.supports_timescale_marks = false;

  setTimeout(function () {
    callback(config);
  }, 0);
};

MockWebsockFeed.prototype.subscribeBars = function (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  listenerGUID,
  onResetCacheNeededCallback
) {
  console.log("=====subscribeBars runnning");

  // 保存回调函数用于实时更新
  this.realtimeCallbacks.push({
    callback: onRealtimeCallback,
    symbolInfo: symbolInfo,
    resolution: resolution,
    listenerGUID: listenerGUID,
  });
};

MockWebsockFeed.prototype.unsubscribeBars = function (subscriberUID) {
  console.log("=====unsubscribeBars runnning");
  this.subscribe = false;
  // 移除对应的回调
  this.realtimeCallbacks = this.realtimeCallbacks.filter(
    (item) => item.listenerGUID !== subscriberUID
  );
};

MockWebsockFeed.prototype.resolveSymbol = function (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback
) {
  var data = {
    name: this.coin.symbol,
    "exchange-traded": "",
    "exchange-listed": "",
    minmov: 1,
    volumescale: 10000,
    has_daily: true,
    has_weekly_and_monthly: true,
    has_intraday: true,
    description: this.coin.symbol,
    type: "bitcoin",
    session: "24x7",
    supported_resolutions: [
      "1",
      "5",
      "15",
      "30",
      "60",
      "240",
      "1D",
      "1W",
      "1M",
    ],
    pricescale: Math.pow(10, this.scale || 2),
    ticker: "",
    timezone: "Asia/Shanghai",
  };

  setTimeout(function () {
    onSymbolResolvedCallback(data);
  }, 0);
};

MockWebsockFeed.prototype.getBars = function (
  symbolInfo,
  resolution,
  from,
  to,
  onHistoryCallback,
  onErrorCallback,
  firstDataRequest
) {
  console.log("=====getBars runnning");

  try {
    // 生成模拟历史数据
    const bars = generateMockKlineData(from, to, resolution);

    this.lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
    this.currentBar = this.lastBar;

    const noData = bars.length === 0;

    setTimeout(() => {
      onHistoryCallback(bars, { noData: noData });
    }, 100); // 模拟网络延迟
  } catch (error) {
    console.error("Error generating mock data:", error);
    onErrorCallback(error);
  }
};

MockWebsockFeed.prototype.startRealTimeSimulation = function () {
  const that = this;

  // 每2秒更新一次实时数据
  setInterval(() => {
    if (
      !that.subscribe ||
      !that.lastBar ||
      that.realtimeCallbacks.length === 0
    ) {
      return;
    }

    // 生成新的价格数据
    const change = (Math.random() - 0.5) * 5; // -2.5 到 +2.5 的随机变化
    const newClose = that.lastBar.close + change;
    const newHigh = Math.max(that.lastBar.high, newClose, that.lastBar.open);
    const newLow = Math.min(that.lastBar.low, newClose, that.lastBar.open);
    const newVolume = that.lastBar.volume + Math.random() * 50;

    // 更新当前K线
    const updatedBar = {
      time: that.lastBar.time,
      open: that.lastBar.open,
      high: parseFloat(newHigh.toFixed(2)),
      low: parseFloat(newLow.toFixed(2)),
      close: parseFloat(newClose.toFixed(2)),
      volume: parseFloat(newVolume.toFixed(2)),
    };

    that.lastBar = updatedBar;
    that.currentBar = updatedBar;

    // 通知所有订阅者
    that.realtimeCallbacks.forEach((item) => {
      if (item.callback) {
        item.callback(updatedBar);
      }
    });
  }, 2000);

  // 每分钟生成新的K线
  setInterval(() => {
    if (
      !that.subscribe ||
      !that.lastBar ||
      that.realtimeCallbacks.length === 0
    ) {
      return;
    }

    // 生成新的K线数据点
    const newTime = that.lastBar.time + 60000; // 1分钟后
    const newOpen = that.lastBar.close;
    const change = (Math.random() - 0.5) * 10;
    const newClose = newOpen + change;
    const newHigh = Math.max(newOpen, newClose) + Math.random() * 5;
    const newLow = Math.min(newOpen, newClose) - Math.random() * 5;
    const newVolume = Math.random() * 200 + 50;

    const newBar = {
      time: newTime,
      open: parseFloat(newOpen.toFixed(2)),
      high: parseFloat(newHigh.toFixed(2)),
      low: parseFloat(newLow.toFixed(2)),
      close: parseFloat(newClose.toFixed(2)),
      volume: parseFloat(newVolume.toFixed(2)),
    };

    that.lastBar = newBar;
    that.currentBar = newBar;

    // 通知所有订阅者
    that.realtimeCallbacks.forEach((item) => {
      if (item.callback) {
        item.callback(newBar);
      }
    });
  }, 60000); // 每分钟
};

MockWebsockFeed.prototype.periodLengthSeconds = function (
  resolution,
  requiredPeriodsCount
) {
  var daysCount = 0;
  if (resolution === "D") {
    daysCount = requiredPeriodsCount;
  } else if (resolution === "M") {
    daysCount = 31 * requiredPeriodsCount;
  } else if (resolution === "W") {
    daysCount = 7 * requiredPeriodsCount;
  } else if (resolution === "H") {
    daysCount = (requiredPeriodsCount * resolution) / 24;
  } else {
    daysCount = (requiredPeriodsCount * resolution) / (24 * 60);
  }

  return daysCount * 24 * 60 * 60;
};

export default { WebsockFeed: MockWebsockFeed };
