# Plan: HR Document Chatbot with Local LLM + RAG

## TL;DR

Build a two-app system (React frontend + Express backend) that lets HR users upload PDF documents, processes them into a ChromaDB vector store via Ollama embeddings, and provides a RAG-powered chatbot using LangGraph.js to answer questions grounded in those documents. Local Ollama llama3 model handles all generation.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + TypeScript + Express
- **LLM**: Ollama — llama3 (8B) for generation, nomic-embed-text for embeddings
- **Vector Store**: ChromaDB (Docker container)
- **Orchestration**: LangGraph.js (with LangChain.js components)
- **Persistence**: SQLite (via better-sqlite3) for chat history + document metadata
- **Document Format**: PDF only (pdf-parse)
- **Streaming**: SSE (Server-Sent Events) for token-by-token chat responses

---

## Steps

### Phase 1: Project Scaffolding

1. **Initialize backend** (`./backend`): `npm init`, TypeScript config, Express setup, folder structure:

    ```
    backend/
    ├── src/
    │   ├── index.ts              (Express app entry)
    │   ├── routes/
    │   │   ├── chat.ts           (chat endpoints)
    │   │   └── documents.ts      (upload/list/file/delete endpoints)
    │   ├── services/
    │   │   ├── rag.ts            (LangGraph RAG pipeline)
    │   │   ├── vectorStore.ts    (ChromaDB operations)
    │   │   └── documentProcessor.ts (PDF parsing + chunking)
    │   ├── db/
    │   │   ├── schema.ts         (SQLite schema)
    │   │   └── index.ts          (DB connection)
    │   └── config.ts             (environment/config)
    ├── uploads/                  (uploaded PDFs)
    ├── tsconfig.json
    └── package.json
    ```

    Dependencies: `express`, `cors`, `multer`, `pdf-parse`, `better-sqlite3`, `@langchain/langgraph`, `@langchain/ollama`, `@langchain/community`, `chromadb`, `uuid`

2. **Initialize frontend** (`./frontend`): Vite + React + TypeScript, install Tailwind CSS + shadcn/ui, folder structure:

    ```
    frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── pages/
    │   │   ├── ChatPage.tsx
    │   │   └── DocumentsPage.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Navbar.tsx
    │   │   ├── chat/
    │   │   │   ├── ChatMessage.tsx
    │   │   │   └── ChatInput.tsx
    │   │   └── documents/
    │   │       ├── UploadArea.tsx
    │   │       ├── DocumentList.tsx
    │   │       └── DocumentPreview.tsx
    │   ├── lib/
    │   │   └── api.ts            (API client)
    │   └── types/
    │       └── index.ts
    ├── tailwind.config.ts
    └── package.json
    ```

3. **Docker Compose** (`./docker-compose.yml`): ChromaDB service. Ollama assumed running on host.

### Phase 2: Backend — Database & Document Processing

4. **SQLite schema** — Two tables:
    - `documents` (id, filename, original_name, upload_date, chunk_count, status)
    - `chat_messages` (id, conversation_id, role, content, created_at)

5. **Document upload endpoint** (`POST /api/documents`):
    - Accept PDF via multer
    - Save file to `uploads/`
    - Insert metadata into SQLite with status "processing"
    - Trigger async processing (step 6)

6. **Document processing service**:
    - Parse PDF with `pdf-parse`
    - Split text into chunks using LangChain's `RecursiveCharacterTextSplitter`
    - Generate embeddings via Ollama `nomic-embed-text`
    - Store vectors in ChromaDB (collection per app, metadata includes document ID)
    - Update document status to "ready" in SQLite

7. **Document list endpoint** (`GET /api/documents`): Return all documents with metadata from SQLite.

8. **File serve endpoint** (`GET /api/documents/:id/file`): Serve raw PDF file (`res.sendFile()`, `Content-Type: application/pdf`) for embedded browser viewing.

9. **Document delete endpoint** (`DELETE /api/documents/:id`): Remove from SQLite, delete vectors from ChromaDB, delete file.

### Phase 3: Backend — RAG Pipeline with LangGraph

10. **LangGraph RAG state graph** with nodes:
    - **retrieve**: Query ChromaDB with user question → return top-k relevant chunks
    - **generate**: Construct prompt with 4T's design + retrieved context → call Ollama llama3 → stream response

    Graph: `START → retrieve → generate → END`

11. **4T's prompt template**:
    - **Traits**: "You are a knowledgeable HR assistant with expertise in company policies and procedures"
    - **Task**: "Answer the user's HR-related question using ONLY the provided context documents"
    - **Tone**: "Professional, helpful, and concise"
    - **Target**: "HR employees and managers seeking quick answers about company policies"

    System prompt encodes all 4T's. Retrieved context injected as part of the prompt.

