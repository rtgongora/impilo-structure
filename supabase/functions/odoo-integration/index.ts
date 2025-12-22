import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Odoo demo instance credentials
const ODOO_URL = "https://demo.odoo.com";
const ODOO_DB = "demo";

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
  uid?: number;
}

// JSON-RPC call to Odoo
async function jsonRpc(url: string, method: string, params: any): Promise<any> {
  console.log(`Making JSON-RPC call to ${url}, method: ${method}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('Odoo error:', data.error);
    throw new Error(data.error.data?.message || data.error.message || 'Odoo API error');
  }
  
  return data.result;
}

// Authenticate with Odoo
async function authenticate(config: OdooConfig): Promise<number> {
  console.log(`Authenticating with Odoo at ${config.url}`);
  
  const result = await jsonRpc(`${config.url}/web/session/authenticate`, 'call', {
    db: config.db,
    login: config.username,
    password: config.password,
  });
  
  if (!result || !result.uid) {
    throw new Error('Authentication failed - invalid credentials');
  }
  
  console.log(`Authenticated successfully, uid: ${result.uid}`);
  return result.uid;
}

// Search and read records from Odoo
async function searchRead(config: OdooConfig, model: string, domain: any[], fields: string[], limit: number = 100): Promise<any[]> {
  console.log(`Searching ${model} with domain:`, domain);
  
  const result = await jsonRpc(`${config.url}/web/dataset/search_read`, 'call', {
    model: model,
    domain: domain,
    fields: fields,
    limit: limit,
    context: { lang: 'en_US', tz: 'UTC' },
  });
  
  return result?.records || [];
}

// Get record count
async function searchCount(config: OdooConfig, model: string, domain: any[]): Promise<number> {
  const result = await jsonRpc(`${config.url}/web/dataset/call_kw`, 'call', {
    model: model,
    method: 'search_count',
    args: [domain],
    kwargs: {},
  });
  
  return result || 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config: customConfig, model, domain, fields, limit } = await req.json();
    
    // Use custom config or demo credentials
    const config: OdooConfig = customConfig || {
      url: ODOO_URL,
      db: ODOO_DB,
      username: 'admin',
      password: 'admin',
    };

    console.log(`Odoo action: ${action}, model: ${model || 'N/A'}`);

    switch (action) {
      case 'test_connection': {
        try {
          const uid = await authenticate(config);
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Connected successfully',
            uid: uid,
            server: config.url,
            database: config.db,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          return new Response(JSON.stringify({ 
            success: false, 
            message: errorMessage,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'get_partners': {
        await authenticate(config);
        const partners = await searchRead(config, 'res.partner', domain || [], 
          fields || ['id', 'name', 'email', 'phone', 'city', 'country_id', 'customer_rank', 'supplier_rank'],
          limit || 50
        );
        const count = await searchCount(config, 'res.partner', domain || []);
        return new Response(JSON.stringify({ success: true, records: partners, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_products': {
        await authenticate(config);
        const products = await searchRead(config, 'product.template', domain || [], 
          fields || ['id', 'name', 'list_price', 'default_code', 'categ_id', 'type', 'qty_available'],
          limit || 50
        );
        const count = await searchCount(config, 'product.template', domain || []);
        return new Response(JSON.stringify({ success: true, records: products, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_invoices': {
        await authenticate(config);
        const invoices = await searchRead(config, 'account.move', 
          domain || [['move_type', 'in', ['out_invoice', 'out_refund']]], 
          fields || ['id', 'name', 'partner_id', 'invoice_date', 'amount_total', 'state', 'payment_state'],
          limit || 50
        );
        const count = await searchCount(config, 'account.move', domain || [['move_type', 'in', ['out_invoice', 'out_refund']]]);
        return new Response(JSON.stringify({ success: true, records: invoices, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_stock': {
        await authenticate(config);
        const stock = await searchRead(config, 'stock.quant', domain || [], 
          fields || ['id', 'product_id', 'location_id', 'quantity', 'available_quantity'],
          limit || 50
        );
        const count = await searchCount(config, 'stock.quant', domain || []);
        return new Response(JSON.stringify({ success: true, records: stock, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_employees': {
        await authenticate(config);
        const employees = await searchRead(config, 'hr.employee', domain || [], 
          fields || ['id', 'name', 'job_id', 'department_id', 'work_email', 'work_phone'],
          limit || 50
        );
        const count = await searchCount(config, 'hr.employee', domain || []);
        return new Response(JSON.stringify({ success: true, records: employees, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_payments': {
        await authenticate(config);
        const payments = await searchRead(config, 'account.payment', domain || [], 
          fields || ['id', 'name', 'partner_id', 'amount', 'date', 'state', 'payment_type'],
          limit || 50
        );
        const count = await searchCount(config, 'account.payment', domain || []);
        return new Response(JSON.stringify({ success: true, records: payments, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_summary': {
        await authenticate(config);
        
        // Get counts for all modules
        const [partnersCount, productsCount, invoicesCount, stockCount, employeesCount, paymentsCount] = await Promise.all([
          searchCount(config, 'res.partner', []),
          searchCount(config, 'product.template', []),
          searchCount(config, 'account.move', [['move_type', 'in', ['out_invoice', 'out_refund']]]),
          searchCount(config, 'stock.quant', []),
          searchCount(config, 'hr.employee', []),
          searchCount(config, 'account.payment', []),
        ]);

        return new Response(JSON.stringify({ 
          success: true, 
          summary: {
            partners: partnersCount,
            products: productsCount,
            invoices: invoicesCount,
            stock: stockCount,
            employees: employeesCount,
            payments: paymentsCount,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Error in odoo-integration function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
