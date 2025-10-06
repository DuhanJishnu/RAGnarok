import time
import json
from flask import Blueprint, request, jsonify, Response
from models.retriever import Retriever
from models.llm_grounding import LLMGrounding
from models.embedding_service import EmbeddingService
from models.vector_store import VectorDB

chat_bp = Blueprint('chat', __name__)

# Initialize components
embedding_service = EmbeddingService()
vector_db = VectorDB()

# Standard and enhanced components
retriever = Retriever(vector_db, embedding_service)
llm_grounding = LLMGrounding()

@chat_bp.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with selectable RAG pipeline"""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        question = data['question'].strip()
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400
        
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

@chat_bp.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Chat endpoint with SSE for streaming responses."""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        question = data['question'].strip()
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400

        def generate():
            try:
                # Standard pipeline
                retrieved_docs = retriever.retrieve(question)
                
                # Send retrieval info
                yield f"data: {json.dumps({
                    'type': 'retrieval_info',
                    'data': {
                        'documents_retrieved': len(retrieved_docs)
                    }
                })}\n\n"
                
                if not retrieved_docs:
                    yield f"data: {json.dumps({
                        'type': 'final',
                        'data': {
                            'success': True,
                            'answer': "I couldn't find relevant information in the documents to answer your question.",
                            'citations': [],
                            'retrieved_documents': []
                        }
                    })}\n\n"
                    return

                # Generate streaming response (assuming llm_grounding supports streaming)
                if hasattr(llm_grounding, 'generate_response_stream'):
                    # If the LLM supports streaming
                    stream_generator = llm_grounding.generate_response_stream(question, retrieved_docs)
                    for chunk in stream_generator:
                        yield f"data: {json.dumps({
                            'type': 'answer_chunk',
                            'data': chunk
                        })}\n\n"
                else:
                    # Fallback: simulate streaming
                    response = llm_grounding.generate_response(question, retrieved_docs)
                    answer = response.get("answer", "")
                    
                    # Stream answer word by word
                    words = answer.split()
                    for i, word in enumerate(words):
                        yield f"data: {json.dumps({
                            'type': 'answer_chunk',
                            'data': word + (' ' if i < len(words) - 1 else '')
                        })}\n\n"
                        time.sleep(0.03)  # Adjust speed as needed
                
                # Send final data with citations
                yield f"data: {json.dumps({
                    'type': 'final',
                    'data': {
                        'success': True,
                        'question': question,
                        'citations': response.get('citations', []),
                        'retrieved_documents': retrieved_docs
                    }
                })}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({
                    'type': 'error',
                    'data': {
                        'error': str(e),
                        'success': False
                    }
                })}\n\n"

        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'  # Important for nginx
            }
        )

    except Exception as e:
        def error_generate():
            yield f"data: {json.dumps({
                'type': 'error',
                'data': {
                    'success': False,
                    'error': str(e)
                }
            })}\n\n"
        return Response(error_generate(), mimetype='text/event-stream')