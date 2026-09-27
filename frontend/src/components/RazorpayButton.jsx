import { useState } from 'react'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { api } from '../lib/api'
import { loadScript } from '../lib/loadScript'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * Standard Razorpay Web Checkout button.
 * amountInr: cart total in rupees (converted to paise before hitting the backend).
 * onSuccess(order): called with our internal order record once payment is verified.
 */
export default function RazorpayButton({ amountInr, discountCode, disabled, onSuccess, customer, className }) {
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)

  async function pay() {
    setError(null)
    setStatus('loading')
    try {
      await loadScript(CHECKOUT_SRC)

      const amountPaise = Math.round(amountInr * 100)
      const { order_id, amount, currency, key_id } = await api.createRazorpayOrder(amountPaise, `rcpt_${Date.now()}`)

      const rzp = new window.Razorpay({
        key: key_id || RAZORPAY_KEY_ID,
        order_id,
        amount,
        currency,
        name: 'Aura',
        description: 'Order payment',
        prefill: customer || {},
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          setStatus('loading')
          try {
            const result = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              discountCode,
            })
            if (result.success) {
              setStatus('idle')
              onSuccess?.(result.order)
            } else {
              setStatus('error')
              setError(result.error || 'Payment could not be verified.')
            }
          } catch (e) {
            setStatus('error')
            setError(e.message)
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle')
          },
        },
      })

      rzp.on('payment.failed', (resp) => {
        setStatus('error')
        setError(resp.error?.description || 'Payment failed. Please try again.')
      })

      rzp.open()
      setStatus('idle')
    } catch (e) {
      setStatus('error')
      setError(e.message)
    }
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={disabled || status === 'loading'}
        className={className || 'flex w-full items-center justify-center gap-2 rounded-full bg-[#0c2451] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2451]/90 disabled:opacity-50'}
      >
        <LockClosedIcon className="h-4 w-4" />
        {status === 'loading' ? 'Processing…' : 'Pay with Razorpay'}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
