"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Shield, Zap, FileText, Loader2 } from "lucide-react";
import ScanDashboard from "@/components/scan-dashboard";
import ReportViewer from "@/components/report-viewer";
import ScanHistory from "@/components/scan-history";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [targetUrl, setTargetUrl] = useState("");
  const [crawlDepth, setCrawlDepth] = useState("2");
  const [timeout, setTimeout] = useState("10000");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleStartScan = async () => {
    setError("");

    if (!targetUrl.trim()) {
      setError("Please enter a target URL");
      return;
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          depth: Number.parseInt(crawlDepth),
          timeout: Number.parseInt(timeout),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Scan failed");
        return;
      }

      setScanResults(data);
      setScanHistory([data, ...scanHistory]);
      setActiveTab("results");
    } catch (error) {
      setError("Network error: " + (error as Error).message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectFromHistory = (scan: any) => {
    setScanResults(scan);
    setActiveTab("results");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Web Vulnerability Scanner
                </h1>
                <p className="text-sm text-muted-foreground">
                  Professional security testing tool
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-card px-3 py-1 rounded-full border border-border">
              Educational Use Only
            </div>
          </div>
        </div>
      </header>

      {/* Legal Warning */}
      <div className="bg-red-950/30 border-b border-red-900/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">
            <strong>Legal Notice:</strong> This tool is for authorized security
            testing only. Only scan systems you own or have explicit written
            permission to test. Unauthorized access is illegal. Use on
            intentionally vulnerable apps (OWASP Juice Shop, DVWA) for learning.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle>Start New Scan</CardTitle>
                <CardDescription>
                  Enter the target URL to begin vulnerability scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-950/30 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="target-url">Target URL</Label>
                  <Input
                    id="target-url"
                    placeholder="https://example.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    disabled={isScanning}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: https://juice-shop.herokuapp.com (OWASP Juice Shop
                    for testing)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depth">Crawl Depth</Label>
                    <Input
                      id="depth"
                      type="number"
                      value={crawlDepth}
                      onChange={(e) => setCrawlDepth(e.target.value)}
                      min="1"
                      max="5"
                      disabled={isScanning}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={timeout}
                      onChange={(e) => setTimeout(e.target.value)}
                      min="1000"
                      disabled={isScanning}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="info">Info</Label>
                    <div className="bg-input border border-border rounded px-3 py-2 text-sm text-muted-foreground">
                      {isScanning ? "Scanning..." : "Ready"}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    "Start Scan"
                  )}
                </Button>
              </CardContent>
            </Card>

            <ScanDashboard />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {scanResults ? (
              <ReportViewer report={scanResults} />
            ) : (
              <Card className="border-border bg-card/50">
                <CardContent className="pt-8 text-center">
                  <p className="text-muted-foreground">
                    No scan results yet. Start a scan to see results here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ScanHistory
              history={scanHistory}
              onSelectScan={handleSelectFromHistory}
            />
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle>Scanner Documentation</CardTitle>
                <CardDescription>
                  How to use the vulnerability scanner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Supported Vulnerability Types
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      • <strong>Reflected XSS:</strong> Detects reflected
                      cross-site scripting vulnerabilities
                    </li>
                    <li>
                      • <strong>DOM-based XSS:</strong> Identifies DOM
                      manipulation patterns that could lead to XSS
                    </li>
                    <li>
                      • <strong>SQL Injection:</strong> Tests for SQL injection
                      via error-based and boolean-based detection
                    </li>
                    <li>
                      • <strong>CSRF:</strong> Identifies missing CSRF tokens in
                      forms
                    </li>
                    <li>
                      • <strong>Open Redirect:</strong> Detects unvalidated
                      redirects
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Severity Levels
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      •{" "}
                      <span className="severity-critical px-2 py-1 rounded text-xs">
                        Critical
                      </span>{" "}
                      - Immediate exploitation possible
                    </li>
                    <li>
                      •{" "}
                      <span className="severity-high px-2 py-1 rounded text-xs">
                        High
                      </span>{" "}
                      - Likely exploitable
                    </li>
                    <li>
                      •{" "}
                      <span className="severity-medium px-2 py-1 rounded text-xs">
                        Medium
                      </span>{" "}
                      - Possible exploitation
                    </li>
                    <li>
                      •{" "}
                      <span className="severity-low px-2 py-1 rounded text-xs">
                        Low
                      </span>{" "}
                      - Unlikely to be exploited
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Best Practices
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      • Always get written permission before testing any system
                    </li>
                    <li>
                      • Start with low crawl depth to avoid overwhelming the
                      target
                    </li>
                    <li>
                      • Use on intentionally vulnerable applications for
                      learning
                    </li>
                    <li>
                      • Review findings carefully and validate before reporting
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Legal & Ethical Use
                  </h3>
                  <p className="text-muted-foreground">
                    This tool is designed for educational purposes and
                    authorized security testing only. Always obtain written
                    permission before testing any system you do not own.
                    Unauthorized access to computer systems is illegal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
