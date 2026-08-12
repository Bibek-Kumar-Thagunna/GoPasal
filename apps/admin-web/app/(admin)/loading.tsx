export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        <span className="text-sm text-white/50">Loading dashboard...</span>
      </div>
    </div>
  );
}
