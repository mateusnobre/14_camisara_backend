import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import connection from "./database.js";
import { loginSchema, signUpSchema } from "./schemas.js";
import jwt from "jsonwebtoken";
const app = express();
app.use(cors());
app.use(express.json());

app.post("/sign-up", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    await signUpSchema.validateAsync({ username, email, password });

    let passwordHash = await bcrypt.hash(password, 10);

    let date = new Date();

    await connection.query(
      `INSERT INTO 
        users (name, email, password, created_at) 
        VALUES ($1, $2, $3, $4)`,
      [username, email, passwordHash, date]
    );

    return res.sendStatus(201);
  } catch (err) {
    if (
      err.message ===
      'duplicate key value violates unique constraint "email_unique"'
    )
      return res.sendStatus(409);
    return res.sendStatus(404);
  }
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    await loginSchema.validateAsync({ email, password });

    const result = await connection.query(
      `SELECT * 
      FROM users 
      WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password)))
      throw Error("Authentication Error");

    const privateKey = process.env.JWT_SECRET;
    const config = { expiresIn: 60 * 60 };

    const token = jwt.sign({ id: user.id }, privateKey, config);

    return res.status(200).send({ token });
  } catch (error) {
    if (error.message === "Authentication Error") return res.sendStatus(409);
    return res.sendStatus(404);
  }
});

app.get("/products", async(req, res) => {
  try {
    const result = await connection.query(
      `SELECT * 
      FROM products `);
    const data = result.rows[0];
    return res.status(200).send(data);
  } catch (error) {
    return res.sendStatus(404);
  }

})
export default app;
