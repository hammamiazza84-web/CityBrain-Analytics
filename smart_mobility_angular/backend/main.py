"""
API FastAPI — POST /api/assistant/chat (proxy OpenAI).

  uvicorn main:app --host 127.0.0.1 --port 5004

OPENAI_API_KEY doit être défini dans l'environnement du process uvicorn.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger("assistant")
logging.basicConfig(level=logging.INFO)

OPENAI_URL = "https://api.groq.com/openai/v1/chat/completions"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., max_length=32000)


class AssistantChatBody(BaseModel):
    message: str = ""
    audience: str = "client"
    messages: list[ChatTurn] = []
    context: dict[str, Any] | None = None


app = FastAPI(title="Smart Mobility — Assistant chat proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Smart Mobility — assistant API",
        "docs_swagger": "/docs",
        "health_check": "/api/health",
        "assistant_chat": "POST /api/assistant/chat",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "assistant": "smart-mobility-backend"}


def _system_prompt(audience: str, context: dict[str, Any] | None) -> str:
    ctx = context or {}
    try:
        ctx_str = json.dumps(ctx, ensure_ascii=False)[:2000]
    except (TypeError, ValueError):
        ctx_str = str(ctx)[:2000]
    return (
        "Tu es Smart Assistant pour la plateforme Smart Mobility (mobilité urbaine, "
        "tableaux de bord ML, transports, CO2). "
        f"Audience: {audience}. "
        "Réponds en français, de façon concise et utile ; emojis sobres. "
        f"Contexte JSON fourni par l'app : {ctx_str}"
    )


@app.post("/api/assistant/chat")
async def assistant_chat(body: AssistantChatBody):
    try:
        return await _assistant_chat_core(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("assistant_chat erreur inattendue")
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {e}. Voir le terminal uvicorn pour la traceback.",
        ) from e


async def _assistant_chat_core(body: AssistantChatBody) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY manquant sur le serveur (variable d'environnement)",
        )

    model = os.environ.get("OPENAI_MODEL", "gpt-4-turbo")

    turns: list[dict[str, str]] = []
    for m in body.messages[-16:]:
        if m.role in ("user", "assistant"):
            turns.append({"role": m.role, "content": m.content[:8000]})

    # Swagger envoie souvent messages: [] — au moins un tour « user » (OpenAI exige un dialogue)
    last_user = (body.message or "").strip()
    if last_user:
        if not turns or turns[-1]["role"] != "user" or turns[-1]["content"] != last_user:
            turns.append({"role": "user", "content": last_user[:8000]})
    if not turns:
        turns.append({"role": "user", "content": "Bonjour"})

    messages: list[dict[str, str]] = [
        {"role": "system", "content": _system_prompt(body.audience, body.context)},
        *turns,
    ]

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": float(os.environ.get("OPENAI_TEMPERATURE", "0.7")),
                    "max_tokens": int(os.environ.get("OPENAI_MAX_TOKENS", "500")),
                },
            )
    except httpx.RequestError as e:
        logger.exception("OpenAI connection error")
        raise HTTPException(status_code=502, detail=f"OpenAI injoignable: {e}") from e

    raw_text = r.text
    if r.status_code != 200:
        logger.warning("OpenAI HTTP %s: %s", r.status_code, raw_text[:500])
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI HTTP {r.status_code}: {raw_text[:1500]}",
        )

    try:
        data = r.json()
    except json.JSONDecodeError as e:
        logger.exception("OpenAI response not JSON: %s", raw_text[:500])
        raise HTTPException(
            status_code=502,
            detail=f"Réponse OpenAI non-JSON: {raw_text[:500]}",
        ) from e

    try:
        reply = (data.get("choices") or [{}])[0].get("message") or {}
        reply = (reply.get("content") or "").strip()
    except (IndexError, TypeError, AttributeError) as e:
        logger.exception("Unexpected OpenAI shape: %s", data)
        raise HTTPException(
            status_code=502,
            detail=f"Réponse OpenAI inattendue: {str(data)[:800]}",
        ) from e

    if not reply:
        raise HTTPException(status_code=502, detail="Réponse vide du modèle")

    return {"reply": reply, "confidence": 0.9}
