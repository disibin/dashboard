const fs = require('fs');
const { Pool } = require('pg');

const envContent = fs.readFileSync('d:/disibin/dashboard/.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const pool = new Pool({
  user: envVars.PG_USER,
  password: envVars.PG_PASSWORD,
  host: envVars.PG_HOST,
  port: Number(envVars.PG_PORT || 5432),
  database: envVars.PG_DATABASE,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Creating staff_notes and staff_todos tables in DB...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_notes (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES staffs(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );

      DROP TRIGGER IF EXISTS update_staff_notes_modtime ON staff_notes;
      CREATE TRIGGER update_staff_notes_modtime 
      BEFORE UPDATE ON staff_notes 
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

      CREATE INDEX IF NOT EXISTS idx_staff_notes_staff_id ON staff_notes(staff_id);

      CREATE TABLE IF NOT EXISTS staff_todos (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES staffs(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );

      DROP TRIGGER IF EXISTS update_staff_todos_modtime ON staff_todos;
      CREATE TRIGGER update_staff_todos_modtime 
      BEFORE UPDATE ON staff_todos 
      FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

      CREATE INDEX IF NOT EXISTS idx_staff_todos_staff_id ON staff_todos(staff_id);
      CREATE INDEX IF NOT EXISTS idx_staff_todos_is_completed ON staff_todos(staff_id, is_completed);
    `);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
