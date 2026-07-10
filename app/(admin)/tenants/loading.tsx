import { Skeleton } from "@progress/kendo-react-indicators";
import { Card } from "@progress/kendo-react-layout";

export default function TenantsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton shape="rectangle" style={{ width: 160, height: 16 }} />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton shape="text" style={{ width: 140, height: 24 }} />
          <Skeleton shape="text" style={{ width: 280, height: 14 }} />
        </div>
        <Skeleton shape="rectangle" style={{ width: 140, height: 32 }} />
      </div>

      <Card style={{ padding: 12 }}>
        <div className="flex gap-2">
          <Skeleton shape="rectangle" style={{ width: 240, height: 28, flex: 1 }} />
          <Skeleton shape="rectangle" style={{ width: 180, height: 28 }} />
          <Skeleton shape="rectangle" style={{ width: 90, height: 28 }} />
        </div>
      </Card>

      <Card>
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <Skeleton shape="text" style={{ width: 80, height: 12 }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, r) => (
                <tr key={r} className="border-t border-slate-100">
                  {Array.from({ length: 6 }).map((__, c) => (
                    <td key={c} className="px-4 py-3">
                      <Skeleton shape="text" style={{ width: 96, height: 12 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
