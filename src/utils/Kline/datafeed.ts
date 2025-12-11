//datafeed.ts
import type {
  HistoryCallback,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
  SymbolResolveExtension,
} from "public/charting_library/charting_library";
import { subscribeOnStream, unsubscribeFromStream } from "./streaming";
import {
  makeApiRequest,
  makeBinanceRequest,
  generateSymbol,
  parseFullSymbol,
  priceScale,
} from "./helpers";

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

  public unsubscribeBars(subscriberUID: string): void {
    console.log(
      "[unsubscribeBars]: Method call with subscriberUID:",
      subscriberUID
    );
    unsubscribeFromStream(subscriberUID);
  }
}
