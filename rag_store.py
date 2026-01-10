
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import uuid

class RAGStore:
    def __init__(self, persist_dir: str = "chroma_db"):
        self.client = chromadb.Client(
            chromadb.Settings(
                persist_directory=persist_dir,
                anonymized_telemetry=False
            )
        )

        self.collection_name = "rag_documents"

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name
        )

        self.model = SentenceTransformer("all-MiniLM-L6-v2")


    def add_texts(self, texts: List[str], metadata: dict = None):
        if not texts:
            return

        embeddings = self.model.encode(texts).tolist()
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

        return results["documents"][0] if results.get("documents") else []

    def clear(self):
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name
        )

    def get_stats(self):
        return {
            "total_chunks": self.collection.count(),
            "collection": self.collection.name
        }
        
    def list_files(self):
        """
        Return list of unique uploaded file names
        """
        data = self.collection.get(include=["metadatas"])

        if not data or "metadatas" not in data:
            return []

        sources = set()

        for meta in data["metadatas"]:
            if meta and "source" in meta:
                sources.add(meta["source"])

        return list(sources)
    
    def delete_by_file(self, filename: str):
        results = self.collection.get(
        where={"source": filename}
    )

        ids = results.get("ids", [])

        if not ids:
          return 0

        self.collection.delete(ids=ids)
        return len(ids)
    
    def query_with_sources(self, query_text: str, top_k: int = 3):
        query_embedding = self.model.encode([query_text]).tolist()

        results = self.collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        include=["documents", "metadatas"]
    )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        sources = list(
        {meta.get("source", "unknown") for meta in metadatas}
    )

        return documents, sources
    

    def preview_file(self, filename: str, limit: int = 3):
        """
        Return first few chunks of a file for preview
        """
        results = self.collection.get(
            where={"source": filename},
            include=["documents"]
        )

        documents = results.get("documents", [])

        if not documents:
            return []

        return documents[:limit]
