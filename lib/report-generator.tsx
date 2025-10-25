export interface ScanReport {
  id: string
  targetUrl: string
  timestamp: string
  duration: number
  vulnerabilities: any[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  crawlStats: {
    urlsFound: number
    formsFound: number
    parametersFound: number
  }
}

export class ReportGenerator {
  generateJSON(report: ScanReport): string {
    return JSON.stringify(report, null, 2)
  }

  generateHTML(report: ScanReport): string {
    const severityColors: Record<string, string> = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#eab308",
      low: "#0284c7",
      info: "#06b6d4",
    }

    const vulnerabilityRows = report.vulnerabilities
      .map(
        (vuln) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${vuln.type}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="background-color: ${severityColors[vuln.severity]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${vuln.severity.toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px; text-align: left; word-break: break-all; font-size: 12px;">${vuln.url}</td>
        <td style="padding: 12px; text-align: left;">${vuln.parameter}</td>
        <td style="padding: 12px; text-align: left;">${vuln.description}</td>
      </tr>
    `,
      )
      .join("")

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Vulnerability Scan Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #667eea;
        }
        .summary-card.critical {
            border-left-color: #dc2626;
        }
        .summary-card.high {
            border-left-color: #ea580c;
        }
        .summary-card.medium {
            border-left-color: #eab308;
        }
        .summary-card.low {
            border-left-color: #0284c7;
        }
        .summary-card h3 {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        .section h2 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
        }
        .no-vulnerabilities {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 12px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-item {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .stat-item strong {
            display: block;
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 5px;
        }
        .stat-item span {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Web Vulnerability Scan Report</h1>
            <p>Target: ${report.targetUrl}</p>
            <p>Scan Date: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card critical">
                <h3>Critical</h3>
                <div class="value">${report.summary.critical}</div>
            </div>
            <div class="summary-card high">
                <h3>High</h3>
                <div class="value">${report.summary.high}</div>
            </div>
            <div class="summary-card medium">
                <h3>Medium</h3>
                <div class="value">${report.summary.medium}</div>
            </div>
            <div class="summary-card low">
                <h3>Low</h3>
                <div class="value">${report.summary.low}</div>
            </div>
            <div class="summary-card">
                <h3>Total Issues</h3>
                <div class="value">${report.summary.total}</div>
            </div>
        </div>

        <div class="section">
            <h2>Scan Statistics</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>URLs Found</strong>
                    <span>${report.crawlStats.urlsFound}</span>
                </div>
                <div class="stat-item">
                    <strong>Forms Found</strong>
                    <span>${report.crawlStats.formsFound}</span>
                </div>
                <div class="stat-item">
                    <strong>Parameters Found</strong>
                    <span>${report.crawlStats.parametersFound}</span>
                </div>
                <div class="stat-item">
                    <strong>Scan Duration</strong>
                    <span>${report.duration}s</span>
                </div>
            </div>
        </div>

        ${
          report.vulnerabilities.length > 0
            ? `
        <div class="section">
            <h2>Vulnerabilities Found</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>URL</th>
                        <th>Parameter</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${vulnerabilityRows}
                </tbody>
            </table>
        </div>
        `
            : `
        <div class="section">
            <div class="no-vulnerabilities">
                <h2>No Vulnerabilities Found</h2>
                <p>The scan completed successfully with no vulnerabilities detected.</p>
            </div>
        </div>
        `
        }

        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>Web Vulnerability Scanner - Educational Use Only</p>
        </div>
    </div>
</body>
</html>
    `

    return html
  }
}
