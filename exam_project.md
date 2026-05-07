# Exam Project — LLM for Developers

## Purpose

You must design and implement a software solution based on a case of your own choice.

The solution must use a **local LLM** as part of the delivered system and must include **RAG (Retrieval-Augmented Generation)** as part of the final solution.

The goal is to show that you can take the techniques from the course and turn them into a realistic, working application with clear documentation.

---

## Project Choice

You choose your own project idea, but it must stay within the guardrails in this document.

Your project must clearly define:

- the problem being solved
- the intended user or target group
- the value of the solution
- the role of the LLM in the system

A project is not approved simply because it contains an LLM. The LLM must be part of the actual solution and must have a clear purpose.

---

## Core Requirements

Your project must include all of the following:

### 1. A working prototype software solution
You must deliver a working prototype software solution that can be run and demonstrated.

Examples of acceptable forms include:

- a website
- a web application
- an API-backed application
- another software interface with a clear user flow

The solution must do more than show a simple prompt-response demo. It must function as a small but complete working prototype system.

### 2. A local LLM in the delivered solution
The delivered solution must get its generated answers from a **local LLM**.

This means:

- the final system must use a local model
- the LLM must be part of the delivered application flow
- the local LLM must be used in the version you hand in and demonstrate

Cloud-based LLMs may be used during development as support tools, but the delivered solution itself must rely on a local LLM for its core answer generation.

### 3. RAG must be part of the solution
Your project must include **retrieval-augmented generation**.

You may use a course path shown earlier or design your own RAG pipeline, as long as the delivered solution clearly uses retrieval as part of the answer generation flow.

Accepted approaches include, but are not limited to:

- an Ollama-based RAG pipeline
- an OpenWebUI Knowledge-based solution
- another RAG pipeline designed and implemented by you

You may choose the approach that fits your project best, as long as the delivered solution is clearly a RAG-based system.

Your solution must show that answers are based on retrieved material rather than only on the model’s general knowledge.

### 4. 4T’s prompt engineering must be used
Your project must make meaningful use of the **4T’s prompt engineering approach**.

This means you must deliberately consider and apply:

- Traits
- Task
- Tone
- Target

The 4T’s must be used as part of how your solution guides the LLM. This can be shown through system prompts, prompt templates, structured prompt design, or another clearly documented prompt strategy used in the delivered solution.

It is not enough to mention the 4T’s in the synopsis. They must be visible in the actual solution and explained in your documentation.

### 4. A clear application flow
Your project must have a clear path from user input to system output.

A typical example could be:

- a user asks a question
- the system retrieves relevant information
- the local LLM generates an answer based on that information
- the answer is returned through your application

### 5. A defined MVP
You must define a **minimum viable product (MVP)**.

In this project, the MVP is understood as the **smallest working prototype** that demonstrates the core idea of the solution.

This means the MVP does not need to be production-ready, fully scalable, or feature-complete. It must, however, work clearly enough to show the intended purpose, the role of the local LLM, and the role of RAG in the solution.

You may add extra features beyond the MVP, but the MVP must be clearly defined and must work as a prototype.

---

## Scope Rules

Your project must be realistic and limited in scope.

### You must:
- choose one main technical path
- keep the project small enough to complete well
- make clear what is included in the MVP
- make clear what is not included

### You should avoid:
- building a large system with many incomplete parts
- treating complexity as a goal in itself

A focused and well-executed project is better than a large but unstable one.

---

## Documentation Requirements

You must document both the solution and how it is used.

### 1. Setup Guide
You must include a setup guide that makes it possible for another person to run your project.

The setup guide must include:

- prerequisites
- installation steps
- configuration steps
- how to start the system
- how to provide or load the RAG source material
- how to test or use the solution

This setup guide should be part of the delivered project files, for example as a `README.md` and any supporting documentation files.

### 2. Technical Documentation
Your delivered project must document the key parts of the system, including:

- the overall architecture
- which local LLM path is used
- how RAG is implemented
- how the different parts of the system connect
- known limitations or risks

---

## Synopsis

You must hand in a **synopsis of maximum 5 pages**.

The synopsis must be short, structured, and focused on the project you built.

The synopsis must include:

- project title
- problem statement
- target user or target group
- chosen architecture
- explanation of how the local LLM is used
- explanation of how RAG is used
- explanation of how the 4T’s are used in the solution
- MVP description
- summary of implementation
- important design choices
- limitations, challenges, and possible improvements

The setup guide is **not** part of the 5-page synopsis limit.

---

## Deliverables

You must hand in all of the following:

### 1. The project itself
This must include the source code and the files needed to run the solution.

### 2. A setup guide
This must explain how to install, configure, and run the system.

### 3. A synopsis
Maximum 5 pages.

### 4. Any required project assets
This may include, where relevant:

- documents used for RAG
- configuration examples
- prompts or system instructions
- database or storage setup files
- dependency files

---

## What Counts as a Valid Project

A valid project must:

- solve a defined problem
- use a local LLM in the delivered solution
- use the 4T’s as part of the prompt design
- include RAG
- work as a usable prototype software solution
- be documented clearly enough to understand and reproduce

---

## Optional Extensions

The following are allowed, but not required:

- orchestration with AutoGen Studio or LangGraph or any other orchestration or agentic approach you found to be working for you
- custom frontend design
- imported Hugging Face models in Ollama
- additional features beyond the MVP
- cloud-based development support tools
- extra integrations

These can strengthen a project when they are relevant and well integrated, but they are not required for a good result.

---

## Recommended Project Pattern

A strong project usually has this shape:

- one clear problem
- one clear user group
- one main architecture choice
- one working MVP
- one local LLM path
- one RAG solution
- clear setup documentation
- short and focused written reflection

---

## Final Reminder

Choose a project that you can complete well.

Build something focused.

Make it work.

Document it clearly.

Use the LLM and RAG as meaningful parts of the solution, not as decoration.

Limit your project to a mimimum viable prototype, Expansion is easier than limiting to large a scope when time becomes tight.
