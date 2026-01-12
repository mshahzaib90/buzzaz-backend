require('dotenv').config();
const db = require('../services/db');

(async () => {
  try {
    const res = await db.query("SELECT table_schema, table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY table_schema, column_name");
    console.log('Users table columns:', res.rows);
    const ugc = await db.query("SELECT table_schema, table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'ugc_creators' ORDER BY column_name");
    console.log('UGC creators table columns:', ugc.rows);
    const cur = await db.query("SELECT current_schema() AS schema, current_database() AS db");
    console.log('Current schema/db:', cur.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Inspect error:', err);
    process.exit(1);
  }
})();

