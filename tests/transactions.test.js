import connection from '../src/database.js';
import app from '../src/ServerApp.js';
import supertest from 'supertest';

const testUser = {
  id: 1,
  name: 'Mateus Nobre',
  email: 'mateus@bootcamp.com.br',
  password: 'projeto_top',
  token: 'token'
}

beforeEach(async () => {
  await connection.query(`DELETE FROM transactions`);
  await connection.query(`DELETE FROM clients`);
  await connection.query(`DELETE FROM sessions`);
  await connection.query(`INSERT INTO clients (id, name, email, password, created_at)
          VALUES (1, '${testUser.name}', '${testUser.email}', '${testUser.passwordHashed}', NOW())`);       
  await connection.query(`INSERT INTO sessions (client_id, token, created_at)
          VALUES (${testUser.id}, '${testUser.token}', NOW())`);       
  await connection.query(`INSERT INTO transactions (client_id, "value", comment, created_at)
          VALUES (1, 30, 'some random comment', NOW())`);       
  await connection.query(`INSERT INTO transactions (client_id, "value", comment, created_at)
          VALUES (1, 40, 'some random comment', NOW())`);       
  await connection.query(`INSERT INTO transactions (client_id, "value", comment, created_at)
          VALUES (1, -25, 'some random comment', NOW())`);       
});

describe("GET /transactions", () => {
    it("returns 200 and right amount of transactions for valid token", async () => {
        const result = await supertest(app).get("/transactions").set('authorization', `Bearer ${testUser.token}`);
        const status = result.status;
        const transactions = await connection.query(`
          SELECT *
          FROM transactions
          WHERE client_id = ${testUser.id}
        `)
        expect(status).toEqual(200);
        console.log(result.data)
        expect(transactions.rows.length).toEqual(result.data.length);
    });
});

describe("POST /transactions", () => {
    it("returns 201 when transaction is valid", async () => {
        const body = {value: 30, comment: 'some random comment'}
        const result = await supertest(app).post("/transactions").set('authorization', `Bearer ${testUser.token}`).send(body);
        const status = result.status;
        const data = result.data;
        expect(status).toEqual(201);
        expect(data).toEqual(undefined);
    });
    it("returns 400 when value is null", async () => {
        const body = {comment: 'some random comment'}
        const result = await supertest(app).post("/transactions").set('authorization', `Bearer ${testUser.token}`).send(body);
        const status = result.status;
        const data = result.data;
        expect(status).toEqual(400);
        expect(data).toEqual(undefined);
    });
    it("returns 400 when value equals 0", async () => {
        const body = {value: 0, comment: 'some random comment'}
        const result = await supertest(app).post("/transactions").set('authorization', `Bearer ${testUser.token}`).send(body);
        const status = result.status;
        const data = result.data;
        expect(status).toEqual(400);
        expect(data).toEqual(undefined);
    });
});

afterAll(() => {
  connection.end();
});