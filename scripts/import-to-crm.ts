import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RETAILCRM_URL = process.env.RETAILCRM_URL?.replace(/\/$/, '');
const RETAILCRM_API_KEY = process.env.RETAILCRM_API_KEY;

if (!RETAILCRM_URL || !RETAILCRM_API_KEY) {
  console.error('Missing RETAILCRM_URL or RETAILCRM_API_KEY in .env');
  process.exit(1);
}

const importOrders = async () => {
  const dataPath = path.join(__dirname, '../mock_orders.json');
  const mockOrders = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Loaded ${mockOrders.length} orders from mock_orders.json`);

  for (let i = 0; i < mockOrders.length; i++) {
    const orderData = mockOrders[i];
    
    // Map items to RetailCRM structure
    const order = {
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      phone: orderData.phone,
      email: orderData.email,
      status: orderData.status || 'new',
      items: orderData.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        initialPrice: item.initialPrice
      })),
      delivery: orderData.delivery ? {
        address: orderData.delivery.address
      } : undefined,
      customFields: orderData.customFields
    };

    try {
      const params = new URLSearchParams();
      params.append('order', JSON.stringify(order));
      params.append('apiKey', RETAILCRM_API_KEY);

      const response = await axios.post(
        `${RETAILCRM_URL}/api/v5/orders/create`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data.success) {
        console.log(`Order ${i + 1}/${mockOrders.length} created: ID ${response.data.id || response.data.order?.id || 'Unknown'}`);
      } else {
        console.error(`Error creating order ${i + 1}:`, response.data);
      }
    } catch (error: any) {
      console.error(`Error creating order ${i + 1}:`, error.response?.data || error.message);
    }
    
    // Delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

importOrders();