export function AdminTableSkeleton({
  cols,
  rows = 6,
}: {
  cols: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, ri) => (
        <tr key={ri}>
          {Array.from({ length: cols }, (_, ci) => (
            <td key={ci} className="px-5 py-3.5">
              <div
                className="h-4 animate-pulse rounded-md bg-white/[0.06]"
                style={{ width: ci === 0 ? "72%" : "56%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
