from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_ollama import OllamaLLM
from langchain.schema import BaseMemory
import logging
from config import Config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global store for conversation chains
conversation_chains = {}

class ChatMemory:
    def __init__(self, model_name: str = Config.LLM_MODEL):
        try:
            self.llm = OllamaLLM(model=model_name)
            # Test the model connection
            test_response = self.llm.invoke("Say 'OK'")
            logger.info(f"Model {model_name} initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OllamaLLM: {e}")
            raise

    def get_conversation_chain(self, conv_id: str) -> ConversationChain:
        """Get or create a conversation chain for the given conversation ID."""
        if not conv_id:
            raise ValueError("conv_id cannot be empty")
            
        if conv_id not in conversation_chains:
            conversation_chains[conv_id] = self._create_new_chain()
            logger.info(f"Created new conversation chain for ID: {conv_id}")
        return conversation_chains[conv_id]

    def _create_new_chain(self) -> ConversationChain:
        """Create a new conversation chain with memory."""
        return ConversationChain(
            llm=self.llm,
            memory=ConversationBufferMemory(),
            verbose=True  # Set to True for debugging
        )

    def chat(self, conv_id: str, message: str) -> str:
        """Send a message to the conversation and get a response."""
        try:
            if not message or not message.strip():
                return "Please provide a non-empty message."
            
            chain = self.get_conversation_chain(conv_id)
            logger.info(f"Sending message to chain: {message[:100]}...")
            
            # Use invoke method for newer LangChain versions
            response = chain.invoke({"input": message})
            
            # Extract response based on ConversationChain output structure
            if isinstance(response, dict) and "response" in response:
                return response["response"]
            elif isinstance(response, str):
                return response
            else:
                # Fallback: try to get the last response from memory
                return str(response)
                
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return f"Error: {str(e)}"

    def get_conversation_history(self, conv_id: str) -> str:
        """Get the full conversation history for a given ID."""
        if conv_id in conversation_chains:
            chain = conversation_chains[conv_id]
            return chain.memory.buffer
        return "No conversation history found."

    def summarize_conversation(self, conv_id: str) -> str:
        """Summarize the conversation history."""
        try:
            if conv_id in conversation_chains:
                chain = conversation_chains[conv_id]
                history = chain.memory.buffer
                if not history:
                    return "No conversation to summarize."
                
                summary_prompt = f"""Please provide a concise summary of the following conversation:
                
                {history}
                
                Summary:"""
                
                summary = self.llm.invoke(summary_prompt)
                return summary
            return "Conversation not found."
        except Exception as e:
            logger.error(f"Error summarizing conversation: {e}")
            return f"Error creating summary: {str(e)}"

    def load_summary(self, conv_id: str, summary: str):
        """Load a summary into a new conversation chain."""
        try:
            chain = self._create_new_chain()
            # Initialize with the summary as context
            chain.memory.save_context({"input": "Previous conversation summary:"}, 
                                    {"output": summary})
            conversation_chains[conv_id] = chain
            logger.info(f"Loaded summary for conversation ID: {conv_id}")
        except Exception as e:
            logger.error(f"Error loading summary: {e}")
            raise

    def clear_memory(self, conv_id: str):
        """Clear conversation memory for the given ID."""
        if conv_id in conversation_chains:
            del conversation_chains[conv_id]
            logger.info(f"Cleared memory for conversation ID: {conv_id}")
        else:
            logger.warning(f"No conversation found for ID: {conv_id}")

    def list_active_conversations(self) -> list:
        """List all active conversation IDs."""
        return list(conversation_chains.keys())