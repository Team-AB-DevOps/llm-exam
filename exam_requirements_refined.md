# Exam Project — LLM for Developers (Refined Requirements)

## Purpose

Design and implement a software solution based on a case of your own choice. The solution must use a **local LLM** with **RAG (Retrieval-Augmented Generation)** as core parts of the delivered system — not as decoration.

---

## Project Definition

Your project must clearly define:

- The problem being solved
- The intended user or target group
- The value of the solution
- The role of the LLM in the system

The LLM must have a clear, justified purpose within the solution.

---

## Core Requirements

### 1. Working Prototype

Deliver a working prototype with a clear user flow. Acceptable forms include websites, web applications, API-backed applications, or other software interfaces. It must function as a small but complete system — not just a prompt-response demo.

### 2. Local LLM

The delivered solution must use a **local model** for its core answer generation. Cloud-based LLMs may be used during development, but the handed-in version must rely on a local LLM.

### 3. RAG Pipeline

The solution must include retrieval-augmented generation, demonstrating that answers are based on retrieved material rather than only on the model's general knowledge. Accepted approaches include:

- Ollama-based RAG pipeline
- OpenWebUI Knowledge-based solution
- A custom RAG pipeline

### 4. 4T's Prompt Engineering

Deliberately apply the **4T's** in your prompt design:

- **Traits** — **Task** — **Tone** — **Target**

The 4T's must be visible in the actual solution (system prompts, prompt templates, structured prompt design) and explained in the documentation. Mentioning them in the synopsis alone is not sufficient.

### 5. Clear Application Flow

The system must have a defined path from user input to system output, typically:

1. User asks a question
2. System retrieves relevant information
3. Local LLM generates an answer based on retrieved context
4. Answer is returned through the application

### 6. Defined MVP

Define a **minimum viable product** — the smallest working prototype that demonstrates the core idea. It does not need to be production-ready, scalable, or feature-complete, but it must clearly show the intended purpose and the role of LLM + RAG. Clearly state what is and is not included.

---

## Scope

- Choose one main technical path
- Keep the project small enough to complete well
- A focused, well-executed project is better than a large, unstable one

---

## Deliverables

### 1. Source Code & Project Files

All source code and files needed to run the solution, including:

- Documents used for RAG
- Configuration examples
- Prompts or system instructions
- Database or storage setup files
- Dependency files

### 2. Setup Guide (not counted toward page limit)

Must enable another person to run the project. Include:

- Prerequisites
- Installation steps
- Configuration steps
- How to start the system
- How to provide/load RAG source material
- How to test or use the solution

### 3. Technical Documentation

Document the key parts of the system:

- Overall architecture
- Which local LLM path is used
- How RAG is implemented
- How the system components connect
- Known limitations or risks

### 4. Synopsis (max 5 pages)

Short, structured, and focused. Must include:

- Project title
- Problem statement
- Target user/group
- Chosen architecture
- How the local LLM is used
- How RAG is used
- How the 4T's are applied
- MVP description
- Summary of implementation
- Important design choices
- Limitations, challenges, and possible improvements

---

## Optional Extensions

Allowed but not required — can strengthen a project when relevant and well-integrated:

- Orchestration (AutoGen Studio, LangGraph, or other agentic approaches)
- Custom frontend design
- Imported Hugging Face models in Ollama
- Additional features beyond MVP
- Cloud-based development support tools
- Extra integrations
