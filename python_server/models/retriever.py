from typing import List, Dict, Any
from .embedding_service import EmbeddingService

class Retriever:
    def __init__(self, vector_db, embedding_service: EmbeddingService, top_k: int = 5, rerank_top_k: int = 3):
        self.vector_db = vector_db
        self.embedding_service = embedding_service
        self.top_k = top_k
        self.rerank_top_k = rerank_top_k
    
    def retrieve(self, query: str) -> List[Dict]:
        """Retrieve relevant documents for query"""
        # Generate query embedding
        query_embedding = self.embedding_service.embedding_model.embed_query(query)
        normalized_query_embedding = self.embedding_service.normalize_embeddings([query_embedding])[0]
        
        # First-stage retrieval: kNN search
        initial_results = self.vector_db.similarity_search(
            normalized_query_embedding, 
            k=self.top_k * 2  # Get more for re-ranking
        )
        
        # Re-ranking (simplified - in production, use cross-encoder)
        reranked_results = self._rerank_results(query, initial_results)
        
        return reranked_results[:self.rerank_top_k]
    
    def _rerank_results(self, query: str, results: List[Dict]) -> List[Dict]:
        """Simple re-ranking based on query-term overlap"""
        for result in results:
            # Simple relevance scoring based on term overlap
            content = result["content"].lower()
            query_terms = query.lower().split()
            overlap_score = sum(1 for term in query_terms if term in content) / len(query_terms)
            
            # Combine similarity score with overlap score
            result["relevance_score"] = (
                0.7 * result["similarity_score"] + 0.3 * overlap_score
            )
        
        return sorted(results, key=lambda x: x["relevance_score"], reverse=True)