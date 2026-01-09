
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import uuid

class RAGStore:
    def __init__(self,presist_dir: str = "chroma_db"):
        self.client = chromadb.Client(
            chromadb.Settings(
                persist_directory=persist_dir,
                anonymized_telemetry=False
            )
        )
        pass