import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "3001", 10),
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",
    llmModel: process.env.LLM_MODEL || "llama3:8b",
    embeddingModel: process.env.EMBEDDING_MODEL || "nomic-embed-text",
    chromaCollection: process.env.CHROMA_COLLECTION || "hr_documents",
    uploadsDir: process.env.UPLOADS_DIR || "./uploads",
};
