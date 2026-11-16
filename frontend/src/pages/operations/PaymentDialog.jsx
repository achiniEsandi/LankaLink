import { CircleCheck, Lock } from 'lucide-react'
import { useState } from 'react'
import OpsDialog from './OpsDialog'
import { CURRENCY_RATES } from './sampleData'

const WALLETS = ['Apple Pay', 'Google Pay']

// Demo checkout for an overseas customer's invoice. Card details are never collected here:
// a real payment would hand over to the gateway's own secure page.
export default function PaymentDialog({ open, commission, onClose, onPaid }) {
  const [currency, setCurrency] = useState('USD')
  const [method, setMethod] = useState('card')
  const [wallet, setWallet] = useState(WALLETS[0])
  const [phase, setPhase] = useState('form')

  if (!commission) return null
  const rate = CURRENCY_RATES[currency]
  const charge = `${rate.symbol}${(commission.amountUsd * rate.usdFactor).toFixed(2)}`
  const lkr = Math.round(commission.amountUsd * CURRENCY_RATES.USD.lkrRate).toLocaleString('en-LK')

  function close() {
    setPhase('form')
    onClose()
  }

  function pay(e) {
    e.preventDefault()
    setPhase('processing')
    window.setTimeout(() => {
      setPhase('cleared')
      onPaid(commission, charge, method === 'card' ? 'card' : wallet)
    }, 1100)
  }

  return (
    <OpsDialog open={open} title={phase === 'cleared' ? 'Payment received' : 'Pay invoice'} onClose={close}>
      {phase === 'cleared' ? (
        <div className="ops-paid">
          <CircleCheck size={40} aria-hidden="true" className="ops-check--ok" />
          <p>
            <strong>{charge}</strong> paid for {commission.id}.
          </p>
          <p className="small muted">The commission is now marked as completed.</p>
          <div className="dialog__actions">
            <button type="button" className="btn btn--primary btn--small" onClick={close}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={pay}>
          <dl className="summary-list">
            <div>
              <dt>Invoice</dt>
              <dd>
                {commission.id} · {commission.service}
              </dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>
                {commission.clientName} ({commission.overseasOrigin})
              </dd>
            </div>
          </dl>

          <p className="group__label ops-dialog__label">Currency</p>
          <div className="pills" role="radiogroup" aria-label="Currency">
            {Object.keys(CURRENCY_RATES).map((code) => (
              <label key={code} className={`pill pill--small${currency === code ? ' pill--on' : ''}`}>
                <input type="radio" name="currency" checked={currency === code} onChange={() => setCurrency(code)} />
                {code}
              </label>
            ))}
          </div>

          <p className="group__label ops-dialog__label">Pay with</p>
          <div className="pills" role="radiogroup" aria-label="Payment method">
            <label className={`pill pill--small${method === 'card' ? ' pill--on' : ''}`}>
              <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} />
              Card
            </label>
            {WALLETS.map((w) => (
              <label key={w} className={`pill pill--small${method === 'wallet' && wallet === w ? ' pill--on' : ''}`}>
                <input
                  type="radio"
                  name="method"
                  checked={method === 'wallet' && wallet === w}
                  onChange={() => {
                    setMethod('wallet')
                    setWallet(w)
                  }}
                />
                {w}
              </label>
            ))}
          </div>

          <p className="note ops-dialog__note">
            <Lock size={14} aria-hidden="true" /> Card details are entered on the payment provider's secure page. LankaLink never sees
            them.
          </p>

          <div className="summary-list summary-list__total ops-total">
            <span>Total</span>
            <span>
              {charge} <span className="small muted">≈ LKR {lkr}</span>
            </span>
          </div>

          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={close} disabled={phase === 'processing'}>
              Cancel
            </button>
            <button type="submit" className="btn btn--ink btn--small" disabled={phase === 'processing'}>
              {phase === 'processing' ? 'Processing…' : `Pay ${charge}`}
            </button>
          </div>
        </form>
      )}
    </OpsDialog>
  )
}
