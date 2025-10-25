export class RequestInjector {
  async sendRequest(
    url: string,
    method = "GET",
    parameters: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): Promise<string> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...headers,
        },
        timeout: 10000,
      }

      let finalUrl = url

      if (method === "GET" && Object.keys(parameters).length > 0) {
        const params = new URLSearchParams(parameters)
        finalUrl = `${url}?${params.toString()}`
      } else if (method === "POST") {
        options.body = new URLSearchParams(parameters).toString()
        options.headers = {
          ...options.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }

      const response = await fetch(finalUrl, options)
      return await response.text()
    } catch (error) {
      console.error("Request error:", error)
      return ""
    }
  }
}
