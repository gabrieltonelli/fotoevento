import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: '¡Hola! 👋 Soy el asistente de Foto Eventos. ¿En qué puedo ayudarte?' }
    ]);
    const [input, setInput] = useState('');
    const messagesEnd = useRef(null);

    const botResponses = {
        precio: `¡Tenemos planes desde $0/mes! El plan gratuito incluye 1 evento con hasta ${import.meta.env.VITE_PLAN_FREE_MAX_PHOTOS || '50'} fotos. Visitá la sección de Precios para ver todos los detalles.`,
        funciona: 'Es muy simple: 1) Creás tu evento 2) Compartís el QR 3) Los invitados suben fotos 4) Se proyectan en vivo. ¡La IA modera todo automáticamente!',
        registro: 'Es opcional según la config del evento. El organizador decide si los invitados deben registrarse o pueden subir fotos como anónimos.',
        segur: 'Las fotos son moderadas por IA antes de mostrarse. Contenido inapropiado es rechazado automáticamente.',
        descarg: 'Sí, desde tu dashboard podés descargar todas las fotos del evento en alta calidad.',
        default: 'Gracias por tu consulta. Te recomiendo revisar nuestra sección de FAQ o contactarnos a través de nuestro formulario de Soporte para más detalles.'
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
        setInput('');

        setTimeout(() => {
            const lower = userMsg.toLowerCase();
            let response = botResponses.default;
            for (const [key, val] of Object.entries(botResponses)) {
                if (key !== 'default' && lower.includes(key)) {
                    response = val;
                    break;
                }
            }
            setMessages(prev => [...prev, { from: 'bot', text: response }]);
        }, 800);
    };

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {/* Toggle */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2, type: 'spring' }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-110 transition-transform"
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-primary-600 to-accent-600 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">Asistente Foto Eventos</p>
                                <p className="text-white/60 text-xs">Online ahora</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-dark-950/50">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.from === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-md'
                                        : 'bg-white/10 text-white/80 rounded-bl-md'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEnd} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-white/5 flex items-center gap-2 bg-dark-900">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribí tu consulta..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                            />
                            <button onClick={handleSend} className="p-2 rounded-lg bg-primary-600 hover:bg-primary-500 transition-colors">
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
