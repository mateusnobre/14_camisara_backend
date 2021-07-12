import connection from "../src/database.js";
import app from "../src/ServerApp.js";
import supertest from "supertest";

const testUser = {
  username: "Username",
  email: "email@bootcamp.com.br",
  password: "password",
};

beforeEach(async () => {
  await connection.query("DELETE FROM users");
});

describe("POST /login", () => {
  it("returns 200 for valid params", async () => {
    const body1 = testUser;
    const result1 = await supertest(app).post("/sign-up").send(body1);
    const status1 = result1.status;
    expect(status1).toEqual(201);

    const body2 = { email: testUser.email, password: testUser.password };
    const result2 = await supertest(app).post("/login").send(body2);
    const status2 = result2.status;
    expect(status2).toEqual(200);
  });

  it("returns 401 for authentication error", async () => {
    const invalidEmailBody = {
      email: "nonexisting@email.com",
      password: "123456",
    };
    const invalidEmailResult = await supertest(app)
      .post("/login")
      .send(invalidEmailBody);
    const invalidEmailstatus = invalidEmailResult.status;
    expect(invalidEmailstatus).toEqual(401);

    const invalidPasswordBody = { email: testUser.email, password: "123456" };
    const invalidPasswordResult = await supertest(app)
      .post("/login")
      .send(invalidPasswordBody);
    const invalidPasswordstatus = invalidPasswordResult.status;
    expect(invalidPasswordstatus).toEqual(401);
  });

  it("returns 400 for bad request", async () => {
    const invalidEmailBody = {
      password: testUser.password,
    };
    const invalidEmailResult = await supertest(app)
      .post("/login")
      .send(invalidEmailBody);
    const invalidEmailstatus = invalidEmailResult.status;
    expect(invalidEmailstatus).toEqual(400);

    const invalidPasswordBody = { email: testUser.email };
    const invalidPasswordResult = await supertest(app)
      .post("/login")
      .send(invalidPasswordBody);
    const invalidPasswordstatus = invalidPasswordResult.status;
    expect(invalidPasswordstatus).toEqual(400);
  });
});

afterAll(() => {
  connection.end();
});
