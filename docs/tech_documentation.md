# Technical Documentation

## Overall Architecture

The system consists of four main components orchestrated via Docker Compose:

1. **React Frontend** — a single-page application built with Vite, React, TypeScript, and Tailwind CSS. Served by nginx on port 80. Nginx also acts as a reverse proxy, forwarding `/api/` requests to the backend.

2. **Express Backend** — a Node.js/TypeScript API server on port 3001. Handles document uploads, chat messaging, and coordinates the RAG pipeline. Uses SQLite (via `better-sqlite3`) for persisting document metadata and chat history.

3. **Ollama** — runs on the host machine (not inside Docker). Provides two models: `llama3:8b` for text generation and `nomic-embed-text` for embedding generation.

4. **ChromaDB** — a vector database running as a Docker container on port 8000. Stores document chunk embeddings and handles similarity search queries.

### Data Flow

```
User (Browser)
  → nginx (port 80, serves frontend, proxies /api/)
    → Express backend (port 3001)
      → Ollama (host:11434) for LLM generation and embeddings
      → ChromaDB (port 8000) for vector storage and retrieval
      → SQLite (local file) for metadata and chat history
```

### Database Schema

**`documents`** — stores uploaded document metadata:

- `id` (TEXT PRIMARY KEY) — UUID
- `filename` — stored filename on disk
- `original_name` — user-facing filename
- `upload_date` — timestamp (defaults to current time)
- `chunk_count` — number of text chunks after processing
- `status` — one of `processing`, `ready`, or `error`

**`chat_messages`** — stores conversation history:

- `id` (TEXT PRIMARY KEY) — UUID
- `conversation_id` — groups messages into conversations
- `role` — `user` or `assistant`
- `content` — message text
- `created_at` — timestamp

An index on `(conversation_id, created_at)` supports efficient conversation retrieval.

---

## Local LLM Path

The system uses **Ollama** as the local LLM runtime, with two models:

- **`llama3:8b`** — used for chat generation. Accessed via LangChain's `ChatOllama` class, which provides a unified interface for invoking and streaming responses. This model was chosen for its balance of quality and performance on consumer hardware.

- **`nomic-embed-text`** — used for generating vector embeddings of document chunks and user queries. Accessed via LangChain's `OllamaEmbeddings` class. This model produces embeddings suitable for semantic similarity search in ChromaDB.

Both models are configured in `backend/src/config.ts` and can be overridden via environment variables (`LLM_MODEL`, `EMBEDDING_MODEL`), though the defaults work out of the box.

---

## RAG Implementation

The RAG pipeline is split across three backend services:

### Document Ingestion (`backend/src/services/documentProcessor.ts`)

When a PDF is uploaded, the following steps run asynchronously:

1. **PDF parsing** — `pdf-parse` extracts raw text from the PDF file.
2. **Text chunking** — LangChain's `RecursiveCharacterTextSplitter` splits the text into chunks of 1000 characters with 200-character overlap. The overlap ensures context continuity across chunk boundaries.
3. **Embedding generation** — each chunk is sent to Ollama's `nomic-embed-text` model to produce a vector embedding.
4. **Vector storage** — chunks and their embeddings are stored in ChromaDB with metadata linking each chunk back to its source document.
5. **Status update** — the document's status in SQLite is updated to `ready` (or `error` if processing fails).

### Vector Store Operations (`backend/src/services/vectorStore.ts`)

- **`addDocumentChunks(documentId, chunks)`** — generates embeddings for all chunks and stores them in ChromaDB with metadata (`documentId`, `chunkIndex`).
- **`queryRelevantChunks(query, topK)`** — embeds the user's query, performs a similarity search against ChromaDB, and returns the top-K most relevant chunks along with their source document IDs.
- **`deleteDocumentChunks(documentId)`** — removes all chunks belonging to a document from ChromaDB.

ChromaDB uses a single collection (`hr_documents`) for all documents. Embeddings are computed externally via Ollama rather than using ChromaDB's built-in embedding functions.

### RAG Query Pipeline (`backend/src/services/rag.ts`)

The query pipeline is orchestrated using **LangGraph**, which defines a state graph with two nodes:

```
START → retrieve → generate → END
```

1. **Retrieve node** — takes the user's question, queries ChromaDB for the top 4 most relevant chunks, and adds them to the graph state.
2. **Generate node** — builds a prompt consisting of the system message, chat history, retrieved context (labeled with document names), and the user's question. Calls `ChatOllama` to produce a response.

Two execution modes are available:

