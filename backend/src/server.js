import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    try {
      await connectDB(MONGODB_URI);
    } catch (dbError) {
      console.warn("MongoDB not connected yet:", dbError.message);
      console.warn(
        "API will still run. Start MongoDB to enable database features.",
      );
    }

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

start();
