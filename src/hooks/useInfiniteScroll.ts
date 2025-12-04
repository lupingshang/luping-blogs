import { useState, useEffect } from "react";

export function useInfiniteScroll<T>(
  items: T[],
  initialCount: number = 10,
  loadMoreCount: number = 10
) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 100 && !isLoading) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayCount, isLoading, items.length]);

  const loadMore = () => {
    if (displayCount >= items.length) return;

    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + loadMoreCount, items.length));
      setIsLoading(false);
    }, 300);
  };

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  return {
    displayedItems,
    isLoading,
    hasMore,
    displayCount,
    totalCount: items.length,
  };
}
