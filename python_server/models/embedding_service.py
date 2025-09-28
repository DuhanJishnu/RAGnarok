import numpy as np
from langchain_ollama import OllamaEmbeddings
from typing import List, Dict, Any
import asyncio

class EmbeddingService:
    def __init__(self, model_name: str = "nomic-embed-text:v1.5", batch_size: int = 32):
        self.embedding_model = OllamaEmbeddings(model=model_name)
        self.batch_size = batch_size
        self.embedding_dim = 768  # Default for nomic-embed-text
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings in batches to avoid memory issues"""
        embeddings = []
        
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_embeddings = self.embedding_model.embed_documents(batch)
            embeddings.extend(batch_embeddings)
        
        return embeddings
    
    def normalize_embeddings(self, embeddings: List[List[float]]) -> List[List[float]]:
        """Normalize embeddings to unit length for better similarity search"""
        normalized = []
        for emb in embeddings:
            norm = np.linalg.norm(emb)
            if norm > 0:
                normalized.append((np.array(emb) / norm).tolist())
            else:
                normalized.append(emb)
        return normalized
    
    def process_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """Process chunks and generate embeddings"""
        texts = [chunk["content"] for chunk in chunks]
        
        # Generate embeddings
        embeddings = self.generate_embeddings_batch(texts)
        normalized_embeddings = self.normalize_embeddings(embeddings)
        
        # Add embeddings to chunks
        for i, chunk in enumerate(chunks):
            chunk["embedding"] = normalized_embeddings[i]
            chunk["metadata"]["embedding_dim"] = len(normalized_embeddings[i])
        
        return chunks