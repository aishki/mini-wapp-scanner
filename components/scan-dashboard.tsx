"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"

const mockData = {
  vulnerabilityTrends: [
    { name: "XSS", critical: 2, high: 3, medium: 5, low: 8 },
    { name: "SQLi", critical: 1, high: 2, medium: 4, low: 6 },
    { name: "CSRF", critical: 0, high: 1, medium: 2, low: 3 },
    { name: "Auth", critical: 1, high: 1, medium: 2, low: 4 },
  ],
  severityDistribution: [
    { name: "Critical", value: 4, fill: "#dc2626" },
    { name: "High", value: 7, fill: "#ea580c" },
    { name: "Medium", value: 13, fill: "#eab308" },
    { name: "Low", value: 21, fill: "#0284c7" },
  ],
}

export default function ScanDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">45</div>
              <p className="text-sm text-muted-foreground mt-1">Total Vulnerabilities</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">4</div>
              <p className="text-sm text-muted-foreground mt-1">Critical Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">7</div>
              <p className="text-sm text-muted-foreground mt-1">High Severity</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">12</div>
              <p className="text-sm text-muted-foreground mt-1">Scans Completed</p>
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
              <BarChart data={mockData.vulnerabilityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
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
                  data={mockData.severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockData.severityDistribution.map((entry, index) => (
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
  )
}
