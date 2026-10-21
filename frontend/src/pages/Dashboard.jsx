import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { getDashboard } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'

function Trend({ trend }) {
  if (trend === 'increasing') return <span className="flex items-center gap-1 text-red-400"><TrendingUp className="h-3.5 w-3.5" /> rising</span>
  if (trend === 'decreasing') return <span className="flex items-center gap-1 text-emerald-400"><TrendingDown className="h-3.5 w-3.5" /> falling</span>
  return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-3.5 w-3.5" /> stable</span>
}

export default function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const grid = useRef(null)

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.message || 'Backend unreachable'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && data.length && grid.current) {
      gsap.from(grid.current.children, {
        y: 24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.12,
        ease: 'power2.out',
      })
    }
  }, [loading, data])

  const high = data.filter((s) => s.latest_prediction?.predicted_risk_class >= 2)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Flood Risk Dashboard</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Live ensemble monitoring for Makurdi, Lokoja & Onitsha — RF + temporal model, Open-Meteo feeds.
        </p>
      </div>

      {high.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            {high.length} location{high.length > 1 ? 's' : ''} at High or Extreme risk. SMS alerts fire for subscribers.
          </span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <Card className="border-red-500/30">
          <CardContent className="p-6 text-red-300">
            Could not reach API. Set <code className="text-xs">VITE_API_URL</code> to your Render backend.
            <div className="mt-1 text-xs opacity-70">{error}</div>
          </CardContent>
        </Card>
      )}

      <div ref={grid} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => {
          const pred = item.latest_prediction
          return (
            <Card key={item.station.id} className="group transition hover:border-sky-500/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{item.station.name}</CardTitle>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.station.state} · {item.station.river_name}
                    </p>
                  </div>
                  <Badge risk={pred?.risk_label || 'Low'}>{pred?.risk_label || 'No data'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pred ? (
                  <>
                    <div className="mb-4 flex gap-6 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend</div>
                        <div className="mt-0.5"><Trend trend={item.trend} /></div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Updated</div>
                        <div className="mt-0.5 text-xs">{new Date(pred.prediction_timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    {pred.probabilities && (
                      <div className="flex h-2 overflow-hidden rounded-full bg-background">
                        {['Low', 'Moderate', 'High', 'Extreme'].map((lbl) => {
                          const pct = (pred.probabilities[lbl] || 0) * 100
                          const colors = { Low: '#22c55e', Moderate: '#eab308', High: '#f97316', Extreme: '#ef4444' }
                          return (
                            <div
                              key={lbl}
                              title={`${lbl}: ${pct.toFixed(1)}%`}
                              style={{ width: `${Math.max(pct, 1)}%`, background: colors[lbl] }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Run a prediction to populate risk data.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
