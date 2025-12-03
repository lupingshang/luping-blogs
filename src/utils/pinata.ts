import { PinataSDK } from "pinata";

// 从环境变量读取配置
const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

if (!pinataJwt || !pinataGateway) {
  throw new Error(
    "Pinata 配置缺失，请检查环境变量 NEXT_PUBLIC_PINATA_JWT 和 NEXT_PUBLIC_PINATA_GATEWAY"
  );
}

// 初始化 Pinata SDK
const pinata = new PinataSDK({
  pinataJwt,
  pinataGateway,
});

// 1. 上传图片到 Pinata
export async function uploadImageToPinata(file: File): Promise<string> {
  try {
    const upload = await pinata.upload.public.file(file);
    return upload.cid;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

// 2. 上传 JSON 数据到 Pinata
export async function uploadJsonToPinata(jsonData: object): Promise<string> {
  try {
    const upload = await pinata.upload.public.json(jsonData);
    return upload.cid;
  } catch (error) {
    console.error("Error uploading JSON:", error);
    throw error;
  }
}

// 3. 获取 JSON 数据
export async function getJsonFromPinata(cid: string): Promise<any> {
  try {
    const data = await pinata.gateways.public.get(cid);
    return data.data;
  } catch (error) {
    console.error("Error fetching JSON:", error);
    throw error;
  }
}

// 4. 获取图片 URL（可直接用于 img 标签）
export async function getImageUrl(cid: string): Promise<string> {
  // 使用公共 IPFS 网关，可以访问任何 CID
  //公共关 TODO 只有这个可以用
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
  //Cloudflare 网关
  //return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  //IPFS 官方网关
  //return `https://ipfs.io/ipfs/${cid}`;
  //私有网关
  //   return `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${cid}`;
}
