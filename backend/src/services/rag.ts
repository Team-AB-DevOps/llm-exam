import { ChatOllama } from "@langchain/ollama";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { queryRelevantChunks, type RetrievedChunk } from "./vectorStore";
import { config } from "../config";
import db from "../db/index";

const llm = new ChatOllama({
    model: config.llmModel,
    baseUrl: config.ollamaBaseUrl,
});

const SYSTEM_PROMPT = `You are a knowledgeable HR assistant with expertise in company policies and procedures.
Your task is to answer the user's HR-related question using ONLY the provided context documents.
Your tone should be professional, helpful, and concise.
Your target audience is company employees seeking quick answers about company policies.

Rules:
- Base your answer strictly on the provided context. Do not make up information.
- If the context does not contain enough information to answer the question, say so clearly.
- Always Cite or reference the relevant document in the end of your response in the following format: [document_name.pdf].
- Keep answers focused and to the point.`;

function resolveDocumentNames(chunks: RetrievedChunk[]): { content: string; documentName: string }[] {
    const nameCache = new Map<string, string>();
    return chunks.map((chunk) => {
        if (!nameCache.has(chunk.documentId)) {
            const row = db.prepare("SELECT original_name FROM documents WHERE id = ?").get(chunk.documentId) as { original_name: string } | undefined;
            nameCache.set(chunk.documentId, row?.original_name ?? "Unknown Document");
        }
        return { content: chunk.content, documentName: nameCache.get(chunk.documentId)! };
    });
}

function formatContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) return "No relevant documents found.";
    const named = resolveDocumentNames(chunks);
    return named.map((c) => `[${c.documentName}]\n${c.content}`).join("\n\n");
}

// Define the graph state
const GraphState = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<string[]>({
        reducer: (_prev, next) => next,
        default: () => [],
    }),
    chatHistory: Annotation<BaseMessage[]>({
        reducer: (_prev, next) => next,
        default: () => [],
    }),
    response: Annotation<string>,
});

// Retrieve node: query ChromaDB for relevant chunks
async function retrieve(state: typeof GraphState.State) {
    console.log(`[rag] Retrieve node — querying for: "${state.question.substring(0, 80)}${state.question.length > 80 ? "..." : ""}"`);
    const chunks = await queryRelevantChunks(state.question, 4);
    console.log(`[rag] Retrieved ${chunks.length} context chunk(s)`);
    return { context: chunks.map((c) => c.content) };
}

// Generate node: build prompt and call LLM
async function generate(state: typeof GraphState.State) {
    const retrievedChunks = await queryRelevantChunks(state.question, 4);
    const contextText = formatContext(retrievedChunks);

    const messages: BaseMessage[] = [
        new SystemMessage(SYSTEM_PROMPT),
        ...state.chatHistory,
        new HumanMessage(`Context:\n${contextText}\n\nQuestion: ${state.question}`),
    ];

    const response = await llm.invoke(messages);
    return { response: typeof response.content === "string" ? response.content : "" };
}

// Build the LangGraph state graph
const workflow = new StateGraph(GraphState)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", END);

const app = workflow.compile();

export async function runRAGPipeline(question: string, chatHistory: BaseMessage[] = []): Promise<string> {
    const result = await app.invoke({
        question,
        chatHistory,
    });
    return result.response;
}

export async function* streamRAGPipeline(question: string, chatHistory: BaseMessage[] = []): AsyncGenerator<string> {
    console.log(`[rag] Stream pipeline started — question: "${question.substring(0, 80)}${question.length > 80 ? "..." : ""}"`);
    // First retrieve context
    const chunks = await queryRelevantChunks(question, 4);
    console.log(`[rag] Retrieved ${chunks.length} context chunk(s) for streaming`);
    const contextText = formatContext(chunks);

    const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), ...chatHistory, new HumanMessage(`Context:\n${contextText}\n\nQuestion: ${question}`)];

    console.log(`[rag] Calling Ollama (${config.llmModel}) with ${messages.length} messages...`);
    const stream = await llm.stream(messages);
    let tokenCount = 0;
    for await (const chunk of stream) {
        const content = typeof chunk.content === "string" ? chunk.content : "";
        if (content) {
            tokenCount++;
            yield content;
        }
    }
    console.log(`[rag] Stream complete — ${tokenCount} token chunks yielded`);
}

export { HumanMessage, AIMessage };
