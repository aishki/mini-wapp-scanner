"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ScanDashboardProps {
  report?: any;
}

export default function ScanDashboard({ report }: ScanDashboardProps) {
  if (!report) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground">
            No scan data yet. Start a scan to see statistics and charts here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const vulnerabilityTrends = [
    {
      name: "XSS",
      critical: report.vulnerabilities.filter(
        (v: any) => v.type === "xss" && v.severity === "critical"
      ).length,
      high: report.vulnerabilities.filter(
        (v: any) => v.type === "xss" && v.severity === "high"
      ).length,
      medium: report.vulnerabilities.filter(
        (v: any) => v.type === "xss" && v.severity === "medium"
      ).length,
      low: report.vulnerabilities.filter(
        (v: any) => v.type === "xss" && v.severity === "low"
      ).length,
    },
    {
      name: "SQLi",
      critical: report.vulnerabilities.filter(
        (v: any) => v.type === "sqli" && v.severity === "critical"
      ).length,
      high: report.vulnerabilities.filter(
        (v: any) => v.type === "sqli" && v.severity === "high"
      ).length,
      medium: report.vulnerabilities.filter(
        (v: any) => v.type === "sqli" && v.severity === "medium"
      ).length,
      low: report.vulnerabilities.filter(
        (v: any) => v.type === "sqli" && v.severity === "low"
      ).length,
    },
    {
      name: "CSRF",
      critical: report.vulnerabilities.filter(
        (v: any) => v.type === "csrf" && v.severity === "critical"
      ).length,
      high: report.vulnerabilities.filter(
        (v: any) => v.type === "csrf" && v.severity === "high"
      ).length,
      medium: report.vulnerabilities.filter(
        (v: any) => v.type === "csrf" && v.severity === "medium"
      ).length,
      low: report.vulnerabilities.filter(
        (v: any) => v.type === "csrf" && v.severity === "low"
      ).length,
    },
  ];

  const severityDistribution = [
    { name: "Critical", value: report.summary.critical, fill: "#dc2626" },
    { name: "High", value: report.summary.high, fill: "#ea580c" },
    { name: "Medium", value: report.summary.medium, fill: "#eab308" },
    { name: "Low", value: report.summary.low, fill: "#0284c7" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {report.summary.total}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total Vulnerabilities
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                {report.summary.critical}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Critical Issues
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">
                {report.summary.high}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                High Severity
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {report.crawlStats.urlsFound}
              </div>
              <p className="text-sm text-muted-foreground mt-1">URLs Found</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle>Vulnerability Trends</CardTitle>
            <CardDescription>Distribution by type and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vulnerabilityTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill="#dc2626" />
                <Bar dataKey="high" stackId="a" fill="#ea580c" />
                <Bar dataKey="medium" stackId="a" fill="#eab308" />
                <Bar dataKey="low" stackId="a" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Overall vulnerability breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
