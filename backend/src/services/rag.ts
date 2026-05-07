import { ChatOllama } from "@langchain/ollama";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { queryRelevantChunks } from "./vectorStore";
import { config } from "../config";

const llm = new ChatOllama({
    model: config.llmModel,
    baseUrl: config.ollamaBaseUrl,
});

const SYSTEM_PROMPT = `You are a knowledgeable HR assistant with expertise in company policies and procedures.
Your task is to answer the user's HR-related question using ONLY the provided context documents.
Your tone should be professional, helpful, and concise.
Your target audience is HR employees and managers seeking quick answers about company policies.

Rules:
- Base your answer strictly on the provided context. Do not make up information.
- If the context does not contain enough information to answer the question, say so clearly.
- Cite or reference the relevant parts of the context when possible.
- Keep answers focused and to the point.`;

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
    const chunks = await queryRelevantChunks(state.question, 4);
    return { context: chunks };
}

// Generate node: build prompt and call LLM
async function generate(state: typeof GraphState.State) {
    const contextText =
        state.context.length > 0 ? state.context.map((chunk, i) => `[Document ${i + 1}]\n${chunk}`).join("\n\n") : "No relevant documents found.";

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
    // First retrieve context
    const chunks = await queryRelevantChunks(question, 4);
    const contextText = chunks.length > 0 ? chunks.map((chunk, i) => `[Document ${i + 1}]\n${chunk}`).join("\n\n") : "No relevant documents found.";

    const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), ...chatHistory, new HumanMessage(`Context:\n${contextText}\n\nQuestion: ${question}`)];

    const stream = await llm.stream(messages);
    for await (const chunk of stream) {
        const content = typeof chunk.content === "string" ? chunk.content : "";
        if (content) {
            yield content;
        }
    }
}

export { HumanMessage, AIMessage };
