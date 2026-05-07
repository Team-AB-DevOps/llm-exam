import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index";
import { streamRAGPipeline, HumanMessage, AIMessage } from "../services/rag";
import { BaseMessage } from "@langchain/core/messages";

const router = Router();

// POST /api/chat — Send a message and get streamed response via SSE
router.post("/", async (req: Request, res: Response) => {
    const { message, conversationId: existingConvId } = req.body;

    if (!message || typeof message !== "string") {
        res.status(400).json({ error: "message is required" });
        return;
    }

    const conversationId = existingConvId || uuidv4();
    const isNewConversation = !existingConvId;
    const userMessageId = uuidv4();

    console.log(`[chat] ${isNewConversation ? "New conversation" : "Continuing conversation"} ${conversationId}`);
    console.log(`[chat] User message: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`);

    // Save user message
    db.prepare("INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)").run(userMessageId, conversationId, "user", message);

    // Load chat history for context
    const historyRows = db.prepare("SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC").all(conversationId) as {
        role: string;
        content: string;
    }[];

    // Build chat history (exclude the just-inserted user message from LLM history,
    // since it will be part of the current question)
    const chatHistory: BaseMessage[] = historyRows
        .slice(0, -1) // exclude last (current user message)
        .map((row) => (row.role === "user" ? new HumanMessage(row.content) : new AIMessage(row.content)));

    console.log(`[chat] Chat history: ${chatHistory.length} previous message(s)`);

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send conversationId as first event
    res.write(`data: ${JSON.stringify({ type: "meta", conversationId })}\n\n`);

    let fullResponse = "";

    try {
        for await (const token of streamRAGPipeline(message, chatHistory)) {
            fullResponse += token;
            res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
        }

        // Save assistant message
        const assistantMessageId = uuidv4();
        db.prepare("INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)").run(
            assistantMessageId,
            conversationId,
            "assistant",
            fullResponse,
        );

        console.log(`[chat] Response complete for ${conversationId} (${fullResponse.length} chars)`);
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (error) {
        console.error(`[chat] Streaming error for ${conversationId}:`, error);
        res.write(`data: ${JSON.stringify({ type: "error", content: "An error occurred while generating the response." })}\n\n`);
    }

    res.end();
});

// GET /api/chat/:conversationId — Get conversation history
router.get("/:conversationId", (req: Request, res: Response) => {
    const conversationId = req.params.conversationId as string;
    const messages = db
        .prepare("SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC")
        .all(conversationId);

    res.json({ conversationId, messages });
});

export default router;
