import { Skeleton } from "@progress/kendo-react-indicators";
import { Card, CardBody, CardHeader } from "@progress/kendo-react-layout";

export default function NewTenantLoading() {
  return (
    <div className="max-w-3xl space-y-4">
      <Skeleton shape="rectangle" style={{ width: 220, height: 16 }} />
      <Card>
        <CardHeader>
          <Skeleton shape="text" style={{ width: 160, height: 18 }} />
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, s) => (
              <div key={s} className="space-y-3">
                <Skeleton shape="text" style={{ width: 140, height: 16 }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, f) => (
                    <div key={f} className="space-y-2">
                      <Skeleton shape="text" style={{ width: 96, height: 12 }} />
                      <Skeleton shape="rectangle" style={{ height: 32 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
