// 真实WebSocket数据源实现
var RealTimeWebsockFeed = function (wsUrl, coin, apiUrl, scale) {
  this.wsUrl = wsUrl || "wss://your-websocket-server.com/ws";
  this.apiUrl = apiUrl || "https://your-api-server.com/api";
  this.coin = coin || { symbol: "ETH/USDT" };
  this.scale = scale || 2;
  this.lastBar = null;
  this.currentBar = null;
  this.subscribe = true;
  this.realtimeCallbacks = [];
  this.websocket = null;
  this.reconnectAttempts = 0;
  this.maxReconnectAttempts = 5;

  // 初始化WebSocket连接
  this.initWebSocket();
};

// 初始化WebSocket连接
RealTimeWebsockFeed.prototype.initWebSocket = function () {
  const that = this;

  try {
    console.log("连接WebSocket:", that.wsUrl);
    that.websocket = new WebSocket(that.wsUrl);

    // WebSocket连接成功
    that.websocket.onopen = function (event) {
      console.log("WebSocket连接成功");
      that.reconnectAttempts = 0;

      // 订阅K线数据
      const subscribeMessage = {
        method: "SUBSCRIBE",
        params: [
          `${that.coin.symbol.toLowerCase()}@kline_1m`, // 1分钟K线
          `${that.coin.symbol.toLowerCase()}@kline_5m`, // 5分钟K线
          `${that.coin.symbol.toLowerCase()}@ticker`, // 24小时价格统计
        ],
        id: 1,
      };

      that.websocket.send(JSON.stringify(subscribeMessage));
    };

    // 接收WebSocket消息
    that.websocket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        that.handleWebSocketMessage(data);
      } catch (error) {
        console.error("解析WebSocket消息失败:", error);
      }
    };

    // WebSocket连接关闭
    that.websocket.onclose = function (event) {
      console.log("WebSocket连接关闭:", event.code, event.reason);
      that.handleReconnect();
    };

    // WebSocket连接错误
    that.websocket.onerror = function (error) {
      console.error("WebSocket连接错误:", error);
    };
  } catch (error) {
    console.error("创建WebSocket连接失败:", error);
    that.handleReconnect();
  }
};

// 处理WebSocket消息
RealTimeWebsockFeed.prototype.handleWebSocketMessage = function (data) {
  const that = this;

  // 处理K线数据
  if (data.stream && data.stream.includes("@kline")) {
    const klineData = data.data.k;

    // 转换为TradingView格式
    const bar = {
      time: klineData.t, // 开盘时间
      open: parseFloat(klineData.o), // 开盘价
      high: parseFloat(klineData.h), // 最高价
      low: parseFloat(klineData.l), // 最低价
      close: parseFloat(klineData.c), // 收盘价
      volume: parseFloat(klineData.v), // 成交量
    };

    // 更新最新K线数据
    that.lastBar = bar;
    that.currentBar = bar;

    // 通知TradingView更新图表
    that.realtimeCallbacks.forEach((item) => {
      if (item.callback && item.symbolInfo.name === that.coin.symbol) {
        item.callback(bar);
      }
    });
  }

  // 处理24小时价格统计
  if (data.stream && data.stream.includes("@ticker")) {
    const tickerData = data.data;

    // 可以在这里更新价格信息到页面
    const priceInfo = {
      symbol: tickerData.s,
      price: parseFloat(tickerData.c),
      change: parseFloat(tickerData.P),
      volume: parseFloat(tickerData.v),
      high: parseFloat(tickerData.h),
      low: parseFloat(tickerData.l),
    };

    // 触发价格更新事件（可以通过自定义事件通知页面组件）
    window.dispatchEvent(
      new CustomEvent("priceUpdate", {
        detail: priceInfo,
      })
    );
  }
};

