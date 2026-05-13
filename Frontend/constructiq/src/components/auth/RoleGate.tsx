import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";

interface RoleGateProps {
  allow: UserRole[];
  children: React.ReactNode;
}

export default function RoleGate({ allow, children }: RoleGateProps) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allow.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
