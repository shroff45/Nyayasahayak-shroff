import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot } from 'lucide-react';

export const RightsAssistant: React.FC = () => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Namaste! I am NyayaSahayak. Ask me about your legal rights or bail process.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsgs = [...messages, { id: Date.now(), type: 'user', text: input }];
        setMessages(newMsgs);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            let reply = "I can help you understand the IPC sections mentioned in your case.";
            if (input.toLowerCase().includes('bail')) {
                reply = "Bail is a right in bailable offenses. For non-bailable ones, it is the court's discretion. Since your case (Theft) is bailable under certain conditions, you can apply using Form 45.";
            } else if (input.toLowerCase().includes('fir')) {
                reply = "You have the right to receive a free copy of the FIR immediately after it is recorded.";
            }
            setMessages(curr => [...curr, { id: Date.now() + 1, type: 'bot', text: reply }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-h-[300px] relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-lg ${msg.type === 'user' ? 'bg-white/10 text-white' : 'bg-ns-secondary-500/20 text-ns-secondary-400'}`}>
                            {msg.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-md backdrop-blur-sm ${msg.type === 'user' ? 'bg-ns-primary-500/20 text-white border border-ns-primary-500/30 rounded-tr-none' : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-2 text-ns-secondary-400 text-xs ml-12 items-center h-8">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-ns-primary-500/50 to-ns-secondary-500/50 rounded-xl opacity-30 group-hover:opacity-70 transition duration-500 blur"></div>
                <div className="relative flex gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-xl border border-white/10">
                    <input
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none"
                        placeholder="Ask a legal question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 bg-ns-primary-500 text-black rounded-lg hover:bg-ns-primary-400 transition-colors shadow-lg shadow-ns-primary-500/20"
                        disabled={!input.trim()}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
