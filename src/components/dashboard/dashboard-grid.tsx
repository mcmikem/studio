import { cn } from "@/lib/utils";

interface DashboardGridProps {
  headerContent?: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
}

export function DashboardGrid({
  headerContent,
  mainContent,
  sidebarContent,
}: DashboardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      {headerContent && <div>{headerContent}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">{mainContent}</div>
        <div className="lg:col-span-1 flex flex-col gap-6">{sidebarContent}</div>
      </div>
    </div>
  );
}
