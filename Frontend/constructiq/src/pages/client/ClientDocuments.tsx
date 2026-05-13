import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuthStore } from "../../store/useAuthStore";
import { listDocuments, downloadDocument } from "../../api/documents";
import type { DocumentRecord } from "../../api/documents";
import { toast } from "../../components/ui/Toast";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import FocusView from "../../components/layout/FocusView";
import DocumentUploadForm from "../../components/documents/DocumentUploadForm";
import {
  FileText,
  Download,
  Search,
  File,
  Image,
  FileSpreadsheet,
  FileCode,
  FolderArchive,
  Plus,
} from "lucide-react";

type FilterTab = "ALL" | string;

export default function ClientDocuments() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDocUploadOpen, setDocUploadOpen] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!currentProject) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await listDocuments(String(currentProject.id));
      setDocuments((data || []).filter((d: DocumentRecord) => d.is_current));
    } catch (error) {
      console.error("Failed to load documents", error);
      toast("Failed to load blueprint registry.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDownload = async (doc: DocumentRecord) => {
    setDownloadingId(String(doc.id));
    try {
      await downloadDocument(String(doc.id), doc.title);
      toast("Document downloaded successfully.", "success");
    } catch (err: unknown) {
      console.error("Download failed:", err);
      toast("Failed to download document.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Use the project selector in the top bar to view documents."
        />
      </div>
    );
  }

  const fileTypes = Array.from(new Set(documents.map((d) => d.file_type)));

  const filteredDocs = documents
    .filter((doc) => activeFilter === "ALL" || doc.file_type === activeFilter)
    .filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (["pdf", "doc", "docx"].includes(type))
      return <FileText className="w-5 h-5 text-[var(--color-accent-red)]" />;
    if (["jpg", "jpeg", "png", "svg", "webp"].includes(type))
      return <Image className="w-5 h-5 text-[var(--color-accent-emerald)]" />;
    if (["xls", "xlsx", "csv"].includes(type))
      return (
        <FileSpreadsheet className="w-5 h-5 text-[var(--color-accent-emerald)]" />
      );
    if (["dwg", "dxf", "ifc"].includes(type))
      return <FileCode className="w-5 h-5 text-[var(--color-accent-blue)]" />;
    if (["zip", "rar", "7z"].includes(type))
      return (
        <FolderArchive className="w-5 h-5 text-[var(--color-accent-amber)]" />
      );
    return <File className="w-5 h-5 text-[var(--color-text-muted)]" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Project Documents
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
            {currentProject.name} — Blueprints, permits, contracts, and
            specifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-muted)] mr-2">
            <FolderArchive className="w-4 h-4" />
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </div>
          {user?.role !== "CLIENT" && (
            <Button
              variant="primary"
              onClick={() => setDocUploadOpen(true)}
              className="flex-none w-full sm:w-auto mt-2 md:mt-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {fileTypes.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full scrollbar-hide">
            {["ALL", ...fileTypes].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`flex-1 text-center shrink-0 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] whitespace-nowrap transition-colors
                ${
                  activeFilter === type
                    ? "bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)]"
                }
              `}
              >
                {type}
                {type !== "ALL" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({documents.filter((d) => d.file_type === type).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader type="card" count={3} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title={
            searchQuery || activeFilter !== "ALL"
              ? "No matching documents"
              : "No documents available"
          }
          description={
            searchQuery || activeFilter !== "ALL"
              ? "Try adjusting your filters or search terms."
              : "Documents will appear here when the project team uploads them."
          }
        />
      ) : (
        <Card variant="surface" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Document
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Version
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)] text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[var(--color-bg-interactive)] transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type)}
                        <span className="font-medium text-[var(--color-text-primary)] text-sm group-hover:text-[var(--color-accent-cyan)] transition-colors">
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={doc.file_type} />
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)] font-mono">
                      v{doc.version}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)]">
                      {doc.uploaded_by_email}
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === String(doc.id)}
                      >
                        <Download
                          className={`w-4 h-4 ${downloadingId === String(doc.id) ? "animate-pulse" : ""}`}
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <FocusView
        isOpen={isDocUploadOpen}
        onClose={() => setDocUploadOpen(false)}
        title="Upload Document"
      >
        <DocumentUploadForm
          projectId={currentProject.id}
          onSuccess={() => {
            setDocUploadOpen(false);
            fetchDocs();
          }}
          onCancel={() => setDocUploadOpen(false)}
        />
      </FocusView>
    </div>
  );
}
