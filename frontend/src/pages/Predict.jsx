import { useEffect, useState } from 'react'
import { CloudRain, Cpu } from 'lucide-react'
import { getStations, predict, getLiveStation, getMetrics } from '@/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input, Label, Select } from '@/ui/input'
import { Badge } from '@/ui/badge'

const presets = {
  safe: { daily_rainfall_mm: 5, river_level_m: 3.2, antecedent_3day_rain_mm: 12, antecedent_7day_rain_mm: 30, river_level_change_m: 0.05 },
  moderate: { daily_rainfall_mm: 28, river_level_m: 5.8, antecedent_3day_rain_mm: 55, antecedent_7day_rain_mm: 90, river_level_change_m: 0.3 },
  high: { daily_rainfall_mm: 48, river_level_m: 7.5, antecedent_3day_rain_mm: 95, antecedent_7day_rain_mm: 160, river_level_change_m: 0.7 },
  extreme: { daily_rainfall_mm: 75, river_level_m: 11.2, antecedent_3day_rain_mm: 140, antecedent_7day_rain_mm: 220, river_level_change_m: 1.1 },
}

function ProbBars({ probs }) {
  if (!probs) return null
  const colors = { Low: '#22c55e', Moderate: '#eab308', High: '#f97316', Extreme: '#ef4444' }
  return (
    <div className="space-y-2">
      {Object.entries(probs).map(([label, prob]) => (
        <div key={label}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span>{label}</span>
            <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full transition-all" style={{ width: `${prob * 100}%`, background: colors[label] }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Predict() {
  const [stations, setStations] = useState([])
  const [form, setForm] = useState({
    station_id: 1,
    daily_rainfall_mm: 20,
    river_level_m: 5,
    antecedent_3day_rain_mm: 40,
    antecedent_7day_rain_mm: 70,
    river_level_change_m: 0.2,
    month: new Date().getMonth() + 1,
  })
  const [result, setResult] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [liveLoading, setLiveLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedNote, setFeedNote] = useState(null)

  useEffect(() => {
    getStations().then((r) => {
      setStations(r.data)
      if (r.data[0]) setForm((f) => ({ ...f, station_id: r.data[0].id }))
    })
    getMetrics().then((r) => setMetrics(r.data)).catch(() => {})
  }, [])

  const set = (e) => {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: name === 'station_id' || name === 'month' ? parseInt(value, 10) : parseFloat(value),
    }))
  }

  const loadLive = async () => {
    const st = stations.find((s) => s.id === form.station_id)
    if (!st) return
    setLiveLoading(true)
    setError(null)
    try {
      const { data: d } = await getLiveStation(st.name)
      setForm((f) => ({
        ...f,
        daily_rainfall_mm: d.daily_rainfall_mm ?? f.daily_rainfall_mm,
        river_level_m: d.river_level_m ?? f.river_level_m,
        antecedent_3day_rain_mm: d.antecedent_3day_rain_mm ?? f.antecedent_3day_rain_mm,
        antecedent_7day_rain_mm: d.antecedent_7day_rain_mm ?? f.antecedent_7day_rain_mm,
        river_level_change_m: d.river_level_change_m ?? f.river_level_change_m,
        month: d.month ?? f.month,
      }))
      setFeedNote(`Live feed · ${d.source} · ${d.station}`)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLiveLoading(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await predict(form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Ensemble Prediction</h1>
        <p className="mt-2 text-muted-foreground">RF-style + temporal branch · 0.5 / 0.5 weights · 4-class risk</p>
      </div>

      {metrics?.chapter4_highlights && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-border/80 bg-card/50 px-4 py-3 text-sm">
          <span className="font-medium text-sky-400">Chapter 4</span>
          <span>RF {(metrics.chapter4_highlights.rf_accuracy * 100).toFixed(1)}%</span>
          <span>LSTM {(metrics.chapter4_highlights.lstm_accuracy * 100).toFixed(1)}%</span>
          <span className="font-semibold">Ensemble {(metrics.chapter4_highlights.ensemble_accuracy * 100).toFixed(1)}%</span>
          <span className="text-muted-foreground">{metrics.chapter4_highlights.advance_warning_hours}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CloudRain className="h-5 w-5 text-sky-400" /> Inputs</CardTitle>
            <CardDescription>Presets or live Open-Meteo features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.keys(presets).map((k) => (
                <Button key={k} type="button" size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, ...presets[k] }))}>
                  {k}
                </Button>
              ))}
              <Button type="button" size="sm" onClick={loadLive} disabled={liveLoading}>
                {liveLoading ? 'Loading…' : 'Load live feed'}
              </Button>
            </div>
            {feedNote && <p className="mb-3 text-xs text-muted-foreground">{feedNote}</p>}
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label>Station</Label>
                <Select name="station_id" value={form.station_id} onChange={set}>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.state})</option>
                  ))}
                </Select>
              </div>
              {[
                ['daily_rainfall_mm', 'Daily rainfall (mm)'],
                ['river_level_m', 'River level (m)'],
                ['antecedent_3day_rain_mm', '3-day antecedent rain (mm)'],
                ['antecedent_7day_rain_mm', '7-day antecedent rain (mm)'],
                ['river_level_change_m', 'River level change (m)'],
                ['month', 'Month (1–12)'],
              ].map(([name, label]) => (
                <div key={name}>
                  <Label>{label}</Label>
                  <Input type="number" step="any" name={name} value={form[name]} onChange={set} required={name.includes('daily') || name.includes('river_level_m')} />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Predicting…' : 'Run ensemble prediction'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-sky-400" /> Result</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {!result && !error && !loading && (
              <p className="text-sm text-muted-foreground">Submit features to see RF, temporal branch, and ensemble output.</p>
            )}
            {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div>}
            {result && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge risk={result.risk_label} className="text-sm px-3 py-1">{result.risk_label} Risk</Badge>
                  {result.alert_triggered && <span className="text-sm font-medium text-orange-400">SMS alert triggered</span>}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.recommended_action}</p>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Ensemble</div>
                  <ProbBars probs={result.probabilities} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background/80 p-3 ring-1 ring-border">
                    <div className="mb-2 text-xs font-semibold">Random Forest</div>
                    <Badge risk={result.rf?.label}>{result.rf?.label}</Badge>
                    <div className="mt-3"><ProbBars probs={result.rf?.probabilities} /></div>
                  </div>
                  <div className="rounded-lg bg-background/80 p-3 ring-1 ring-border">
                    <div className="mb-2 text-xs font-semibold">Temporal (LSTM-style)</div>
                    <Badge risk={result.lstm?.label}>{result.lstm?.label}</Badge>
                    <div className="mt-3"><ProbBars probs={result.lstm?.probabilities} /></div>
                  </div>
                </div>
                {result.model_version && <p className="text-[10px] text-muted-foreground">{result.model_version}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
