import { Router } from "express";

const router = Router();

// POST /api/documents — Upload a PDF document
router.post("/", (req, res) => {
    // TODO: Implement in Phase 2
    res.status(501).json({ error: "Not implemented yet" });
});

// GET /api/documents — List all documents
router.get("/", (req, res) => {
    // TODO: Implement in Phase 2
    res.status(501).json({ error: "Not implemented yet" });
});

// GET /api/documents/:id/file — Serve raw PDF file
router.get("/:id/file", (req, res) => {
    // TODO: Implement in Phase 2
    res.status(501).json({ error: "Not implemented yet" });
});

// DELETE /api/documents/:id — Delete a document
router.delete("/:id", (req, res) => {
    // TODO: Implement in Phase 2
    res.status(501).json({ error: "Not implemented yet" });
});

export default router;
