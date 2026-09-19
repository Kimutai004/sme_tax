import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let db = null;

export async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, '../../database.sqlite'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'business_owner',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      kra_pin TEXT NOT NULL,
      physical_address TEXT,
      postal_address TEXT,
      email TEXT,
      phone TEXT,
      business_type TEXT,
      industry TEXT,
      vat_registered INTEGER DEFAULT 0,
      vat_number TEXT,
      currency TEXT DEFAULT 'KES',
      etims_enabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      physical_address TEXT,
      kra_pin TEXT,
      customer_type TEXT DEFAULT 'retail',
      credit_limit REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT,
      unit_of_measure TEXT DEFAULT 'piece',
      unit_price REAL NOT NULL,
      cost_price REAL,
      stock_quantity REAL DEFAULT 0,
      vat_rate REAL DEFAULT 16.0,
      vat_exempt INTEGER DEFAULT 0,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_id INTEGER,
      invoice_date DATETIME,
      due_date DATETIME,
      status TEXT DEFAULT 'draft',
      subtotal REAL NOT NULL,
      vat_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      balance REAL NOT NULL,
      notes TEXT,
      payment_method TEXT,
      etims_invoice_id TEXT,
      etims_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      vat_amount REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS tax_obligations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      tax_type TEXT NOT NULL,
      period TEXT,
      period_start DATE,
      period_end DATE,
      calculated_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      due_date DATE,
      filed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      related_id INTEGER,
      related_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reconciliation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      period TEXT,
      period_start DATE,
      period_end DATE,
      internal_sales REAL DEFAULT 0,
      etims_sales REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      status TEXT DEFAULT 'matched',
      last_checked DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    );
  `);

  console.log('Database initialized successfully');
  return db;
}
