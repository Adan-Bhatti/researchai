# AI Research Automation Hub — PRD

## Problem Statement
Build a full-stack web application that automates deep research tasks across multiple platforms using structured AI prompts and the Gemini 3 Flash API. Users configure research tasks via a clean UI; the system auto-generates optimal prompts and runs them through AI research APIs.

## Architecture

### Tech Stack
- **Frontend**: React 19 + React Router + Tailwind CSS + shadcn UI
- **Backend**: FastAPI (Python) + MongoDB (Motor async)
- **AI**: Gemini 3 Flash via `emergentintegrations` (EMERGENT_LLM_KEY)
- **Export**: CSV (stdlib), JSON (stdlib), Excel (openpyxl)

### File Structure
```
/app/
├── backend/
│   ├── server.py           - FastAPI app, all routes, background task runner
│   ├── prompt_generator.py - Structured prompt generation logic
│   └── .env                - MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
├── frontend/src/
│   ├── App.js              - Router + Layout + Toaster
│   ├── api/client.js       - Axios API wrapper
│   ├── components/Layout.jsx - Sidebar navigation
│   └── pages/
│       ├── Dashboard.jsx    - Bento grid command center
│       ├── ResearchBuilder.jsx - 4-step split wizard
│       ├── Results.jsx      - Polling + data table + export
│       ├── History.jsx      - Research run list + status
│       └── Templates.jsx    - Saved + preset templates
```

### Database Collections (MongoDB)
- `research_tasks`: id, title, config{platforms, niches, depth, output_format, dataset_size, custom_query}, generated_prompt, status, results[], total_results, error, created_at, completed_at
- `templates`: id, name, description, config, created_at

### API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/ | Health check |
| GET | /api/research/stats | Dashboard stats |
| GET | /api/research/history | All research tasks |
| POST | /api/research/run | Create + start research task |
| POST | /api/research/preview-prompt | Preview generated prompt |
| GET | /api/research/{id} | Get task status/results |
| DELETE | /api/research/{id} | Delete task |
| GET | /api/research/{id}/export?format= | Export CSV/JSON/XLSX |
| GET | /api/templates | Get all templates |
| POST | /api/templates | Save template |
| DELETE | /api/templates/{id} | Delete template |

## User Personas
- Marketers needing lead generation data
- SaaS founders researching competitor landscape
- Researchers mapping online communities
- Freelancers finding potential clients

## Core Requirements (Static)
1. Research Builder: Platform selector (9 platforms), niche selector (12 niches), depth (4 levels), output format (6 options), dataset size (1-1000)
2. Auto Prompt Generator: Structured, platform-specific prompts with validation rules
3. Multi-platform research via Gemini 3 Flash
4. Results: table view, search, filter, sorting, expandable rows
5. Export: CSV, JSON, Excel
6. Templates: save & load research configurations
7. History: all past runs with status tracking

## What's Been Implemented (2026-02)
- [x] Full FastAPI backend with all CRUD routes
- [x] Gemini 3 Flash integration via emergentintegrations
- [x] Structured prompt generator (platform-specific strategies)
- [x] Background task runner for async AI research
- [x] Results processor (JSON parsing, validation, enrichment)
- [x] Export: CSV, JSON, Excel (openpyxl)
- [x] Dashboard with bento grid layout + live stats
- [x] Research Builder: 4-step split wizard with live prompt preview
- [x] Results page: polling, table, sort, search, filter, export, expandable rows
- [x] History page: all runs, status badges, delete
- [x] Templates page: save/use templates + 4 preset quick-start templates
- [x] Dark theme (Deep Slate #020617 + Indigo #6366f1)
- [x] 100% backend (14/14) + frontend tests passing

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Research execution pipeline
- [x] Gemini AI integration
- [x] Results display + export

### P1 - High Priority (Next)
- [ ] Real-time progress streaming (SSE/WebSocket)
- [ ] Pagination for large result sets (>100 results)
- [ ] Re-run functionality from history
- [ ] Email/webhook notification on completion
- [ ] Search across history by title/topic

### P2 - Nice to Have
- [ ] Multiple AI provider support (OpenAI, Claude)
- [ ] Results comparison between runs
- [ ] Scheduled/recurring research tasks
- [ ] Collaboration/sharing research results
- [ ] Custom platform configurations