- **`runRAGPipeline()`** — invokes the full graph and returns the complete response.
- **`streamRAGPipeline()`** — an async generator that retrieves context first, then streams tokens from Ollama one at a time. This is used by the chat endpoint to deliver Server-Sent Events (SSE) to the frontend.

Context chunks are labeled with their source document names (resolved from SQLite) so the LLM can cite specific documents in its answers.

### Streaming Delivery (`backend/src/routes/chat.ts`)

The chat endpoint uses SSE to stream responses to the frontend:

1. The user message is saved to SQLite.
2. Chat history is loaded from the database.
3. `streamRAGPipeline()` is called, yielding tokens one at a time.
4. Each token is sent as an SSE event (`type: "token"`).
5. A `meta` event sends the conversation ID, and a `done` event signals completion.
6. The full assistant response is saved to SQLite.

---

## 4T's Prompt Engineering

The system prompt in `backend/src/services/rag.ts` is designed around the 4T's framework:

```
You are a knowledgeable HR assistant with expertise in company policies and procedures.
Your task is to answer the user's HR-related question using ONLY the provided context documents.
Your tone should be professional, helpful, and concise.
Your target audience is company employees seeking quick answers about company policies.

Rules:
- Base your answer strictly on the provided context. Do not make up information.
- If the context does not contain enough information to answer the question, say so clearly.
- Always Cite or reference the relevant document in the end of your response in the following format: [document_name.pdf].
- Keep answers focused and to the point.
```

### Mapping

| Element    | Value                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Traits** | "knowledgeable HR assistant with expertise in company policies and procedures" — defines the persona and domain expertise   |
| **Task**   | "answer the user's HR-related question using ONLY the provided context documents" — constrains the LLM to retrieved content |
| **Tone**   | "professional, helpful, and concise" — sets the communication style                                                         |
| **Target** | "company employees seeking quick answers about company policies" — identifies the audience                                  |

The rules section reinforces the RAG grounding: the LLM must not fabricate information, must admit when context is insufficient, and must cite source documents. This reduces hallucination and keeps responses traceable to the uploaded material.

---

## How the Parts Connect

### Chat Request Lifecycle

1. The user types a question in the frontend (`ChatPage.tsx`).
2. The frontend calls `api.sendMessage()` which sends a POST request to `/api/chat` with the message and an optional conversation ID.
3. Nginx proxies the request to the Express backend.
4. The `chat.ts` route handler saves the user message to SQLite and loads the conversation's chat history.
5. `streamRAGPipeline()` is called:
    - The user's question is embedded and sent to ChromaDB for similarity search.
    - The top 4 matching chunks are retrieved and formatted with their source document names.
    - The system prompt, chat history, context, and question are assembled into a prompt.
    - `ChatOllama.stream()` sends the prompt to Ollama and yields tokens.
6. Each token is written to the SSE response stream.
7. The frontend reads the stream, parsing each `data:` line and appending tokens to the displayed message in real time.
8. On completion, the full assistant response is saved to SQLite.

### Document Upload Lifecycle

1. The user drags a PDF onto the upload area in the frontend (`DocumentsPage.tsx`).
2. The frontend sends a multipart POST to `/api/documents` via `api.uploadDocument()`.
3. `multer` middleware validates the file (PDF only, max 50MB) and saves it to the `uploads/` directory.
4. A document record is inserted into SQLite with status `processing`.
5. `processDocument()` runs asynchronously in the background:
    - PDF text is extracted with `pdf-parse`.
    - Text is split into chunks with `RecursiveCharacterTextSplitter`.
    - Chunks are embedded via Ollama and stored in ChromaDB.
    - The document status is updated to `ready` in SQLite.
6. The frontend polls the documents list every 3 seconds while any document has status `processing`, and updates the UI when processing completes.

---

## Known Limitations and Risks

- **PDF only** — the system only supports PDF documents. Other formats (DOCX, TXT, HTML) are not accepted.
- **No authentication** — there is no login or access control. The system is single-user and assumes a trusted environment.
- **Single ChromaDB collection** — all documents share one vector collection. There is no per-user or per-workspace isolation.
- **Host-dependent Ollama** — Ollama must be installed and running on the host machine. It is not containerized, so deployment requires manual setup of the LLM runtime.
- **No production hardening** — there is no rate limiting, HTTPS, or input sanitization beyond file type validation. The system is a prototype, not production-ready.
- **Large PDF performance** — very large PDFs may take significant time to process due to embedding generation being sequential.
- **LLM hallucination** — despite RAG grounding and explicit prompt rules, the LLM may occasionally generate information not present in the retrieved context.
