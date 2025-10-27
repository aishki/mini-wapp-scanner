import { type NextRequest, NextResponse } from "next/server";
import { WebCrawler } from "@/lib/scanner/crawler";
import { PAYLOADS } from "@/lib/scanner/payloads";
import { VulnerabilityDetector } from "@/lib/scanner/detector";
import { RequestInjector } from "@/lib/scanner/requester";

const scanCache = new Map<string, { timestamp: number; result: any }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_SCANS_PER_MINUTE = 5;
const scanAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = scanAttempts.get(ip) || [];
  const recentAttempts = attempts.filter((time) => now - time < 60000);

  if (recentAttempts.length >= MAX_SCANS_PER_MINUTE) {
    return false;
  }

  recentAttempts.push(now);
  scanAttempts.set(ip, recentAttempts);
  return true;
}

function addCORSHeaders(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] POST /api/scan called");
    console.log("[v0] Request headers:", Object.fromEntries(request.headers));

    let body;
    try {
      body = await request.json();
      console.log("[v0] Request body:", body);
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError);
      const errorResponse = NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
      return addCORSHeaders(errorResponse);
    }

    const { targetUrl, depth = 2, timeout = 10000 } = body;

    if (!targetUrl) {
      const errorResponse = NextResponse.json(
        { error: "Target URL required" },
        { status: 400 }
      );
      return addCORSHeaders(errorResponse);
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      const errorResponse = NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
      return addCORSHeaders(errorResponse);
    }

    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      const errorResponse = NextResponse.json(
        { error: "Rate limit exceeded. Maximum 5 scans per minute." },
        { status: 429 }
      );
      return addCORSHeaders(errorResponse);
    }

    const cacheKey = `${targetUrl}-${depth}`;
    const cached = scanCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[v0] Returning cached result for:", targetUrl);
      const cachedResponse = NextResponse.json({
        ...cached.result,
        fromCache: true,
      });
      return addCORSHeaders(cachedResponse);
    }

    const startTime = Date.now();
    console.log("[v0] Starting scan for:", targetUrl);

    // Step 1: Crawl the target
    const crawler = new WebCrawler(targetUrl, depth, timeout);
    const crawlResults = await crawler.crawl();
    console.log("[v0] Crawl complete. Found", crawlResults.urls.size, "URLs");

    // Step 2: Initialize scanner components
    const detector = new VulnerabilityDetector();
    const injector = new RequestInjector();
    const vulnerabilities: any[] = [];

    // Step 3: Test each parameter for vulnerabilities
    for (const param of crawlResults.parameters) {
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
            vulnerabilities.push({
              id: `${Date.now()}-${Math.random()}`,
              ...xssResult,
            });
          }
        } catch (e) {
          console.error("[v0] XSS test error:", e);
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
            vulnerabilities.push({
              id: `${Date.now()}-${Math.random()}`,
              ...sqliResult,
            });
          }
        } catch (e) {
          console.error("[v0] SQLi test error:", e);
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
        console.error("[v0] CSRF test error:", e);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(
      "[v0] Scan complete. Found",
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

    scanCache.set(cacheKey, { timestamp: Date.now(), result: report });

    const successResponse = NextResponse.json(report);
    return addCORSHeaders(successResponse);
  } catch (error) {
    console.error("[v0] Scan error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorResponse = NextResponse.json(
      { error: `Scan failed: ${errorMessage}` },
      { status: 500 }
    );
    return addCORSHeaders(errorResponse);
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log("[v0] OPTIONS /api/scan called");
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
