import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";


//beforeEach(async () => {
//  await connection.query("DELETE FROM products");
//});

describe("get /products", () => {
  it("returns 200 for valid params", async () => {
    const result = await supertest(app).get("/products");
    const status = result.status;
    expect(status).toEqual(200);
  });
});

afterAll(() => {
  connection.end();
});
