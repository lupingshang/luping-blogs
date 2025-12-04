import Link from "next/link";
import { useState, useEffect } from "react";

function NftImage({ nft }: any) {
  const [imageSrc, setImageSrc] = useState(
    `https://ipfs.io/ipfs/${nft.thumImage}`
  );
  const [isHighRes, setIsHighRes] = useState(false);

  useEffect(() => {
    // 预加载原图
    const img = new Image();
    img.src = `https://ipfs.io/ipfs/${nft.image}`;
    img.onload = () => {
      console.log("原图加载完成");
      setImageSrc(img.src);
      setIsHighRes(true);
    };
  }, [nft.image]);

  return (
    <img
      src={imageSrc}
      alt={nft.name}
      style={{
        width: "100%",
        height: "200px",
        objectFit: "cover",
        borderRadius: "4px",
        filter: isHighRes ? "none" : "blur(2px)",
        transition: "filter 0.3s ease-in-out",
      }}
    />
  );
}

export default function NftFile({ nfts }: any) {
  return (
    <>
      {nfts.map((nft: any) => (
        <Link key={nft.tokenId} href={`/nftPage?tokenId=${nft.tokenId}`}>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            {nft.image && <NftImage nft={nft} />}
            <h3>Name:{nft.name}</h3>
            <p>{nft.description}</p>
            <p>
              <strong>Price:</strong> {nft.price} ETH
            </p>
            <p>
              <strong>Token ID:</strong> {nft.tokenId}
            </p>
            <p>
              <strong>Status:</strong>
              {nft.currentlyListed ? "Listed" : "Not Listed"}
            </p>
          </div>
        </Link>
      ))}
    </>
  );
}
