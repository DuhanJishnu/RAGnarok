from typing import List, Dict, Any, Optional
from .embedding_service import EmbeddingService
from .confidence_scorer import ConfidenceScorer

class EnhancedRetriever:
    def __init__(self, vector_db, embedding_service: EmbeddingService, 
                 top_k: int = 5, rerank_top_k: int = 3):
        self.vector_db = vector_db
        self.embedding_service = embedding_service
        self.confidence_scorer = ConfidenceScorer()
        self.top_k = top_k
        self.rerank_top_k = rerank_top_k
    
    def retrieve_with_confidence(self, query: str) -> Dict[str, Any]:
        """Retrieve documents with confidence scoring"""
        # Generate query embedding
        query_embedding = self.embedding_service.embedding_model.embed_query(query)
        normalized_query_embedding = self.embedding_service.normalize_embeddings([query_embedding])[0]
        
        # First-stage retrieval
        initial_results = self.vector_db.similarity_search(
            normalized_query_embedding, 
            k=self.top_k * 2
        )
        
        # Calculate confidence metrics
        confidence_metrics = self.confidence_scorer.calculate_retrieval_confidence(
            query, initial_results
        )
        
        # Apply re-ranking if we have results
        if initial_results:
            reranked_results = self._rerank_results(query, initial_results)
            final_results = reranked_results[:self.rerank_top_k]
        else:
            final_results = []
        
        # Determine if we should proceed
        should_proceed, message = self.confidence_scorer.should_proceed_with_llm(
            confidence_metrics
        )
        
        return {
            "documents": final_results,
            "confidence_metrics": confidence_metrics,
            "should_proceed": should_proceed,
            "proceed_message": message,
            "query_embedding": normalized_query_embedding  # For debugging
        }
    
    def _rerank_results(self, query: str, results: List[Dict]) -> List[Dict]:
        """Enhanced re-ranking with multiple factors"""
        for result in results:
            content = result["content"].lower()
            query_terms = query.lower().split()
            
            # Term overlap score
            overlap_score = sum(1 for term in query_terms if len(term) > 2 and term in content) 
            overlap_score = overlap_score / len(query_terms) if query_terms else 0
            
            # Position bonus (prefer earlier chunks in documents)
            position_bonus = 1.0
            if 'chunk_index' in result.get('metadata', {}):
                chunk_idx = result['metadata']['chunk_index']
                total_chunks = result['metadata'].get('total_chunks', 1)
                if total_chunks > 1:
                    position_bonus = 1.0 - (chunk_idx / total_chunks) * 0.3  # First chunks get bonus
            
            # Content quality score (longer, more substantive content)
            content_length = len(content)
            quality_score = min(content_length / 500, 1.0)  # Normalize to 1.0 for 500+ chars
            
            # Combined relevance score
            result["relevance_score"] = (
                0.6 * result.get("similarity_score", 0) +
                0.2 * overlap_score +
                0.1 * position_bonus +
                0.1 * quality_score
            )
        
        return sorted(results, key=lambda x: x["relevance_score"], reverse=True)