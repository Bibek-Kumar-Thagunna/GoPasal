export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      <span className="text-sm text-white/50">Loading...</span>
    </div>
  );
}
