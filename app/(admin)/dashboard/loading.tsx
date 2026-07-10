import { Skeleton } from "@progress/kendo-react-indicators";
import { Card, CardBody, CardHeader } from "@progress/kendo-react-layout";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton shape="rectangle" style={{ width: 160, height: 16 }} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton shape="text" style={{ width: 160, height: 24 }} />
          <Skeleton shape="text" style={{ width: 240, height: 14 }} />
        </div>
        <div className="flex gap-2">
          <Skeleton shape="rectangle" style={{ width: 96, height: 28 }} />
          <Skeleton shape="rectangle" style={{ width: 128, height: 28 }} />
          <Skeleton shape="rectangle" style={{ width: 64, height: 28 }} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton shape="text" style={{ width: 96, height: 12 }} />
              <Skeleton shape="circle" style={{ width: 16, height: 16 }} />
            </CardHeader>
            <CardBody>
              <Skeleton shape="text" style={{ width: 60, height: 28 }} />
            </CardBody>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <Skeleton shape="text" style={{ width: 128, height: 18 }} />
          <Skeleton shape="text" style={{ width: 240, height: 12 }} />
        </CardHeader>
        <CardBody>
          <div className="flex gap-2">
            <Skeleton shape="rectangle" style={{ width: 128, height: 32 }} />
            <Skeleton shape="rectangle" style={{ width: 128, height: 32 }} />
            <Skeleton shape="rectangle" style={{ width: 128, height: 32 }} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton shape="text" style={{ width: 128, height: 18 }} />
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton shape="text" style={{ width: 160, height: 12 }} />
                  <Skeleton shape="text" style={{ width: 80, height: 10 }} />
                </div>
                <Skeleton shape="rectangle" style={{ width: 56, height: 18 }} />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
