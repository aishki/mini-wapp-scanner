export class RequestInjector {
  async sendRequest(
    url: string,
    method: string,
    params: Record<string, string>
  ): Promise<string> {
    try {
      let requestUrl = url;
      let body = null;

      if (method === "GET") {
        const queryParams = new URLSearchParams(params);
        requestUrl = `${url}${
          url.includes("?") ? "&" : "?"
        }${queryParams.toString()}`;
      } else {
        body = JSON.stringify(params);
      }

      const response = await fetch(requestUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body,
      });

      return await response.text();
    } catch (error) {
      console.error("[requester] Request error:", error);
      throw error;
    }
  }
}
