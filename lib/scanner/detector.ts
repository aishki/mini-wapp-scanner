import { SQLI_ERROR_PATTERNS, XSS_DETECTION_PATTERNS } from "../payloads";

export interface DetectionResult {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  url: string;
  parameter: string;
  payload: string;
  evidence: string;
  description: string;
}

export class VulnerabilityDetector {
  detectXSS(
    response: string,
    payload: string,
    url: string,
    parameter: string
  ): DetectionResult | null {
    // Check if payload is reflected in response (direct reflection)
    if (response.includes(payload)) {
      return {
        type: "Reflected XSS",
        severity: "high",
        url,
        parameter,
        payload,
        evidence: response.substring(0, 200),
        description: "Payload reflected in response without encoding",
      };
    }

    // Check for dangerous patterns
    for (const pattern of XSS_DETECTION_PATTERNS) {
      if (pattern.test(response)) {
        return {
          type: "Potential XSS",
          severity: "medium",
          url,
          parameter,
          payload,
          evidence: response.substring(0, 200),
          description: "Dangerous JavaScript patterns detected",
        };
      }
    }

    // Check for DOM-based XSS indicators
    if (
      /document\.(write|getElementById|querySelector)|innerHTML|eval\(/i.test(
        response
      )
    ) {
      return {
        type: "DOM-based XSS",
        severity: "high",
        url,
        parameter,
        payload,
        evidence: response.substring(0, 200),
        description:
          "DOM manipulation patterns detected that could lead to XSS",
      };
    }

    return null;
  }

  detectSQLi(
    response: string,
    payload: string,
    url: string,
    parameter: string
  ): DetectionResult | null {
    // Check for SQL error messages (error-based SQLi)
    for (const pattern of SQLI_ERROR_PATTERNS) {
      if (pattern.test(response)) {
        return {
          type: "SQL Injection",
          severity: "critical",
          url,
          parameter,
          payload,
          evidence: response.substring(0, 200),
          description:
            "SQL error message detected in response - likely vulnerable to SQL injection",
        };
      }
    }

    // Check for unusual response patterns that might indicate boolean-based SQLi
    if (payload.includes("AND") || payload.includes("OR")) {
      // This is a simplified check - in production, you'd compare responses
      if (response.length > 100) {
        return {
          type: "Potential SQL Injection",
          severity: "high",
          url,
          parameter,
          payload,
          evidence: response.substring(0, 200),
          description: "Boolean-based SQL injection pattern detected",
        };
      }
    }

    return null;
  }

  detectCSRFRisk(formHtml: string, url: string): DetectionResult | null {
    // Check if form has CSRF token (common token names)
    const tokenPatterns = [
      /csrf[_-]?token/i,
      /xsrf[_-]?token/i,
      /authenticity[_-]?token/i,
      /_token/i,
      /nonce/i,
      /request[_-]?token/i,
    ];

    const hasCSRFToken = tokenPatterns.some((pattern) =>
      pattern.test(formHtml)
    );

    if (!hasCSRFToken && /method\s*=\s*["']post["']/i.test(formHtml)) {
      return {
        type: "Missing CSRF Token",
        severity: "high",
        url,
        parameter: "form",
        payload: "N/A",
        evidence: formHtml.substring(0, 200),
        description:
          "POST form lacks CSRF protection token - vulnerable to CSRF attacks",
      };
    }

    return null;
  }

  detectWeakAuth(response: string, url: string): DetectionResult | null {
    const weakPatterns = [
      /admin.*admin/i,
      /password.*123/i,
      /default.*credentials/i,
      /test.*test/i,
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(response)) {
        return {
          type: "Weak Authentication",
          severity: "high",
          url,
          parameter: "auth",
          payload: "N/A",
          evidence: response.substring(0, 200),
          description: "Potential weak authentication detected",
        };
      }
    }

    return null;
  }

  detectMissingSecurityHeaders(
    headers: Record<string, string>,
    url: string
  ): DetectionResult[] {
    const results: DetectionResult[] = [];
    const criticalHeaders = [
      { name: "Content-Security-Policy", severity: "high" as const },
      { name: "X-Content-Type-Options", severity: "medium" as const },
      { name: "X-Frame-Options", severity: "high" as const },
      { name: "Strict-Transport-Security", severity: "high" as const },
    ];

    for (const header of criticalHeaders) {
      if (!headers[header.name.toLowerCase()]) {
        results.push({
          type: `Missing ${header.name}`,
          severity: header.severity,
          url,
          parameter: "header",
          payload: "N/A",
          evidence: "Header not found in response",
          description: `The ${header.name} security header is missing`,
        });
      }
    }

    return results;
  }

  detectOpenRedirect(
    response: string,
    payload: string,
    url: string,
    parameter: string
  ): DetectionResult | null {
    // Check if redirect payload is in response headers or meta tags
    if (
      response.includes(`Location: ${payload}`) ||
      response.includes(`<meta.*refresh.*${payload}`) ||
      response.includes(`window.location = "${payload}"`)
    ) {
      return {
        type: "Open Redirect",
        severity: "medium",
        url,
        parameter,
        payload,
        evidence: response.substring(0, 200),
        description:
          "Application redirects to user-supplied URL without validation",
      };
    }

    return null;
  }
}
