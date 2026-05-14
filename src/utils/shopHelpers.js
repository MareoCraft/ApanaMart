export const ORDER_STAGES = [
  'Pending',
  'Accepted',
  'Out for delivery',
  'Delivered',
]

export const STAGE_DURATION_MS = 15000

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatPrice(value) {
  return priceFormatter.format(value)
}

export function getStatusIndex(order, nowMs) {
  const explicitStatusIndex = ORDER_STAGES.indexOf(order.status)
  if (explicitStatusIndex >= 0) {
    return explicitStatusIndex
  }

  if (order.status === 'Out For Delivery') {
    return ORDER_STAGES.indexOf('Out for delivery')
  }

  const elapsed = Math.max(0, nowMs - order.createdAt)
  return Math.min(ORDER_STAGES.length - 1, Math.floor(elapsed / STAGE_DURATION_MS))
}

export function buildSlots() {
  return [
    'Deliver in 15-20 mins'
  ]
}
// export function buildSlots() {
//   return [
//     'Deliver in 10-15 mins',
//     'Deliver in 20-30 mins',
//     'Deliver by Tonight 8 PM',
//     'Deliver Tomorrow Morning',
//   ]
// }
