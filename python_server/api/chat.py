from flask import Blueprint, request, jsonify
from models.retriever import Retriever
from models.enhanced_retriever import EnhancedRetriever
from models.llm_grounding import LLMGrounding
from models.safe_llm_grounding import SafeLLMGrounding
from models.embedding_service import EmbeddingService
from models.vector_store import VectorDB

chat_bp = Blueprint('chat', __name__)

# Initialize components
embedding_service = EmbeddingService()
vector_db = VectorDB()
vector_db.load()  # Load existing vector database

# Standard and enhanced components
retriever = Retriever(vector_db, embedding_service)
llm_grounding = LLMGrounding()
enhanced_retriever = EnhancedRetriever(vector_db, embedding_service)
safe_llm = SafeLLMGrounding()

@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with selectable RAG pipeline"""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        question = data['question'].strip()
        secure_mode = data.get('secure_mode', False)
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400
        
        if secure_mode:
            # Use the secure pipeline
            retrieval_result = enhanced_retriever.retrieve_with_confidence(question)
            response = safe_llm.generate_safe_response(
                question, 
                retrieval_result["documents"],
                retrieval_result["confidence_metrics"]
            )
            response.update({
                "success": True,
                "question": question,
                "retrieval_metrics": retrieval_result["confidence_metrics"],
                "documents_retrieved": len(retrieval_result["documents"]),
                "should_proceed": retrieval_result["should_proceed"]
            })
            return jsonify(response)
        else:
            # Use the standard pipeline
            retrieved_docs = retriever.retrieve(question)
            if not retrieved_docs:
                return jsonify({
                    "success": True,
                    "answer": "I couldn't find relevant information in the documents to answer your question.",
                    "citations": [],
                    "retrieved_documents": []
                })
            response = llm_grounding.generate_response(question, retrieved_docs)
            return jsonify({
                "success": True,
                "question": question,
                **response
            })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/search', methods=['POST'])
def search():
    """Direct document search with optional query analysis"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({"success": False, "error": "Query is required"}), 400
        
        query = data['query'].strip()
        k = data.get('k', 5)
        analyze = data.get('analyze', False)

        if analyze:
            # Perform query analysis using the enhanced retriever
            retrieval_result = enhanced_retriever.retrieve_with_confidence(query)
            return jsonify({
                "success": True,
                "query": query,
                "analysis": retrieval_result["confidence_metrics"],
                "should_proceed": retrieval_result["should_proceed"],
                "message": retrieval_result["proceed_message"],
                "documents_retrieved": len(retrieval_result["documents"])
            })
        else:
            # Perform a standard search
            retrieved_docs = retriever.retrieve(query)
            return jsonify({
                "success": True,
                "query": query,
                "results": [
                    {
                        "content": doc["content"],
                        "metadata": doc["metadata"],
                        "similarity_score": doc.get("similarity_score", 0),
                        "relevance_score": doc.get("relevance_score", 0)
                    }
                    for doc in retrieved_docs[:k]
                ]
            })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500