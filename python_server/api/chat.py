import time
import json
from flask import Blueprint, request, jsonify, Response
from models.retriever import Retriever
from models.enhanced_retriever import EnhancedRetriever
from models.llm_grounding import LLMGrounding
from models.safe_llm_grounding import SafeLLMGrounding
from models.embedding_service import EmbeddingService
from models.vector_store import VectorDB
from utils.sanitizer import sanitize_model_output

chat_bp = Blueprint('chat', __name__)

# Initialize components
embedding_service = EmbeddingService()
vector_db = VectorDB()

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
        stream = data.get('stream', False)  # Add stream option for regular chat endpoint
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400
        
        # If streaming is requested, redirect to stream endpoint
        if stream:
            return chat_stream()
        
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

@chat_bp.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Chat endpoint with SSE for streaming responses."""
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        question = data['question'].strip()
        secure_mode = data.get('secure_mode', False)
        
        if not question:
            return jsonify({"success": False, "error": "Question cannot be empty"}), 400

        def generate():
            try:
                if secure_mode:
                    # Enhanced retrieval with confidence
                    retrieval_result = enhanced_retriever.retrieve_with_confidence(question)
                    
                    # Send retrieval metrics first
                    yield f"data: {json.dumps({
                        'type': 'retrieval_metrics',
                        'data': {
                            'metrics': retrieval_result['confidence_metrics'],
                            'documents_retrieved': len(retrieval_result['documents']),
                            'should_proceed': retrieval_result['should_proceed']
                        }
                    })}\n\n"
                    
                    if not retrieval_result["should_proceed"]:
                        # Send final message if we shouldn't proceed
                        yield f"data: {json.dumps({
                            'type': 'final',
                            'data': {
                                'success': True,
                                'question': question,
                                'answer': retrieval_result.get('proceed_message', 'Unable to provide a confident response.'),
                                'citations': [],
                                'retrieved_documents': []
                            }
                        })}\n\n"
                        return
                    
                    # Generate safe response (assuming safe_llm supports streaming)
                    if hasattr(safe_llm, 'generate_safe_response_stream'):
                        # If the safe LLM supports streaming
                        stream_generator = safe_llm.generate_safe_response_stream(
                            question,
                            retrieval_result["documents"],
                            retrieval_result["confidence_metrics"]
                        )
                        for chunk in stream_generator:
                            yield f"data: {json.dumps({
                                'type': 'answer_chunk',
                                'data': chunk
                            })}\n\n"
                    else:
                        # Fallback: simulate streaming for safe response
                        response = safe_llm.generate_safe_response(
                            question,
                            retrieval_result["documents"],
                            retrieval_result["confidence_metrics"]
                        )
                        answer = response.get("answer", "")
                        
                        # Stream answer word by word
                        words = answer.split()
                        for i, word in enumerate(words):
                            yield f"data: {json.dumps({
                                'type': 'answer_chunk',
                                'data': word + (' ' if i < len(words) - 1 else '')
                            })}\n\n"
                            time.sleep(0.03)  # Adjust speed as needed
                    
                    # Send final data
                    yield f"data: {json.dumps({
                        'type': 'final',
                        'data': {
                            'success': True,
                            'question': question,
                            'citations': response.get('citations', []),
                            'retrieved_documents': retrieval_result['documents'],
                            'retrieval_metrics': retrieval_result['confidence_metrics']
                        }
                    })}\n\n"

                else:
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
                        import re
                        # Fallback: simulate streaming
                        response = llm_grounding.generate_response(question, retrieved_docs)
                        answer = response.get("answer", "")
                        # chunks = re.split(r'(?<=[.!?])\s+', answer)

                        # if len(chunks) == 1:
                        #     chunks = re.split(r'(?<=\n\n)', answer)

                        # for chunk in chunks:
                        #     if chunk.strip():
                        #         yield f"data: {json.dumps({
                        #             'type': 'answer_chunk',
                        #             'data': chunk + ' '
                        #         })}\n\n"
                        #         time.sleep(0.05)  # Adjust speed as needed

                        # words = answer.split()
                        answer_with_markers = answer.replace('\n', '___NEWLINE___')
                        words = answer_with_markers.split()
                        for i, word in enumerate(words):
                            chunk = word.replace('___NEWLINE___', '\n')
                            yield f"data: {json.dumps({
                                'type': 'answer_chunk',
                                'data': chunk + (' ' if i < len(words) - 1 else '')
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