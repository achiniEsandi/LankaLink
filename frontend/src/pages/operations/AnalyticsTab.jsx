import { ArrowUpRight, ChevronRight, Compass, FileCheck2, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SUBSCRIPTION_SERIES } from './sampleData'
import { COMMISSION_TONE, formatUsd } from './helpers'

const TIMEFRAMES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]
const STATUSES = ['All', 'Active', 'Awaiting Payment', 'Completed']

// Recurring revenue as an area chart; hover or focus a point to read it
function RevenueChart({ series }) {
  const [active, setActive] = useState(series.length - 1)
  const point = series[Math.min(active, series.length - 1)]

  const width = 640
  const height = 220
  const pad = { top: 16, right: 16, bottom: 30, left: 48 }
  const values = series.map((d) => d.mrr)
  const min = Math.min(...values) * 0.9
  const max = Math.max(...values) * 1.05
  const x = (i) => pad.left + (i * (width - pad.left - pad.right)) / (series.length - 1)
  const y = (v) => pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom)
  const line = series.map((d, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(d.mrr)}`).join(' ')
  const area = `${line} L ${x(series.length - 1)} ${height - pad.bottom} L ${x(0)} ${height - pad.bottom} Z`
  const ticks = [0, 0.5, 1].map((t) => min + t * (max - min))

  return (
    <>
      <p className="ops-readout">
        <strong>{point.label}</strong>
        <span>{formatUsd(point.mrr)} recurring revenue</span>
        <span>{point.subscribers} active plans</span>
        <span>{point.retention}% net retention</span>
      </p>
      <svg className="ops-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recurring revenue over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="ops-chart__grid" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="ops-chart__label">
              ${Math.round(t / 1000)}k
            </text>
          </g>
        ))}
        <path d={area} className="ops-chart__area" />
        <path d={line} className="ops-chart__line" />
        {series.map((d, i) => (
          <g key={d.label}>
            <circle
              cx={x(i)}
              cy={y(d.mrr)}
              r={i === active ? 6 : 4}
              className={`ops-chart__dot${i === active ? ' ops-chart__dot--on' : ''}`}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <title>{`${d.label}: ${formatUsd(d.mrr)}`}</title>
            </circle>
            <text x={x(i)} y={height - 8} textAnchor="middle" className="ops-chart__label">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </>
  )
}

export default function AnalyticsTab({ commissions, totalRevenueUsd, activeCount, enRoute, report, onPay, onOpenTab }) {
  const [timeframe, setTimeframe] = useState('monthly')
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')

  const series = SUBSCRIPTION_SERIES[timeframe]
  const pending = commissions.filter((c) => c.status === 'Awaiting Payment')
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return commissions.filter(
      (c) =>
        (status === 'All' || c.status === status) &&
        (!q || [c.id, c.service, c.district, c.clientName, c.overseasOrigin].some((v) => v.toLowerCase().includes(q))),
    )
  }, [commissions, status, query])

  const stats = [
    { icon: ArrowUpRight, label: 'Total platform revenue', value: formatUsd(totalRevenueUsd), sub: '+18.4% · LKR 14.66M' },
    { icon: Compass, label: 'Active service commissions', value: activeCount, sub: '24 technicians · 9 districts' },
    { icon: RefreshCw, label: 'Recurring revenue (MRR)', value: formatUsd(SUBSCRIPTION_SERIES.monthly.at(-1).mrr), sub: '104.2% retention · 684 plans' },
    { icon: ShieldCheck, label: 'Evidence verification rate', value: '99.4%', sub: '14.2 min average · GPS-stamped' },
  ]

  return (
    <>
      <div className="stat-cards">
        {stats.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="stat-card">
            <span className="stat-card__icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <p className="stat-card__label">{label}</p>
            <p className="stat-card__value">{value}</p>
            <p className="stat-card__sub">{sub}</p>
          </div>
        ))}
      </div>

      <div className="ops-grid">
        <section className="panel">
          <div className="panel__title-row">
            <h2 className="panel__title">Recurring revenue</h2>
            <div className="pills" role="radiogroup" aria-label="Timeframe">
              {TIMEFRAMES.map((t) => (
                <label key={t.value} className={`pill pill--small${timeframe === t.value ? ' pill--on' : ''}`}>
                  <input type="radio" name="timeframe" checked={timeframe === t.value} onChange={() => setTimeframe(t.value)} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <RevenueChart key={timeframe} series={series} />
        </section>

        <section className="panel">
          <h2 className="panel__title">Field operations</h2>
          <div className="ops-links">
            {enRoute && (
              <button type="button" className="ops-link" onClick={() => onOpenTab('gps')}>
                <span className="booking-row__icon" aria-hidden="true">
                  <Compass size={18} />
                </span>
                <span>
                  <strong>{enRoute.name}</strong>
                  <span className="small muted">En route · {enRoute.district}</span>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="ops-link" onClick={() => onOpenTab('evidence')}>
              <span className="booking-row__icon" aria-hidden="true">
                <FileCheck2 size={18} />
              </span>
              <span>
                <strong>Latest report: {report.id}</strong>
                <span className="small muted">{report.district}</span>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="ops-settle">
            <div>
              <strong>{pending.length} invoice{pending.length === 1 ? '' : 's'} pending</strong>
              <p className="small muted">Overseas customer payments</p>
            </div>
            <button type="button" className="btn btn--primary btn--small" disabled={!pending.length} onClick={() => onPay(pending[0]?.id)}>
              Settle now
            </button>
          </div>
        </section>
      </div>

      <section className="panel ops-ledger">
        <div className="panel__title-row">
          <div>
            <h2 className="panel__title">Service commissions</h2>
            <p className="small muted">Overseas customer requests matched with verified providers</p>
          </div>
        </div>
        <div className="filters">
          <label className="search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, service, district or customer"
              aria-label="Search commissions"
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <p className="muted">No commissions match.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Commission</th>
                  <th>Customer</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Fee (USD)</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.service}
                      <br />
                      <span className="small muted">
                        {c.id} · {c.providerName}
                      </span>
                    </td>
                    <td>
                      {c.clientName}
                      <br />
                      <span className="small muted">{c.overseasOrigin}</span>
                    </td>
                    <td>{c.district}</td>
                    <td>
                      <span className={`status-chip status-chip--${COMMISSION_TONE[c.status]}`}>{c.status}</span>
                      <br />
                      <span className="small muted">{c.updatedAt}</span>
                    </td>
                    <td>{formatUsd(c.amountUsd)}</td>
                    <td>
                      {c.status === 'Awaiting Payment' && (
                        <button type="button" className="btn btn--ghost btn--small" onClick={() => onPay(c.id)}>
                          Pay invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
