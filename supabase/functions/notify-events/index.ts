// Aviso diario (cron 8:00 UTC): si hay un evento en la zona del jugador se lo
// cuenta; si no, le recuerda que el Escondite del día sigue sin dueño.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { zoneEvent, ZONE, BUCKET_MS } from '../_shared/spawn.ts'

const MESSAGES: Record<string, { title: string; body: string }> = {
  marea: {
    title: '🌊 ¡Marea de Chatarra en tu zona!',
    body: 'Hoy tu barrio rebosa de objetos. Sal a llenar la mochila.',
  },
  eco: {
    title: '🏺 Eco de Reliquias detectado',
    body: 'Los Desechadores pasaron por tu zona: hoy brotan épicos y reliquias.',
  },
  senal: {
    title: '🛸 Señal Alienígena cerca',
    body: 'Algo emite desde tu zona. El Gremio paga MUY bien por lo que sea.',
  },
  fallback: {
    title: '🧭 La brújula te espera',
    body: 'El Escondite de los Desechadores de hoy sigue sin dueño. ¿Será tuyo?',
  },
}

Deno.serve(async (req) => {
  if (req.headers.get('x-notify-secret') !== Deno.env.get('NOTIFY_SECRET')) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  webpush.setVapidDetails(
    'mailto:jhenigc@gmail.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: subs, error } = await admin.from('push_subscriptions').select('*')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const bucket = Math.floor(Date.now() / BUCKET_MS)
  let sent = 0
  let removed = 0

  for (const sub of subs ?? []) {
    let msg = MESSAGES.fallback
    if (typeof sub.lat === 'number' && typeof sub.lng === 'number') {
      const event = zoneEvent(Math.floor(sub.lng / ZONE), Math.floor(sub.lat / ZONE), bucket)
      if (event && MESSAGES[event]) msg = MESSAGES[event]
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(msg),
      )
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id)
        removed++
      }
    }
  }

  return new Response(JSON.stringify({ total: subs?.length ?? 0, sent, removed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
