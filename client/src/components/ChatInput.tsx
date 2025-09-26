'use client'
import { useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'


export default function ChatInput({ onSend }: { onSend: (txt: string) => void }) {
const [text, setText] = useState('')
const send = () => {
if (!text.trim()) return
onSend(text.trim())
setText('')
}
const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault(); send()
}
}


return (
<div className="flex gap-2 items-end">
<textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey} placeholder="Type a message... (Shift+Enter for newline)" rows={1}
className="resize-none flex-1 min-h-[44px] max-h-40 rounded-md p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-vsyellow/40 transition-all" />
<button onClick={send} aria-label="Send" className="h-10 w-10 flex items-center justify-center rounded-md bg-vsyellow text-black font-semibold hover:scale-105 active:scale-95 transition">
<PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
</button>
</div>
)
}