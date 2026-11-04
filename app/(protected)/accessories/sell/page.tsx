import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SellAccessoryPage() {
  // /accessories/sell has no ID. Real sell page is /accessories/[id]/sell
  // Redirect to accessories list so user picks an item to sell
  redirect('/accessories')
}