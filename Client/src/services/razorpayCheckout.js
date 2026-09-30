const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const SCRIPT_ID = 'razorpay-checkout-script'

let scriptPromise = null

export function getRazorpayKeyId() {
  return (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim()
}

export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout needs a browser session'))
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  const existing = document.getElementById(SCRIPT_ID)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = existing || document.createElement('script')
    const onLoad = () => {
      cleanup()
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay checkout failed to initialise'))
    }
    const onError = () => {
      cleanup()
      scriptPromise = null
      reject(new Error('Unable to load the Razorpay checkout script'))
    }
    const cleanup = () => {
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }

    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)

    if (!existing) {
      script.id = SCRIPT_ID
      script.src = SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }
  })

  return scriptPromise
}

/**
 * Opens the Razorpay checkout sheet and resolves with the checkout response.
 * Rejects with a user-facing message when the key is missing or the sheet is
 * dismissed or fails.
 */
export async function openRazorpayCheckout({ orderId, amount, currency = 'INR', keyId, name, description, prefill, notes, theme }) {
  const resolvedKeyId = (keyId || getRazorpayKeyId()).trim()
  if (!resolvedKeyId) {
    throw new Error('Razorpay key is not configured. Add VITE_RAZORPAY_KEY_ID to Client/.env and restart the dev server.')
  }
  if (!orderId) {
    throw new Error('Razorpay order id is missing')
  }

  const Razorpay = await loadRazorpayCheckout()

  return new Promise((resolve, reject) => {
    const instance = new Razorpay({
      key: resolvedKeyId,
      order_id: orderId,
      amount,
      currency,
      name: name || 'KROM DETAIL',
      description: description || 'Service payment',
      prefill: prefill || undefined,
      notes: notes || undefined,
      theme: theme || { color: '#d94f3d' },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
      handler: (response) => {
        if (!response?.razorpay_payment_id) {
          reject(new Error('Razorpay did not return a payment id'))
          return
        }
        resolve(response)
      },
    })

    instance.open()
  })
}
