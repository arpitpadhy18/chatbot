# from cryptography.fernet import Fernet
# print(Fernet.generate_key().decode())

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from rag_store import RAGStore
from pypdf import PdfReader
import os
from typing import List
import xml.etree.ElementTree as ET
import pandas as pd
from io import BytesIO
from lang_utilities import detect_language
from lang_prompt import get_language_instruction
from collections import defaultdict, deque
from cryptography.fernet import Fernet
from datetime import datetime
import io
from dotenv import load_dotenv
load_dotenv()

# ---------------- APP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- SECURITY ----------------
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise RuntimeError("ENCRYPTION_KEY not set")

fernet = Fernet(ENCRYPTION_KEY)
SECURE_DIR = "secure_docs"
os.makedirs(SECURE_DIR, exist_ok=True)

# ---------------- GROQ ----------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set")

client = Groq(api_key=GROQ_API_KEY)

# ---------------- RAG + MEMORY ----------------
rag = RAGStore()
chat_memory = defaultdict(lambda: deque(maxlen=5))
audit_log = []

# ---------------- MODELS ----------------
class ChatRequest(BaseModel):
    question: str
    top_k: int = 3
    session_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    num_sources: int

class PreviewResponse(BaseModel):
    filename: str
    preview_chunks: List[str]
    total_chunks: int

# ---------------- HELPERS ----------------
def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)

def decrypt_bytes(data: bytes) -> bytes:
    return fernet.decrypt(data)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    chunks, start = [], 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) > 50:
            chunks.append(chunk)
        start = end - overlap
    return chunks

def extract_text_from_bytes(filename: str, raw: bytes) -> str:
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(raw))
        return "\n".join(p.extract_text() or "" for p in reader.pages)

    elif filename.endswith((".txt", ".md")):
        return raw.decode("utf-8")

    elif filename.endswith(".xml"):
        root = ET.fromstring(raw)
        return " ".join(e.text for e in root.iter() if e.text)

    elif filename.endswith((".xls", ".xlsx")):
        sheets = pd.read_excel(BytesIO(raw), sheet_name=None)
        return "\n".join(df.astype(str).to_string() for df in sheets.values())

    else:
        raise ValueError("Unsupported file type")

def log_event(user, action, file):
    audit_log.append({
        "user": user,
        "action": action,
        "file": file,
        "time": datetime.utcnow().isoformat()
    })

# ---------------- ROUTES ----------------
@app.get("/")
async def root():
    return {"message": "Secure RAG Chatbot API"}

# 📤 UPLOAD (ENCRYPTED)
@app.post("/upload")
async def upload_document(file: UploadFile = File(...), session_id: str = "default"):
    raw = await file.read()

    encrypted = encrypt_bytes(raw)
    path = f"{SECURE_DIR}/{session_id}_{file.filename}.enc"

    with open(path, "wb") as f:
        f.write(encrypted)

    decrypted = decrypt_bytes(encrypted)
    text = extract_text_from_bytes(file.filename.lower(), decrypted)
    chunks = chunk_text(text)

    rag.add_texts(chunks, metadata={"source": file.filename, "owner": session_id})

    del decrypted
    log_event(session_id, "upload", file.filename)

    return {
        "message": "Document securely uploaded",
        "filename": file.filename,
        "chunks": len(chunks)
    }

# 🤖 CHAT (MEMORY ONLY)
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    chunks, sources = rag.query_with_sources(req.question, req.top_k)

    if not chunks:
        return ChatResponse(
            answer="No documents available.",
            sources=[],
            num_sources=0
        )

    context = "\n".join(f"[{i+1}] {c}" for i, c in enumerate(chunks))

    history = chat_memory[req.session_id]
    history_text = "\n".join(f"Q:{h['q']} A:{h['a']}" for h in history)

    lang = detect_language(context)
    lang_instruction = get_language_instruction(lang)

    prompt = f"""
You are a secure assistant.
{lang_instruction}

Previous Conversation:
{history_text}

Context:
{context}

Question:
{req.question}

Rules:
- Answer only from context
- Do NOT reveal full documents
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500
    )

    answer = completion.choices[0].message.content

    chat_memory[req.session_id].append({"q": req.question, "a": answer})
    log_event(req.session_id, "chat", ",".join(sources))

    return ChatResponse(answer=answer, sources=sources, num_sources=len(sources))

# 👀 PREVIEW (OWNER ONLY)
@app.get("/preview/{filename}", response_model=PreviewResponse)
async def preview_file(filename: str, session_id: str = "default"):
    chunks = rag.preview_file(filename, limit=3)
    if not chunks:
        raise HTTPException(404, "File not found")

    log_event(session_id, "preview", filename)
    return PreviewResponse(filename=filename, preview_chunks=chunks, total_chunks=len(chunks))

# 📊 STATS
@app.get("/stats")
async def stats():
    return rag.get_stats()

# 🧹 RESET
@app.delete("/files/{filename}")
async def delete_file(filename: str):
    # 1️⃣ Remove from RAG (embeddings + metadata)
    deleted_chunks = rag.delete_by_file(filename)

    if deleted_chunks == 0:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    # 2️⃣ Remove encrypted files from disk
    removed_files = 0
    for file in os.listdir(SECURE_DIR):
        if file.endswith(f"_{filename}.enc"):
            os.remove(os.path.join(SECURE_DIR, file))
            removed_files += 1

    return {
        "message": f"{filename} deleted successfully",
        "deleted_chunks": deleted_chunks,
        "encrypted_files_removed": removed_files
    }

# 📜 AUDIT LOG
@app.get("/audit")
async def get_audit():
    return audit_log

@app.get("/chat-history")
async def get_chat_history(session_id: str = "default"):
    if session_id not in chat_memory or not chat_memory[session_id]:
        return {
            "history": [],
            "message": "No past questions found"
        }

    return {
        "history": list(chat_memory[session_id]),
        "total_questions": len(chat_memory[session_id])
    }

@app.get("/files")
async def list_files():
    return {
        "files": rag.list_files()
    }
