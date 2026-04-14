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

interface MockOrderItem {
  productName: string;
  quantity: number;
  initialPrice: number;
}

interface MockOrder {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status?: string;
  items: MockOrderItem[];
  delivery?: {
    address: string;
  };
  customFields?: Record<string, any>;
}

/**
 * Загружает моковые заказы из JSON файла
 */
function loadMockOrders(): MockOrder[] {
  const dataPath = path.join(__dirname, '../mock_orders.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

/**
 * Преобразует данные заказа в формат API RetailCRM
 */
function mapToRetailCrmOrder(orderData: MockOrder) {
  return {
    firstName: orderData.firstName,
    lastName: orderData.lastName,
    phone: orderData.phone,
    email: orderData.email,
    status: orderData.status || 'new',
    items: orderData.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      initialPrice: item.initialPrice
    })),
    delivery: orderData.delivery ? {
      address: orderData.delivery.address
    } : undefined,
    customFields: orderData.customFields
  };
}

/**
 * Отправляет один заказ в RetailCRM
 */
async function sendOrderToCrm(order: any): Promise<{ success: boolean; id?: number; error?: any }> {
  try {
    const params = new URLSearchParams();
    params.append('order', JSON.stringify(order));
    params.append('apiKey', RETAILCRM_API_KEY!);

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
      return { 
        success: true, 
        id: response.data.id || response.data.order?.id 
      };
    }
    return { success: false, error: response.data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

/**
 * Основная функция импорта всех заказов
 */
const importOrders = async () => {
  try {
    const mockOrders = loadMockOrders();
    console.log(`Loaded ${mockOrders.length} orders from mock_orders.json`);

    for (let i = 0; i < mockOrders.length; i++) {
      const orderData = mockOrders[i];
      const retailCrmOrder = mapToRetailCrmOrder(orderData);
      
      const result = await sendOrderToCrm(retailCrmOrder);
      
      if (result.success) {
        console.log(`Order ${i + 1}/${mockOrders.length} created: ID ${result.id || 'Unknown'}`);
      } else {
        console.error(`Error creating order ${i + 1}:`, result.error);
      }
      
      // Задержка 300мс для соблюдения лимитов API
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('Import process finished.');
  } catch (error) {
    console.error('Import failed:', error);
  }
};

importOrders();
