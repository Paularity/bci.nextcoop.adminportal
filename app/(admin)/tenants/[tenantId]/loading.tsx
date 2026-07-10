import { Skeleton } from "@progress/kendo-react-indicators";
import { Card, CardBody, CardHeader } from "@progress/kendo-react-layout";

export default function TenantDetailsLoading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton shape="rectangle" style={{ width: 220, height: 16 }} />
      <div className="flex items-center justify-between">
        <Skeleton shape="text" style={{ width: 240, height: 24 }} />
        <div className="flex gap-2">
          <Skeleton shape="rectangle" style={{ width: 64, height: 32 }} />
          <Skeleton shape="rectangle" style={{ width: 96, height: 32 }} />
          <Skeleton shape="rectangle" style={{ width: 80, height: 32 }} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, c) => (
          <Card key={c}>
            <CardHeader>
              <Skeleton shape="text" style={{ width: 160, height: 18 }} />
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, r) => (
                  <div key={r} className="flex justify-between">
                    <Skeleton shape="text" style={{ width: 80, height: 12 }} />
                    <Skeleton shape="text" style={{ width: 120, height: 12 }} />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
