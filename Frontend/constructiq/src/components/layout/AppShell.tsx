
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useProjectStore } from "../../store/useProjectStore";
import { listProjects } from "../../api/projects";
import OfflineBanner from "../pwa/OfflineBanner";
import InstallPrompt from "../pwa/InstallPrompt";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { projects, setProjects, setCurrentProject, currentProject } =
    useProjectStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects(signal: AbortSignal) {
      if (projects.length === 0) {
        try {
          const fetched = await listProjects(signal);
          if (signal.aborted) return;

          setProjects(fetched);

          const lastId = localStorage.getItem("constructiq_last_project");
          if (lastId && !currentProject && fetched.length > 0) {
            const lastProj = fetched.find((p) => String(p.id) === lastId);
            if (lastProj) setCurrentProject(lastProj);
          }
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            (err.name === "CanceledError" || err.name === "AbortError")
          )
            return;
          console.error("AppShell unable to load global project context:", err);
        }
      }
    }
    loadProjects(controller.signal);

    return () => controller.abort();
  }, [projects.length, currentProject, setProjects, setCurrentProject]); // run once on mount

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg-app)] text-[var(--color-text-primary)] overflow-hidden">
      <OfflineBanner />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="flex flex-col flex-1 w-full overflow-hidden min-w-0">
          <TopBar
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg-app)] relative">
            <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8 h-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
