import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";
import jwt from "jsonwebtoken";

beforeEach(async () => {
  await connection.query("DELETE FROM evaluations");
  await connection.query("DELETE FROM products");
  await connection.query("DELETE FROM sessions");
});

describe("get /evaluation/:product_id", () => {
  it("returns 200 for valid params", async () => {
    const insertQuery = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const productId = insertQuery.rows[0].id;

    await connection.query(
      `INSERT INTO 
         evaluations (product_id)
         VALUES ( $1 )`,
      [productId]
    );

    const result = await supertest(app).get(`/evaluation/${productId}`);
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns 404 for not found", async () => {
    const result = await supertest(app).get(`/evaluation/-1`);
    const status = result.status;
    expect(status).toEqual(404);
  });
});

describe("post /evaluation/:product_id", () => {
  it("returns 200 for valid params", async () => {
    const body = { rating: 5, title: "teste", opinion: "teste" };

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

    const insertProduct = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const productId = insertProduct.rows[0].id;

    const result = await supertest(app)
      .post(`/evaluation/${productId}`)
      .send(body)
      .set({ Authorization: `Bearer ${token}` });
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns 401 for invalid token", async () => {
    const body = { rating: 5, title: "teste", opinion: "teste" };

    const insertProduct = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const productId = insertProduct.rows[0].id;

    const result = await supertest(app)
      .post(`/evaluation/${productId}`)
      .send(body);
    const status = result.status;
    expect(status).toEqual(401);
  });

  it("returns 403 for expired token", async () => {
    const body = { rating: 5, title: "teste", opinion: "teste" };

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
      .post(`/evaluation/${productId}`)
      .send(body)
      .set({ Authorization: `Bearer ${token}` });
    const status = result.status;
    expect(status).toEqual(403);
  });

  it("returns 400 for invalid params", async () => {
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

    const insertProduct = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const productId = insertProduct.rows.id;

    const body1 = { rating: 6, title: "teste", opinion: "teste" };
    const body2 = { rating: 0, title: "teste", opinion: "teste" };
    const body3 = { title: "teste", opinion: "teste" };
    const body4 = { rating: 5, opinion: "teste" };
    const body5 = { rating: 5, title: "teste" };

    [body1, body2, body3, body4, body5].forEach(async (body) => {
      const result = await supertest(app)
        .post(`/evaluation/${productId}`)
        .send(body)
        .set({ Authorization: `Bearer ${token}` });
      expect(result.status).toEqual(400);
    });
  });
});

afterAll(() => {
  connection.end();
});
