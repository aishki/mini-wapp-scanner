export interface VulnerabilityResult {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  url: string;
  parameter: string;
  payload: string;
  description: string;
  remediation: string;
}

export class VulnerabilityDetector {
  detectXSS(
    response: string,
    payload: string,
    url: string,
    parameter: string
  ): VulnerabilityResult | null {
    // Check if payload is reflected in response
    if (response.includes(payload)) {
      return {
        type: "Cross-Site Scripting (XSS)",
        severity: "high",
        url,
        parameter,
        payload,
        description: `The parameter "${parameter}" appears to be vulnerable to XSS. The injected payload was reflected in the response without proper encoding.`,
        remediation:
          "Implement proper output encoding/escaping for all user inputs. Use Content Security Policy (CSP) headers.",
      };
    }

    return null;
  }

  detectSQLi(
    response: string,
    payload: string,
    url: string,
    parameter: string
  ): VulnerabilityResult | null {
    // Check for SQL error patterns
    const sqlErrorPatterns = [
      /SQL syntax/i,
      /mysql_fetch/i,
      /Warning.*mysql/i,
      /ORA-\d+/i,
      /PostgreSQL.*ERROR/i,
      /Unclosed quotation mark/i,
      /Syntax error/i,
    ];

    for (const pattern of sqlErrorPatterns) {
      if (pattern.test(response)) {
        return {
          type: "SQL Injection (SQLi)",
          severity: "critical",
          url,
          parameter,
          payload,
          description: `The parameter "${parameter}" appears to be vulnerable to SQL injection. SQL error messages were detected in the response.`,
          remediation:
            "Use parameterized queries/prepared statements. Implement input validation and use ORM frameworks.",
        };
      }
    }

    return null;
  }

  detectCSRFRisk(formHtml: string, url: string): VulnerabilityResult | null {
    // Check if form has CSRF token
    const hasCsrfToken =
      /csrf|token|nonce/i.test(formHtml) &&
      /<input[^>]*name=["']?(?:csrf|token|nonce)["']?/i.test(formHtml);

    if (!hasCsrfToken) {
      return {
        type: "Cross-Site Request Forgery (CSRF)",
        severity: "medium",
        url,
        parameter: "form",
        payload: "N/A",
        description:
          "The form does not appear to have CSRF protection tokens. This could allow attackers to perform unauthorized actions.",
        remediation:
          "Implement CSRF tokens in all forms. Use SameSite cookie attributes. Implement proper origin/referer validation.",
      };
    }

    return null;
  }
}
