import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "../../store/useProjectStore";
import { listPhotos, type PhotoRecord } from "../../api/photos";
import { toast } from "../../components/ui/Toast";
import EmptyState from "../../components/ui/EmptyState";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Calendar,
  Search,
} from "lucide-react";

export default function PhotoGalleryPage() {
  const currentProject = useProjectStore((state) => state.currentProject);

  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!currentProject) return;
    loadPhotos();
  }, [currentProject]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await listPhotos(currentProject!.id);
      setPhotos(data);
    } catch (err) {
      toast("Failed to load photos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((prev) =>
          prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : prev,
        );
      if (e.key === "ArrowLeft")
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev,
        );
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handler);
    };
  }, [lightboxIndex, photos]);

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Select a project to view photos."
        />
      </div>
    );
  }

  const filteredPhotos = photos.filter(
    (p) =>
      p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uploaded_by_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentPhoto =
    lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Photo Gallery
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
            {currentProject.name} — Site documentation & visual records
          </p>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="relative group w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
        <input
          type="text"
          placeholder="Search by caption or uploader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all text-[var(--color-text-primary)]"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching photos" : "No photos yet"}
          description={
            searchQuery
              ? "Try a different search."
              : "Site photos uploaded by field officers will appear here."
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="group cursor-pointer relative aspect-square rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] hover:border-[var(--color-accent-cyan)]/50 transition-all hover:shadow-lg hover:shadow-[var(--color-accent-cyan)]/5"
              onClick={() => setLightboxIndex(index)}
            >
              {photo.image ? (
                <img
                  src={photo.image}
                  alt={photo.caption}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                  <MapPin className="w-8 h-8 opacity-30" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium line-clamp-2">
                  {photo.caption}
                </p>
                <p className="text-white/60 text-[10px] mt-1">
                  {photo.uploaded_by_name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {currentPhoto && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {lightboxIndex < filteredPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {currentPhoto.image ? (
                <img
                  src={currentPhoto.image}
                  alt={currentPhoto.caption}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-[400px] h-[300px] bg-[var(--color-bg-elevated)] rounded-lg flex items-center justify-center">
                  <p className="text-[var(--color-text-muted)]">
                    Image not available
                  </p>
                </div>
              )}

              <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                <span className="font-medium text-white">
                  {currentPhoto.caption}
                </span>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {currentPhoto.uploaded_by_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(currentPhoto.created_at).toLocaleDateString()}
                </div>
                {currentPhoto.lat && currentPhoto.lon && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {currentPhoto.lat.toFixed(4)}, {currentPhoto.lon.toFixed(4)}
                  </div>
                )}
                <span className="text-white/40 text-xs ml-auto">
                  {lightboxIndex + 1} / {filteredPhotos.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
