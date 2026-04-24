import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, LifeBuoy, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Chatbot from '../components/common/Chatbot';
import toast from 'react-hot-toast';

export default function Support() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: profile?.full_name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/support`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    userId: user?.id
                }),
            });

            if (!response.ok) throw new Error('Error al enviar el mensaje');

            setSubmitted(true);
            toast.success('¡Mensaje enviado con éxito!');
        } catch (error) {
            console.error('Support error:', error);
            toast.error('Hubo un problema al enviar tu mensaje. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Estamos para <br /> <span className="text-primary-500">ayudarte.</span>
                        </h1>
                        <p className="text-white/60 text-lg mb-12 max-w-md">
                            ¿Tenés alguna duda, problema técnico o sugerencia? Envianos un mensaje y nuestro equipo te responderá lo antes posible.
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                                    <MessageSquare className="text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Soporte Técnico</h3>
                                    <p className="text-white/60 text-sm">Ayuda con la creación de eventos, carga de fotos o configuración de pantallas.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-secondary-500/10 flex items-center justify-center shrink-0 border border-secondary-500/20">
                                    <LifeBuoy className="text-secondary-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Facturación y Planes</h3>
                                    <p className="text-white/60 text-sm">Consultas sobre pagos, facturas o cambios de plan.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                                    <Mail className="text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Feedback</h3>
                                    <p className="text-white/60 text-sm">Tus ideas nos ayudan a mejorar. ¡Queremos saber qué pensás!</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-dark border border-white/10 rounded-3xl p-8 md:p-10"
                    >
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">¡Mensaje Recibido!</h2>
                                <p className="text-white/60 mb-8 max-w-xs">
                                    Gracias por contactarte con nosotros. Hemos enviado una confirmación a tu correo y te responderemos pronto.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold"
                                >
                                    Enviar otro mensaje
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary-500 transition-colors"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary-500 transition-colors"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Categoría</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                                    >
                                        <option value="general" className="bg-dark-900 text-white">Consulta General</option>
                                        <option value="technical" className="bg-dark-900 text-white">Problema Técnico</option>
                                        <option value="billing" className="bg-dark-900 text-white">Facturación</option>
                                        <option value="feedback" className="bg-dark-900 text-white">Sugerencia / Feedback</option>
                                        <option value="bug" className="bg-dark-900 text-white">Reportar un Error</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Asunto</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary-500 transition-colors"
                                        placeholder="¿En qué podemos ayudarte?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Mensaje</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                                        placeholder="Escribí tu mensaje acá..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Enviar Mensaje
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}
