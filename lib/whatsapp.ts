// WhatsApp helper for Eminent Phone Clinic
// No API key needed - opens WhatsApp with pre-filled message

export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('234')) return cleaned
  if (cleaned.startsWith('0')) return '234' + cleaned.slice(1)
  if (cleaned.length === 10) return '234' + cleaned
  return cleaned
}

export function buildReadyMessage(opts: {
  customerName: string
  device: string
  repairCost?: number
  balance?: number
}): string {
  const { customerName, device, repairCost, balance } = opts
  const firstName = customerName.trim().split(' ')[0]
  let msg = `Hi ${firstName} 👋\n\nGood news! Your ${device} is READY for pickup at Eminent Phone Clinic ✅\n\n`
  if (repairCost) msg += `Repair cost: ₦${repairCost.toLocaleString()}\n`
  if (balance && balance > 0) msg += `Balance to pay: ₦${balance.toLocaleString()}\n`
  msg += `\n📍 Come pick it up today — 07064245688 | 09061626394\n\nThank you for trusting us 🙏`
  return msg
}

export function buildInProgressMessage(opts: { customerName: string; device: string }): string {
  const firstName = opts.customerName.trim().split(' ')[0]
  return `Hi ${firstName} 👋\n\nUpdate: Your ${opts.device} is now being repaired by our technician 🔧\n\nWe will message you as soon as it is ready.\n\n— Eminent Phone Clinic`
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const formatted = formatNigerianPhone(phone)
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
}