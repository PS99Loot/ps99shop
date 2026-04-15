import { supabase } from '@/integrations/supabase/client';

export async function sendWelcomeEmail(email: string) {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        template: 'welcome',
        to: { email },
      },
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  data: {
    orderId: string;
    accessCode: string;
    itemsSummary: string;
    totalUsd: string;
  }
) {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        template: 'order_confirmation',
        to: { email },
        data: {
          ORDER_ID: data.orderId,
          ACCESS_CODE: data.accessCode,
          ITEMS_SUMMARY: data.itemsSummary,
          TOTAL_USD: data.totalUsd,
        },
      },
    });
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}
