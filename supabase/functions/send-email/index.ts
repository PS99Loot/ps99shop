import { corsHeaders } from '@supabase/supabase-js/cors'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const SENDER = { name: 'PS99Loot', email: 'noreply@ps99loot.com' }

interface EmailRequest {
  template: 'welcome' | 'order_confirmation'
  to: { email: string; name?: string }
  data?: Record<string, string>
}

function buildWelcome(): { subject: string; textContent: string } {
  return {
    subject: 'Welcome to PS99Loot',
    textContent: `Welcome to PS99Loot!

Your account has been created successfully.

You can now sign in and start ordering random Huges at some of the lowest prices available.

Thank you for joining PS99Loot.

- PS99Loot Team`,
  }
}

function buildOrderConfirmation(data: Record<string, string>): { subject: string; textContent: string } {
  return {
    subject: 'PS99Loot Order Confirmation',
    textContent: `Thank you for your order at PS99Loot.

Your order has been created successfully.

Order ID: ${data.ORDER_ID || ''}
Access Code: ${data.ACCESS_CODE || ''}
Quantity: ${data.QUANTITY || ''}x Random Huges
Total: $${data.TOTAL_USD || ''}

Please save your Order ID and Access Code somewhere safe.

Your delivery will be handled manually after payment is confirmed.

Thank you for choosing PS99Loot.

- PS99Loot Team`,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: EmailRequest = await req.json()
    const { template, to, data } = body

    if (!template || !to?.email) {
      return new Response(JSON.stringify({ error: 'Missing template or recipient' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let email: { subject: string; textContent: string }

    switch (template) {
      case 'welcome':
        email = buildWelcome()
        break
      case 'order_confirmation':
        email = buildOrderConfirmation(data || {})
        break
      default:
        return new Response(JSON.stringify({ error: 'Unknown template' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const brevoPayload = {
      sender: SENDER,
      to: [{ email: to.email, name: to.name || to.email }],
      subject: email.subject,
      textContent: email.textContent,
    }

    console.log(`Sending ${template} email to ${to.email}`)

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(brevoPayload),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Brevo API error:', JSON.stringify(result))
      return new Response(JSON.stringify({ error: 'Failed to send email', details: result }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Email sent successfully: ${template} to ${to.email}`, result)

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-email error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
