from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from typing import List, Dict, Any

class LLMGrounding:
    def __init__(self, model_name: str = "gemma3:4b"):
        self.llm = OllamaLLM(model=model_name)
        self.prompt_template = self._create_grounding_prompt()
    
    def _create_grounding_prompt(self) -> PromptTemplate:
        """Create prompt template with citation support"""
        template = """You are a helpful AI assistant. Use the provided context to answer the user's question. 
        Always cite your sources using the provided citation format [source_number]. 
        If the context doesn't contain the answer, say so instead of making up an answer.

Context Information:
{context}

User Question: {question}

Please provide a comprehensive answer with citations for each fact you use from the context:"""

        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
    
    def format_context_with_citations(self, retrieved_docs: List[Dict]) -> str:
        """Format retrieved documents with citation markers"""
        context_parts = []
        
        for i, doc in enumerate(retrieved_docs, 1):
            metadata = doc["metadata"]
            source_info = f"Source [{i}]: {metadata.get('original_filename', 'Document')}"
            if 'page_number' in metadata:
                source_info += f" (Page {metadata['page_number']})"
            
            context_parts.append(f"{source_info}\n{doc['content']}\n")
        
        return "\n".join(context_parts)
    
    def generate_response(self, question: str, retrieved_docs: List[Dict]) -> Dict[str, Any]:
        """Generate response with citations"""
        formatted_context = self.format_context_with_citations(retrieved_docs)
        
        prompt = self.prompt_template.format(
            context=formatted_context,
            question=question
        )
        
        try:
            response = self.llm.invoke(prompt)
            
            # Extract citations from response
            citations = self._extract_citations(response, retrieved_docs)
            
            return {
                "answer": response,
                "citations": citations,
                "retrieved_documents": [
                    {
                        "content": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
                        "metadata": doc["metadata"],
                        "similarity_score": doc.get("similarity_score", 0),
                        "relevance_score": doc.get("relevance_score", 0),
                        "citation_id": i + 1
                    }
                    for i, doc in enumerate(retrieved_docs)
                ]
            }
        except Exception as e:
            return {
                "answer": f"Error generating response: {str(e)}",
                "citations": [],
                "retrieved_documents": []
            }
    
    def _extract_citations(self, response: str, retrieved_docs: List[Dict]) -> List[Dict]:
        """Extract citation information from response"""
        citations = []
        
        for i in range(1, len(retrieved_docs) + 1):
            if f"[{i}]" in response:
                doc_metadata = retrieved_docs[i-1]["metadata"]
                citations.append({
                    "citation_id": i,
                    "source_filename": doc_metadata.get("original_filename", "Unknown"),
                    "page_number": doc_metadata.get("page_number"),
                    "source_url": doc_metadata.get("source_url", "#"),
                    "similarity_score": retrieved_docs[i-1].get("similarity_score", 0)
                })
        
        return citations