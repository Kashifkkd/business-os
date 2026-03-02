"use client";

import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { useSalesForecast } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SalesForecastPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const { data, isLoading } = useSalesForecast(orgId);
  const symbol = tenant?.currency_symbol ?? "$";

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Forecast</h1>
        <p className="text-muted-foreground text-sm">
          Weighted pipeline value and expected close by month.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total pipeline value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(data?.totalPipelineValue ?? 0, symbol)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Weighted pipeline value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(data?.weightedPipelineValue ?? 0, symbol)}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Based on deal probability
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">By stage</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Pipeline value and weighted value per stage.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Stage</th>
                      <th className="text-right py-2 font-medium">Deals</th>
                      <th className="text-right py-2 font-medium">Value</th>
                      <th className="text-right py-2 font-medium">Weighted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.byStage ?? []).map((row) => (
                      <tr key={row.stage_id} className="border-b last:border-0">
                        <td className="py-2">{row.stage_name}</td>
                        <td className="text-right tabular-nums py-2">{row.count}</td>
                        <td className="text-right tabular-nums py-2">{formatCurrency(row.value, symbol)}</td>
                        <td className="text-right tabular-nums py-2">{formatCurrency(row.weightedValue, symbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expected close by month</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Weighted value expected to close per month.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Month</th>
                      <th className="text-right py-2 font-medium">Deals</th>
                      <th className="text-right py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.expectedCloseByMonth ?? []).map((row) => (
                      <tr key={row.month} className="border-b last:border-0">
                        <td className="py-2">{row.month}</td>
                        <td className="text-right tabular-nums py-2">{row.count}</td>
                        <td className="text-right tabular-nums py-2">{formatCurrency(row.value, symbol)}</td>
                      </tr>
                    ))}
                    {(data?.expectedCloseByMonth ?? []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-muted-foreground text-sm">
                          No expected close dates set on deals.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
