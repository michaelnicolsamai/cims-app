"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  CreditCard,
  MapPin,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format, subMonths } from "date-fns";

type ReportType =
  | "sales_summary"
  | "sales_detailed"
  | "customer_analysis"
  | "product_performance"
  | "financial_summary"
  | "payment_analysis"
  | "regional_sales";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const reportTypes: ReportOption[] = [
  {
    id: "sales_summary",
    title: "Sales Summary",
    description: "Overview of sales performance with daily breakdown",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "sales_detailed",
    title: "Sales Detailed",
    description: "Complete list of all sales transactions",
    icon: FileText,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "customer_analysis",
    title: "Customer Analysis",
    description: "Customer segments and performance analysis",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "product_performance",
    title: "Product Performance",
    description: "Best selling products and performance metrics",
    icon: Package,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "financial_summary",
    title: "Financial Summary",
    description: "Revenue, payments, and financial overview",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "payment_analysis",
    title: "Payment Analysis",
    description: "Payment methods and status breakdown",
    icon: CreditCard,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "regional_sales",
    title: "Regional Sales",
    description: "Sales breakdown by region and location",
    icon: MapPin,
    color: "bg-pink-100 text-pink-600",
  },
];

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      setError("Please select a report type");
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const params = new URLSearchParams({
        type: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setReportData(data);
      } else {
        setError(data.error || "Failed to generate report");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    // Convert report data to JSON for export
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReport}_${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const quickDateRanges = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "Last Year", days: 365 },
  ];

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate comprehensive business reports and analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Date Range Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {quickDateRanges.map((range) => (
                  <Button
                    key={range.days}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDateRange(range.days)}
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Report Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                const isSelected = selectedReport === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${report.color} flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedReport || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {!reportData && !loading && !error && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Report Generated
                </h3>
                <p className="text-gray-600">
                  Select a report type and date range, then click "Generate
                  Report" to view your data.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Generating report...</p>
              </CardContent>
            </Card>
          )}

          {reportData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900">
                      {
                        reportTypes.find((r) => r.id === selectedReport)
                          ?.title
                      }
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(
                        new Date(reportData.dateRange.start),
                        "MMM dd, yyyy"
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(reportData.dateRange.end),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ReportDisplay data={reportData} type={selectedReport!} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportDisplay({
  data,
  type,
}: {
  data: any;
  type: ReportType;
}) {
  switch (type) {
    case "sales_summary":
      return <SalesSummaryDisplay data={data.data} />;
    case "sales_detailed":
      return <SalesDetailedDisplay data={data.data} />;
    case "customer_analysis":
      return <CustomerAnalysisDisplay data={data.data} />;
    case "product_performance":
      return <ProductPerformanceDisplay data={data.data} />;
    case "financial_summary":
      return <FinancialSummaryDisplay data={data.data} />;
    case "payment_analysis":
      return <PaymentAnalysisDisplay data={data.data} />;
    case "regional_sales":
      return <RegionalSalesDisplay data={data.data} />;
    default:
      return <div>Unknown report type</div>;
  }
}

function SalesSummaryDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.summary.totalSales}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg. Order Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.averageOrderValue)}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Discounts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalDiscounts)}
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Date</th>
                <th className="text-right py-2 px-4">Revenue</th>
                <th className="text-right py-2 px-4">Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyBreakdown.map((day: any) => (
                <tr key={day.date} className="border-b border-gray-100">
                  <td className="py-2 px-4">{format(new Date(day.date), "MMM dd, yyyy")}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(day.revenue)}
                  </td>
                  <td className="text-right py-2 px-4">{day.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SalesDetailedDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {data.sales.length} sales transactions
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4">Invoice</th>
              <th className="text-left py-2 px-4">Date</th>
              <th className="text-left py-2 px-4">Customer</th>
              <th className="text-right py-2 px-4">Amount</th>
              <th className="text-left py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.slice(0, 50).map((sale: any) => (
              <tr key={sale.invoiceNumber} className="border-b border-gray-100">
                <td className="py-2 px-4 font-mono">{sale.invoiceNumber}</td>
                <td className="py-2 px-4">
                  {format(new Date(sale.date), "MMM dd, yyyy")}
                </td>
                <td className="py-2 px-4">{sale.customer}</td>
                <td className="text-right py-2 px-4">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "SLL",
                    minimumFractionDigits: 0,
                  }).format(sale.totalAmount)}
                </td>
                <td className="py-2 px-4">{sale.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerAnalysisDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Customer Segments</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.segments.map((segment: any) => (
            <div key={segment.segment} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{segment.segment}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {segment.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "SLL",
                  minimumFractionDigits: 0,
                }).format(segment.totalValue)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Customer</th>
                <th className="text-left py-2 px-4">Segment</th>
                <th className="text-right py-2 px-4">Period Revenue</th>
                <th className="text-right py-2 px-4">Visits</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.slice(0, 20).map((customer: any) => (
                <tr key={customer.id} className="border-b border-gray-100">
                  <td className="py-2 px-4">{customer.name}</td>
                  <td className="py-2 px-4">{customer.segment}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(customer.periodRevenue)}
                  </td>
                  <td className="text-right py-2 px-4">{customer.periodVisits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductPerformanceDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.summary.totalProducts}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Quantity Sold</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.summary.totalQuantitySold}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalRevenue)}
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Product</th>
                <th className="text-right py-2 px-4">Quantity</th>
                <th className="text-right py-2 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.products.slice(0, 20).map((product: any) => (
                <tr key={product.productId} className="border-b border-gray-100">
                  <td className="py-2 px-4">{product.productName}</td>
                  <td className="text-right py-2 px-4">{product.totalQuantity}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(product.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinancialSummaryDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalPaid)}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalPending)}
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-right py-2 px-4">Count</th>
                <th className="text-right py-2 px-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentStatusBreakdown.map((item: any) => (
                <tr key={item.status} className="border-b border-gray-100">
                  <td className="py-2 px-4">{item.status}</td>
                  <td className="text-right py-2 px-4">{item.count}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentAnalysisDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Method</th>
                <th className="text-right py-2 px-4">Count</th>
                <th className="text-right py-2 px-4">Amount</th>
                <th className="text-right py-2 px-4">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentMethods.map((method: any) => (
                <tr key={method.method} className="border-b border-gray-100">
                  <td className="py-2 px-4">{method.method.replace("_", " ")}</td>
                  <td className="text-right py-2 px-4">{method.count}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(method.totalAmount)}
                  </td>
                  <td className="text-right py-2 px-4">
                    {method.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegionalSalesDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Regions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.summary.totalRegions}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "SLL",
              minimumFractionDigits: 0,
            }).format(data.summary.totalRevenue)}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.summary.totalSales}
          </p>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Sales by Region</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Region</th>
                <th className="text-right py-2 px-4">Sales</th>
                <th className="text-right py-2 px-4">Revenue</th>
                <th className="text-right py-2 px-4">Avg. Order</th>
              </tr>
            </thead>
            <tbody>
              {data.regions.map((region: any) => (
                <tr key={region.regionId} className="border-b border-gray-100">
                  <td className="py-2 px-4">{region.regionName}</td>
                  <td className="text-right py-2 px-4">{region.totalSales}</td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(region.totalRevenue)}
                  </td>
                  <td className="text-right py-2 px-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "SLL",
                      minimumFractionDigits: 0,
                    }).format(region.averageOrderValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

