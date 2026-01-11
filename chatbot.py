from fastapi import FastAPI, UploadFile, File, HTTPException
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
##newwww
from collections import defaultdict, deque


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)   



GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

client = Groq(api_key=GROQ_API_KEY)
rag = RAGStore()
chat_memory = defaultdict(lambda: deque(maxlen=5))

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

# class ChatRequest(BaseModel):
#     question: str
#     top_k: int = 3
#     session_id: str = "default"

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]

        if end < text_length:
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            boundary = max(last_period, last_newline)

            if boundary > chunk_size // 2:
                chunk = chunk[:boundary + 1]
                end = start + len(chunk)

        chunk = chunk.strip()
        if len(chunk) > 50:
            chunks.append(chunk)

        start = end - overlap

    return chunks

def read_file(file: UploadFile) -> str:
    """Extract text from uploaded file."""
    try:
        filename = file.filename.lower()

        # -------- PDF --------
        if filename.endswith(".pdf"):
            reader = PdfReader(file.file)
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            if not text.strip():
                raise ValueError("PDF appears to be empty or unreadable")
            return text

        # -------- TEXT / MARKDOWN --------
        elif filename.endswith((".txt", ".md")):
            content = file.file.read().decode("utf-8")
            if not content.strip():
                raise ValueError("File appears to be empty")
            return content

        # -------- XML --------
        elif filename.endswith(".xml"):
            tree = ET.parse(file.file)
            root = tree.getroot()
            text = " ".join(elem.text.strip() for elem in root.iter() if elem.text)
            if not text.strip():
                raise ValueError("XML appears to be empty")
            return text

        # -------- EXCEL --------
        elif filename.endswith((".xls", ".xlsx")):
            data = pd.read_excel(BytesIO(file.file.read()), sheet_name=None)
            text_parts = []

            for sheet_name, df in data.items():
                text_parts.append(f"Sheet: {sheet_name}")
                text_parts.append(df.astype(str).to_string(index=False))

            text = "\n".join(text_parts)
            if not text.strip():
                raise ValueError("Excel file appears to be empty")
            return text

        else:
            raise ValueError(f"Unsupported file type: {file.filename}")

    except Exception as e:
        raise ValueError(f"Error processing file {file.filename}: {str(e)}")
    
# ----------- ROUTES -----------
@app.get("/")
async def root():
    return {
        "message": "RAG Chatbot API",
        "endpoints": {
            "POST /upload": "Upload a document (PDF or TXT)",
            "POST /chat": "Ask questions about uploaded documents",
            "GET /stats": "Get storage statistics"
        }
    }
    

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document."""
    try:
        # Validate file size (10MB limit)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        # Extract and chunk text
        text = read_file(file)
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No text content found in file")
        
        # Store in RAG
        rag.add_texts(
            chunks,
            metadata={
               "source": file.filename
            }
        )
        
        
        return {
            "message": "Document processed successfully",
            "filename": file.filename,
            "chunks": len(chunks),
            "total_chars": len(text)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


# @app.post("/chat", response_model=ChatResponse)
# async def chat(req: ChatRequest):
#     """Ask a question about uploaded documents."""
#     try:
#         if not req.question.strip():
#             raise HTTPException(status_code=400, detail="Question cannot be empty")

#         chunks, sources = rag.query_with_sources(
#             req.question,
#             top_k=req.top_k
#         )

#         if not chunks:
#             return ChatResponse(
#                 answer="I don't have any documents to answer from. Please upload a document first.",
#                 sources=[],
#                 num_sources=0
#             )

#         context_text = "\n".join(
#             f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)
#         )

       
#         lang_code = detect_language(context_text)

      
#         language_instruction = get_language_instruction(lang_code)

#         prompt = f"""
# You are a helpful assistant that answers questions based ONLY on the provided context.

# {language_instruction}

# Context:
# {context_text}

# Question:
# {req.question}

# Instructions:
# - Answer based ONLY on the context above
# - If information is missing, say so clearly
# - Be concise and accurate
# - Cite context sections like [1], [2]
# - Greet the user politely
# - If asked what type of bot you are, explain based on uploaded documents
# - greet only first time
# - give short answer some time
# """

#         # 🔹 Groq call
#         completion = client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[{"role": "user", "content": prompt}],
#             max_tokens=500,
#             temperature=0.3
#         )

#         answer = completion.choices[0].message.content

#         return ChatResponse(
#             answer=answer,
#             sources=sources,
#             num_sources=len(sources)
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error generating response: {str(e)}"
#         )

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        if not req.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        # 🔹 1. Retrieve relevant chunks
        chunks, sources = rag.query_with_sources(
            req.question,
            top_k=req.top_k
        )

        if not chunks:
            return ChatResponse(
                answer="I don't have any documents to answer from. Please upload a document first.",
                sources=[],
                num_sources=0
            )

        # 🔹 2. Build context
        context_text = "\n".join(
            f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)
        )

        # 🔴 3. FETCH PAST QUESTIONS (ADD HERE)
        history = chat_memory[req.session_id]

        history_text = ""
        if history:
            history_text = "\n".join(
                f"Q: {h['question']}\nA: {h['answer']}"
                for h in history
            )

        # 🔹 4. Language detection
        lang_code = detect_language(context_text)
        language_instruction = get_language_instruction(lang_code)

        # 🔴 5. MODIFY PROMPT (ADD history_text)
        prompt = f"""
You are a helpful assistant that answers questions based ONLY on the provided context.

{language_instruction}

Previous Conversation:
{history_text}

Context:
{context_text}

Current Question:
{req.question}

Instructions:
- Use previous conversation only if relevant
- Answer based on context
- If information is missing, say so
- Cite context sections like [1], [2]
"""

        # 🔹 6. LLM call
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3
        )

        answer = completion.choices[0].message.content

        # 🔴 7. STORE QUESTION + ANSWER (ADD HERE)
        chat_memory[req.session_id].append({
            "question": req.question,
            "answer": answer
        })

        # 🔹 8. Return response
        return ChatResponse(
            answer=answer,
            sources=sources,
            num_sources=len(sources)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """Get statistics about stored documents."""
    return rag.get_stats()

@app.delete("/resetdocs")
async def clear_documents():
    """Clear all stored documents."""
    rag.clear()
    return {"message": "All documents cleared"}

@app.get("/files")
async def list_files():
    return {
        "files": rag.list_files()
    }

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    deleted = rag.delete_by_file(filename)

    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return {
        "message": f"{filename} deleted successfully",
        "deleted_chunks": deleted
    }
    
@app.get("/preview/{filename}", response_model=PreviewResponse)
async def preview_file(filename: str, limit: int = 3):
    """
    Preview a document without querying LLM
    """
    try:
        chunks = rag.preview_file(filename, limit=limit)

        if not chunks:
            raise HTTPException(
                status_code=404,
                detail="File not found or no content available"
            )

        return PreviewResponse(
            filename=filename,
            preview_chunks=chunks,
            total_chunks=len(chunks)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error previewing file: {str(e)}"
        )

@app.get("/chat-history")
async def get_chat_history():
    session_id = "default"

    if session_id not in chat_memory or not chat_memory[session_id]:
        return {
            "history": [],
            "message": "No past questions found"
        }

    return {
        "history": list(chat_memory[session_id]),
        "total_questions": len(chat_memory[session_id])
    }