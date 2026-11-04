import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { qty } = await req.json()
  if (!qty || qty <= 0) return NextResponse.json({ error: 'Invalid qty' }, { status: 400 })

  const { data: acc } = await supabase.from('accessories').select('stock_quantity').eq('id', id).single()
  if (!acc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('accessories').update({ stock_quantity: acc.stock_quantity + qty }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, new_stock: acc.stock_quantity + qty })
}