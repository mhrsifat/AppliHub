// filepath: src/features/chat/components/MessageItem.jsx 
import React from 'react';

function formatDate(ts) { try { return new Date(ts).toLocaleString(); } catch (e) { return ts; } }

export default function MessageItem({ message }) { const isStaff = !!message.is_staff; return ( <div className={flex ${isStaff ? 'justify-end' : 'justify-start'}}> <div className={max-w-[78%] px-3 py-2 rounded-lg ${isStaff ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900'}}> <div className="text-xs font-semibold">{message.sender_name || (isStaff ? 'Staff' : 'Guest')}</div> <div className="mt-1 text-sm whitespace-pre-wrap">{message.body}</div> {message.attachments && message.attachments.length > 0 && ( <div className="mt-2 grid grid-cols-1 gap-2"> {message.attachments.map(att => ( <div key={att.id} className="rounded overflow-hidden"> {att.mime && att.mime.startsWith('image') ? ( <img src={att.url} alt={att.filename} className="w-full max-h-48 object-cover rounded" /> ) : att.mime && att.mime.startsWith('video') ? ( <video controls src={att.url} className="w-full max-h-48 rounded" /> ) : ( <a href={att.url} className="text-sm underline" target="_blank" rel="noreferrer">{att.filename}</a> )} </div> ))} </div> )} <div className="mt-1 text-xs text-slate-400">{formatDate(message.created_at)}</div> </div> </div> ); }

