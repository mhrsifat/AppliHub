// filepath: src/features/chat/components/MessageComposer.jsx 
import React, { useState, useRef } from 'react'; import api from '../services/api'; import chatService from '../services/chatService'; import useUpload from '../hooks/useUpload';

export default function MessageComposer({ conversationUuid, apiBase = '/api', onCreated }) { const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [body, setBody] = useState(''); const [sending, setSending] = useState(false); const fileRef = useRef(null); const { files, addFiles, removeFile, clear } = useUpload();

const ensureConversation = async () => { // If there's no conversationUuid, create a conversation first 
if (conversationUuid) return conversationUuid; const payload = { name: name || 'Anonymous', contact }; const res = await api.post(${apiBase}/message/conversations, payload); const uuid = res.data.data.uuid || res.data.uuid || res.data.data?.uuid; if (onCreated) onCreated(uuid); return uuid; };

const handleFiles = (e) => { const inputFiles = Array.from(e.target.files || []); addFiles(inputFiles); };

const handleSend = async () => { if (!body && files.length === 0) return; setSending(true); try { const uuid = await ensureConversation(); const form = new FormData(); if (name) form.append('name', name); if (contact) form.append('contact', contact); form.append('body', body); files.forEach(f => form.append('attachments[]', f));

// optimistic UI: chatService handle local state
  await chatService.sendMessage(uuid, form);
  setBody('');
  clear();
} catch (err) {
  console.error(err);
} finally {
  setSending(false);
}

};

return ( <div className="flex flex-col gap-2"> <div className="flex gap-2"> <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)" className="flex-1 input input-sm" /> <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact (optional)" className="w-36 input input-sm" /> </div> <div className="flex items-end gap-2"> <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write a message..." className="flex-1 textarea resize-none h-20" /> <div className="flex flex-col gap-2"> <input ref={fileRef} type="file" multiple onChange={handleFiles} className="hidden" /> <button onClick={() => fileRef.current && fileRef.current.click()} className="btn btn-ghost">Attach</button> <button onClick={handleSend} disabled={sending} className="btn btn-primary">{sending ? 'Sending...' : 'Send'}</button> </div> </div> {files.length > 0 && ( <div className="flex gap-2 overflow-auto"> {files.map((f, i) => ( <div key={i} className="w-20 h-20 rounded border p-1 relative"> {f.type.startsWith('image') ? ( <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover rounded" /> ) : f.type.startsWith('video') ? ( <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" /> ) : ( <div className="text-xs">{f.name}</div> )} <button onClick={() => removeFile(i)} className="absolute top-0 right-0 text-xs bg-white rounded-full p-1">✕</button> </div> ))} </div> )} </div> ); }

