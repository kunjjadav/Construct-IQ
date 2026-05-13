
type SkeletonType = "card" | "table-row" | "text";

interface SkeletonLoaderProps {
  type?: SkeletonType;
  count?: number; // How many to render in a list
}

export default function SkeletonLoader({
  type = "text",
  count = 1,
}: SkeletonLoaderProps) {
  const elements = Array.from({ length: count });

  if (type === "card") {
    return (
      <div className="flex flex-col gap-4">
        {elements.map((_, i) => (
          <div
            key={i}
            className="w-full h-32 rounded-[var(--radius-xl)] bg-[var(--color-bg-surface)] animate-pulse border border-[var(--color-border-subtle)]"
          />
        ))}
      </div>
    );
  }

  if (type === "table-row") {
    return (
      <div className="flex flex-col gap-2 w-full mt-2">
        {elements.map((_, i) => (
          <div
            key={i}
            className="flex gap-4 w-full h-12 rounded-[var(--radius-md)] bg-[var(--color-bg-interactive)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {elements.map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] animate-pulse"
          style={{ width: `${40 + ((i * 37) % 41)}%` }}
        />
      ))}
    </div>
  );
}
