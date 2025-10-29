import express, { type Request, type Response } from "express";
import cors from "cors";
import { WebCrawler } from "./scanner/crawler";
import { PAYLOADS } from "./scanner/payloads";
import { VulnerabilityDetector } from "./scanner/detector";
import { RequestInjector } from "./scanner/requester";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// API Key validation middleware
app.use((req: Request, res: Response, next) => {
  // Skip auth for health check
  if (req.path === "/health") {
    return next();
  }

  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return res.status(403).json({ error: "Forbidden: Invalid API key" });
  }

  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main scan endpoint
app.post("/scan", async (req: Request, res: Response) => {
  try {
    console.log("[backend] POST /scan called");
    const { targetUrl, depth = 2, timeout = 10000 } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: "Target URL required" });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const startTime = Date.now();
    console.log("[backend] Starting scan for:", targetUrl);

    // Step 1: Crawl the target
    const crawler = new WebCrawler(targetUrl, depth, timeout);
    const crawlResults = await crawler.crawl();
    console.log(
      "[backend] Crawl complete. Found",
      crawlResults.urls.size,
      "URLs"
    );

    // Step 2: Initialize scanner components
    const detector = new VulnerabilityDetector();
    const injector = new RequestInjector();
    const vulnerabilities: any[] = [];

    // Step 3: Test each parameter for vulnerabilities
    console.log(
      "[backend] Testing",
      crawlResults.parameters.length,
      "parameters for vulnerabilities"
    );
    for (const param of crawlResults.parameters) {
      console.log(`[backend] Testing parameter: ${param.name} on ${param.url}`);

      // Test XSS
      for (const payload of PAYLOADS.xss) {
        try {
          const testParams = { [param.name]: payload };
          const response = await injector.sendRequest(
            param.url,
            param.method,
            testParams
          );

          const xssResult = detector.detectXSS(
            response,
            payload,
            param.url,
            param.name
          );
          if (xssResult) {
            console.log("[backend] XSS vulnerability found:", xssResult);
            vulnerabilities.push({
              id: `${Date.now()}-${Math.random()}`,
              ...xssResult,
            });
          }
        } catch (e) {
          console.error("[backend] XSS test error:", e);
        }
      }

      // Test SQLi
      for (const payload of PAYLOADS.sqli) {
        try {
          const testParams = { [param.name]: payload };
          const response = await injector.sendRequest(
            param.url,
            param.method,
            testParams
          );

          const sqliResult = detector.detectSQLi(
            response,
            payload,
            param.url,
            param.name
          );
          if (sqliResult) {
            console.log("[backend] SQLi vulnerability found:", sqliResult);
            vulnerabilities.push({
              id: `${Date.now()}-${Math.random()}`,
              ...sqliResult,
            });
          }
        } catch (e) {
          console.error("[backend] SQLi test error:", e);
        }
      }
    }

    // Step 4: Test forms for CSRF
    for (const form of crawlResults.forms) {
      try {
        const csrfResult = detector.detectCSRFRisk(
          JSON.stringify(form),
          form.url
        );
        if (csrfResult) {
          vulnerabilities.push({
            id: `${Date.now()}-${Math.random()}`,
            ...csrfResult,
          });
        }
      } catch (e) {
        console.error("[backend] CSRF test error:", e);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(
      "[backend] Scan complete. Found",
      vulnerabilities.length,
      "vulnerabilities in",
      duration,
      "seconds"
    );

    // Generate report
    const report = {
      id: `scan-${Date.now()}`,
      targetUrl,
      timestamp: new Date().toISOString(),
      duration,
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter((v) => v.severity === "critical")
          .length,
        high: vulnerabilities.filter((v) => v.severity === "high").length,
        medium: vulnerabilities.filter((v) => v.severity === "medium").length,
        low: vulnerabilities.filter((v) => v.severity === "low").length,
      },
      crawlStats: {
        urlsFound: crawlResults.urls.size,
        formsFound: crawlResults.forms.length,
        parametersFound: crawlResults.parameters.length,
      },
    };

    res.json(report);
  } catch (error) {
    console.error("[backend] Scan error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({ error: `Scan failed: ${errorMessage}` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[backend] Server running on port ${PORT}`);
  console.log(`[backend] Health check: http://localhost:${PORT}/health`);
});
