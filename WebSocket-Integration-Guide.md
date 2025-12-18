# WebSocket实时数据接收指南 🔌

## 📍 核心接收位置

### 主要文件：`public/charting_library/datafeed/realtime-websocket.js`

这是接收后台WebSocket推送数据的**核心位置**，所有实时数据处理逻辑都在这里。

## 🔄 数据流程图

```
后台WebSocket服务器 
    ↓ 推送数据
WebSocket客户端 (realtime-websocket.js)
    ↓ 解析数据
TradingView数据源接口
    ↓ 格式转换
TradingView图表组件
    ↓ 图表更新
用户界面显示
```

## 🎯 关键接收点详解

### 1. **WebSocket消息接收** (`handleWebSocketMessage`)

```javascript
// 在 realtime-websocket.js 中
RealTimeWebsockFeed.prototype.handleWebSocketMessage = function (data) {
  const that = this;
  
  // 🔥 这里是接收后台数据的核心位置
  if (data.stream && data.stream.includes('@kline')) {
    const klineData = data.data.k;
    
    // 转换后台数据格式为TradingView格式
    const bar = {
      time: klineData.t,                    // 时间戳
      open: parseFloat(klineData.o),        // 开盘价
      high: parseFloat(klineData.h),        // 最高价
      low: parseFloat(klineData.l),         // 最低价
      close: parseFloat(klineData.c),       // 收盘价
      volume: parseFloat(klineData.v)       // 成交量
    };
    
    // 🚀 通知TradingView更新图表
    that.realtimeCallbacks.forEach((item) => {
      if (item.callback) {
        item.callback(bar);  // 这里触发图表更新
      }
    });
  }
};
```

### 2. **WebSocket连接初始化** (`initWebSocket`)

```javascript
// WebSocket连接和订阅
RealTimeWebsockFeed.prototype.initWebSocket = function () {
  const that = this;
  
  // 🔗 连接WebSocket服务器
  that.websocket = new WebSocket(that.wsUrl);
  
  that.websocket.onopen = function (event) {
    // 🎯 连接成功后订阅数据
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: [
        `${that.coin.symbol.toLowerCase()}@kline_1m`,  // K线数据
        `${that.coin.symbol.toLowerCase()}@ticker`     // 价格统计
      ],
      id: 1
    };
    
    that.websocket.send(JSON.stringify(subscribeMessage));
  };
  
  // 📨 接收消息的入口点
  that.websocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    that.handleWebSocketMessage(data);  // 处理接收到的数据
  };
};
```

## 🔧 如何替换为真实WebSocket

### 步骤1：修改TvChart组件导入

```tsx
// 在 src/components/tv/index.tsx 中
// 替换这行：
import Datafeeds from "../../../public/charting_library/datafeed/mockswaptrade.js";

// 改为：
import Datafeeds from "../../../public/charting_library/datafeed/realtime-websocket.js";
```

### 步骤2：配置WebSocket服务器地址

```javascript
// 在创建数据源时传入真实的WebSocket地址
const newDatafeed = new Datafeeds.WebsockFeed(
  'wss://your-websocket-server.com/ws',  // WebSocket服务器地址
  { symbol: 'ETH/USDT' },                // 交易对信息
  'https://your-api-server.com/api',     // REST API地址
  2                                      // 价格精度
);
```

### 步骤3：适配后台数据格式

根据你的后台WebSocket数据格式，修改 `handleWebSocketMessage` 方法：

```javascript
// 示例：适配币安WebSocket格式
if (data.stream && data.stream.includes('@kline')) {
  const klineData = data.data.k;
  
  const bar = {
    time: klineData.t,                    // 开盘时间
    open: parseFloat(klineData.o),        // 开盘价
    high: parseFloat(klineData.h),        // 最高价
    low: parseFloat(klineData.l),         // 最低价
    close: parseFloat(klineData.c),       // 收盘价
    volume: parseFloat(klineData.v)       // 成交量
  };
}

// 示例：适配自定义后台格式
if (data.type === 'kline_update') {
  const bar = {
    time: data.timestamp,
    open: data.ohlcv.open,
    high: data.ohlcv.high,
    low: data.ohlcv.low,
    close: data.ohlcv.close,
    volume: data.ohlcv.volume
  };
}
```

## 📊 页面组件数据接收

### 使用自定义Hook接收价格数据

```tsx
// 在页面组件中使用
import { useWebSocketPrice } from "@/hooks/useWebSocketPrice";

export default function CexPage() {
  // 🎣 Hook自动监听WebSocket价格更新
  const { priceData, isConnected, formattedPrice } = useWebSocketPrice('ETH/USDT');
  
  // 当价格数据更新时自动重新渲染
  return (
    <div>
      <div className="price-display">
        当前价格: {formattedPrice}
        连接状态: {isConnected ? '已连接' : '未连接'}
      </div>
    </div>
  );
}
```

