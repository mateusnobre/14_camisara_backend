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

    const searchQuery = await connection.query(
      `SELECT * 
      FROM users 
      WHERE email = $1`,
      [email]
    );

    const user = searchQuery.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password)))
      throw Error("Authentication Error");

    let sessionQuery = await connection.query(
      `SELECT *
       FROM sessions
       WHERE user_id = $1`,
      [user.id]
    );

    if (!sessionQuery.rowCount) {
      let date = new Date();

      sessionQuery = await connection.query(
        `INSERT INTO
        sessions (user_id, created_at)
        VALUES
        ($1, $2)
        RETURNING id`,
        [user.id, date]
      );
    }

    const privateKey = process.env.JWT_SECRET;
    const config = { expiresIn: 60 * 60 }; // expires in 1 hour

    const token = jwt.sign({ id: sessionQuery.rows[0].id }, privateKey, config);

    const userResponse = { username: user.name, email: user.email };

    return res.status(200).send({ user: userResponse, token });
  } catch (error) {
    console.log(error.message);
    if (error.message === "Authentication Error") return res.sendStatus(409);
    return res.sendStatus(404);
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const productQuery = await connection.query(
      `SELECT *
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (!productQuery.rowCount) throw Error("Invalid product");

    const evaluationStarsQuery = await connection.query(
      `SELECT COUNT(title) 
       FROM evaluations
       WHERE product_id = $1
       GROUP by rating
       ORDER by rating`,
      [id]
    );

    const evaluationAverageQuery = await connection.query(
      `SELECT COUNT(*),
       ROUND( AVG(rating), 2) AS avg
       FROM evaluations
       WHERE product_id = $1`,
      [id]
    );

    const evaluationQuery = await connection.query(
      `SELECT u.name, e.evaluated_at, e.rating, e.opinion, e.title
       FROM evaluations AS e
       JOIN users AS u
       ON e.user_id = u.id
       WHERE product_id = $1`,
      [id]
    );

    const numberEvaluations = {
      ...[0, ...evaluationStarsQuery.rows.map((row) => row.count)],
    };
    delete numberEvaluations[0];
    numberEvaluations["total"] = evaluationAverageQuery.rows[0].count;

    const responseObject = {
      ...productQuery.rows[0],
      evaluations: {
        avgRating: evaluationAverageQuery.rows[0].avg,
        numberEvaluations,
        usersEvaluations: evaluationQuery.rows,
      },
    };

    return res.send(responseObject);
  } catch (err) {
    console.log(err.message);
    return res.sendStatus(404);
  }
});

export default app;
