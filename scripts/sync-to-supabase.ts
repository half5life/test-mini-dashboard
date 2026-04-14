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

const syncOrders = async () => {
  try {
    let currentPage = 1;
    let totalPages = 1;
    let syncedCount = 0;

    console.log('Starting sync from RetailCRM to Supabase...');

    do {
      console.log(`Fetching orders page ${currentPage}...`);
      const response = await axios.get(`${RETAILCRM_URL}/api/v5/orders`, {
        params: {
          apiKey: RETAILCRM_API_KEY,
          limit: 100,
          page: currentPage
        }
      });

      if (!response.data.success) {
        console.error('Failed to fetch orders from RetailCRM', response.data);
        break;
      }

      const orders = response.data.orders;
      if (!orders || orders.length === 0) {
        break;
      }

      if (response.data.pagination) {
        totalPages = response.data.pagination.totalPageCount;
      }

      const supabaseOrders = orders.map((order: any) => {
        // Use totalSumm if it's available, else calculate from items
        let totalSum = order.totalSumm;
        if (totalSum === undefined || totalSum === null) {
          totalSum = order.items?.reduce((acc: number, item: any) => {
            return acc + (item.initialPrice || 0) * (item.quantity || 1);
          }, 0) || 0;
        }

        return {
          crm_order_id: order.id,
          total_sum: totalSum,
          status: order.status,
          // RetailCRM provides createdAt in YYYY-MM-DD HH:mm:ss format, Supabase wants ISO8601 or similar.
          created_at: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()
        };
      });

      // Upsert into Supabase matching crm_order_id
      const { data, error } = await supabase
        .from('orders')
        .upsert(supabaseOrders, { onConflict: 'crm_order_id' })
        .select();

      if (error) {
        console.error(`Error upserting page ${currentPage} to Supabase:`, error.message);
        break;
      } else {
        syncedCount += supabaseOrders.length;
        console.log(`Upserted ${supabaseOrders.length} orders from page ${currentPage}`);
      }

      currentPage++;
      // Sleep slightly to respect rate limits if fetching many pages
      await new Promise(resolve => setTimeout(resolve, 300));

    } while (currentPage <= totalPages);

    console.log(`Sync completed successfully! Total orders synced: ${syncedCount}`);

  } catch (error: any) {
    console.error('Error syncing orders:', error.message || error);
  }
};

syncOrders();