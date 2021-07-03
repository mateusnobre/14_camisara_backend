import bcrypt from 'bcrypt';
import express from 'express';
import cors from 'cors';
import connection from './database.js'
import { v4 as uuid } from 'uuid';
const app = express();
app.use(cors());
app.use(express.json());

export default app