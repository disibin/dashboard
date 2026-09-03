const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      value = value.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || "6543", 10),
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("Connecting to PostgreSQL database...");

    console.log("Cleaning up staffs table...");
    await client.query("ALTER TABLE staffs DROP COLUMN IF EXISTS base_salary;");

    console.log("Dropping old payroll tables if existing...");
    await client.query("DROP TABLE IF EXISTS salary CASCADE;");
    await client.query("DROP TABLE IF EXISTS payroll CASCADE;");

    console.log("Creating payscale table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS payscale (
        id SERIAL PRIMARY KEY,
        grade_name TEXT NOT NULL,
        grade_level INT DEFAULT 1,
        basic_salary INT DEFAULT 0,
        house_rent INT DEFAULT 0,
        medical_allowance INT DEFAULT 0,
        other_allowance INT DEFAULT 0,
        total_salary INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log("Creating staff_salary table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_salary (
        id SERIAL PRIMARY KEY,
        staff_id INT UNIQUE REFERENCES staffs(id) ON DELETE CASCADE,
        payscale_id INT REFERENCES payscale(id) ON DELETE SET NULL,
        custom_bonus INT DEFAULT 0,
        custom_deduction INT DEFAULT 0,
        net_salary INT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    console.log("Creating salary_payments table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES staffs(id) ON DELETE CASCADE,
        staff_salary_id INT REFERENCES staff_salary(id) ON DELETE SET NULL,
        month INT CHECK (month BETWEEN 1 AND 12),
        year INT NOT NULL,
        amount INT NOT NULL,
        paid_amount INT DEFAULT 0,
        due_amount INT DEFAULT 0,
        payment_method TEXT,
        transaction_id TEXT,
        note TEXT,
        status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'cancelled')),
        paid_by INT REFERENCES staffs(id) ON DELETE SET NULL,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        CONSTRAINT unique_staff_month_year UNIQUE (staff_id, month, year)
      );
    `);

    console.log("Creating auto_generate_monthly_salary_payments PL/pgSQL function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_generate_monthly_salary_payments(target_month INT, target_year INT)
      RETURNS INT AS $$
      DECLARE
          gen_count INT := 0;
          ss RECORD;
      BEGIN
          FOR ss IN 
              SELECT ss.id AS staff_salary_id, ss.staff_id, ss.net_salary 
              FROM staff_salary ss
              JOIN staffs st ON st.id = ss.staff_id
              WHERE st.is_active = TRUE AND ss.status = 'active'
          LOOP
              IF NOT EXISTS (SELECT 1 FROM salary_payments WHERE staff_id = ss.staff_id AND month = target_month AND year = target_year) THEN
                  INSERT INTO salary_payments (staff_id, staff_salary_id, month, year, amount, paid_amount, due_amount, status)
                  VALUES (ss.staff_id, ss.staff_salary_id, target_month, target_year, ss.net_salary, 0, ss.net_salary, 'unpaid');
                  gen_count := gen_count + 1;
              END IF;
          END LOOP;
          RETURN gen_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log("Database tables migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
