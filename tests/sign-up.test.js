import connection from '../src/database.js';
import app from '../src/ServerApp.js';
import supertest from 'supertest';
import bcrypt from 'bcrypt'

const testUser = {
  name: 'Mateus Nobre',
  email: 'mateus@bootcamp.com.br',
  password: 'projeto_top',
  passwordHashed: bcrypt.hashSync('projeto_top', 10)
}

beforeEach(async () => {
  await connection.query(`DELETE FROM clients`); 
});

describe("POST /sign-up", () => {
    it("returns 201 for valid params", async () => {
        const body = {name: testUser.name , email: testUser.email, password: testUser.password}; 
        const result = await supertest(app).post("/sign-up").send(body);
        const status = result.status;
        const data = result.data;
        expect(status).toEqual(201);
        expect(data).toEqual(undefined);
    });
    it("returns 409 for duplicated email", async () => {
        const body = {name: testUser.name , email: testUser.email, password: testUser.password}; 
        
        const firstTry = await supertest(app).post("/sign-up").send(body);
        expect(firstTry.status).toEqual(201);
        expect(firstTry.data).toEqual(undefined);

        const secondTry = await supertest(app).post("/sign-up").send(body);
        expect(secondTry.status).toEqual(409);
        expect(secondTry.data).toEqual(undefined);
    });
});

afterAll(() => {
  connection.end();
});