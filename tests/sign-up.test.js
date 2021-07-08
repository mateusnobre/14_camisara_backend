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
  it("returns 409 for duplicate emails", async () => {
    const body = {
      username: testUser.name,
      password: testUser.password,
      email: testUser.email,
    };
    const result1 = await supertest(app).post("/sign-up").send(body);
    expect(result1.status).toEqual(201);
    const result2 = await supertest(app).post("/sign-up").send(body);
    expect(result2.status).toEqual(409);
  });
  it("returns 404 for bad request", async () => {
    const missingName = {
      password: testUser.password,
      email: testUser.email,
    };
    const missingNameResult = await supertest(app)
      .post("/sign-up")
      .send(missingName);
    expect(missingNameResult.status).toEqual(404);

    const missingPassword = {
      username: testUser.name,
      email: testUser.email,
    };
    const missingPasswordResult = await supertest(app)
      .post("/sign-up")
      .send(missingPassword);
    expect(missingPasswordResult.status).toEqual(404);

    const missingEmail = {
      username: testUser.name,
      password: testUser.password,
    };
    const missingEmailResult = await supertest(app)
      .post("/sign-up")
      .send(missingEmail);
    expect(missingEmailResult.status).toEqual(404);
  });
});

afterAll(() => {
  connection.end();
});
