import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { TopBar } from "@/components/Navigation/TopBar";
import { BackgroundTasks } from "@/components/Studio/BackgroundTasks";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";

export type StudioFeature = { id: string; label: string; icon: LucideIcon };

export function StudioLayout({
  children,
  maxWidth = "max-w-3xl",
  showBackgroundTasks = true,
}: {
  children: ReactNode;
  maxWidth?: string;
  showBackgroundTasks?: boolean;
}) {
  usePrefetchRoutes();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <Sidebar />
      <div className="lg:pl-[248px]">
        <TopBar />
        <main className={`mx-auto ${maxWidth} px-4 pb-14 pt-4 lg:px-7`}>{children}</main>
      </div>
      {showBackgroundTasks && <BackgroundTasks />}
    </div>
  );
}

export default StudioLayout;
