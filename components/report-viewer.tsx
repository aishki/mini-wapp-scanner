"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { ReportGenerator } from "@/lib/scanner/report-generator";

interface Vulnerability {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  url: string;
  parameter: string;
  payload: string;
  evidence: string;
  description: string;
}

interface ScanReport {
  id: string;
  targetUrl: string;
  timestamp: string;
  duration: number;
  vulnerabilities: Vulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  crawlStats: {
    urlsFound: number;
    formsFound: number;
    parametersFound: number;
  };
}

export default function ReportViewer({ report }: { report: ScanReport }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "severity-critical",
      high: "severity-high",
      medium: "severity-medium",
      low: "severity-low",
      info: "severity-info",
    };
    return colors[severity] || "severity-info";
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadJSON = () => {
    const generator = new ReportGenerator();
    const dataStr = generator.generateJSON(report);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan-report-${report.id}.json`;
    link.click();
  };

  const handleDownloadHTML = () => {
    const generator = new ReportGenerator();
    const htmlStr = generator.generateHTML(report);
    const dataBlob = new Blob([htmlStr], { type: "text/html" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan-report-${report.id}.html`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Scan Report</CardTitle>
              <CardDescription>Target: {report.targetUrl}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadJSON}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
              <Button
                onClick={handleDownloadHTML}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <FileText className="w-4 h-4" />
                HTML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Scan Date</p>
              <p className="text-sm font-medium">
                {new Date(report.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{report.duration}s</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Issues</p>
              <p className="text-sm font-medium">{report.summary.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Level</p>
              <p className="text-sm font-medium text-red-400">
                {report.summary.critical > 0
                  ? "Critical"
                  : report.summary.high > 0
                  ? "High"
                  : "Medium"}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-2 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {report.summary.critical}
              </div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {report.summary.high}
              </div>
              <p className="text-xs text-muted-foreground">High</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {report.summary.medium}
              </div>
              <p className="text-xs text-muted-foreground">Medium</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {report.summary.low}
              </div>
              <p className="text-xs text-muted-foreground">Low</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-500">
                {report.summary.total}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Vulnerabilities Found
        </h2>
        {report.vulnerabilities.length === 0 ? (
          <Card className="border-border bg-card/50">
            <CardContent className="pt-8 text-center">
              <p className="text-muted-foreground">
                No vulnerabilities detected in this scan.
              </p>
            </CardContent>
          </Card>
        ) : (
          report.vulnerabilities.map((vuln) => (
            <Card
              key={vuln.id}
              className="border-border bg-card/50 overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {vuln.type}
                      </h3>
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vuln.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Affected URL
                    </p>
                    <p className="text-sm font-mono bg-input p-2 rounded border border-border break-all">
                      {vuln.url}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Parameter
                    </p>
                    <p className="text-sm font-mono bg-input p-2 rounded border border-border">
                      {vuln.parameter}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Payload Used
                  </p>
                  <div className="flex gap-2">
                    <p className="text-sm font-mono bg-input p-2 rounded border border-border flex-1 break-all">
                      {vuln.payload}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(vuln.payload, vuln.id)}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Evidence</p>
                  <div className="bg-input p-3 rounded border border-border max-h-32 overflow-y-auto">
                    <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                      {vuln.evidence}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
