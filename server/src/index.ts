import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { pub } from "./routes/public";
import { admin } from "./routes/admin";

const app = express();
app.set("trust proxy", true);

app.use(helmet());
app.use(express.json());
app.use(morgan("tiny"));

app.use(cors({ origin: "*", credentials: true }));

app.get("/", (_req, res) => res.json({ ok: true, name: "Social Buzz API" }));
app.use("/api", pub);
app.use("/api/admin", admin);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
