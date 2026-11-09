# Anish Tripathi: Voice Interview Bot

A voice-first bot that answers interview questions in the first person as Anish Tripathi, AI/ML and MLOps Engineer. It answers only from one profile file, and says so honestly when that file does not cover a question.

**Live:** https://100xvoiceagentanishtripathi.vercel.app/

## What it does

- Speak a question or type it. The answer is read aloud with the browser's default voice.
- Answers are 3 to 6 spoken sentences, with no lists or markdown.
- Pause/Resume and Stop controls, with barge-in: start speaking to interrupt the bot.
- A short buffer (0.5 s) after you finish speaking before the question is sent.
- History tab, stored in the browser (last 100 questions), with Clear all.
- Refuses or deflects questions about phone numbers, marital status, unrelated trivia, and requests to reveal its instructions.

## How it works

```
Browser (index.html)
  │  question (typed or spoken via Web Speech API)
  ▼
POST /api/ask  (Vercel serverless function, api/ask.js)
  │  system prompt = rules + profile/answers.md
  ├─▶ Groq   (openai/gpt-oss-120b)      primary
  └─▶ Gemini (GEMINI_MODEL)             fallback if Groq fails
  ▼
Answer text (sentence-capped) → browser speechSynthesis
```

The API keys live only on the server. The browser never sees them.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | Single-page UI: voice and text input, answer card, playback controls, History tab |
| `api/ask.js` | The only server path to the LLMs: builds the prompt, calls Groq then Gemini, enforces the sentence limit |
| `profile/answers.md` | The only source of facts about Anish. Edit this to change what the bot says |
| `dev-server.js` | Local server on port 3100 that serves `index.html` and routes `/api/ask` to the same handler used in production |
| `vercel.json` | Bundles `profile/**` with the API function so the profile is available at runtime |
| `tests/questions.txt` | 20 interview questions used for manual and live checks |

## Run locally

Requirements: Node.js 18 or newer.

1. Create `.env.local` in the project root:

   ```bash
   GROQ_API_KEY=your_groq_key
   GEMINI_API_KEY=your_gemini_key
   # optional
   GEMINI_MODEL=gemini-3.8-flash
   ```

2. Start the server:

   ```bash
   node --env-file-if-exists=.env.local dev-server.js
   ```

3. Open http://localhost:3100. Use Chrome or Edge for the best speech support. Safari needs a tap to unlock audio.

At least one of `GROQ_API_KEY` or `GEMINI_API_KEY` is required. Groq is free to use, and Gemini is used as a backup when Groq is unavailable or rate-limited.

## Deploy

The project is deployed on Vercel from the `main` branch.

1. Import the repository in Vercel.
2. Add `GROQ_API_KEY` and `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) under Project Settings, then Environment Variables.
3. Deploy. Vercel picks up `api/ask.js` as a serverless function and includes `profile/**` through `vercel.json`.

## Changing what the bot says

All facts come from `profile/answers.md`. Edit that file, commit, and redeploy. The rules in `buildSystemPrompt()` in `api/ask.js` control tone and what the bot may claim: no invented facts, no contact details, and an honest "I don't have that detail" when the profile is silent.

## Testing

- **Manual:** run `tests/questions.txt` through the UI and check each answer against `profile/answers.md`.
- **Live:** post each question to `/api/ask` on the deployed URL and check for status 200, a length of 3 to 6 sentences, and no invented facts. A 429 means a provider rate limit; retry after a short wait.

## Known limits

- Speech depends on the browser. Chrome and Edge support recognition best.
- Free-tier rate limits on Groq and Gemini can return "The bot is busy" during heavy use.
- History is stored only in the current browser and is not synced.

## License

See [LICENSE](LICENSE).
