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

class ChatRequest(BaseModel):
    question: str
    top_k: int = 3
    
class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    num_sources: int
    
# def chunk_text(text:str, chunk_size:int = 500, overlap:int = 50) -> List[str]:
#     chunks = []
#     start = 0
#     text_length = len(text)
    
#     while start < text_length:
#         end = start + chunk_size
#         chunks=text[start:end]
        
#         if end > text_length:
#             last_period = chunk.rfind('.')
#             last_newline = chunk.rfind('\n')
#             boundary = max(last_period, last_newline)
            
#             if boundary > chunk_size // 2:
#                 chunk = chunk[:boundary + 1]
#                 end = start + len(chunk)
                
#         chunks.append(chunk.strip())
#         start = end - overlap
    
#     return [c for c in chunks if len(c.strip()) > 50]
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]   # ✅ correct variable

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
    

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Ask a question about uploaded documents."""
    try:
        if not req.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Retrieve relevant context
        context = rag.query(req.question, top_k=req.top_k)
        
        if not context:
            return ChatResponse(
                answer="I don't have any documents to answer from. Please upload a document first.",
                sources=[],
                num_sources=0
            )
        
        # Build prompt
        prompt = f"""You are a helpful assistant that answers questions based ONLY on the provided context.

                        Context:
                        {chr(10).join(f"[{i+1}] {chunk}" for i, chunk in enumerate(context))}

                        Question: {req.question}

                        Instructions:
                        - Answer based ONLY on the context above
                        - If the context doesn't contain enough information, say so
                        - Be concise and accurate
                        - If there is no relevant information in uploaded documents, respond on your own knowledge
                        - Cite which context section(s) you used (e.g., [1], [2])
                        - greet the user politely
                        - if some one ask which type of bot are you anlyze the document and respond accordingly
                        - greet the user politely even when no relevant information is found
                   """

        # Get completion from Groq
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.3  # Lower temperature for more focused answers
        )
        
        answer = completion.choices[0].message.content
        
        return ChatResponse(
            answer=answer,
            sources=context,
            num_sources=len(context)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
    
@app.get("/stats")
async def get_stats():
    """Get statistics about stored documents."""
    return rag.get_stats()

@app.delete("/clear")
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