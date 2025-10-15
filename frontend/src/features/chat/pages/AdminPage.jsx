// filepath: src/features/chat/pages/AdminPage.jsx
import React from 'react'; import AdminComponent from '../components/AdminComponent';

export default function AdminPage({ apiBase }) { return ( <div className="min-h-screen p-6 bg-white"> <h1 className="text-2xl font-bold mb-4">Admin Chat</h1> <div className="h-[80vh] border rounded-lg overflow-hidden"> <AdminComponent apiBase={apiBase} /> </div> </div> ); }
