import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ocr", ocrRoutes);

// Centralized error response for unhandled route/controller errors.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
