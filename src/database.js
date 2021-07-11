import pg from "pg";

const { Pool } = pg;

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
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database:
        process.env.NODE_ENV === "test"
          ? process.env.DB_DATABASE_TEST
          : process.env.DB_DATABASE,
    });
    return connection;
  }
}

const connection = get_connection();
export default connection;
