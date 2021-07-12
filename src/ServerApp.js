import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import connection from "./database.js";
import { evaluationsSchema, loginSchema, signUpSchema } from "./schemas.js";
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
    const config = { expiresIn: 60 * 60 * 24 * 7 }; // expires in 1 week

    const token = jwt.sign({ id: sessionQuery.rows[0].id }, privateKey, config);

    const userResponse = { username: user.name, email: user.email };

    return res.status(200).send({ user: userResponse, token });
  } catch (error) {
    console.log(error.message);
    if (error.message === "Authentication Error") return res.sendStatus(401);
    return res.sendStatus(400);
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

    const responseObject = {
      ...productQuery.rows[0],
    };

    return res.send(responseObject);
  } catch (err) {
    return res.sendStatus(404);
  }
});

app.get("/evaluation/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;

    const evaluationStarsQuery = await connection.query(
      `SELECT COUNT(title) 
       FROM evaluations
       WHERE product_id = $1
       GROUP by rating
       ORDER by rating`,
      [product_id]
    );

    if (!evaluationStarsQuery.rowCount) throw Error("Invalid Product");

    const evaluationAverageQuery = await connection.query(
      `SELECT COUNT(*),
       ROUND( AVG(rating), 2) AS avg
       FROM evaluations
       WHERE product_id = $1`,
      [product_id]
    );

    const evaluationQuery = await connection.query(
      `SELECT u.name, e.evaluated_at, e.rating, e.opinion, e.title
       FROM evaluations AS e
       JOIN users AS u
       ON e.user_id = u.id
       WHERE product_id = $1`,
      [product_id]
    );

    const numberEvaluations = {
      ...[0, ...evaluationStarsQuery.rows.map((row) => row.count)],
    };
    delete numberEvaluations[0];
    numberEvaluations["total"] = evaluationAverageQuery.rows[0].count;

    return res.send({
      avgRating: evaluationAverageQuery.rows[0].avg,
      numberEvaluations,
      usersEvaluations: evaluationQuery.rows,
    });
  } catch (err) {
    console.log(err.message);
    return res.sendStatus(404);
  }
});

app.post("/evaluation/:product_id", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization?.replace("Bearer ", "");
    const privateKey = process.env.JWT_SECRET;

    if (!token) throw Error("invalid token");

    const sessionId = jwt.verify(token, privateKey).id;
    const { product_id } = req.params;
    const { rating, title, opinion } = req.body;

    await evaluationsSchema.validateAsync({ rating, title, opinion });

    const user_id = (
      await connection.query(
        `SELECT user_id
        FROM sessions
        WHERE id = $1`,
        [sessionId]
      )
    ).rows[0].user_id;
    const date = new Date();

    await connection.query(
      `INSERT INTO
       evaluations (product_id, user_id, evaluated_at, rating, title, opinion)
       VALUES
       ($1, $2, $3, $4, $5, $6)`,
      [product_id, user_id, date, rating, title, opinion]
    );

    return res.send({ sessionId, product_id });
  } catch (err) {
    console.log(err.message);
    if (err.message === "invalid token") return res.sendStatus(401);
    if (err.message === "jwt expired") return res.sendStatus(403);
    return res.sendStatus(400);
  }
});

app.get("/products", async (req, res) => {
  try {
    const result = await connection.query(
      `SELECT * 
      FROM products `
    );
    const data = result.rows[0];
    return res.status(200).send(data);
  } catch (error) {
    return res.sendStatus(404);
  }
});

app.post("/purchase/:product_id", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization?.replace("Bearer ", "");
    const privateKey = process.env.JWT_SECRET;

    if (!token) throw Error("invalid token");

    const sessionId = jwt.verify(token, privateKey).id;

    const user_id = (
      await connection.query(
        `SELECT user_id
        FROM sessions
        WHERE id = $1`,
        [sessionId]
      )
    ).rows[0].user_id;

    const { product_id } = req.params;
    const { quantity } = req.body;
    const date = new Date();

    const searchQuery = await connection.query(
      `SELECT *
       FROM purchases
       WHERE user_id = $1 AND product_id = $2`,
      [user_id, product_id]
    );

    if (searchQuery.rowCount) {
      const newQuantity = searchQuery.rows[0].quantity + quantity;
      console.log(newQuantity);
      await connection.query(
        `UPDATE purchases
         SET quantity = $1 , updated_at = $2
         WHERE user_id = $3 AND product_id = $4`,
        [newQuantity, date, user_id, product_id]
      );
      return res.sendStatus(200);
    } else {
      await connection.query(
        `INSERT INTO
         purchases (user_id, product_id, quantity, updated_at)
         VALUES
         ($1, $2, $3, $4)`,
        [user_id, product_id, quantity, date]
      );
      return res.sendStatus(201);
    }
  } catch (err) {
    console.log(err.message);
    if (err.message === "invalid token") return res.sendStatus(401);
    if (err.message === "jwt expired") return res.sendStatus(403);
    return res.sendStatus(400);
  }
});

app.post("/wishlist/:product_id", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization?.replace("Bearer ", "");
    const privateKey = process.env.JWT_SECRET;

    if (!token) throw Error("invalid token");

    const sessionId = jwt.verify(token, privateKey).id;

    const user_id = (
      await connection.query(
        `SELECT user_id
        FROM sessions
        WHERE id = $1`,
        [sessionId]
      )
    ).rows[0].user_id;

    const { product_id } = req.params;

    await connection.query(
      `INSERT INTO
         wishlists (user_id, product_id)
         VALUES
         ($1, $2)`,
      [user_id, product_id]
    );
    return res.sendStatus(201);
  } catch (err) {
    if (
      err.message ===
      'duplicate key value violates unique constraint "wishlist_unique"'
    )
      return res.sendStatus(403);
    return res.sendStatus(400);
  }
});

export default app;
