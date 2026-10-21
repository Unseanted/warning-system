import { useEffect, useState } from 'react'
import { getMetrics, getNimetInfo } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export default function About() {
  const [metrics, setMetrics] = useState(null)
  const [nimet, setNimet] = useState(null)
  useEffect(() => {
    getMetrics().then((r) => setMetrics(r.data)).catch(() => {})
    getNimetInfo().then((r) => setNimet(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">About FRPEWS</h1>
        <p className="mt-2 text-muted-foreground">Node.js API · React + Tailwind · Thesis prototype</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Flood Risk Prediction & Early Warning System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Full-stack implementation for vulnerable Nigerian communities (Makurdi, Lokoja, Onitsha):
            ensemble flood-risk classification, live meteorological feeds, and Twilio SMS last-mile alerts.
          </p>
          <div>
            <h4 className="mb-1 font-semibold text-foreground">Stack</h4>
            <ul className="list-inside list-disc space-y-1">
              <li>Backend: Node.js + Express + better-sqlite3</li>
              <li>Frontend: React 18, Vite, Tailwind (shadcn-style), GSAP weather scene</li>
              <li>Feeds: Open-Meteo · NiMet integration path documented</li>
              <li>SMS: Twilio (demo mode without keys)</li>
            </ul>
          </div>
          {metrics?.chapter4_highlights && (
            <div>
              <h4 className="mb-1 font-semibold text-foreground">Chapter 4 metrics</h4>
              <ul className="list-inside list-disc space-y-1">
                <li>RF {(metrics.chapter4_highlights.rf_accuracy * 100).toFixed(1)}%</li>
                <li>LSTM {(metrics.chapter4_highlights.lstm_accuracy * 100).toFixed(1)}%</li>
                <li>Ensemble {(metrics.chapter4_highlights.ensemble_accuracy * 100).toFixed(1)}%</li>
                <li>{metrics.chapter4_highlights.advance_warning_hours}</li>
              </ul>
            </div>
          )}
          {nimet && (
            <div>
              <h4 className="mb-1 font-semibold text-foreground">Data</h4>
              <p>{nimet.current_demo_source}</p>
              <p className="mt-1 text-xs">{nimet.thesis_alignment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
