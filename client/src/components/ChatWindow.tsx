'use client'
import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import { AnimatePresence, motion } from 'framer-motion'


type Msg = { id: string; role: 'user' | 'assistant'; text: string }


export default function ChatWindow() {
const [messages, setMessages] = useState<Msg[]>([
{ id: 'm1', role: 'assistant', text: 'Hello! Ask me anything.' }
])
const containerRef = useRef<HTMLDivElement | null>(null)


useEffect(() => {
containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
}, [messages])


const onSend = (text: string) => {
if (!text.trim()) return
const userMsg = { id: 'u' + Date.now(), role: 'user', text }
setMessages(m => [...m, userMsg])


setTimeout(() => {
const reply: Msg = { id: 'a' + Date.now(), role: 'assistant', text: `Echo: ${text}` }
setMessages(m => [...m, reply])
}, 700)
}


return (
<div className="flex flex-col h-full bg-gradient-to-b from-white/80 to-transparent dark:from-transparent rounded-lg shadow-md overflow-hidden">
<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
<div className="font-medium">Conversation</div>
<div className="text-sm text-gray-500 dark:text-gray-400">AI • Responsive • Dark-ready</div>
</div>


<div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
<AnimatePresence initial={false} mode="popLayout">
{messages.map(m => (
<motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}>
<MessageBubble role={m.role} text={m.text} />
</motion.div>
))}
</AnimatePresence>
</div>


<div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
<ChatInput onSend={onSend} />
</div>
</div>
)
}

