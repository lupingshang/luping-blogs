// helpers.ts
export async function makeApiRequest(path: string) {
  try {
    console.log("makeApiRequest", path);
    const url = new URL(`https://min-api.cryptocompare.com/${path}`);
    // 在 Next.js 中使用 process.env
    const apiKey =
      process.env.NEXT_PUBLIC_VITE_API_KEY || process.env.VITE_API_KEY;
    if (apiKey) {
      url.searchParams.append("api_key", apiKey);
    }
    const response = await fetch(url.toString());
    return response.json();
  } catch (error) {
    throw new Error(`CryptoCompare request error: ${error}`);
  }
}

export async function makeBinanceRequest(path: string) {
  try {
    console.log("makeBinanceRequest", path);
    const response = await fetch(`https://api.binance.com/${path}`);
    return response.json();
  } catch (error) {
    throw new Error(`[Binance] request error: ${error}`);
  }
}

export function generateSymbol(
  exchange: string,
  fromSymbol: string,
  toSymbol: any
) {
  const short = `${fromSymbol}/${toSymbol}`;
  return {
    short,
    full: `${exchange}:${short}`,
  };
}

export function parseFullSymbol(fullSymbol: string) {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }
  return { exchange: match[1], symbol: `${match[2]}${match[3]}` };
}

export function priceScale(tickSize: string | number) {
  if (Number(tickSize) >= 1) {
    return Math.pow(10, Number(tickSize));
  } else {
    return Math.round(1 / parseFloat(String(tickSize)));
  }
}
