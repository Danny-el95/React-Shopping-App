import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { pool } from './src/db/pool.js';

async function startServer() {
  try {
    // Check that MySQL is available before starting the API.
    await pool.query('SELECT 1');
    console.log('Connected to MySQL');

    // Express 5 passes any server startup error to this callback.
    app.listen(env.PORT, (error) => {
      if (error) {
        console.error('Could not start the server:', error.code);
        process.exit(1);
      }

      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Could not connect to MySQL:', error.code);
    process.exit(1);
  }
}

startServer();
