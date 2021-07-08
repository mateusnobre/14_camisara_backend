import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";

const testUser = {
  name: "Mateus Nobre",
  email: "mateus@bootcamp.com.br",
  password: "projeto_top",
};

beforeEach(async () => {
  await connection.query(`DELETE FROM users`);
});

describe("POST /sign-up", () => {
  it("returns 201 for valid params", async () => {
    const body = {
      username: testUser.name,
      password: testUser.password,
      email: testUser.email,
    };
    const result = await supertest(app).post("/sign-up").send(body);
    const status = result.status;
    expect(status).toEqual(201);
  });
});

afterAll(() => {
  connection.end();
});
