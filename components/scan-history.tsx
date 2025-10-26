"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ScanHistoryItem {
  id: string
  targetUrl: string
  timestamp: string
  duration: number
  summary: {
    total: number
    critical: number
    high: number
  }
}

export default function ScanHistory({
  history,
  onSelectScan,
}: {
  history: ScanHistoryItem[]
  onSelectScan: (scan: any) => void
}) {
  if (history.length === 0) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="pt-8 text-center">
          <p className="text-muted-foreground">No scan history yet. Start a scan to see it here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((scan) => (
        <Card key={scan.id} className="border-border bg-card/50 hover:bg-card/70 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{scan.targetUrl}</p>
                <p className="text-sm text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-medium">{scan.summary.total} issues</p>
                  <div className="flex gap-2 mt-1">
                    {scan.summary.critical > 0 && (
                      <Badge className="severity-critical text-xs">{scan.summary.critical} Critical</Badge>
                    )}
                    {scan.summary.high > 0 && <Badge className="severity-high text-xs">{scan.summary.high} High</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
