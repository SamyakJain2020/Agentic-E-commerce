import { useEffect, useState } from 'react'

const STEPS = ['scanning', 'success']

export default function BiometricModal({ open, amount, onConfirm, onCancel }) {
  const [step, setStep] = useState('scanning')

  useEffect(() => {
    if (!open) return
    setStep('scanning')
    const t1 = setTimeout(() => setStep('success'), 1400)
    const t2 = setTimeout(() => onConfirm(), 2100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open, onConfirm])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span className={`absolute inset-0 rounded-full ${step === 'scanning' ? 'animate-ping bg-indigo-400/40' : 'bg-emerald-400/30'}`} />
          <div className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg ${step === 'scanning' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
            {step === 'scanning' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.972M3.75 21c1.5-1.5 2.5-3.5 2.5-6.5m0 0a4.5 4.5 0 118.5-2m-8.5 2v0a11.95 11.95 0 002.5 7.5M15.75 8.75a4.5 4.5 0 00-.75-2.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="mt-6 text-lg font-bold text-neutral-900">
          {step === 'scanning' ? 'Verifying biometrics…' : 'Identity confirmed'}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {step === 'scanning'
            ? 'Hold still — confirming it’s you to authorize this payment.'
            : `Payment of $${amount?.toFixed(2)} authorized.`}
        </p>

        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
          Demo mode: this is a simulated biometric check, not a real fingerprint/Face ID capture.
        </p>

        {step === 'scanning' && (
          <button onClick={onCancel} className="mt-4 text-xs font-medium text-neutral-400 hover:text-neutral-600">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
