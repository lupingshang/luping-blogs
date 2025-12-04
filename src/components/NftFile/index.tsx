import Link from "next/link";
export default function NftFile({ nfts }: any) {
  return (
    <>
      {nfts.map((nft: any) => (
        <Link href={`/nftPage?tokenId=${nft.tokenId}`}>
          <div
            key={nft.tokenId}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            {nft.image && (
              <img
                src={`https://ipfs.io/ipfs/${nft.image}`}
                alt={nft.name}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            )}
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
