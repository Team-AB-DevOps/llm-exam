# HR Chat Assistant

A RAG-powered chatbot that lets HR users upload PDF documents and ask questions about them. Built with React, Express, LangGraph.js, Ollama, and ChromaDB.

## Prerequisites

### Ollama

Install [Ollama](https://ollama.com/) and pull the two required models:

```bash
ollama pull llama3:8b
ollama pull nomic-embed-text
```

- **llama3:8b** — used for chat generation
- **nomic-embed-text** — used for document embeddings

Make sure Ollama is running before starting the application (`ollama serve` or via the desktop app).

### Docker & Docker Compose

Required for running ChromaDB (and optionally the full stack). Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with the Compose plugin.

### Node.js

Node.js 18+ is required for local development.

## Configuration

All configuration values are hardcoded with sensible defaults and do not need to be changed. The backend reads its settings from environment variables, but the defaults (`llama3:8b`, `nomic-embed-text`, ChromaDB on port 8000) work out of the box. When running via Docker Compose, these are set automatically.

## Getting Started

### With Docker Compose (recommended)

```bash
docker compose up --build -d
```

This starts the frontend (port 80), backend (port 3001), and ChromaDB (port 8000).

### Local Development

1. Start ChromaDB:

```bash
docker compose up chromadb
```

2. Start the backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Loading RAG Source Material

To load documents into the system, navigate to the **Documents** page in the frontend and upload PDF files using the drag-and-drop area. Each uploaded document is automatically processed — the text is extracted, split into chunks, and stored as vector embeddings in ChromaDB.

Sample HR policy PDFs are provided in `docs/sample-docs/` and can be used as test data.

## Using the Application

### Documents Page

- **Upload**: Drag and drop PDF files onto the upload area, or click to browse
- **Status**: Each document shows its processing status — _processing_ (being chunked and embedded), _ready_ (available for chat), or _error_ (processing failed)
- **Preview**: Click the preview button to view the original PDF in the browser
- **Delete**: Remove a document and its associated vector embeddings

### Chat Page

- **Ask questions**: Type a question about your uploaded documents and receive a streamed response grounded in the retrieved content
- **Conversations**: Previous conversations are listed in the sidebar and can be resumed
- **New chat**: Click "New Chat" to start a fresh conversation

## MVP Definition

The MVP is a working prototype that demonstrates RAG-powered document chat assistant with a local LLM.

**Included:**

- PDF document upload and processing
- RAG-powered chat with streaming responses
- Local LLM via Ollama (llama3:8b)
- Conversation history
- Embedded PDF preview
- 4T's prompt engineering

**Not included:**

- Authentication or multi-user support
- Non-PDF document formats (DOCX, TXT, etc.)
- Production deployment or HTTPS
- Cloud LLM fallback

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + TypeScript + Express
- **LLM**: Ollama (llama3:8b for generation, nomic-embed-text for embeddings)
- **Vector Store**: ChromaDB
- **Orchestration**: LangGraph.js
- **Database**: SQLite (chat history + document metadata)
