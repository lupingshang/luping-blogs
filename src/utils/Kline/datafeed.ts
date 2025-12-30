/**
 * TradingView DataFeed 数据源实现
 *
 * 🔄 方法调用流程：
 * 1. onReady() - TradingView初始化时调用，返回数据源配置
 * 2. resolveSymbol() - 解析交易对信息，返回交易对元数据
 * 3. getBars() - 获取历史K线数据，用于图表初始显示
 * 4. subscribeBars() - 订阅实时数据，建立WebSocket连接
 * 5. [实时数据推送] - 通过onRealtimeCallback更新图表
 * 6. unsubscribeBars() - 取消订阅，清理资源
 *
 * 📊 数据流向：
 * 后台API/WebSocket → DataFeed适配器 → TradingView图表库 → 用户界面
 *
 * 🎯 核心职责：
 * - 统一数据接口：将不同数据源的格式转换为TradingView标准格式
 * - 管理数据连接：处理HTTP请求和WebSocket连接
 * - 缓存管理：缓存最新数据用于实时更新对比
 * - 错误处理：网络异常、数据异常的处理和重试
 */

//datafeed.ts

// TradingView 类型定义
declare global {
  namespace TradingView {
    interface DatafeedConfiguration {
      supported_resolutions: ResolutionString[];
      exchanges?: Exchange[];
      symbols_types?: SymbolType[];
    }

    interface Exchange {
      value: string;
      name: string;
      desc: string;
    }

    interface SymbolType {
      name: string;
      value: string;
    }

    type ResolutionString = string;

    interface LibrarySymbolInfo {
      ticker: string;
      name: string;
      description: string;
      type: string;
      session: string;
      timezone: string;
      exchange: string;
      minmov: number;
      pricescale: number;
      has_intraday: boolean;
      has_daily: boolean;
      has_weekly_and_monthly: boolean;
      visible_plots_set: string;
      supported_resolutions: ResolutionString[];
      volume_precision: number;
      data_status: string;
      full_name: string;
    }

    interface Bar {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }

    interface IExternalDatafeed {
      onReady(callback: OnReadyCallback): void;
      searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResultReadyCallback: SearchSymbolsCallback
      ): void;
      resolveSymbol(
        symbolName: string,
        onResolve: ResolveCallback,
        onError: ErrorCallback,
        extension?: SymbolResolveExtension
      ): void;
    }

    interface IDatafeedChartApi {
      getBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onResolve: HistoryCallback,
        onError: ErrorCallback
      ): void;
      subscribeBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onRealtimeCallback: SubscribeBarsCallback,
        subscriberUID: string,
        onResetCacheNeededCallback: () => void
      ): void;
      unsubscribeBars(subscriberUID: string): void;
    }
  }

  type OnReadyCallback = (
    configuration: TradingView.DatafeedConfiguration
  ) => void;
  type SearchSymbolsCallback = (symbols: any[]) => void;
  type ResolveCallback = (symbolInfo: TradingView.LibrarySymbolInfo) => void;
  type SymbolResolveExtension = any;
  type HistoryCallback = (
    bars: TradingView.Bar[],
    meta?: { noData?: boolean }
  ) => void;
  type SubscribeBarsCallback = (bar: TradingView.Bar) => void;
  type ResolutionString = TradingView.ResolutionString;
  type LibrarySymbolInfo = TradingView.LibrarySymbolInfo;

  interface PeriodParams {
    from: number;
    to: number;
    firstDataRequest: boolean;
  }
}
import { subscribeOnStream, unsubscribeFromStream } from "./streaming";
import {
  makeApiRequest,
  makeBinanceRequest,
  generateSymbol,
  parseFullSymbol,
  priceScale,
} from "./helpers";

// 本地类型定义
type ErrorCallback = any;

interface UrlParameters {
  e?: string;
  fsym?: string;
  tsym?: string;
  toTs: number;
  limit: number;
}

interface DataFeedOptions {
  SymbolInfo?: TradingView.LibrarySymbolInfo;
  DatafeedConfiguration?: TradingView.DatafeedConfiguration;
  getBars?: TradingView.IDatafeedChartApi["getBars"];
}

