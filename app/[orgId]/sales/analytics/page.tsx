"use client";

import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { useSalesAnalytics } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SalesAnalyticsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const { data, isLoading } = useSalesAnalytics(orgId);
  const symbol = tenant?.currency_symbol ?? "$";

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Win rate, deal value, and trends.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {data?.winRate != null ? `${Math.round(data.winRate)}%` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Loss rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
                  {data?.lossRate != null ? `${Math.round(data.lossRate)}%` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg deal value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(data?.avgDealValue ?? 0, symbol)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total won value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(data?.totalWonValue ?? 0, symbol)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deals created by month</CardTitle>
                <p className="text-muted-foreground text-sm font-normal">
                  New deals and total value per month.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Month</th>
                        <th className="text-right py-2 font-medium">Count</th>
                        <th className="text-right py-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.dealsCreatedByMonth ?? []).map((row) => (
                        <tr key={row.month} className="border-b last:border-0">
                          <td className="py-2">{row.month}</td>
                          <td className="text-right tabular-nums py-2">{row.count}</td>
                          <td className="text-right tabular-nums py-2">{formatCurrency(row.value, symbol)}</td>
                        </tr>
                      ))}
                      {(data?.dealsCreatedByMonth ?? []).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground text-sm">
                            No data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deals closed by month</CardTitle>
                <p className="text-muted-foreground text-sm font-normal">
                  Won vs lost and won value per month.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Month</th>
                        <th className="text-right py-2 font-medium">Won</th>
                        <th className="text-right py-2 font-medium">Lost</th>
                        <th className="text-right py-2 font-medium">Won value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.dealsClosedByMonth ?? []).map((row) => (
                        <tr key={row.month} className="border-b last:border-0">
                          <td className="py-2">{row.month}</td>
                          <td className="text-right tabular-nums py-2">{row.won}</td>
                          <td className="text-right tabular-nums py-2">{row.lost}</td>
                          <td className="text-right tabular-nums py-2 text-green-600 dark:text-green-400">
                            {formatCurrency(row.wonValue, symbol)}
                          </td>
                        </tr>
                      ))}
                      {(data?.dealsClosedByMonth ?? []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                            No closed deals yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
