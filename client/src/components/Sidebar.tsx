'use client'
import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'


export default function Sidebar() {
const [chats, setChats] = useState(() => [
{ id: '1', title: 'Welcome chat' },
{ id: '2', title: 'Project plan' },
])


const addNew = () => setChats(s => [{ id: String(Date.now()), title: 'New chat' }, ...s])


return (
<aside className="w-20 sm:w-64 bg-white dark:bg-[#071027] border-r border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-4 transition-all">
<div className="flex items-center justify-between px-1">
<h2 className="hidden sm:block font-semibold">Chats</h2>
<button onClick={addNew} aria-label="New chat" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/6 transition">
<PlusIcon className="w-5 h-5" />
</button>
</div>


<div className="flex-1 overflow-y-auto py-2">
<ul className="flex flex-col gap-2">
{chats.map(chat => (
<li key={chat.id} className="group">
<button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/6 transition flex items-center gap-3">
<div className="w-8 h-8 bg-gray-200 dark:bg-white/6 rounded flex items-center justify-center text-xs">C</div>
<div className="hidden sm:block truncate">{chat.title}</div>
</button>
</li>
))}
</ul>
</div>


<div className="text-xs text-gray-500 dark:text-gray-400 px-1 hidden sm:block">Tip: click &quot;New chat&quot; to start.</div>
</aside>
)
}