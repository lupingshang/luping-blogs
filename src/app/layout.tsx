"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Layout from "@/components/Layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#111417",
      paper: "#111417",
    },
    text: {
      primary: "#ffffff",
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,user-scalable=no"
        />
        <meta name="renderer" content="webkit" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // TradingView 基础全局变量
              var JSServer = {};
              var __initialEnabledFeaturesets = ["charting_library"];
              
              // 简化的配置，避免复杂的父窗口逻辑
              window.TradingViewConfig = {
                datafeed: null,
                customFormatters: null,
                brokerFactory: null,
                tradingController: null
              };
              
              // 简化的urlParams
              var urlParams = {
                locale: 'en',
                symbol: 'ETH/USDT',
                interval: '5'
              };
              
              window.locale = 'en';
              window.language = 'en';
              window.tradingController = null;
            `,
          }}
        />
        <script src="/charting_library/charting_library.min.js"></script>
        <link
          type="text/css"
          href="/charting_library/static/bundles/library.2e4e86e4539a260f4a7b69dd55f2595b.css"
          rel="stylesheet"
        />
        <link
          type="text/css"
          href="/charting_library/static/bundles/vendors.4d073557b52d805561e631f4420fc97f.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
