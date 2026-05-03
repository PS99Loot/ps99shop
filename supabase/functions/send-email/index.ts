const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const SENDER = { name: 'PS99Loot', email: 'noreply@ps99loot.com' }

interface EmailRequest {
  template: 'welcome' | 'order_confirmation'
  to: { email: string; name?: string }
  data?: Record<string, string>
}

function buildWelcome(): { subject: string; htmlContent: string; textContent: string } {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thank You for Signing Up</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td align="center" style="background:#6c5ce7; padding:25px;">
              <img src="https://www.ps99loot.com/shoplogo.png" alt="PS99Loot Logo" style="max-width:160px; display:block; margin-bottom:15px;">
              <h1 style="color:#ffffff; margin:0;">Welcome to PS99Loot</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:35px 25px;">
              <h2 style="color:#222;">Thank you for signing up 🎉</h2>
              <p style="color:#555; font-size:16px; line-height:1.6;">
                Your PS99Loot account has been created successfully.
                You can now browse items, place orders, and get access to exclusive deals.
              </p>
              <a href="https://ps99loot.com" style="background:#6c5ce7; color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold; display:inline-block; margin-top:15px;">
                Start Shopping
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fafafa; padding:20px; color:#888; font-size:12px;">
              © 2026 PS99Loot. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return {
    subject: 'Welcome to PS99Loot',
    htmlContent,
    textContent: 'Thank you for signing up to PS99Loot. Visit https://ps99loot.com to start shopping.',
  }
}

function buildOrderConfirmation(data: Record<string, string>): { subject: string; htmlContent: string; textContent: string } {
  const orderId = data.ORDER_ID || ''
  const accessCode = data.ACCESS_CODE || ''
  const amount = `$${data.TOTAL_USD || '0.00'}`

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmed</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td align="center" style="background:#6c5ce7; padding:25px;">
              <img src="https://www.ps99loot.com/shoplogo.png" alt="PS99Loot Logo" style="max-width:160px; display:block; margin-bottom:15px;">
              <h1 style="color:#ffffff; margin:0;">Order Confirmed</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:30px 25px;">
              <h2 style="color:#222;">Thank you for your order!</h2>
              <p style="color:#555; font-size:16px;">Your PS99Loot order has been confirmed. Here are your order details:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border:1px solid #eee; border-radius:10px;">
                <tr>
                  <td style="padding:14px; color:#555;">Order ID</td>
                  <td align="right" style="padding:14px; font-weight:bold;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding:14px; color:#555;">Amount</td>
                  <td align="right" style="padding:14px; font-weight:bold;">${amount}</td>
                </tr>
                <tr>
                  <td style="padding:14px; color:#555;">Access Code</td>
                  <td align="right" style="padding:14px;">
                    <span style="background:#f1f1ff; border:2px dashed #6c5ce7; color:#6c5ce7; padding:10px 14px; border-radius:8px; font-weight:bold;">
                      ${accessCode}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="color:#777; font-size:14px; margin-top:25px;">Please keep your access code safe.</p>
              <a href="https://ps99loot.com" style="background:#6c5ce7; color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold; display:inline-block;">
                Visit PS99Loot
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fafafa; padding:20px; color:#888; font-size:12px;">
              © 2026 PS99Loot. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textContent = `PS99Loot Order Confirmed

Order ID: ${orderId}
Amount: ${amount}
Access Code: ${accessCode}

Please keep your access code safe. Visit https://ps99loot.com to track your order.`

  return {
    subject: 'PS99Loot Order Confirmation',
    htmlContent,
    textContent,
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

    let email: { subject: string; htmlContent: string; textContent: string }

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
      htmlContent: email.htmlContent,
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

    console.log(`Email sent successfully: ${template} to ${to.email}`)

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
