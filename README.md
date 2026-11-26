# Dental Clinic AI Assistant

**A grounded AI assistant that answers only from the clinic's documents, sends emergencies to 911, and books appointments through tool calling.**

My first end-to-end RAG project, built as a reusable skeleton for domain-specific assistants.

[Live demo](<live-demo-url>) · [Architecture](#how-it-works) · [Use it as a skeleton](#use-it-as-a-skeleton)

## Why it's different from a typical chatbot

- **It doesn't make things up.** Answers come from retrieved documents with a similarity threshold. When nothing relevant is found, it says so and points to the administrator. Every answer cites its source file.
- **Safety doesn't depend on the LLM.** Emergency symptoms are caught by deterministic code before the model is called.
- **It acts, not just talks.** The agent picks a doctor from the complaint, offers free slots, asks for confirmation and books through an atomic SQL function, so a time slot can never be double booked.
- **Production habits.** Streaming UI, input validation, per-key rate limiting, access codes, server-only secrets, deployed on Vercel.

## Use it as a skeleton

The core is domain-agnostic. Everything specific to a business lives in one folder, `src/packs/`.

| Layer | Where | What changes per project |
|---|---|---|
| Graph, retrieval, streaming, rate limit, access control | `src/core/` | Nothing |
| Chat UI | `src/components/` | Optional branding |
| Prompts, emergency rules, tools, UI texts | `src/packs/` | Everything |
| Knowledge base | `data/` + `npm run ingest` | Your documents |

To build a new assistant (legal intake, finance, HR, support):

1. Use this repository as a template.
2. Write a new pack: system prompt, safety rules, UI texts.
3. Add your tools (any function with a Zod schema) and wire them into the pack.
4. Drop your documents into `data/`, run `npm run ingest`, deploy.

A second project on the same skeleton, a personal finance assistant, is in progress.