// 处理重连逻辑
RealTimeWebsockFeed.prototype.handleReconnect = function () {
  const that = this;

  if (that.reconnectAttempts < that.maxReconnectAttempts) {
    that.reconnectAttempts++;
    const delay = Math.pow(2, that.reconnectAttempts) * 1000; // 指数退避

    console.log(
      `${delay / 1000}秒后尝试重连 (${that.reconnectAttempts}/${
        that.maxReconnectAttempts
      })`
    );

    setTimeout(() => {
      that.initWebSocket();
    }, delay);
  } else {
    console.error("WebSocket重连失败，已达到最大重试次数");
  }
};

// TradingView数据源配置
RealTimeWebsockFeed.prototype.onReady = function (callback) {
  var config = {
    exchanges: [],
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
    supports_group_request: false,
    supports_marks: false,
    supports_search: false,
    supports_time: true,
    supports_timescale_marks: false,
  };

  setTimeout(function () {
    callback(config);
  }, 0);
};

// 解析交易对信息
RealTimeWebsockFeed.prototype.resolveSymbol = function (
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

// 获取历史K线数据（从API获取）
RealTimeWebsockFeed.prototype.getBars = function (
  symbolInfo,
  resolution,
  from,
  to,
  onHistoryCallback,
  onErrorCallback,
  firstDataRequest
) {
  const that = this;

  // 构建API请求URL
  const symbol = symbolInfo.name.replace("/", "");
  const interval = that.convertResolution(resolution);
  const startTime = from * 1000;
  const endTime = to * 1000;

  const apiUrl = `${that.apiUrl}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;

  console.log("获取历史数据:", apiUrl);

  // 发起API请求
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // 转换API数据为TradingView格式
      const bars = data.map((item) => ({
        time: parseInt(item[0]), // 开盘时间
        open: parseFloat(item[1]), // 开盘价
        high: parseFloat(item[2]), // 最高价
        low: parseFloat(item[3]), // 最低价
        close: parseFloat(item[4]), // 收盘价
        volume: parseFloat(item[5]), // 成交量
      }));

      // 保存最新的K线数据
      if (bars.length > 0) {
        that.lastBar = bars[bars.length - 1];
        that.currentBar = that.lastBar;
      }

      console.log(`获取到 ${bars.length} 条历史数据`);

      setTimeout(() => {
        onHistoryCallback(bars, { noData: bars.length === 0 });
      }, 0);
    })
    .catch((error) => {
      console.error("获取历史数据失败:", error);
      onErrorCallback(error);
    });
};

// 转换时间周期格式
RealTimeWebsockFeed.prototype.convertResolution = function (resolution) {
  const resolutionMap = {
    1: "1m",
    5: "5m",
    15: "15m",
    30: "30m",
    60: "1h",
    240: "4h",
    "1D": "1d",
    "1W": "1w",
    "1M": "1M",
  };

  return resolutionMap[resolution] || "1m";
};

// 订阅实时数据
RealTimeWebsockFeed.prototype.subscribeBars = function (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  listenerGUID,
  onResetCacheNeededCallback
) {
  console.log("订阅实时数据:", symbolInfo.name, resolution);

  // 保存回调函数
  this.realtimeCallbacks.push({
    callback: onRealtimeCallback,
    symbolInfo: symbolInfo,
    resolution: resolution,
    listenerGUID: listenerGUID,
  });

  // 如果WebSocket未连接，尝试重新连接
  if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
    this.initWebSocket();
  }
};

// 取消订阅实时数据
RealTimeWebsockFeed.prototype.unsubscribeBars = function (subscriberUID) {
  console.log("取消订阅实时数据:", subscriberUID);

  // 移除对应的回调
  this.realtimeCallbacks = this.realtimeCallbacks.filter(
    (item) => item.listenerGUID !== subscriberUID
  );

  // 如果没有订阅者了，可以关闭WebSocket连接
  if (this.realtimeCallbacks.length === 0) {
    this.subscribe = false;
    if (this.websocket) {
      this.websocket.close();
    }
  }
};

// 清理资源
RealTimeWebsockFeed.prototype.destroy = function () {
  this.subscribe = false;
  this.realtimeCallbacks = [];

  if (this.websocket) {
    this.websocket.close();
    this.websocket = null;
  }
};

export default { WebsockFeed: RealTimeWebsockFeed };