### 监听自定义事件

```tsx
// 在组件中直接监听价格更新事件
useEffect(() => {
  const handlePriceUpdate = (event: CustomEvent) => {
    const priceData = event.detail;
    console.log('接收到价格更新:', priceData);
    // 更新组件状态
  };

  window.addEventListener('priceUpdate', handlePriceUpdate);
  
  return () => {
    window.removeEventListener('priceUpdate', handlePriceUpdate);
  };
}, []);
```

## 🔄 数据同步机制

### 1. **K线数据同步**
- WebSocket推送实时K线数据
- 数据源自动转换格式并通知TradingView
- 图表实时更新显示

### 2. **价格信息同步**
- WebSocket推送24小时价格统计
- 通过自定义事件通知页面组件
- 页面价格信息实时更新

### 3. **历史数据获取**
- 通过REST API获取历史K线数据
- 支持不同时间周期的数据请求
- 与实时数据无缝衔接

## 🛠️ 常见后台数据格式适配

### 币安格式
```javascript
// 币安WebSocket K线数据格式
{
  "stream": "ethusdt@kline_1m",
  "data": {
    "k": {
      "t": 1640995200000,  // 开盘时间
      "o": "2450.50",      // 开盘价
      "h": "2480.00",      // 最高价
      "l": "2420.30",      // 最低价
      "c": "2465.80",      // 收盘价
      "v": "15420.5"       // 成交量
    }
  }
}
```

### 火币格式
```javascript
// 火币WebSocket K线数据格式
{
  "ch": "market.ethusdt.kline.1min",
  "tick": {
    "id": 1640995200,
    "open": 2450.50,
    "high": 2480.00,
    "low": 2420.30,
    "close": 2465.80,
    "vol": 15420.5
  }
}
```

### 自定义格式适配示例
```javascript
// 适配自定义后台格式
RealTimeWebsockFeed.prototype.handleWebSocketMessage = function (data) {
  // 根据你的后台数据格式进行适配
  if (data.msgType === 'KLINE_DATA') {
    const bar = {
      time: data.data.timestamp * 1000,  // 转换为毫秒
      open: data.data.open,
      high: data.data.high,
      low: data.data.low,
      close: data.data.close,
      volume: data.data.volume
    };
    
    // 通知TradingView更新
    this.realtimeCallbacks.forEach((item) => {
      if (item.callback) {
        item.callback(bar);
      }
    });
  }
};
```

## 🚨 错误处理和重连

### 自动重连机制
```javascript
// 处理连接断开和重连
RealTimeWebsockFeed.prototype.handleReconnect = function () {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 指数退避
    
    setTimeout(() => {
      this.initWebSocket();
    }, delay);
  }
};
```

### 错误处理
```javascript
// WebSocket错误处理
that.websocket.onerror = function (error) {
  console.error('WebSocket连接错误:', error);
  // 可以在这里添加错误上报逻辑
};

// 数据解析错误处理
that.websocket.onmessage = function (event) {
  try {
    const data = JSON.parse(event.data);
    that.handleWebSocketMessage(data);
  } catch (error) {
    console.error('解析WebSocket消息失败:', error);
    // 忽略无法解析的消息，继续处理后续数据
  }
};
```

## 📈 性能优化建议

### 1. **数据节流**
```javascript
// 避免过于频繁的更新
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100; // 100ms最多更新一次

if (Date.now() - lastUpdateTime > UPDATE_INTERVAL) {
  // 执行更新逻辑
  lastUpdateTime = Date.now();
}
```

### 2. **内存管理**
```javascript
// 及时清理资源
RealTimeWebsockFeed.prototype.destroy = function () {
  this.subscribe = false;
  this.realtimeCallbacks = [];
  
  if (this.websocket) {
    this.websocket.close();
    this.websocket = null;
  }
};
```

## 🎯 总结

WebSocket数据接收的核心位置是 `public/charting_library/datafeed/realtime-websocket.js` 文件中的 `handleWebSocketMessage` 方法。

**关键步骤：**
1. 在 `initWebSocket()` 中建立WebSocket连接
2. 在 `onmessage` 中接收后台推送的数据
3. 在 `handleWebSocketMessage()` 中解析和转换数据格式
4. 通过 `realtimeCallbacks` 通知TradingView更新图表
5. 通过自定义事件通知页面组件更新价格信息

只需要根据你的后台WebSocket数据格式，修改数据解析逻辑即可实现真实数据的接收和显示！

---

*这个指南详细说明了WebSocket数据接收的完整流程，帮助你快速集成真实的后台数据源！* 🚀