# TradingView DataFeed 核心方法详解

## 🔄 方法调用时序图

```
TradingView Widget 创建
         ↓
    1. onReady()
         ↓
    2. resolveSymbol()  
         ↓
    3. getBars()
         ↓
    4. subscribeBars()
         ↓
    [实时数据更新循环]
         ↓
    5. unsubscribeBars()
```

## 📋 核心方法详解

### 1. onReady(callback) - 数据源配置
**🎯 作用**：告诉TradingView这个数据源支持什么功能
- 返回支持的时间周期
- 返回支持的交易所列表  
- 返回支持的功能特性

**📤 返回配置**：
```javascript
{
  supported_resolutions: ['1', '5', '15', '1H', '1D'],
  exchanges: [{value: 'Binance', name: 'Binance'}],
  supports_marks: false,
  supports_search: true
}
```

### 2. resolveSymbol(symbolName, onResolve, onError) - 交易对解析
**🎯 作用**：根据交易对名称返回详细信息
- 解析"BTCUSDT"返回完整的交易对元数据
- 设置价格精度、最小变动单位
- 配置交易时间和时区

**📤 返回信息**：
```javascript
{
  name: 'BTCUSDT',
  pricescale: 100,        // 价格精度(2位小数)
  minmov: 1,              // 最小变动单位
  session: '24x7',        // 24小时交易
  timezone: 'Etc/UTC',    // UTC时区
  has_intraday: true      // 支持分钟级数据
}
```

### 3. getBars(symbolInfo, resolution, periodParams, onResolve, onError) - 历史数据
**🎯 作用**：获取指定时间范围的历史K线数据
- 从API获取历史数据
- 转换为TradingView标准格式
- 缓存最新数据用于实时更新

**📥 输入参数**：
- `symbolInfo`: 交易对信息
- `resolution`: 时间周期('1', '5', '1H', '1D')
- `periodParams`: {from, to, firstDataRequest}

**📤 返回数据**：
```javascript
[
  {
    time: 1640995200000,    // 时间戳(毫秒)
    open: 47000.50,         // 开盘价
    high: 47500.00,         // 最高价
    low: 46800.30,          // 最低价
    close: 47200.80,        // 收盘价
    volume: 1542.5          // 成交量
  }
]
```

### 4. subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) - 实时订阅
**🎯 作用**：订阅实时K线数据推送
- 建立WebSocket连接
- 订阅指定交易对的实时数据
- 接收推送数据并更新图表

**🔄 工作流程**：
1. 建立WebSocket连接
2. 发送订阅消息
3. 接收实时数据
4. 调用`onRealtimeCallback`更新图表

**📊 实时数据处理**：
- **增量更新**：更新当前K线的价格
- **新K线**：时间周期结束创建新K线
- **数据校验**：确保时间连续性

### 5. unsubscribeBars(subscriberUID) - 取消订阅
**🎯 作用**：取消实时数据订阅，清理资源
- 关闭WebSocket连接
- 清理订阅记录
- 释放内存资源

**🧹 清理工作**：
- 移除订阅记录
- 关闭网络连接
- 清理定时器
- 防止内存泄漏

## 🔧 实现要点

### 数据格式标准化
```javascript
// 所有方法返回的K线数据必须统一格式
const standardBar = {
  time: timestamp,        // 毫秒时间戳
  open: number,          // 开盘价
  high: number,          // 最高价  
  low: number,           // 最低价
  close: number,         // 收盘价
  volume: number         // 成交量
};
```

### 错误处理
```javascript
// 每个方法都必须处理错误情况
try {
  const data = await fetchData();
  onResolve(data);
} catch (error) {
  onError(error);  // 必须调用错误回调
}
```

### 缓存管理
```javascript
// getBars首次请求时缓存最新数据
if (firstDataRequest) {
  this.lastBarsCache.set(symbolInfo.name, lastBar);
}

// subscribeBars使用缓存数据作为基准
const lastBar = this.lastBarsCache.get(symbolInfo.name);
```

## 🚨 常见问题

### 1. 方法不被调用
- 检查TradingView库是否正确加载
- 确认数据源对象正确传递给widget
- 验证方法名称和签名是否正确

### 2. 数据不显示
- 确保调用了onResolve回调
- 检查数据格式是否符合标准
- 验证时间戳是否为毫秒级

### 3. 实时更新不工作
- 检查WebSocket连接状态
- 确认subscriberUID管理正确
- 验证onRealtimeCallback调用

### 4. 内存泄漏
- 确保unsubscribeBars被正确调用
- 检查WebSocket连接是否关闭
- 清理所有定时器和事件监听

## 💡 最佳实践

1. **异步处理**：所有方法都应该异步处理，使用setTimeout或Promise
2. **错误处理**：完善的try-catch和错误回调
3. **资源管理**：及时清理WebSocket连接和缓存
4. **数据校验**：验证数据完整性和格式正确性
5. **性能优化**：合理的缓存策略和数据分页

这些方法构成了TradingView数据源的完整接口，正确实现这些方法就能让TradingView正常显示K线图并支持实时更新！