12. **Chat endpoint** (`POST /api/chat`):
    - Accept `{ message, conversationId? }`
    - Run LangGraph pipeline
    - Stream response via SSE
    - Save messages (user + assistant) to SQLite

13. **Chat history endpoint** (`GET /api/chat/:conversationId`): Return conversation messages.

14. **Conversations list endpoint** (`GET /api/conversations`): Return list of conversations.

### Phase 4: Frontend — Layout & Navigation

15. **App shell**: React Router with two routes: `/chat` and `/documents`. Navbar with navigation links, app title "HR Document Assistant".

16. **Navbar component**: shadcn/ui navigation menu with "Chat" and "Documents" links + active state.

### Phase 5: Frontend — Documents Page

17. **Upload area**: Drag-and-drop zone + file picker for PDF upload. Shows upload progress. Calls `POST /api/documents`.

18. **Document list**: Table/card list showing uploaded documents (name, date, status, chunk count). Calls `GET /api/documents`. Delete button per document.

19. **Document preview**: Modal or side panel with an `<iframe src="/api/documents/:id/file">` embedding the full PDF in the browser's native PDF viewer. No extra library needed.

### Phase 6: Frontend — Chat Page

20. **Chat interface**: Message list (user messages right-aligned, assistant left-aligned), auto-scroll to bottom.

21. **Chat input**: Text input with send button. On submit, calls `POST /api/chat` and reads SSE stream.

22. **SSE streaming handler**: Parse streaming response, update message in real-time as tokens arrive.

23. **Conversation management**: Optional sidebar or dropdown to switch between conversations.

### Phase 7: Integration & Polish

24. **Error handling**: API error responses, frontend error toasts (shadcn/ui toast), loading states.

25. **CORS configuration**: Backend allows frontend origin.

26. **Environment config**: `.env.example` with Ollama URL, ChromaDB URL, model names, port.

---

## Relevant Files

- `./backend/src/services/rag.ts` — Core LangGraph pipeline (retrieve → generate), 4T's prompt template
- `./backend/src/services/vectorStore.ts` — ChromaDB connection, embedding storage, similarity search
- `./backend/src/services/documentProcessor.ts` — PDF parsing, text chunking, embedding generation
- `./backend/src/routes/chat.ts` — SSE streaming chat endpoint
- `./backend/src/routes/documents.ts` — Upload, list, file serve, delete endpoints
- `./backend/src/db/schema.ts` — SQLite tables for documents and chat messages
- `./frontend/src/pages/ChatPage.tsx` — Chat UI with streaming
- `./frontend/src/pages/DocumentsPage.tsx` — Upload + list + preview
- `./frontend/src/lib/api.ts` — API client for all backend calls
- `./docker-compose.yml` — ChromaDB service

---

## Verification

1. **Document upload flow**: Upload a sample HR PDF → verify it appears in document list with status "ready" → verify chunks exist in ChromaDB
2. **RAG retrieval**: Ask a question about uploaded document content → verify retrieved chunks are relevant (log them)
3. **Chat accuracy**: Ask specific questions from uploaded HR documents → verify answers cite/reference actual document content, not hallucinated info
4. **Streaming**: Verify tokens appear incrementally in the chat UI, not all at once
5. **Document preview**: Click a document → verify full PDF renders in embedded viewer
6. **Persistence**: Restart backend → verify documents and chat history survive
7. **No-context handling**: Ask a question with no documents uploaded → verify the system says it has no information rather than hallucinating

---

## Decisions

- **LangGraph.js** over plain LangChain.js — supports future two-agent extension, earns optional extension points
- **ChromaDB** as vector store — well-supported by LangChain.js, runs in Docker, simple setup
- **SQLite** for metadata/history — zero config, file-based, appropriate for MVP scope
- **PDF only** — keeps document processing simple; DOCX/TXT can be added later
- **SSE** for streaming — simpler than WebSockets for unidirectional streaming
- **shadcn/ui** — accessible, customizable components that work with Tailwind
- **PDF iframe preview** — native browser rendering, no extra dependencies

## Scope

- **Included**: Upload PDFs, process into vectors, chat with RAG, streaming responses, embedded PDF preview, chat history, 4T's prompt engineering
- **Excluded**: Authentication/authorization, multi-user support, production deployment, DOCX/TXT support, two-agent workflow (future extension)

---

## Further Considerations

1. **Conversation context**: Should previous messages in a conversation be included in the LLM prompt for multi-turn context? Recommend yes (last N messages) for a natural chat experience.
2. **Chunk size**: Default to 1000 characters with 200 overlap for `RecursiveCharacterTextSplitter` — standard for RAG. Can be tuned later.
3. **Top-k retrieval**: Default to 4 retrieved chunks. Balances context quality vs. token budget for llama3 8B.
