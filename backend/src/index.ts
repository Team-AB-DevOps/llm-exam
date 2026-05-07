import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { initializeDatabase } from "./db/schema";
import chatRouter from "./routes/chat";
import documentsRouter from "./routes/documents";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/conversations", (req, res) => {
    // TODO: Implement in Phase 3
    res.status(501).json({ error: "Not implemented yet" });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(config.port, () => {
    console.log(`Backend server running on http://localhost:${config.port}`);
});

export default app;
