import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { initializeDatabase } from "./db/schema";
import db from "./db/index";
import chatRouter from "./routes/chat";
import documentsRouter from "./routes/documents";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Initialize database
console.log("[startup] Initializing database...");
initializeDatabase();
console.log("[startup] Database initialized");

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/conversations", (_req, res) => {
    const conversations = db
        .prepare(
            `SELECT conversation_id, 
                    MIN(created_at) as started_at,
                    MAX(created_at) as last_message_at,
                    COUNT(*) as message_count,
                    (SELECT content FROM chat_messages cm2 
                     WHERE cm2.conversation_id = cm.conversation_id 
                     AND cm2.role = 'user' 
                     ORDER BY cm2.created_at ASC LIMIT 1) as title
             FROM chat_messages cm
             GROUP BY conversation_id
             ORDER BY last_message_at DESC`,
        )
        .all();
    res.json(conversations);
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(config.port, () => {
    console.log(`[startup] Backend server running on http://localhost:${config.port}`);
    console.log(`[startup] Ollama URL: ${config.ollamaBaseUrl}`);
    console.log(`[startup] ChromaDB URL: ${config.chromaUrl}`);
    console.log(`[startup] LLM model: ${config.llmModel}, Embedding model: ${config.embeddingModel}`);
});

export default app;
