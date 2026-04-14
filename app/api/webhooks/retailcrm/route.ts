import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const order = await parseOrder(request);

    if (!order || Object.keys(order).length === 0) {
      return NextResponse.json({ success: false, error: 'No order data found in payload' }, { status: 400 });
    }

    const totalSumm = calculateTotalSum(order);

    await syncOrderToSupabase(order, totalSumm);

    if (totalSumm > 50000) {
      await sendTelegramNotification(order, totalSumm);
    } else {
      console.log(`Order #${order.number || order.id} total sum (${totalSumm}) is not greater than 50000`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function parseOrder(request: Request) {
  let order: any = {};
  const contentType = request.headers.get('content-type') || '';
  
  const textBody = await request.text();
  console.log('Webhook Content-Type:', contentType);
  console.log('Webhook Raw Body:', textBody);

  if (!textBody) {
    return order;
  }

  try {
    if (contentType.includes('application/json')) {
      const body = JSON.parse(textBody);
      order = body.order || body;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(textBody);
      const orderStr = params.get('order');
      
      if (orderStr) {
        order = JSON.parse(orderStr);
      } else {
        // Fallback for custom triggers that might send flat fields
        order.id = params.get('id');
        order.number = params.get('number');
        order.totalSumm = params.get('totalSumm');
        
        // Remove empty fields from fallback
        Object.keys(order).forEach(key => {
          if (order[key] === null || order[key] === undefined) {
            delete order[key];
          }
        });
      }
    } else {
      // Fallback: try parsing as JSON if content-type is missing or unexpected
      try {
        const body = JSON.parse(textBody);
        order = body.order || body;
      } catch (e) {
        console.log('Not a JSON payload');
      }
    }
  } catch (e: any) {
    console.error('Failed to parse webhook body:', e.message);
  }

  return order;
}

function calculateTotalSum(order: any): number {
  let totalSumm = parseFloat(order.totalSumm || order.total_sum || '0');

  if (isNaN(totalSumm) && order.items && Array.isArray(order.items)) {
    totalSumm = order.items.reduce((acc: number, item: any) => acc + (item.initialPrice || 0) * (item.quantity || 1), 0);
  }

  return totalSumm;
}

async function syncOrderToSupabase(order: any, totalSumm: number) {
  const crmOrderId = parseInt(order.id, 10);
  
  if (!crmOrderId || isNaN(crmOrderId)) {
    console.error('Cannot sync to Supabase: order id is missing or invalid');
    return;
  }

  const supabaseOrder = {
    crm_order_id: crmOrderId,
    total_sum: totalSumm,
    status: order.status || 'new', // Дефолтный статус, если RetailCRM его не прислал
    created_at: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()
  };

  const { error } = await supabase
    .from('orders')
    .upsert([supabaseOrder], { onConflict: 'crm_order_id' });

  if (error) {
    console.error(`Failed to sync order #${crmOrderId} to Supabase:`, error.message);
  } else {
    console.log(`Successfully synced order #${crmOrderId} to Supabase in real-time.`);
  }
}

async function sendTelegramNotification(order: any, totalSumm: number) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram bot token or chat id not configured in environment variables');
    return;
  }

  const text = `🚨 *Крупный заказ!*\n\nЗаказ #${order.number || order.id || 'Неизвестно'}\nСумма: ${totalSumm} ₸`;
  
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    })
  });

  if (!response.ok) {
    console.error('Failed to send telegram message', await response.text());
  } else {
    console.log(`Telegram notification sent for order #${order.number || order.id}`);
  }
}
