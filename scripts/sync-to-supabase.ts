import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const RETAILCRM_URL = process.env.RETAILCRM_URL?.replace(/\/$/, '');
const RETAILCRM_API_KEY = process.env.RETAILCRM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!RETAILCRM_URL || !RETAILCRM_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing configuration in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface CrmOrder {
  id: number | string;
  totalSumm?: number;
  items?: Array<{ initialPrice?: number; quantity?: number }>;
  status?: string;
  createdAt?: string;
}

interface SupabaseOrder {
  crm_order_id: number | string;
  total_sum: number;
  status: string;
  created_at: string;
}

async function fetchCrmOrders(page: number) {
  const response = await axios.get(`${RETAILCRM_URL}/api/v5/orders`, {
    params: {
      apiKey: RETAILCRM_API_KEY,
      limit: 100,
      page: page
    }
  });

  if (!response.data.success) {
    throw new Error(`RetailCRM API error: ${JSON.stringify(response.data)}`);
  }

  return {
    orders: response.data.orders as CrmOrder[],
    totalPages: response.data.pagination?.totalPageCount || 1
  };
}

function calculateOrderTotal(order: CrmOrder): number {
  if (order.totalSumm !== undefined && order.totalSumm !== null) {
    return order.totalSumm;
  }
  
  return order.items?.reduce((acc, item) => {
    return acc + (item.initialPrice || 0) * (item.quantity || 1);
  }, 0) || 0;
}

function mapToSupabaseOrder(order: CrmOrder): SupabaseOrder {
  return {
    crm_order_id: order.id,
    total_sum: calculateOrderTotal(order),
    status: order.status || 'unknown',
    created_at: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()
  };
}

async function upsertToSupabase(orders: SupabaseOrder[]) {
  const { error } = await supabase
    .from('orders')
    .upsert(orders, { onConflict: 'crm_order_id' });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }
}

const syncOrders = async () => {
  try {
    let currentPage = 1;
    let totalPages = 1;
    let syncedCount = 0;

    console.log('Starting sync from RetailCRM to Supabase...');

    do {
      console.log(`Processing page ${currentPage}...`);
      
      const { orders, totalPages: fetchedTotalPages } = await fetchCrmOrders(currentPage);
      totalPages = fetchedTotalPages;

      if (!orders || orders.length === 0) break;

      const supabaseOrders = orders.map(mapToSupabaseOrder);
      await upsertToSupabase(supabaseOrders);

      syncedCount += supabaseOrders.length;
      console.log(`Successfully synced ${supabaseOrders.length} orders from page ${currentPage}`);

      currentPage++;
      
      if (currentPage <= totalPages) {
        // Sleep slightly to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } while (currentPage <= totalPages);

    console.log(`Sync completed successfully! Total orders synced: ${syncedCount}`);

  } catch (error: any) {
    console.error('Sync failed:', error.message || error);
  }
};

syncOrders();