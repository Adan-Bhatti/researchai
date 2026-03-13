from fastapi import FastAPI, APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import csv
import io
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from prompt_generator import generate_prompt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ── Models ────────────────────────────────────────────────────────────────────

class ResearchConfig(BaseModel):
    platforms: List[str] = []
    niches: List[str] = []
    depth: str = "standard"
    output_format: str = "json"
    dataset_size: int = 10
    custom_query: Optional[str] = None


class ResearchTaskCreate(BaseModel):
    config: ResearchConfig
    title: Optional[str] = None


class TemplateSave(BaseModel):
    name: str
    description: Optional[str] = ""
    config: ResearchConfig


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_task(title: str, config: ResearchConfig, prompt: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "config": config.model_dump(),
        "generated_prompt": prompt,
        "status": "pending",
        "results": None,
        "raw_response": None,
        "error": None,
        "total_results": 0,
        "created_at": now,
        "completed_at": None,
    }


def make_template(name: str, description: str, config: ResearchConfig) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "config": config.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ── Background research execution ─────────────────────────────────────────────

async def run_research_task(task_id: str):
    try:
        await db.research_tasks.update_one({"id": task_id}, {"$set": {"status": "running"}})

        task_doc = await db.research_tasks.find_one({"id": task_id})
        if not task_doc:
            return

        prompt = task_doc["generated_prompt"]
        api_key = os.environ.get("EMERGENT_LLM_KEY")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"research-{task_id}",
            system_message="You are an expert research analyst. Always respond with valid JSON arrays only. No markdown, no code blocks, no extra text."
        ).with_model("gemini", "gemini-3-flash-preview")

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        raw_response = str(response)

        # Parse JSON from response
        results = []
        try:
            text = raw_response.strip()
            if "```" in text:
                parts = text.split("```")
                for part in parts:
                    part = part.strip()
                    if part.startswith("json"):
                        part = part[4:].strip()
                    if part.startswith("["):
                        text = part
                        break
            results = json.loads(text)
            if not isinstance(results, list):
                results = [results]
        except json.JSONDecodeError:
            start = raw_response.find('[')
            end = raw_response.rfind(']') + 1
            if start != -1 and end > start:
                try:
                    results = json.loads(raw_response[start:end])
                except Exception:
                    results = []

        # Validate results
        config_data = task_doc.get("config", {})
        validated = []
        for r in results:
            if isinstance(r, dict):
                r.setdefault("title", "Unknown Resource")
                r.setdefault("platform", config_data.get("platforms", ["Web"])[0] if config_data.get("platforms") else "Web")
                r.setdefault("url", "#")
                r.setdefault("description", "No description available.")
                r.setdefault("relevance_score", 7)
                r.setdefault("confidence_score", 70)
                niches = config_data.get("niches", ["General"])
                r.setdefault("category", niches[0] if niches else "General")
                r.setdefault("tags", [])
                r.setdefault("engagement_level", "Medium")
                r.setdefault("source_type", "Resource")
                validated.append(r)

        completed_at = datetime.now(timezone.utc).isoformat()
        await db.research_tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "completed",
                "results": validated,
                "raw_response": raw_response[:5000],
                "total_results": len(validated),
                "completed_at": completed_at
            }}
        )
        logger.info(f"Task {task_id} completed with {len(validated)} results")

    except Exception as e:
        logger.error(f"Task {task_id} failed: {e}")
        await db.research_tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "AI Research Automation Hub API"}


@api_router.get("/research/stats")
async def get_stats():
    total = await db.research_tasks.count_documents({})
    completed = await db.research_tasks.count_documents({"status": "completed"})
    templates_count = await db.templates.count_documents({})
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_results"}}}
    ]
    agg = await db.research_tasks.aggregate(pipeline).to_list(1)
    total_results = agg[0]["total"] if agg else 0
    return {
        "total_runs": total,
        "completed_runs": completed,
        "success_rate": round((completed / total * 100) if total > 0 else 0, 1),
        "templates_count": templates_count,
        "total_results": total_results
    }


@api_router.get("/research/history")
async def get_history():
    tasks = await db.research_tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return tasks


@api_router.post("/research/run")
async def run_research(request: ResearchTaskCreate, background_tasks: BackgroundTasks):
    cfg = request.config
    title = request.title or f"{', '.join(cfg.niches[:2]) if cfg.niches else 'Research'} on {', '.join(cfg.platforms[:2]) if cfg.platforms else 'Web'}"
    prompt = generate_prompt(
        platforms=cfg.platforms,
        niches=cfg.niches,
        depth=cfg.depth,
        output_format=cfg.output_format,
        dataset_size=cfg.dataset_size,
        custom_query=cfg.custom_query or ""
    )
    task = make_task(title, cfg, prompt)
    await db.research_tasks.insert_one(task)
    background_tasks.add_task(run_research_task, task["id"])
    return {"task_id": task["id"], "status": "pending", "message": "Research started"}


@api_router.post("/research/preview-prompt")
async def preview_prompt(config: ResearchConfig):
    prompt = generate_prompt(
        platforms=config.platforms,
        niches=config.niches,
        depth=config.depth,
        output_format=config.output_format,
        dataset_size=config.dataset_size,
        custom_query=config.custom_query or ""
    )
    return {"prompt": prompt}


@api_router.get("/research/{task_id}")
async def get_research(task_id: str):
    task = await db.research_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Research task not found")
    return task


@api_router.delete("/research/{task_id}")
async def delete_research(task_id: str):
    result = await db.research_tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Research task not found")
    return {"message": "Research task deleted"}


@api_router.get("/research/{task_id}/export")
async def export_research(task_id: str, format: str = Query("json")):
    task = await db.research_tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    results = task.get("results") or []
    if not results:
        raise HTTPException(status_code=400, detail="No results to export")

    if format == "json":
        content = json.dumps(results, indent=2, ensure_ascii=False)
        return StreamingResponse(
            io.StringIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=research_{task_id[:8]}.json"}
        )

    if format == "csv":
        output = io.StringIO()
        fieldnames = list(results[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in results:
            row_copy = {k: (", ".join(v) if isinstance(v, list) else v) for k, v in row.items()}
            writer.writerow(row_copy)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=research_{task_id[:8]}.csv"}
        )

    if format == "xlsx":
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Research Results"
        if results:
            headers = list(results[0].keys())
            ws.append(headers)
            for row in results:
                ws.append([
                    ", ".join(str(x) for x in v) if isinstance(v, list) else v
                    for v in [row.get(h, "") for h in headers]
                ])
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=research_{task_id[:8]}.xlsx"}
        )

    raise HTTPException(status_code=400, detail="Invalid export format. Use: json, csv, xlsx")


# ── Templates ─────────────────────────────────────────────────────────────────

@api_router.get("/templates")
async def get_templates():
    templates = await db.templates.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return templates


@api_router.post("/templates")
async def save_template(request: TemplateSave):
    template = make_template(request.name, request.description or "", request.config)
    await db.templates.insert_one(template)
    template.pop("_id", None)
    return template


@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}


# ── App setup ─────────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
