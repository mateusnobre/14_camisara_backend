import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import connection from "./database.js";
import { SignUpSchema } from "./schemas.js";
import { v4 as uuid } from "uuid";
const app = express();
app.use(cors());
app.use(express.json());

app.post("/sign-up", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    await SignUpSchema.validateAsync({ username, email, password });

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
    console.log(err.message);
    if (
      err.message ===
      'duplicate key value violates unique constraint "email_unique"'
    )
      return res.sendStatus(409);
    return res.sendStatus(404);
  }
});

export default app;