const configurationData: TradingView.DatafeedConfiguration = {
  // Represents the resolutions for bars supported by your datafeed
  supported_resolutions: [
    "1",
    "5",
    "15",
    "1H",
    "4H",
    "1D",
    "3D",
    "1W",
    "1M",
  ] as TradingView.ResolutionString[],
  // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
  exchanges: [
    { value: "Binance", name: "Binance", desc: "Binance" },
  ] as TradingView.Exchange[],
  // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
  symbols_types: [{ name: "crypto", value: "crypto" }],
};

export const BINANCE_RESOLUSION = {
  1: "1m",
  3: "3m",
  5: "5m",
  15: "15m",
  60: "1h",
  120: "2h",
  240: "4h",
  360: "6h",
  720: "12h",
  "1D": "1d",
  "2D": "2d",
  "3D": "3d",
  "1W": "1w",
  "1M": "1M",
};

async function getAllSymbols() {
  const data = await makeApiRequest("data/v3/all/exchanges");
  let allSymbols: any[] = [];
  if (configurationData.exchanges) {
    for (const exchange of configurationData.exchanges) {
      const pairs = data.Data[exchange.value].pairs;

      for (const leftPairPart of Object.keys(pairs)) {
        const symbols = pairs[leftPairPart].map((rightPairPart: any) => {
          const symbol = generateSymbol(
            exchange.value,
            leftPairPart,
            rightPairPart
          );
          return {
            symbol: symbol.short,
            full_name: symbol.full,
            description: symbol.short,
            exchange: exchange.value,
            type: "crypto",
          };
        });
        allSymbols = [...allSymbols, ...symbols];
      }
    }
    return allSymbols;
  } else {
    allSymbols = [
      {
        symbol: "Token",
        full_name: "Token full name",
        description: "Description",
        exchange: "Binance",
        type: "crypto",
      },
    ];
    return allSymbols;
  }
}

