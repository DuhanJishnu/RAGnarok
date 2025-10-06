import time
import json
from flask import Blueprint, request, jsonify, Response
from models.retriever import Retriever
from models.enhanced_retriever import EnhancedRetriever
from models.llm_grounding import LLMGrounding
from models.safe_llm_grounding import SafeLLMGrounding
from models.embedding_service import EmbeddingService
from models.vector_store import VectorDB
from models.chat_memory import ChatMemory

chat_bp = Blueprint('chat', __name__)

# Initialize components
embedding_service = EmbeddingService()
vector_db = VectorDB()
chat_memory = ChatMemory()

# Standard and enhanced components
retriever = Retriever(vector_db, embedding_service)
llm_grounding = LLMGrounding()
enhanced_retriever = EnhancedRetriever(vector_db, embedding_service)
safe_llm = SafeLLMGrounding()

@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with selectable RAG pipeline and conversation memory"""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data or 'conv_id' not in data:
            return jsonify({"success": False, "error": "Question and conv_id are required"}), 400
        
        question = data['question'].strip()
        conv_id = data['conv_id']
        stream = data.get('stream', False)
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400
        
        if stream:
            return chat_stream()
        
        # Get response using the new chat method
        response = chat_memory.chat(conv_id, question)
        
        return jsonify({
            "success": True,
            "question": question,
            "answer": response
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Chat endpoint with SSE for streaming responses and conversation memory."""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data or 'conv_id' not in data:
            return jsonify({"success": False, "error": "Question and conv_id are required"}), 400
        
        question = data['question'].strip()
        conv_id = data['conv_id']
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400

        def generate():
            try:
                # Get response using the new chat method
                response = chat_memory.chat(conv_id, question)
                
                words = response.split()
                for i, word in enumerate(words):
                    yield f"data: {json.dumps({'type': 'answer_chunk', 'data': word + (' ' if i < len(words) - 1 else '')})}\\n\n"
                    time.sleep(0.03)
                
                yield f"data: {json.dumps({'type': 'final', 'data': {'success': True, 'question': question}})}\\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e), 'success': False}})}\\n\n"

        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    except Exception as e:
        def error_generate():
            yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': str(e)}})}\\n\n"
        return Response(error_generate(), mimetype='text/event-stream')

@chat_bp.route('/api/conversation/history', methods=['GET'])
def get_conversation_history():
    """Get conversation history for a given conversation ID"""
    try:
        conv_id = request.args.get('conv_id')
        if not conv_id:
            return jsonify({"success": False, "error": "conv_id is required"}), 400
        
        history = chat_memory.get_conversation_history(conv_id)
        
        return jsonify({
            "success": True, 
            "conv_id": conv_id,
            "history": history
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/conversation/summarize', methods=['POST'])
def summarize():
    """Summarize a conversation"""
    try:
        data = request.get_json()
        if not data or 'conv_id' not in data:
            return jsonify({"success": False, "error": "conv_id is required"}), 400
        
        conv_id = data['conv_id']
        summary = chat_memory.summarize_conversation(conv_id)
        
        return jsonify({"success": True, "summary": summary})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/conversation/load_summary', methods=['POST'])
def load_summary():
    """Load a summary into a conversation"""
    try:
        data = request.get_json()
        if not data or 'conv_id' not in data or 'summary' not in data:
            return jsonify({"success": False, "error": "conv_id and summary are required"}), 400
        
        conv_id = data['conv_id']
        summary = data['summary']
        chat_memory.load_summary(conv_id, summary)
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/conversation/clear', methods=['POST'])
def clear_conversation():
    """Clear conversation memory for a given ID"""
    try:
        data = request.get_json()
        if not data or 'conv_id' not in data:
            return jsonify({"success": False, "error": "conv_id is required"}), 400
        
        conv_id = data['conv_id']
        chat_memory.clear_memory(conv_id)
        
        return jsonify({"success": True, "message": f"Conversation {conv_id} cleared"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/conversation/list', methods=['GET'])
def list_conversations():
    """List all active conversation IDs"""
    try:
        conversations = chat_memory.list_active_conversations()
        
        return jsonify({
            "success": True,
            "conversations": conversations,
            "count": len(conversations)
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
            retrieved_docs = retriever.retrieve(query)
            return jsonify({
                "success": True,
                "query": query,
                "results": [
                    {
                        "content": doc["content"],
                        "metadata": doc["metadata"],
                        "similarity_score": doc.get('similarity_score', 0),
                        "relevance_score": doc.get('relevance_score', 0)
                    }
                    for doc in retrieved_docs[:k]
                ]
            })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@chat_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test basic functionality
        test_conv_id = "health_check"
        test_response = chat_memory.chat(test_conv_id, "Say 'OK'")
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "model_responding": "OK" in test_response,
            "active_conversations": len(chat_memory.list_active_conversations())
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500