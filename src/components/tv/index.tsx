"use client";
import React, { useEffect, useState } from "react";
import $ from "jquery";
import Datafeeds from "../../../public/charting_library/datafeed/mockswaptrade.js";

declare global {
  interface Window {
    TradingView: any;
    tvWidget: any;
    $: any;
    jQuery: any;
  }
}

interface TvChartProps {
  symbol?: string;
  interval?: string;
  type?: string;
}

const TvChart: React.FC<TvChartProps> = ({
  symbol = "ETH/USDT",
  interval = "5",
  type = "1",
}) => {
  const [dataParam, setDataParam] = useState<any>(null);
  const [theme, setTheme] = useState<string>("dark");

  // 设置全局jQuery和加载TradingView资源
  useEffect(() => {
    window.$ = $;
    window.jQuery = $;

    // 确保全局变量存在
    if (typeof (window as any).JSServer === "undefined") {
      (window as any).JSServer = {};
    }
    if (typeof (window as any).__initialEnabledFeaturesets === "undefined") {
      (window as any).__initialEnabledFeaturesets = ["charting_library"];
    }

    // 简化的TradingView配置
    if (typeof (window as any).TradingViewConfig === "undefined") {
      (window as any).TradingViewConfig = {
        datafeed: null,
        customFormatters: null,
        brokerFactory: null,
        tradingController: null,
      };
    }

    if (typeof (window as any).urlParams === "undefined") {
      (window as any).urlParams = {
        locale: "en",
        symbol: "ETH/USDT",
        interval: "5",
      };
    }
    if (typeof (window as any).locale === "undefined") {
      (window as any).locale = "en";
    }
    if (typeof (window as any).language === "undefined") {
      (window as any).language = "en";
    }
    if (typeof (window as any).tradingController === "undefined") {
      (window as any).tradingController = null;
    }

    // TradingView已通过charting_library.min.js加载，无需额外脚本
    console.log("TradingView ready to initialize");
  }, []);

  useEffect(() => {
    // 监听主题变化
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (dataParam) {
      getKline(dataParam);
    }
  }, [theme]);

  const getKline = (data?: any) => {
    // 检查TradingView是否加载
    console.log("TradingView对象:", window.TradingView);
    console.log("TradingView.widget:", window.TradingView?.widget);

    // 使用模拟数据，不需要真实的WebSocket连接
    const mockData = {
      a: "mock://market",
      b: data?.b || { symbol: "ETH/USDT" },
      c: null, // 模拟的stompClient
      d: data?.d || 2,
    };

    const { a, b, c, d } = mockData;
    setDataParam(mockData);
    const newDatafeed = new Datafeeds.WebsockFeed(a, b, c, d);
    console.log("k线图 数据---》", newDatafeed);

    // 添加调试：检查数据源方法
    console.log("数据源方法检查:");
    console.log("- onReady:", typeof newDatafeed.onReady);
    console.log("- resolveSymbol:", typeof newDatafeed.resolveSymbol);
    console.log("- getBars:", typeof newDatafeed.getBars);
    console.log("- subscribeBars:", typeof newDatafeed.subscribeBars);

    const config = {
      autosize: true,
      height: 800,
      symbol: symbol,
      interval: "5",
      timezone: "Asia/Shanghai",
      toolbar_bg: "#161A1E",
      container_id: "tv_chart_container",
      datafeed: newDatafeed,
      library_path: "/charting_library/",
      locale: "en",
      debug: false,
      drawings_access: {
        type: "black",
        tools: [{ name: "Regression Trend" }],
      },
      hide_top_toolbar: true,
      hide_side_toolbar: false,
      disabled_features: [
        "header_resolutions",
        "timeframes_toolbar",
        "header_symbol_search",
        "header_chart_type",
        "header_compare",
        "header_undo_redo",
        "header_screenshot",
        "header_saveload",
        "volume_force_overlay",
        "widget_logo",
        "compare_symbol",
        "display_market_status",
        "go_to_date",
        "header_interval_dialog_button",
        "legend_context_menu",
        "show_hide_button_in_legend",
        "show_interval_dialog_on_key_press",
        "snapshot_trading_drawings",
        "symbol_info",
        "edit_buttons_in_legend",
        "context_menus",
        "control_bar",
        "border_around_the_chart",
      ],
      enabled_features: ["hide_left_toolbar_by_default"],
      studies_overrides: {
        "volume.volume.color.0": "#00b275",
        "volume.volume.color.1": "#f15057",
        "volume.volume.transparency": 25,
      },
      custom_css_url: "/charting_library/static/bundles/common.css",
      supported_resolutions: [
        "1",
        "5",
        "15",
        "30",
        "60",
        "4H",
        "1D",
        "1W",
        "1M",
      ],
      charts_storage_url: "http://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user_id",
      overrides: {
        "paneProperties.background": "#161A1E",
        "paneProperties.vertGridProperties.color": "rgba(0,0,0,.1)",
        "paneProperties.horzGridProperties.color": "rgba(0,0,0,.1)",
        "scalesProperties.textColor": "#61688A",
        "mainSeriesProperties.candleStyle.upColor": "#00b275",
        "mainSeriesProperties.candleStyle.downColor": "#f15057",
        "mainSeriesProperties.candleStyle.drawBorder": false,
        "mainSeriesProperties.candleStyle.wickUpColor": "#589065",
        "mainSeriesProperties.candleStyle.wickDownColor": "#AE4E54",
        "paneProperties.legendProperties.showLegend": false,
        "mainSeriesProperties.areaStyle.color1": "rgba(71, 78, 112, 0.5)",
        "mainSeriesProperties.areaStyle.color2": "rgba(71, 78, 112, 0.5)",
        "mainSeriesProperties.areaStyle.linecolor": "#9194a4",
        volumePaneSize: "small",
      },
      time_frames: [
        {
          text: "1min",
          resolution: "1",
          description: "realtime",
          title: "realtime",
        },
        { text: "1min", resolution: "1", description: "1min" },
        { text: "5min", resolution: "5", description: "5min" },
        { text: "15min", resolution: "15", description: "15min" },
        { text: "30min", resolution: "30", description: "30min" },
        {
          text: "1hour",
          resolution: "60",
          description: "1hour",
          title: "1hour",
        },
        {
          text: "4hour",
          resolution: "240",
          description: "4hour",
          title: "4hour",
        },
        { text: "1day", resolution: "1D", description: "1day", title: "1day" },
        {
          text: "1week",
          resolution: "1W",
          description: "1week",
          title: "1week",
        },
        { text: "1mon", resolution: "1M", description: "1mon" },
      ],
    };

    // const currentTheme = localStorage.getItem("theme");
    // console.log(currentTheme);
    let currentTheme = null;
    if (currentTheme === "white" || currentTheme === null) {
      config.toolbar_bg = "#fff";
      config.custom_css_url = "/charting_library/static/bundles/common_day.css";
      config.overrides["paneProperties.background"] = "#fff";
      config.overrides["mainSeriesProperties.candleStyle.upColor"] = "#a6d3a5";
      config.overrides["mainSeriesProperties.candleStyle.downColor"] =
        "#ffa5a6";
    }

    if (window.TradingView) {
      console.log("开始创建TradingView widget...");
      console.log("配置对象:", config);

      window.tvWidget = new window.TradingView.widget(config);
      console.log("TradingView widget创建完成:", window.tvWidget);

      window.tvWidget.onChartReady(() => {
        console.log("TradingView图表准备完成!");
        const widget = window.tvWidget;

        widget.chart().executeActionById("drawingToolbarAction");

        // 添加移动平均线
        widget.chart().createStudy("Moving Average", false, false, [5], null, {
          "plot.color": "#EDEDED",
        });
        widget.chart().createStudy("Moving Average", false, false, [10], null, {
          "plot.color": "#ffe000",
        });
        widget.chart().createStudy("Moving Average", false, false, [30], null, {
          "plot.color": "#ce00ff",
        });
        widget.chart().createStudy("Moving Average", false, false, [60], null, {
          "plot.color": "#00adff",
        });

        // 创建自定义按钮
        const createButton = (
          title: string,
          resolution: string,
          chartType: number = 1,
          isSelected: boolean = false
        ) => {
          const button = widget
            .createButton()
            .attr("title", title)
            .on("click", function (this: any) {
              if ($(this).hasClass("selected")) return;
              $(this)
                .addClass("selected")
                .parent(".group")
                .siblings(".group")
                .find(".button.selected")
                .removeClass("selected");
              widget.chart().setChartType(chartType);
              widget.setSymbol("", resolution);
            })
            .append(`<span>${title}</span>`);

          if (isSelected) {
            button.addClass("selected");
          }

          return button;
        };

        createButton("Time", "1", 3);
        createButton("M1", "1");
        createButton("M5", "5", 1, true);
        createButton("M15", "15");
        createButton("M30", "30");
        createButton("H1", "60");
        createButton("H4", "240");
        createButton("D1", "1D");
      });
    }
  };

  useEffect(() => {
    // 初始化图表
    const initChart = () => {
      console.log("检查TradingView加载状态...");
      console.log("window.TradingView:", !!window.TradingView);
      console.log("window.TradingView.widget:", !!window.TradingView?.widget);

      if (window.TradingView && window.TradingView.widget) {
        console.log("TradingView已加载，开始初始化图表");
        getKline();
      } else {
        console.log("TradingView未加载，100ms后重试...");
        // 如果TradingView还没加载，等待一下再试
        setTimeout(initChart, 100);
      }
    };

    // 延迟一点时间确保DOM和脚本都加载完成
    setTimeout(initChart, 500);
  }, [symbol, interval, type]);

  return (
    <div
      id="tv_chart_container"
      style={{ width: "100%", height: "100%", margin: "auto" }}
    />
  );
};

export default TvChart;
