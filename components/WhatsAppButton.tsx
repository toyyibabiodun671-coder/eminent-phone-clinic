'use client'

import { buildReadyMessage, buildInProgressMessage, buildWhatsAppLink } from '@/lib/whatsapp'

type Props = {
  customerName: string
  customerPhone: string
  device: string
  repairCost?: number
  balance?: number
  status: string
}

export default function WhatsAppButton({ customerName, customerPhone, device, repairCost, balance, status }: Props) {
  if (!customerPhone) return null

  const isReady = status === 'ready'
  const message = isReady
    ? buildReadyMessage({ customerName, device, repairCost, balance })
    : buildInProgressMessage({ customerName, device })

  const link = buildWhatsAppLink(customerPhone, message)

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90 ${isReady ? 'bg-green-600' : 'bg-[#25D366]'}`}
    >
      <span>💬</span>
      {isReady ? 'Send WhatsApp — Ready for Pickup' : 'Send WhatsApp Update'}
    </a>
  )
}