export default class DefinedDataFeed
  implements TradingView.IExternalDatafeed, TradingView.IDatafeedChartApi
{
  private options: DataFeedOptions;
  private lastBarsCache: Map<string, TradingView.Bar>;

  constructor(options: DataFeedOptions) {
    this.options = options;
    this.lastBarsCache = new Map();
    if (!options) {
      this.options.DatafeedConfiguration = configurationData;
    }
  }
  /**
   * onReady() - 数据源初始化配置方法
   *
   * 🎯 作用：
   * - TradingView库初始化时第一个调用的方法
   * - 返回数据源的基本配置信息，告诉TradingView这个数据源支持什么功能
   *
   * 📋 主要配置项：
   * - supported_resolutions: 支持的时间周期 ['1', '5', '15', '1H', '1D'等]
   * - exchanges: 支持的交易所列表 [Binance, OKX等]
   * - symbols_types: 支持的交易对类型 [crypto, forex等]
   * - supports_marks: 是否支持图表标记
   * - supports_search: 是否支持交易对搜索
   * - supports_time: 是否支持时间相关功能
   *
   * 🔄 调用时机：
   * - TradingView widget创建时自动调用
   * - 必须调用callback返回配置，否则图表无法初始化
   *
   * 💡 重要性：这是数据源的"身份证"，决定了TradingView能使用哪些功能
   */
  public async onReady(callback: OnReadyCallback): Promise<void> {
    console.log("[onReady]: Method call");
    setTimeout(() => callback(configurationData));
  }
  public async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: SearchSymbolsCallback
  ): Promise<void> {
    console.log("[searchSymbols]: Method call", userInput);
    const symbols = await getAllSymbols();
    const newSymbols = symbols.filter((symbol) => {
      const isExchangeValid = exchange === "" || symbol.exchange === exchange;
      const isFullSymbolContainsInput =
        symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1;
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  }

  /**
   * resolveSymbol() - 交易对信息解析方法
   *
   * 🎯 作用：
   * - 根据交易对名称(如"BTCUSDT")解析出详细的交易对信息
   * - 返回交易对的元数据，包括价格精度、交易时间、支持的功能等
   *
   * 📊 返回的关键信息：
   * - ticker: 交易对代码 (BTCUSDT)
   * - name: 显示名称 (BTC/USDT)
   * - pricescale: 价格精度 (100000000 = 8位小数)
   * - minmov: 最小变动单位 (1)
   * - session: 交易时间 ("24x7" = 24小时交易)
   * - timezone: 时区 ("Etc/UTC")
   * - has_intraday: 是否支持分钟级数据
   * - supported_resolutions: 支持的时间周期
   * - data_status: 数据状态 ("streaming" = 实时流数据)
   *
   * 🔄 调用时机：
   * - 用户选择交易对时
   * - 切换交易对时
   * - 图表初始化时
   *
   * ⚠️ 注意：
   * - 必须调用onResolve返回symbolInfo，否则图表无法加载
   * - 如果交易对不存在，必须调用onError
   * - pricescale决定了价格显示的小数位数
   */
  public async resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback,
    extension?: SymbolResolveExtension | undefined
  ): Promise<void> {
    console.log("[resolveSymbol]: Method call", symbolName);
    const symbols = await getAllSymbols();
    // console.log("symbols", symbols);
    const symbolItem = symbols.find(
      ({ full_name }) => full_name === symbolName
    );
    if (!symbolItem) {
      console.log("[resolveSymbol]: Cannot resolve symbol", symbolName);
      onError("cannot resolve symbol");
      return;
    }
    const symbolInfo: Partial<TradingView.LibrarySymbolInfo> = {
      ticker: symbolItem.full_name,
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      session: "24x7",
      timezone: "Etc/UTC",
      exchange: symbolItem.exchange,
      minmov: 1,
      pricescale: priceScale("0.00000100"), // 修改精度 priceScale('0.00000001'),
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: false,
      visible_plots_set: "ohlcv",
      supported_resolutions: configurationData.supported_resolutions!,
      volume_precision: 8,
      data_status: "streaming",
    };
    console.log("[resolveSymbol]: Symbol resolved", symbolName);
    onResolve(symbolInfo as TradingView.LibrarySymbolInfo);
  }

  /**
   * getBars() - 获取历史K线数据方法
   *
   * 🎯 作用：
   * - 获取指定时间范围内的历史K线数据
   * - 这是图表显示的核心数据来源
   * - 支持不同时间周期的数据请求(1分钟、1小时、1天等)
   *
   * 📥 输入参数：
   * - symbolInfo: 交易对信息(来自resolveSymbol)
   * - resolution: 时间周期('1', '5', '15', '1H', '1D'等)
   * - periodParams: 时间范围参数
   *   - from: 开始时间戳(秒)
   *   - to: 结束时间戳(秒)
   *   - firstDataRequest: 是否首次请求
   *
   * 📤 返回数据格式：
   * - time: 时间戳(毫秒)
   * - open: 开盘价
   * - high: 最高价
   * - low: 最低价
   * - close: 收盘价
   * - volume: 成交量
   *
   * 🔄 调用时机：
   * - 图表初始化时获取初始数据
   * - 用户缩放图表时获取更多历史数据
   * - 切换时间周期时重新获取数据
   * - 用户滚动到历史区域时分页加载
   *
   * 💾 缓存机制：
   * - firstDataRequest=true时，缓存最新的K线数据到lastBarsCache
   * - 缓存用于实时数据更新时的基准对比
   *
   * ⚠️ 重要：
   * - 必须调用onResolve返回数据数组，即使是空数组
   * - 无数据时设置{noData: true}
   * - 数据必须按时间正序排列
   * - 时间戳必须是毫秒级别
   */
  public async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResolve: HistoryCallback,
    onError: ErrorCallback
  ): Promise<void> {
    const { from, to, firstDataRequest } = periodParams;
    console.log("[getBars]: Method call", symbolInfo, resolution, from, to);
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
    if (parsedSymbol) {
      const urlParameters = {
        symbol: parsedSymbol.symbol,
        interval:
          BINANCE_RESOLUSION[resolution as keyof typeof BINANCE_RESOLUSION],
        startTime: from * 1000,
        endTime: to * 1000,
        limit: 1000,
      };

      const query = Object.keys(urlParameters)
        .map(
          (name) =>
            `${name}=${encodeURIComponent(
              urlParameters[name as keyof typeof urlParameters]
            )}`
        )
        .join("&");

      try {
        const data = await makeBinanceRequest(`api/v3/klines?${query}`);
        console.log("[getBars]: Request resolved", data);

        if (!data || data.length === 0) {
          // "noData" should be set if there is no data in the requested period
          onResolve([], { noData: true });
          return;
        }
        let bars: {
          time: number;
          low: any;
          high: any;
          open: any;
          close: any;
          volume: any;
        }[] = [];
        data.forEach((bar: string[]) => {
          if (parseInt(bar[0]) >= from * 1000 && parseInt(bar[0]) < to * 1000) {
            bars = [
              ...bars,
              {
                time: parseInt(bar[0]),
                open: parseFloat(bar[1]),
                high: parseFloat(bar[2]),
                low: parseFloat(bar[3]),
                close: parseFloat(bar[4]),
                volume: parseFloat(bar[5]),
              },
            ];
          }
        });

        if (firstDataRequest) {
          this.lastBarsCache.set(symbolInfo.name, {
            ...bars[bars.length - 1],
          });
        }
        console.log(`[getBars]: returned ${bars.length} bar(s)`, bars);
        onResolve(bars, { noData: false });
      } catch (error) {
        console.log("[getBars]: Get error", error);
        onError(error);
      }
    }
  }

  /**
   * subscribeBars() - 订阅实时K线数据更新方法
   *
   * 🎯 作用：
   * - 订阅指定交易对的实时K线数据推送
   * - 建立WebSocket连接或其他实时数据通道
   * - 当有新的K线数据时，自动更新图表显示
   *
   * 📥 输入参数：
   * - symbolInfo: 交易对信息
   * - resolution: 时间周期
   * - onRealtimeCallback: 实时数据回调函数
   *   - TradingView提供的回调，用于更新图表
   *   - 接收新的K线数据并触发图表重绘
   * - subscriberUID: 订阅者唯一标识
   *   - 用于管理多个订阅，支持取消特定订阅
   * - onResetCacheNeededCallback: 缓存重置回调
   *   - 当数据不连续时调用，清空图表缓存
   *
   * 🔄 工作流程：
   * 1. 建立WebSocket连接到数据源
   * 2. 发送订阅消息(交易对+时间周期)
   * 3. 接收实时推送数据
   * 4. 数据格式转换和验证
   * 5. 调用onRealtimeCallback更新图表
   *
   * 📊 实时数据处理：
   * - 增量更新：只更新当前K线的最新价格
   * - 新K线：时间周期结束时创建新的K线
   * - 数据校验：确保时间连续性和数据完整性
   *
   * 💾 缓存管理：
   * - 使用lastBarsCache中的最新K线作为基准
   * - 对比新数据判断是更新还是新增K线
   *
   * ⚠️ 重要：
   * - 必须保存subscriberUID用于后续取消订阅
   * - 实时数据格式必须与getBars返回格式一致
   * - 处理网络断线重连逻辑
   * - 避免重复订阅同一个交易对
   */
  public subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ): void {
    console.log(
      "[subscribeBars]: Method call with subscriberUID:",
      subscriberUID,
      symbolInfo,
      this.lastBarsCache
    );
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      this.lastBarsCache.get(symbolInfo.name)
    );
  }

  /**
   * unsubscribeBars() - 取消订阅实时K线数据方法
   *
   * 🎯 作用：
   * - 取消指定的实时数据订阅
   * - 清理WebSocket连接和相关资源
   * - 停止接收和处理实时数据推送
   *
   * 📥 输入参数：
   * - subscriberUID: 订阅者唯一标识
   *   - 与subscribeBars中的UID对应
   *   - 用于精确取消特定的订阅
   *
   * 🔄 调用时机：
   * - 用户切换到其他交易对时
   * - 用户关闭图表页面时
   * - 组件卸载时(React useEffect cleanup)
   * - 切换时间周期时(先取消旧订阅，再建立新订阅)
   * - 发生错误需要重新订阅时
   *
   * 🧹 清理工作：
   * - 从订阅列表中移除对应的订阅记录
   * - 关闭WebSocket连接(如果没有其他订阅)
   * - 清理定时器和事件监听器
   * - 释放内存中的缓存数据
   *
   * 🔧 资源管理：
   * - 支持多订阅管理：一个数据源可能同时订阅多个交易对
   * - 引用计数：只有当所有订阅都取消时才关闭连接
   * - 防止内存泄漏：确保所有相关资源都被正确释放
   *
   * ⚠️ 重要：
   * - 必须正确处理subscriberUID，避免取消错误的订阅
   * - 确保WebSocket连接被正确关闭
   * - 处理并发取消订阅的情况
   * - 在组件卸载时必须调用此方法防止内存泄漏
   */
  public unsubscribeBars(subscriberUID: string): void {
    console.log(
      "[unsubscribeBars]: Method call with subscriberUID:",
      subscriberUID
    );
    unsubscribeFromStream(subscriberUID);
  }
}
