import { type NextRequest, NextResponse } from "next/server"
import { WebCrawler } from "@/lib/crawler"
import { PAYLOADS } from "@/lib/payloads"
import { VulnerabilityDetector } from "@/lib/detector"
import { RequestInjector } from "@/lib/requester"

const scanCache = new Map<string, { timestamp: number; result: any }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_SCANS_PER_MINUTE = 5
const scanAttempts = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = scanAttempts.get(ip) || []
  const recentAttempts = attempts.filter((time) => now - time < 60000)

  if (recentAttempts.length >= MAX_SCANS_PER_MINUTE) {
    return false
  }

  recentAttempts.push(now)
  scanAttempts.set(ip, recentAttempts)
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, depth = 2, timeout = 10000 } = await request.json()

    if (!targetUrl) {
      return NextResponse.json({ error: "Target URL required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(targetUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 5 scans per minute." }, { status: 429 })
    }

    const cacheKey = `${targetUrl}-${depth}`
    const cached = scanCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ...cached.result, fromCache: true })
    }

    const startTime = Date.now()

    // Step 1: Crawl the target
    const crawler = new WebCrawler(targetUrl, depth, timeout)
    const crawlResults = await crawler.crawl()

    // Step 2: Initialize scanner components
    const detector = new VulnerabilityDetector()
    const injector = new RequestInjector()
    const vulnerabilities: any[] = []

    // Step 3: Test each parameter for vulnerabilities
    for (const param of crawlResults.parameters) {
      // Test XSS
      for (const payload of PAYLOADS.xss) {
        const testParams = { [param.name]: payload }
        const response = await injector.sendRequest(param.url, param.method, testParams)

        const xssResult = detector.detectXSS(response, payload, param.url, param.name)
        if (xssResult) {
          vulnerabilities.push({
            id: `${Date.now()}-${Math.random()}`,
            ...xssResult,
          })
        }
      }

      // Test SQLi
      for (const payload of PAYLOADS.sqli) {
        const testParams = { [param.name]: payload }
        const response = await injector.sendRequest(param.url, param.method, testParams)

        const sqliResult = detector.detectSQLi(response, payload, param.url, param.name)
        if (sqliResult) {
          vulnerabilities.push({
            id: `${Date.now()}-${Math.random()}`,
            ...sqliResult,
          })
        }
      }
    }

    // Step 4: Test forms for CSRF
    for (const form of crawlResults.forms) {
      const csrfResult = detector.detectCSRFRisk(JSON.stringify(form), form.url)
      if (csrfResult) {
        vulnerabilities.push({
          id: `${Date.now()}-${Math.random()}`,
          ...csrfResult,
        })
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)

    // Generate report
    const report = {
      id: `scan-${Date.now()}`,
      targetUrl,
      timestamp: new Date().toISOString(),
      duration,
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter((v) => v.severity === "critical").length,
        high: vulnerabilities.filter((v) => v.severity === "high").length,
        medium: vulnerabilities.filter((v) => v.severity === "medium").length,
        low: vulnerabilities.filter((v) => v.severity === "low").length,
      },
      crawlStats: {
        urlsFound: crawlResults.urls.size,
        formsFound: crawlResults.forms.length,
        parametersFound: crawlResults.parameters.length,
      },
    }

    scanCache.set(cacheKey, { timestamp: Date.now(), result: report })

    return NextResponse.json(report)
  } catch (error) {
    console.error("Scan error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: `Scan failed: ${errorMessage}` }, { status: 500 })
  }
}
