import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import db from "../db/index";
import { processDocument } from "../services/documentProcessor";
import { deleteDocumentChunks } from "../services/vectorStore";

const router = Router();

// Configure multer for PDF uploads
const uploadsDir = path.resolve(config.uploadsDir);
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/documents — Upload a PDF document
router.post("/", upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }

    const id = uuidv4();
    const { filename, originalname } = req.file;

    db.prepare("INSERT INTO documents (id, filename, original_name, status) VALUES (?, ?, ?, ?)").run(id, filename, originalname, "processing");

    // Trigger async processing
    const filePath = path.join(uploadsDir, filename);
    processDocument(id, filePath).catch((err) => console.error("Document processing failed:", err));

    res.status(201).json({
        id,
        filename,
        original_name: originalname,
        status: "processing",
    });
});

// GET /api/documents — List all documents
router.get("/", (_req: Request, res: Response) => {
    const documents = db.prepare("SELECT id, filename, original_name, upload_date, chunk_count, status FROM documents ORDER BY upload_date DESC").all();
    res.json(documents);
});

// GET /api/documents/:id/file — Serve raw PDF file
router.get("/:id/file", (req: Request, res: Response) => {
    const id = req.params.id as string;
    const doc = db.prepare("SELECT filename, original_name FROM documents WHERE id = ?").get(id) as { filename: string; original_name: string } | undefined;

    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }

    const filePath = path.join(uploadsDir, doc.filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found on disk" });
        return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.original_name}"`);
    res.sendFile(filePath);
});

// DELETE /api/documents/:id — Delete a document
router.delete("/:id", async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const doc = db.prepare("SELECT filename FROM documents WHERE id = ?").get(id) as { filename: string } | undefined;

    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }

    // Delete from ChromaDB
    try {
        await deleteDocumentChunks(id);
    } catch (err) {
        console.error("Error deleting vectors:", err);
    }

    // Delete from SQLite
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);

    // Delete file from disk
    const filePath = path.join(uploadsDir, doc.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    res.status(204).send();
});

export default router;
