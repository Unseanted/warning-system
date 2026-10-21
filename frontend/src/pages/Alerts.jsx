import { useEffect, useState } from 'react'
import { Bell, Send } from 'lucide-react'
import { getAlerts, getStations, sendAlert, subscribe } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input, Label, Select } from '@/ui/input'
import { Badge } from '@/ui/badge'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [stations, setStations] = useState([])
  const [form, setForm] = useState({ station_id: 1, recipient_phone: '', message: '', risk_level: 2 })
  const [sub, setSub] = useState({ station_id: 1, phone: '', min_risk_level: 2 })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    getAlerts().then((r) => setAlerts(r.data)).catch(() => {})
    getStations().then((r) => {
      setStations(r.data)
      if (r.data[0]) {
        setForm((f) => ({ ...f, station_id: r.data[0].id }))
        setSub((f) => ({ ...f, station_id: r.data[0].id }))
      }
    })
  }
  useEffect(load, [])

  const onSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await sendAlert(form)
      setMsg({ ok: true, text: 'Alert sent (or logged in demo mode).' })
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || err.message })
    } finally {
      setLoading(false)
    }
  }

  const onSub = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await subscribe(sub)
      setMsg({ ok: true, text: 'Subscribed — High/Extreme predictions will trigger SMS.' })
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Alert Centre</h1>
        <p className="mt-2 text-muted-foreground">Twilio SMS · demo mode without credentials</p>
      </div>
      {msg && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${msg.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
          {msg.text}
        </div>
      )}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-sky-400" /> Manual SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSend} className="space-y-3">
              <div>
                <Label>Station</Label>
                <Select value={form.station_id} onChange={(e) => setForm({ ...form, station_id: +e.target.value })}>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Phone (E.164)</Label>
                <Input required placeholder="+234..." value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
              </div>
              <div>
                <Label>Risk template</Label>
                <Select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: +e.target.value })}>
                  <option value={0}>Low</option>
                  <option value={1}>Moderate</option>
                  <option value={2}>High</option>
                  <option value={3}>Extreme</option>
                </Select>
              </div>
              <div>
                <Label>Custom message (optional)</Label>
                <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Leave blank for template" />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send alert'}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-sky-400" /> Subscribe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSub} className="space-y-3">
              <div>
                <Label>Station</Label>
                <Select value={sub.station_id} onChange={(e) => setSub({ ...sub, station_id: +e.target.value })}>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input required placeholder="+234..." value={sub.phone} onChange={(e) => setSub({ ...sub, phone: e.target.value })} />
              </div>
              <div>
                <Label>Min risk to trigger</Label>
                <Select value={sub.min_risk_level} onChange={(e) => setSub({ ...sub, min_risk_level: +e.target.value })}>
                  <option value={1}>Moderate+</option>
                  <option value={2}>High+</option>
                  <option value={3}>Extreme only</option>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>Subscribe</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent alerts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">Station</th>
                <th className="pb-2 pr-3">Phone</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-muted-foreground">No alerts yet.</td></tr>
              )}
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-3">{a.id}</td>
                  <td className="pr-3">{a.station_id}</td>
                  <td className="pr-3 font-mono text-xs">{a.recipient_phone}</td>
                  <td className="pr-3"><Badge risk={a.status === 'sent' || a.status === 'demo_sent' ? 'Low' : 'High'}>{a.status}</Badge></td>
                  <td className="max-w-xs truncate text-xs text-muted-foreground">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
