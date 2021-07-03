import connection from '../src/database.js';
import app from '../src/ServerApp.js';
import supertest from 'supertest';
import bcrypt from 'bcrypt'

const testUser = {
  name: 'Mateus Nobre',
  email: 'mateus@bootcamp.com.br',
  password: 'projeto_top'
}

beforeEach(async () => {
  try{
    const passwordHashed = await bcrypt.hashSync('projeto_top', 10)
    await connection.query(`DELETE FROM sessions`);
    await connection.query(`DELETE FROM clients`);
    await connection.query(`INSERT INTO clients (name, email, password, created_at)
            VALUES ('${testUser.name}', '${testUser.email}', '${passwordHashed}', NOW())`);
  }
  catch (error){
    console.log(error)
  }      
});

describe("POST /login", () => {
    it("returns 201 and valid token for valid params", async () => {
        const body = {email: testUser.email, password: testUser.password};
        const result = await supertest(app).post("/login").send(body);
        const status = result.status
        const token = result.text
        const isValidToken = await connection.query(`
          SELECT *
          FROM sessions
          WHERE token='${token}'
        `)
        expect(status).toEqual(201);
        expect(isValidToken.rows[0].token).toBeDefined();
    });
    it("returns 401 and no data for email not found", async () => {
        const body = {email: 'somerandomemail@somerandomdomain.com', password: 'random'}; 
        const result = await supertest(app).post("/login").send(body);
        expect(result.status).toEqual(401);
        expect(result.data).toEqual(undefined);
    });
    it("returns 403 and no data for wrong password", async () => {
        const body = {email: testUser.email, password: 'random'}; 
        const result = await supertest(app).post("/login").send(body);
        expect(result.status).toEqual(403);
        expect(result.data).toEqual(undefined);
    });
    it("returns 400 and no data for empty params", async () => {
        const firstBody = {email: '', password: testUser.password};
        const secondBody = {email: testUser.email, password: ''}; 
        const thirdBody = {email: '', password: ''};
        
        const firstTry = await supertest(app).post("/login").send(firstBody);
        expect(firstTry.status).toEqual(400); 
        expect(firstTry.data).toEqual(undefined);

        const secondTry = await supertest(app).post("/login").send(secondBody);
        expect(secondTry.status).toEqual(400);
        expect(secondTry.data).toEqual(undefined);
        
        const thirdTry = await supertest(app).post("/login").send(thirdBody);
        expect(thirdTry.status).toEqual(400);
        expect(thirdTry.data).toEqual(undefined);
    });
});

afterAll(() => {
  connection.end();
});