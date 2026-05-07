import { Router } from "express";

const router = Router();

// POST /api/chat — Send a message and get streamed response
router.post("/", (req, res) => {
    // TODO: Implement in Phase 3
    res.status(501).json({ error: "Not implemented yet" });
});

// GET /api/chat/:conversationId — Get conversation history
router.get("/:conversationId", (req, res) => {
    // TODO: Implement in Phase 3
    res.status(501).json({ error: "Not implemented yet" });
});

export default router;
