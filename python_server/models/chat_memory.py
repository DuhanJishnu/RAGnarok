from upstash_redis import Redis
from models.llm_grounding import LLMGrounding

class ChatMemory:
    def __init__(self, user_id: str, chat_id: str, redis_url: str, redis_token: str, llm_grounding: LLMGrounding):
        if not all([user_id, chat_id, redis_url, redis_token, llm_grounding]):
            raise ValueError("user_id, chat_id, redis_url, redis_token, and llm_grounding must be provided")

        self.user_id = user_id
        self.chat_id = chat_id
        self.redis = Redis(url=redis_url, token=redis_token)
        self.llm_grounding = llm_grounding

    def _get_short_term_key(self) -> str:
        return f"chat:{self.chat_id}:history"

    def _get_long_term_key(self) -> str:
        return f"user:{self.user_id}:long_term_memory"

    def add_message(self, user_message: str, ai_message: str):
        """Adds a user and AI message pair to the short-term chat history."""
        self.redis.rpush(self._get_short_term_key(), user_message, ai_message)

    def get_history(self, max_turns: int = 5) -> dict:
        """Retrieves chat history, combining long-term memory and recent short-term messages."""
        long_term_memory = self.redis.get(self._get_long_term_key())
        
        short_term_history = self.redis.lrange(self._get_short_term_key(), 0, -1)
        
        # Take the last `max_turns` of the conversation
        recent_history = short_term_history[-(max_turns * 2):]
        
        return {
            "long_term_memory": long_term_memory if long_term_memory else "",
            "short_term_history": recent_history
        }

    def _format_history_for_prompt(self, history: dict) -> str:
        """Formats the history into a string suitable for an LLM prompt."""
        formatted_history = []
        if history["long_term_memory"]:
            formatted_history.append(f"### Long-Term Memory Summary:\n{history['long_term_memory']}")

        if history["short_term_history"]:
            formatted_history.append("### Current Conversation:")
            # Grouping messages by pairs (user, ai)
            it = iter(history["short_term_history"])
            for user_msg, ai_msg in zip(it, it):
                formatted_history.append(f"User: {user_msg}")
                formatted_history.append(f"AI: {ai_msg}")
        
        return "\n".join(formatted_history)

    def get_formatted_history(self, max_turns: int = 5) -> str:
        """Gets and formats the history for direct use in a prompt."""
        history = self.get_history(max_turns)
        return self._format_history_for_prompt(history)

    def summarize_and_update_long_term_memory(self, force_update: bool = False):
        """Summarizes the current chat and updates the long-term memory."""
        history_len = self.redis.llen(self._get_short_term_key())
        
        # Summarize every 10 messages (5 turns) or if forced
        if not force_update and (history_len == 0 or history_len % 10 != 0):
            return

        full_history = self.get_formatted_history(max_turns=10) # Use a larger window for summary
        if not full_history:
            return

        prompt = f"Please summarize the following conversation into a concise paragraph that captures the key topics and outcomes. This summary will be used as long-term memory for a user.\n\nConversation:\n{full_history}"
        
        # Use the provided LLM grounding instance to generate the summary
        summary_response = self.llm_grounding.generate_response(prompt, []) # No docs needed for summarization
        summary = summary_response.get("answer")

        if summary:
            self.redis.set(self._get_long_term_key(), summary)
