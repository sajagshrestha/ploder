import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";

export function InfiniteScrollTrigger({
  hasMore,
  isLoading,
  onLoadMore,
  loadedCount,
  totalCount,
}: {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loadedCount: number;
  totalCount?: number;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (loadedCount === 0) return null;
  return (
    <div ref={triggerRef} className="infinite-scroll-status" aria-live="polite">
      {isLoading ? (
        <>
          <LoaderCircle className="animate-spin" size={16} /> Loading more…
        </>
      ) : hasMore ? (
        <span>Scroll for more</span>
      ) : (
        <span>
          All {totalCount ?? loadedCount} exercises loaded
        </span>
      )}
    </div>
  );
}
