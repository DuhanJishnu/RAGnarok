import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import CrossEncoder
import re

class ConfidenceScorer:
    def __init__(self):
        # Initialize cross-encoder for relevance scoring
        self.cross_encoder = None
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize models for confidence scoring"""
        try:
            # Use a lightweight cross-encoder for relevance scoring
            self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        except:
            print("Warning: Cross-encoder not available, using fallback scoring")
            self.cross_encoder = None
    
    def calculate_retrieval_confidence(self, query: str, retrieved_docs: List[Dict]) -> Dict[str, float]:
        """Calculate multiple confidence metrics for retrieval"""
        if not retrieved_docs:
            return {
                "overall_confidence": 0.0,
                "max_similarity": 0.0,
                "mean_similarity": 0.0,
                "coverage_score": 0.0,
                "relevance_score": 0.0,
                "sufficient_content": False
            }
        
        similarity_scores = [doc.get('similarity_score', 0) for doc in retrieved_docs]
        max_similarity = max(similarity_scores) if similarity_scores else 0.0
        mean_similarity = np.mean(similarity_scores) if similarity_scores else 0.0
        
        # Calculate coverage score (how well the query terms are covered)
        coverage_score = self._calculate_coverage_score(query, retrieved_docs)
        
        # Calculate cross-encoder relevance score if available
        relevance_score = self._calculate_relevance_score(query, retrieved_docs)
        
        # Check if we have sufficient content
        total_content_length = sum(len(doc.get('content', '')) for doc in retrieved_docs)
        sufficient_content = total_content_length > 500  # At least 500 characters
        
        # Overall confidence (weighted combination)
        overall_confidence = (
            0.4 * max_similarity +
            0.3 * mean_similarity +
            0.2 * coverage_score +
            0.1 * relevance_score
        )
        
        return {
            "overall_confidence": float(overall_confidence),
            "max_similarity": float(max_similarity),
            "mean_similarity": float(mean_similarity),
            "coverage_score": float(coverage_score),
            "relevance_score": float(relevance_score),
            "sufficient_content": sufficient_content
        }
    
    def _calculate_coverage_score(self, query: str, retrieved_docs: List[Dict]) -> float:
        """Calculate how well query terms are covered in retrieved documents"""
        query_terms = set(query.lower().split())
        if not query_terms:
            return 0.0
        
        total_content = " ".join([doc.get('content', '').lower() for doc in retrieved_docs])
        
        covered_terms = 0
        for term in query_terms:
            if len(term) > 2 and term in total_content:  # Only consider terms longer than 2 chars
                covered_terms += 1
        
        return covered_terms / len(query_terms)
    
    def _calculate_relevance_score(self, query: str, retrieved_docs: List[Dict]) -> float:
        """Calculate relevance score using cross-encoder"""
        if not self.cross_encoder or not retrieved_docs:
            return 0.5  # Neutral fallback
        
        try:
            # Sample the most relevant documents for cross-encoding
            sample_docs = retrieved_docs[:3]  # Use top 3 for efficiency
            pairs = [(query, doc.get('content', '')[:500]) for doc in sample_docs]
            
            scores = self.cross_encoder.predict(pairs)
            return float(np.mean(scores))
        except:
            return 0.5
    
    def should_proceed_with_llm(self, confidence_metrics: Dict) -> Tuple[bool, str]:
        """Determine if we should proceed with LLM generation"""
        overall_conf = confidence_metrics["overall_confidence"]
        max_sim = confidence_metrics["max_similarity"]
        sufficient_content = confidence_metrics["sufficient_content"]
        
        # Decision matrix
        if overall_conf < 0.3:
            return False, "Very low confidence in retrieved documents"
        elif max_sim < 0.5:
            return False, "No highly relevant documents found"
        elif not sufficient_content:
            return False, "Insufficient content for reliable answer"
        elif overall_conf < 0.6:
            return True, "Proceed with caution - moderate confidence"
        else:
            return True, "High confidence - safe to proceed"