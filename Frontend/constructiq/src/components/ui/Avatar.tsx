import { useState } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({
  src,
  name = "Unknown",
  size = "md",
  className = "",
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = src && !imgFailed;

  return (
    <div
      className={`
        ${sizeMap[size]}
        ${className}
        inline-flex items-center justify-center shrink-0
        rounded-[var(--radius-full)] overflow-hidden
        bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]
        select-none
      `}
      title={name} // Shows full name on mouse hover
    >
      {showImage ? (
        <img
          src={src}
          alt={`Avatar of ${name}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgFailed(true)} // Instantly fallback to initials on 404
        />
      ) : (
        <span className="font-medium text-[var(--color-text-secondary)]">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
