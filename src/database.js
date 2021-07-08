import pg from "pg";

const { Pool } = pg;

const user = "postgres";
const password = "123456";
const host = "localhost";
const port = 5432;
const database = process.env.NODE_ENV ? "camisara_test" : "camisara";

const databaseConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

function get_connection() {
  if (process.env.DATABASE_URL) {
    const connection = new Pool(databaseConfig);
    return connection;
  } else {
    const connection = new Pool({
      user,
      password,
      host,
      port,
      database,
    });
    return connection;
  }
}

const connection = get_connection();
export default connection;
