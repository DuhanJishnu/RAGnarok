'use client'
export default function MessageBubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
const isUser = role === 'user'
return (
<div className={`max-w-[85%] ${isUser ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
<div className={`${isUser ? 'bg-vsred/90 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-gray-100'} p-3 rounded-xl shadow-sm transition-all`}>
<div className="whitespace-pre-wrap">{text}</div>
</div>
<div className={`mt-1 text-xs ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>{isUser ? 'You' : 'Assistant'}</div>
</div>
)
}