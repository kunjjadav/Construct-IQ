import Card from "../../ui/Card";
import { ShieldCheck } from "lucide-react";

/**
 * Display card for Enterprise Guard active status.
 */
export default function SecurityCard() {
  return (
    <Card
      variant="interactive"
      padding="md"
      className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)]/20 flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-extrabold text-[var(--color-text-primary)]">
            Enterprise Guard
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] leading-tight">
            Security protections are active.
          </p>
        </div>
      </div>
    </Card>
  );
}
