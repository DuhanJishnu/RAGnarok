from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_ollama import OllamaLLM
from config import Config

# Global store for conversation chains
conversation_chains = {}

class ChatMemory:
    def __init__(self, model_name: str = Config.LLM_MODEL):
        self.llm = OllamaLLM(model=model_name)

    def get_conversation_chain(self, conv_id: str) -> ConversationChain:
        if conv_id not in conversation_chains:
            conversation_chains[conv_id] = self._create_new_chain()
        return conversation_chains[conv_id]

    def _create_new_chain(self) -> ConversationChain:
        return ConversationChain(
            llm=self.llm,
            memory=ConversationBufferMemory(),
            verbose=False
        )

    def summarize_conversation(self, conv_id: str) -> str:
        if conv_id in conversation_chains:
            chain = conversation_chains[conv_id]
            history = chain.memory.buffer
            summary = self.llm.predict(f"Summarize the following conversation:\n{history}")
            return summary
        return ""

    def load_summary(self, conv_id: str, summary: str):
        chain = self._create_new_chain()
        chain.memory.buffer = summary
        conversation_chains[conv_id] = chain

    def clear_memory(self, conv_id: str):
        if conv_id in conversation_chains:
            del conversation_chains[conv_id]