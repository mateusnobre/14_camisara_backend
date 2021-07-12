import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";
import jwt from "jsonwebtoken";

beforeEach(async () => {
  await connection.query("DELETE FROM purchases");
  await connection.query("DELETE FROM products");
  await connection.query("DELETE FROM sessions");
});

describe("get /purchases", () => {
  it("returns 200 for valid params", async () => {
    const insertSession = await connection.query(
      `INSERT INTO 
       sessions (user_id, created_at)
       VALUES (1, '2021-07-11' )
       RETURNING id`
    );
    const sessionId = insertSession.rows[0].id;
    const privateKey = process.env.JWT_SECRET;
    const config = { expiresIn: 60 * 60 * 24 * 7 }; // expires in 1 week
    const token = jwt.sign({ id: sessionId }, privateKey, config);

    const result = await supertest(app)
      .get(`/purchases`)
      .set({ Authorization: `Bearer ${token}` });
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns 401 for invalid token", async () => {
    const result = await supertest(app).get(`/purchases`);
    const status = result.status;
    expect(status).toEqual(401);
  });
});

describe("post /purchase/:product_id", () => {
  it("returns 200 for valid params", async () => {
    const body = { quantity: 3 };

    const insertSession = await connection.query(
      `INSERT INTO 
       sessions (user_id, created_at)
       VALUES (1, '2021-07-11' )
       RETURNING id`
    );
    const sessionId = insertSession.rows[0].id;
    const privateKey = process.env.JWT_SECRET;
    const config = { expiresIn: 60 * 60 * 24 * 7 }; // expires in 1 week
    const token = jwt.sign({ id: sessionId }, privateKey, config);

    const insertProduct = await connection.query(
      `INSERT INTO products (title) 
         VALUES ('teste') 
         RETURNING id`
    );
    const productId = insertProduct.rows[0].id;

    const result = await supertest(app)
      .post(`/purchase/${productId}`)
      .send(body)
      .set({ Authorization: `Bearer ${token}` });
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns 401 for invalid token", async () => {
    const body = { quantity: 3 };

    const insertProduct = await connection.query(
      `INSERT INTO products (title) 
       VALUES ('teste') 
       RETURNING id`
    );
    const productId = insertProduct.rows[0].id;

    const result = await supertest(app)
      .post(`/purchase/${productId}`)
      .send(body);
    const status = result.status;
    expect(status).toEqual(401);
  });

  it("returns 403 for expired token", async () => {
    const body = { quantity: 3 };

    const insertSession = await connection.query(
      `INSERT INTO 
         sessions (user_id, created_at)
         VALUES (1, '2021-07-11' )
         RETURNING id`
    );
    const sessionId = insertSession.rows[0].id;
    const privateKey = process.env.JWT_SECRET;
    const config = { expiresIn: 0 }; // expires in 0 seconds
    const token = jwt.sign({ id: sessionId }, privateKey, config);

    const insertProduct = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const productId = insertProduct.rows.id;

    const result = await supertest(app)
      .post(`/purchase/${productId}`)
      .send(body)
      .set({ Authorization: `Bearer ${token}` });
    const status = result.status;
    expect(status).toEqual(403);
  });
});

afterAll(() => {
  connection.end();
});
