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

  // 🔧 【全局环境配置】- 设置TradingView运行所需的全局变量和jQuery
  useEffect(() => {
    window.$ = $; // 🔗 设置全局jQuery对象
    window.jQuery = $; // 🔗 设置全局jQuery别名

    // 🌐 【TradingView全局变量检查和设置】
    if (typeof (window as any).JSServer === "undefined") {
      (window as any).JSServer = {}; // 🖥️ TradingView服务器配置对象
    }
    if (typeof (window as any).__initialEnabledFeaturesets === "undefined") {
      (window as any).__initialEnabledFeaturesets = ["charting_library"]; // ✅ 启用的功能集
    }

    // 🎯 【TradingView配置对象】- 简化的配置避免复杂依赖
    if (typeof (window as any).TradingViewConfig === "undefined") {
      (window as any).TradingViewConfig = {
        datafeed: null, // 📊 数据源工厂
        customFormatters: null, // 🎨 自定义格式化器
        brokerFactory: null, // 🏦 经纪商工厂
        tradingController: null, // 🎮 交易控制器
      };
    }

    // 🌐 【URL参数配置】- 模拟URL参数传递
    if (typeof (window as any).urlParams === "undefined") {
      (window as any).urlParams = {
        locale: "en", // 🌍 语言设置
        symbol: "ETH/USDT", // 💰 默认交易对
        interval: "5", // ⏰ 默认时间间隔
      };
    }

    // 🌍 【语言和地区设置】
    if (typeof (window as any).locale === "undefined") {
      (window as any).locale = "en"; // 🌐 界面语言
    }
    if (typeof (window as any).language === "undefined") {
      (window as any).language = "en"; // 🌐 语言代码
    }
    if (typeof (window as any).tradingController === "undefined") {
      (window as any).tradingController = null; // 🎮 交易控制器实例
    }

    // ✅ 【初始化完成日志】
    console.log("🚀 TradingView环境配置完成，准备初始化图表");
  }, []);

  // 🎨 【主题监听】- 监听本地存储中的主题变化
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme); // 🌓 更新组件主题状态
    }
  }, []);

  // 🔄 【主题变化响应】- 当主题改变时重新渲染图表
  useEffect(() => {
    if (dataParam) {
      getKline(dataParam); // 🎨 使用新主题重新初始化图表
    }
  }, [theme]);

  const getKline = (data?: any) => {
    // 🔍 【TradingView加载状态检查】
    console.log("🎯 TradingView对象:", window.TradingView);
    console.log("🎯 TradingView.widget:", window.TradingView?.widget);

    // 🔧 【数据源配置】- 创建模拟数据源参数
    const mockData = {
      a: "mock://market", // 📡 模拟API地址
      b: data?.b || { symbol: "ETH/USDT" }, // 💰 交易对信息
      c: null, // 🔌 WebSocket连接对象（这里为模拟）
      d: data?.d || 2, // 🎯 价格精度设置
    };

    const { a, b, c, d } = mockData;
    setDataParam(mockData);

    // 🏭 【数据源实例】- 创建TradingView数据源适配器
    const newDatafeed = new Datafeeds.WebsockFeed(a, b, c, d);
    console.log("📊 k线图数据源 ---》", newDatafeed);

    // 🔍 【数据源方法验证】- 确保所有必需方法存在
    console.log("📋 数据源方法检查:");
    console.log("- onReady:", typeof newDatafeed.onReady);
    console.log("- resolveSymbol:", typeof newDatafeed.resolveSymbol);
    console.log("- getBars:", typeof newDatafeed.getBars);
    console.log("- subscribeBars:", typeof newDatafeed.subscribeBars);

    // 🎨 【TradingView核心配置对象】
    const config = {
      // 📐 【基础布局配置】
      autosize: true, // 🔄 自动调整大小以适应容器
      height: 800, // 📏 图表固定高度（像素）

      // 📊 【交易数据配置】
      symbol: symbol, // 💱 当前显示的交易对符号
      interval: "5", // ⏰ 默认时间间隔（5分钟）
      timezone: "Asia/Shanghai", // 🌏 时区设置

      // 🎯 【核心功能配置】
      container_id: "tv_chart_container", // 🏠 DOM容器元素ID
      datafeed: newDatafeed, // 📈 数据源对象（提供K线数据）
      library_path: "/charting_library/", // 📚 TradingView库文件路径
      locale: "en", // 🌐 界面语言设置
      debug: false, // 🐛 调试模式开关

      // 🎨 【UI外观配置】
      toolbar_bg: "#161A1E", // 🎨 工具栏背景色（深色主题）

      // 🎭 【绘图工具配置】
      drawings_access: {
        type: "black", // 🖊️ 绘图工具类型
        tools: [{ name: "Regression Trend" }], // 📐 可用绘图工具列表
      },

      // 👁️【界面显示控制】
      hide_top_toolbar: false, // 👀 显示顶部工具栏以显示时间周期按钮
      hide_side_toolbar: false, // 👀 显示侧边工具栏
      // ❌ 【功能禁用列表】- 隐藏不需要的UI元素
      disabled_features: [
        // "header_resolutions", // 🚫 禁用头部时间周期选择器 - 注释掉以显示自定义按钮
        // "timeframes_toolbar", // 🚫 禁用时间框架工具栏 - 注释掉以显示自定义按钮
        "header_symbol_search", // 🚫 禁用头部交易对搜索
        "header_chart_type", // 🚫 禁用头部图表类型选择
        "header_compare", // 🚫 禁用头部比较功能
        "header_undo_redo", // 🚫 禁用头部撤销/重做按钮
        "header_screenshot", // 🚫 禁用头部截图功能
        "header_saveload", // 🚫 禁用头部保存/加载功能
        "volume_force_overlay", // 🚫 禁用成交量强制覆盖
        "widget_logo", // 🚫 禁用TradingView logo
        "compare_symbol", // 🚫 禁用交易对比较功能
        "display_market_status", // 🚫 禁用市场状态显示
        "go_to_date", // 🚫 禁用跳转到日期功能
        "header_interval_dialog_button", // 🚫 禁用头部时间间隔对话框按钮
        "legend_context_menu", // 🚫 禁用图例右键菜单
        "show_hide_button_in_legend", // 🚫 禁用图例中的显示/隐藏按钮
        "show_interval_dialog_on_key_press", // 🚫 禁用按键显示时间间隔对话框
        "snapshot_trading_drawings", // 🚫 禁用交易绘图快照
        "symbol_info", // 🚫 禁用交易对信息
        "edit_buttons_in_legend", // 🚫 禁用图例中的编辑按钮
        "context_menus", // 🚫 禁用右键上下文菜单
        "control_bar", // 🚫 禁用控制栏
        "border_around_the_chart", // 🚫 禁用图表周围边框
      ],

      // ✅ 【功能启用列表】- 启用特定功能
      enabled_features: ["hide_left_toolbar_by_default"], // ✅ 默认隐藏左侧工具栏

      // 📊 【技术指标样式配置】
      studies_overrides: {
        "volume.volume.color.0": "#00b275", // 📈 成交量上涨颜色（绿色）
        "volume.volume.color.1": "#f15057", // 📉 成交量下跌颜色（红色）
        "volume.volume.transparency": 25, // 🌫️ 成交量透明度
      },

      // 🎨 【CSS样式文件配置】
      custom_css_url: "/charting_library/static/bundles/common.css", // 🎨 自定义CSS文件路径
      // ⏰ 【时间周期支持配置】
      supported_resolutions: [
        "1", // 1分钟
        "5", // 5分钟
        "15", // 15分钟
        "30", // 30分钟
        "60", // 1小时
        "4H", // 4小时
        "1D", // 1天
        "1W", // 1周
        "1M", // 1月
      ],

      // 💾 【数据存储配置】
      charts_storage_url: "http://saveload.tradingview.com", // 💾 图表保存服务URL
      charts_storage_api_version: "1.1", // 📋 存储API版本
      client_id: "tradingview.com", // 🆔 客户端标识
      user_id: "public_user_id", // 👤 用户标识
      // 🎨 【图表样式覆盖配置】- 自定义图表外观
      overrides: {
        // 🏠 【背景和网格配置】
        "paneProperties.background": "#161A1E", // 🌃 图表背景色（深色）
        "paneProperties.vertGridProperties.color": "rgba(0,0,0,.1)", // 📏 垂直网格线颜色
        "paneProperties.horzGridProperties.color": "rgba(0,0,0,.1)", // 📏 水平网格线颜色

        // 📊 【刻度和文字配置】
        "scalesProperties.textColor": "#61688A", // 🔤 刻度文字颜色

        // 🕯️ 【K线蜡烛图配置】
        "mainSeriesProperties.candleStyle.upColor": "#00b275", // 📈 上涨蜡烛颜色（绿色）
        "mainSeriesProperties.candleStyle.downColor": "#f15057", // 📉 下跌蜡烛颜色（红色）
        "mainSeriesProperties.candleStyle.drawBorder": false, // 🚫 不绘制蜡烛边框
        "mainSeriesProperties.candleStyle.wickUpColor": "#589065", // 📈 上涨影线颜色
        "mainSeriesProperties.candleStyle.wickDownColor": "#AE4E54", // 📉 下跌影线颜色

        // 📋 【图例配置】
        "paneProperties.legendProperties.showLegend": false, // 🙈 隐藏图例

        // 📊 【面积图配置】
        "mainSeriesProperties.areaStyle.color1": "rgba(71, 78, 112, 0.5)", // 🎨 面积图颜色1
        "mainSeriesProperties.areaStyle.color2": "rgba(71, 78, 112, 0.5)", // 🎨 面积图颜色2
        "mainSeriesProperties.areaStyle.linecolor": "#9194a4", // 📏 面积图线条颜色

        // 📊 【成交量面板配置】
        volumePaneSize: "small", // 📏 成交量面板大小
      },
      // ⏰ 【时间框架配置】- 快速时间切换按钮
      time_frames: [
        {
          text: "1min", // 🏷️ 按钮显示文字
          resolution: "1", // ⏰ 对应的时间分辨率
          description: "realtime", // 📝 描述信息
          title: "realtime", // 🏷️ 标题
        },
        { text: "1min", resolution: "1", description: "1min" }, // 1分钟
        { text: "5min", resolution: "5", description: "5min" }, // 5分钟
        { text: "15min", resolution: "15", description: "15min" }, // 15分钟
        { text: "30min", resolution: "30", description: "30min" }, // 30分钟
        {
          text: "1hour",
          resolution: "60",
          description: "1hour",
          title: "1hour",
        }, // 1小时
        {
          text: "4hour",
          resolution: "240",
          description: "4hour",
          title: "4hour",
        }, // 4小时
        { text: "1day", resolution: "1D", description: "1day", title: "1day" }, // 1天
        {
          text: "1week",
          resolution: "1W",
          description: "1week",
          title: "1week",
        }, // 1周
        { text: "1mon", resolution: "1M", description: "1mon" }, // 1月
      ],
    };

    // 🌓 【主题切换逻辑】- 根据本地存储的主题设置调整样式
    // const currentTheme = localStorage.getItem("theme");
    // console.log("📱 当前主题:", currentTheme);
    let currentTheme = null; // 🌙 强制使用深色主题

    if (currentTheme === "white" || currentTheme === null) {
      // ☀️ 【日间主题配置】
      config.toolbar_bg = "#fff"; // ⚪ 白色工具栏背景
      config.custom_css_url = "/charting_library/static/bundles/common_day.css"; // ☀️ 日间主题CSS
      config.overrides["paneProperties.background"] = "#fff"; // ⚪ 白色图表背景
      config.overrides["mainSeriesProperties.candleStyle.upColor"] = "#a6d3a5"; // 📈 日间上涨颜色
      config.overrides["mainSeriesProperties.candleStyle.downColor"] =
        "#ffa5a6"; // 📉 日间下跌颜色
    }

    // 🚀 【TradingView Widget初始化】
    if (window.TradingView) {
      console.log("🎯 开始创建TradingView Widget...");
      console.log("📋 配置对象:", config);

      window.tvWidget = new window.TradingView.widget(config);
      console.log("✅ TradingView widget创建完成:", window.tvWidget);

      // 📈 【图表就绪回调】- 图表加载完成后执行的操作
      window.tvWidget.onChartReady(() => {
        console.log("✅ TradingView图表已就绪！");
        const widget = window.tvWidget;

        // 🖊️ 【激活绘图工具】
        widget.chart().executeActionById("drawingToolbarAction");

        // 📊 【添加技术指标 - 移动平均线】
        console.log("📊 添加移动平均线指标...");
        widget.chart().createStudy("Moving Average", false, false, [5], null, {
          "plot.color": "#EDEDED", // 🎨 MA5线条颜色（浅灰）
        });
        widget.chart().createStudy("Moving Average", false, false, [10], null, {
          "plot.color": "#ffe000", // 🎨 MA10线条颜色（黄色）
        });
        widget.chart().createStudy("Moving Average", false, false, [30], null, {
          "plot.color": "#ce00ff", // 🎨 MA30线条颜色（紫色）
        });
        widget.chart().createStudy("Moving Average", false, false, [60], null, {
          "plot.color": "#00adff", // 🎨 MA60线条颜色（蓝色）
        });

        // 🔘 【自定义时间周期按钮创建函数】
        const createButton = (
          title: string, // 🏷️ 按钮标题
          resolution: string, // ⏰ 时间分辨率
          chartType: number = 1, // 📊 图表类型（1=蜡烛图，3=线图）
          isSelected: boolean = false // ✅ 是否默认选中
        ) => {
          const button = widget
            .createButton() // 🔘 创建按钮
            .attr("title", title) // 🏷️ 设置按钮标题
            .on("click", function (this: any) {
              // 🖱️ 点击事件处理
              // 🔄 【按钮状态切换逻辑】
              if ($(this).hasClass("selected")) return; // 如果已选中则返回

              // 🎯 【更新按钮选中状态】
              $(this)
                .addClass("selected") // ✅ 添加选中样式
                .parent(".group") // 🔍 找到父级分组
                .siblings(".group") // 🔍 找到兄弟分组
                .find(".button.selected") // 🔍 找到其他选中按钮
                .removeClass("selected"); // ❌ 移除其他按钮选中状态

              // 📊 【切换图表类型和时间周期】
              widget.chart().setChartType(chartType); // 🎨 设置图表类型
              widget.setSymbol("", resolution); // ⏰ 设置时间分辨率
            })
            .append(`<span>${title}</span>`); // 📝 添加按钮文字

          // ✅ 【设置默认选中状态】
          if (isSelected) {
            button.addClass("selected");
          }

          return button;
        };

        // 🔘 【创建时间周期按钮组】
        console.log("🔘 创建自定义时间周期按钮...");
        createButton("Time", "1", 3); // 📈 实时线图
        createButton("M1", "1"); // 📊 1分钟K线
        createButton("M5", "5", 1, true); // 📊 5分钟K线（默认选中）
        createButton("M15", "15"); // 📊 15分钟K线
        createButton("M30", "30"); // 📊 30分钟K线
        createButton("H1", "60"); // 📊 1小时K线
        createButton("H4", "240"); // 📊 4小时K线
        createButton("D1", "1D"); // 📊 1天K线
      });
    } else {
      console.error("❌ TradingView库未加载！");
    }
  };

  // 🚀 【图表初始化】- 组件挂载后初始化TradingView图表
  useEffect(() => {
    const initChart = () => {
      console.log("🔍 检查TradingView加载状态...");
      console.log("📊 window.TradingView:", !!window.TradingView);
      console.log(
        "🏗️ window.TradingView.widget:",
        !!window.TradingView?.widget
      );

      // ✅ 【加载状态验证】- 确保TradingView库完全加载
      if (window.TradingView && window.TradingView.widget) {
        console.log("✅ TradingView已加载，开始初始化图表");
        getKline(); // 🎯 开始创建图表
      } else {
        console.log("⏳ TradingView未加载，100ms后重试...");
        setTimeout(initChart, 100); // 🔄 延迟重试直到库加载完成
      }
    };

    // ⏰ 【延迟初始化】- 确保DOM和脚本都完全加载
    setTimeout(initChart, 500); // 🕐 延迟500ms确保环境就绪
  }, [symbol, interval, type]); // 📊 当交易对或时间间隔变化时重新初始化

  return (
    // 🏠 【图表容器】- TradingView图表的DOM挂载点
    <div
      id="tv_chart_container" // 🆔 容器ID，必须与config中的container_id一致
      style={{
        width: "100%", // 📏 宽度占满父容器
        height: "100%", // 📏 高度占满父容器
        margin: "auto", // 🎯 居中对齐
      }}
    />
  );
};

export default TvChart;
