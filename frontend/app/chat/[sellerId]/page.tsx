'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import SEOHead from '@/components/SEOHead';

export default function ChatPage({ params }: { params: { sellerId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/chat/' + params.sellerId);
      return;
    }

    // Fetch history
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(`/api/users/chat/${params.sellerId}`);
        setMessages(data);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load chat history");
      }
    };
    fetchHistory();

    // Setup Socket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.emit('join_chat', user._id);

    newSocket.on('receive_message', (message) => {
      // Only append if it's relevant to this chat
      if (
        (message.sender === user._id && message.receiver === params.sellerId) ||
        (message.sender === params.sellerId && message.receiver === user._id)
      ) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, params.sellerId, router]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !user) return;

    socket.emit('send_message', {
      sender: user._id,
      receiver: params.sellerId,
      content: inputMessage,
    });

    setInputMessage('');
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto mt-8 h-[80vh] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <SEOHead title="Chat with Seller | BookBazaar" description="Direct messaging." />
      
      {/* Chat Header */}
      <div className="bg-navy-900 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Direct Message</h2>
          <p className="text-teal-400 text-xs">Chatting securely</p>
        </div>
        <button onClick={() => router.back()} className="text-gray-300 hover:text-white">
          Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === user._id;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] rounded-lg p-3 ${
                  isMe 
                    ? 'bg-teal-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className={`text-[10px] mt-1 block ${isMe ? 'text-teal-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Send
        </button>
      </form>
    </div>
  );
}
