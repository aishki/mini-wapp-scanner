import { parse } from "node-html-parser"

export interface CrawlResult {
  urls: Set<string>
  forms: FormData[]
  parameters: ParameterData[]
}

export interface FormData {
  url: string
  method: string
  action: string
  fields: FormField[]
}

export interface FormField {
  name: string
  type: string
  value?: string
}

export interface ParameterData {
  url: string
  method: string
  name: string
  type: string
}

export class WebCrawler {
  private baseUrl: string
  private maxDepth: number
  private timeout: number
  private visited: Set<string> = new Set()
  private results: CrawlResult = {
    urls: new Set(),
    forms: [],
    parameters: [],
  }

  constructor(baseUrl: string, maxDepth = 2, timeout = 10000) {
    this.baseUrl = baseUrl
    this.maxDepth = maxDepth
    this.timeout = timeout
  }

  async crawl(): Promise<CrawlResult> {
    await this.crawlPage(this.baseUrl, 0)
    return this.results
  }

  private async crawlPage(url: string, depth: number): Promise<void> {
    if (depth > this.maxDepth || this.visited.has(url)) {
      return
    }

    this.visited.add(url)
    this.results.urls.add(url)

    try {
      const response = await fetch(url, {
        timeout: this.timeout,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) return

      const html = await response.text()
      const root = parse(html)

      // Extract links
      const links = root.querySelectorAll("a[href]")
      for (const link of links) {
        const href = link.getAttribute("href")
        if (href && !href.startsWith("#")) {
          const absoluteUrl = this.resolveUrl(url, href)
          if (this.isSameDomain(absoluteUrl)) {
            await this.crawlPage(absoluteUrl, depth + 1)
          }
        }
      }

      // Extract forms
      const forms = root.querySelectorAll("form")
      for (const form of forms) {
        const formData = this.extractFormData(url, form)
        this.results.forms.push(formData)

        // Extract form parameters
        for (const field of formData.fields) {
          this.results.parameters.push({
            url: formData.url,
            method: formData.method,
            name: field.name,
            type: field.type,
          })
        }
      }

      // Extract URL parameters
      const urlParams = new URL(url).searchParams
      for (const [key] of urlParams) {
        this.results.parameters.push({
          url,
          method: "GET",
          name: key,
          type: "query",
        })
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error)
    }
  }

  private extractFormData(pageUrl: string, form: any): FormData {
    const method = (form.getAttribute("method") || "GET").toUpperCase()
    const action = form.getAttribute("action") || ""
    const formUrl = this.resolveUrl(pageUrl, action)

    const fields: FormField[] = []
    const inputs = form.querySelectorAll("input, textarea, select")

    for (const input of inputs) {
      const name = input.getAttribute("name")
      if (name) {
        fields.push({
          name,
          type: input.getAttribute("type") || "text",
          value: input.getAttribute("value") || "",
        })
      }
    }

    return {
      url: formUrl,
      method,
      action,
      fields,
    }
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).toString()
    } catch {
      return baseUrl
    }
  }

  private isSameDomain(url: string): boolean {
    try {
      const baseHost = new URL(this.baseUrl).hostname
      const urlHost = new URL(url).hostname
      return baseHost === urlHost
    } catch {
      return false
    }
  }
}
