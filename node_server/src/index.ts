import express, { Express, Request, Response } from 'express';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { rootRouter } from './routes';
import { PORT } from './config/envExports';
import { errorMiddleware } from './middlewares/errors';
import { startWorkers } from './workers';

dotenv.config();
const app:Express = express();
const port = PORT

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  credentials: true, 
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
}));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("This is user server!");
});

app.use('/api', rootRouter)

app.use(errorMiddleware);

// Start workers for background processing
startWorkers();

app.listen(port, () => {
  console.log(`main server is running on port ${port}`);
});
