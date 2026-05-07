# HR Chat Assistant — A RAG-Powered Document Q&A System

## Problem Statement

HR departments maintain large collections of policy documents that employees must navigate to find answers. Locating specific information often requires reading through entire PDFs — a slow and frustrating process. This project solves that problem by providing a chat interface where employees can ask natural-language questions and receive accurate, sourced answers drawn directly from uploaded HR policy documents, powered by a local LLM and retrieval-augmented generation.

## Target User

Company employees and HR staff who need quick, reliable answers about internal policies — such as vacation rules, remote work guidelines, or leave procedures — without manually searching through documents.

## Chosen Architecture

The system consists of four components orchestrated with Docker Compose:

1. **React Frontend** — Single-page application (Vite, TypeScript, Tailwind CSS, shadcn/ui) served by nginx, which also reverse-proxies API requests to the backend.
2. **Express Backend** — Node.js/TypeScript API server handling document uploads, chat messaging, and RAG pipeline coordination. Uses SQLite for document metadata and chat history.
3. **Ollama** — Local LLM runtime running on the host machine, providing `llama3:8b` for text generation and `nomic-embed-text` for embeddings.
4. **ChromaDB** — Vector database (Docker container) storing document chunk embeddings for similarity search.

**Data flow:**

```
User → nginx (port 80) → Express backend (port 3001)
         → Ollama (host:11434) for generation & embeddings
         → ChromaDB (port 8000) for vector storage & retrieval
         → SQLite (local file) for metadata & chat history
```

## How the Local LLM is Used

The system uses **Ollama** with two locally-hosted models:

- **llama3:8b** — generates chat responses based on retrieved context. Accessed via LangChain's `ChatOllama` class with streaming enabled, so tokens are delivered to the user in real time through Server-Sent Events (SSE).
- **nomic-embed-text** — produces vector embeddings for both document chunks (during ingestion) and user queries (during retrieval). Accessed via LangChain's `OllamaEmbeddings`.

Both models run entirely on the local machine. No cloud-based LLM is used in the delivered solution.

## How RAG is Used

The RAG pipeline has two phases:

**Ingestion** — When a PDF is uploaded, `pdf-parse` extracts the text, which is split into chunks of 1,000 characters with 200-character overlap using LangChain's `RecursiveCharacterTextSplitter`. Each chunk is embedded via `nomic-embed-text` and stored in ChromaDB with metadata linking it to the source document.

**Query** — When a user asks a question, the pipeline is orchestrated by **LangGraph** as a two-node state graph:

1. **Retrieve** — The question is embedded and used for a similarity search against ChromaDB, returning the top 4 most relevant chunks.
2. **Generate** — The system prompt, chat history, retrieved context (labeled with source document names), and the user's question are assembled into a prompt and sent to `llama3:8b`.

The response is streamed token-by-token to the frontend via SSE. Source document names are resolved from SQLite so the LLM can cite them in its answers.

## How the 4T's are Applied

The system prompt is explicitly structured around the 4T's framework:

| Element    | Implementation                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Traits** | _"You are a knowledgeable HR assistant with expertise in company policies and procedures"_ — establishes domain expertise and persona         |
| **Task**   | _"Your task is to answer the user's HR-related question using ONLY the provided context documents"_ — constrains answers to retrieved content |
| **Tone**   | _"Your tone should be professional, helpful, and concise"_ — sets communication style                                                         |
| **Target** | _"Your target audience is company employees seeking quick answers about company policies"_ — identifies the audience                          |

The prompt also includes grounding rules: the LLM must not fabricate information, must state when context is insufficient, and must cite source documents in the format `[document_name.pdf]`. These rules reinforce RAG grounding and reduce hallucination.

## MVP Description

The MVP is the smallest working prototype that demonstrates the core idea: a RAG-powered document chat assistant using a local LLM.

**Included in MVP:**

- PDF document upload with automatic text extraction, chunking, and embedding
- RAG-powered chat with real-time streaming responses
- Local LLM generation via Ollama (llama3:8b)
- Conversation history with sidebar navigation
- Embedded PDF preview
- 4T's prompt engineering in the system prompt
- Docker Compose deployment

**Not included:**

- Authentication or multi-user support
- Non-PDF document formats (DOCX, TXT, HTML)
- Production hardening (HTTPS, rate limiting)
- Cloud LLM fallback

## Summary of Implementation

**Backend** — Express/TypeScript API with three service layers: `documentProcessor` (PDF parsing, chunking, embedding), `vectorStore` (ChromaDB operations), and `rag` (LangGraph pipeline). SQLite stores document metadata and chat history. File uploads are handled by multer (PDF only, max 50 MB). Document processing runs asynchronously — the upload returns immediately while chunking and embedding happen in the background.

**Frontend** — React SPA with two pages: a **Documents page** for uploading, previewing, and managing PDFs (with status polling during processing), and a **Chat page** with a streaming message display and conversation sidebar. The chat interface parses SSE events line-by-line, appending tokens to the assistant's message in real time.

**Infrastructure** — Docker Compose runs three services (frontend/nginx, backend, ChromaDB) with persistent volumes for uploads, database, and vector data. Ollama runs on the host and is reached via `host.docker.internal`.

## Important Design Choices

- **SQLite over PostgreSQL** — sufficient for a single-user prototype; zero configuration overhead.
- **SSE over WebSockets** — simpler protocol for one-directional token streaming; no bidirectional communication needed.
- **LangGraph for orchestration** — provides a clean, extensible state graph abstraction over raw LLM calls; the retrieve→generate pipeline is easy to reason about and extend.
- **Single ChromaDB collection** — all documents share one collection (`hr_documents`) with metadata-based filtering, keeping the architecture simple.
- **Async processing with polling** — document ingestion runs in the background; the frontend polls every 3 seconds until processing completes, avoiding long-lived connections for uploads.
- **External embeddings** — embeddings are computed via Ollama rather than ChromaDB's built-in functions, keeping the embedding model consistent and configurable.

## Limitations, Challenges, and Possible Improvements

**Limitations:**

- Only PDF documents are supported.
- No authentication — the system is single-user and assumes a trusted environment.
- Ollama must be installed and running on the host machine; it is not containerized.
- Despite RAG grounding and explicit prompt rules, the LLM may occasionally hallucinate.

**Challenges:**

- Balancing chunk size and overlap to preserve semantic coherence while fitting within the LLM's context window.
- Ensuring reliable SSE streaming across the nginx reverse proxy required careful header configuration.
- Coordinating async document processing status between backend and frontend without WebSockets.

**Possible improvements:**

- Support additional document formats (DOCX, TXT, HTML).
- Add authentication and multi-user workspace isolation.
- Implement a re-ranking step (e.g., cross-encoder) to improve retrieval precision.
- Optimize chunking strategy with semantic-aware splitting.
- Containerize Ollama for fully self-contained deployment.
- Add unit and integration tests for the RAG pipeline.
