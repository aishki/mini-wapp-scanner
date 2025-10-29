import { type NextRequest, NextResponse } from "next/server";

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

    const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
    const API_KEY = process.env.BACKEND_API_KEY;

    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (API_KEY) {
      backendHeaders["x-api-key"] = API_KEY;
    }

    console.log("[v0] Calling backend at:", BACKEND_URL);
    const backendResponse = await fetch(`${BACKEND_URL}/scan`, {
      method: "POST",
      headers: backendHeaders,
      body: JSON.stringify({ targetUrl, depth, timeout }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("[v0] Backend error:", backendResponse.status, errorText);
      const errorResponse = NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: backendResponse.status }
      );
      return addCORSHeaders(errorResponse);
    }

    const report = await backendResponse.json();
    console.log("[v0] Scan complete, returning report");

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
