import { LayoutDashboard, ChevronRight } from "lucide-react";
import Button from "../../ui/Button";
import type { PhotoRecord } from "../../../api/photos";

interface SiteRealityFeedProps {
  photos: PhotoRecord[];
  isOfficer: boolean;
  isAdmin: boolean;
  onNavigate: (path: string) => void;
}

/**
 * Renders a horizontally scrollable feed of recent site photos.
 */
export default function SiteRealityFeed({
  photos,
  isOfficer,
  isAdmin,
  onNavigate,
}: SiteRealityFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="heading-sm text-[var(--color-text-primary)] flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-[var(--color-accent-purple)]" />
          Site Reality Feed
        </h2>
        {(isOfficer || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("/field")}
            className="text-xs hover:bg-transparent hover:text-[var(--color-accent-cyan)] transition-colors"
          >
            View All Captures <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar mask-fade-right">
        {photos.length === 0 ? (
          <div className="w-full h-32 rounded-2xl bg-[var(--color-bg-interactive)] border border-dashed border-[var(--color-border-subtle)] flex items-center justify-center text-sm text-[var(--color-text-muted)] italic">
            Zero frames captured in the last 24 hours
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              className="relative min-w-[280px] h-48 rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] group shadow-lg"
            >
              <img
                loading="lazy"
                width={280}
                height={192}
                src={photo.image || ""}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={photo.caption}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-xs font-medium text-white line-clamp-1">
                  {photo.caption}
                </p>
                <p className="text-xs text-white/60 font-medium uppercase tracking-wider mt-0.5">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
