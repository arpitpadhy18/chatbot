
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import uuid

class RAGStore:
    def __init__(self,presist_dir: str = "chroma_db"):
        self.client = chromadb.Client(
            chromadb.Settings(
                persist_directory=presist_dir,
                anonymized_telemetry=False
            )
        )
        
        self.collection = self.client.get_or_create_collection(
            name="rag_documents"
        )
        
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        
    def add_text(self, texts: List[str],metadata : dict = None):
        if not texts:
            return
        
        embeddings = self.model.encode(texts).tolist
        ids = [str(uuid.uuid4()) for _ in texts]
        
        if metadata is None:
            metadatas = [{} for _ in texts]
        else:
            metadatas = [metadata.copy() for _ in texts]

        self.collection.add(
            documents=texts,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )
        
    def query(self, query_text: str, top_k: int = 3):
        query_embedding = self.model.encode([query_text]).tolist()
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )
        
        return results["documents"][0] if results["documents"] else []
    
    def clear(self):
        self.client.delete_collection("rag_documents")
        