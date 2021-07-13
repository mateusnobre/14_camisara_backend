import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";

beforeEach(async () => {
  await connection.query("DELETE FROM products");
});

describe("get /products", () => {
  it("returns 200 for valid params", async () => {
    const result = await supertest(app).get("/products");
    const status = result.status;
    expect(status).toEqual(200);
  });
});

describe("get /product/:id", () => {
  it("returns 200 for valid params", async () => {
    const insertQuery = await connection.query(`
    INSERT INTO products (title) 
    VALUES ('teste') 
    RETURNING id`);
    const id = insertQuery.rows[0].id;
    const result = await supertest(app).get(`/product/${id}`);
    const status = result.status;
    expect(status).toEqual(200);
  });

  it("returns 404 for invalid id", async () => {
    const result = await supertest(app).get(`/products/-1`);
    const status = result.status;
    expect(status).toEqual(404);
  });
});

afterAll(() => {
  connection.end();
});
