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

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + TypeScript + Express
- **LLM**: Ollama (llama3:8b for generation, nomic-embed-text for embeddings)
- **Vector Store**: ChromaDB
- **Orchestration**: LangGraph.js
- **Database**: SQLite (chat history + document metadata)
