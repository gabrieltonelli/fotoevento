import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Camera, Shield, Zap, Monitor, QrCode, Download,
    Sparkles, ChevronDown, ChevronUp, MessageCircle, Send, X,
    Star, ArrowRight, Users, Image as ImageIcon, Lock
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

import backgroundImage from '../assets/images/bg1.png';

/* ─── Hero Section ─── */
function Hero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const bgScale = useTransform(scrollYProgress, [0, 1], [1.1, 1.3]);

    return (
        <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Parallax and Zoom */}
            <motion.div style={{ y, scale: bgScale }} className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
                {/* Overlays for depth and readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-dark-950/70 via-dark-950/50 to-dark-950" />
                <div className="absolute inset-0 bg-primary-950/20 mix-blend-overlay" />

                {/* Animated orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float animate-delay-300" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-3xl animate-float animate-delay-500" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </motion.div>

            <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-20">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary-300 mb-8"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Moderación IA · Tiempo Real · PWA</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-6"
                >
                    <span className="block text-white">Fotos en</span>
                    <span className="block gradient-text">Tiempo Real</span>
                    <span className="block text-white/90 text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2">para tu Evento</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Tus invitados capturan momentos desde su celular. Las fotos se proyectan en vivo, moderadas por inteligencia artificial. Seguro, instantáneo y mágico.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <Link to="/register" className="btn-primary text-lg flex items-center gap-2 group">
                        Comenzar Gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/pricing" className="btn-secondary text-lg">
                        Ver Planes
                    </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex items-center justify-center gap-8 md:gap-16 text-center"
                >
                    {[
                        { value: '10K+', label: 'Fotos compartidas', icon: ImageIcon },
                        { value: '500+', label: 'Eventos realizados', icon: Users },
                        { value: '99.9%', label: 'Contenido seguro', icon: Shield },
                    ].map(({ value, label, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center">
                            <Icon className="w-5 h-5 text-primary-400 mb-2" />
                            <span className="font-display text-2xl md:text-3xl font-bold text-white">{value}</span>
                            <span className="text-xs md:text-sm text-white/40">{label}</span>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-xs text-white/30">Scroll</span>
                <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
            </motion.div>
        </section>
    );
}

/* ─── Features Section ─── */
function Features() {
    const features = [
        {
            icon: Camera,
            title: 'Carga desde el Celular',
            description: 'Tus invitados acceden al formulario con un QR. Sin app, sin registro obligatorio. Simple y rápido.',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Shield,
            title: 'Moderación por IA',
            description: 'Cada foto pasa por un filtro inteligente que detecta contenido inapropiado antes de mostrarse.',
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            icon: Monitor,
            title: 'Pantalla en Vivo',
            description: 'Proyecta las fotos en tiempo real con transiciones suaves y diferentes temas visuales.',
            gradient: 'from-primary-500 to-accent-500',
        },
        {
            icon: QrCode,
            title: 'QR + Código Corto',
            description: 'Genera un QR imprimible y un código corto para que todos accedan fácilmente.',
            gradient: 'from-orange-500 to-amber-500',
        },
        {
            icon: Download,
            title: 'Descarga Completa',
            description: 'Al finalizar tu evento, descargá todas las fotos en alta calidad con un solo clic.',
            gradient: 'from-pink-500 to-rose-500',
        },
        {
            icon: Zap,
            title: 'Tiempo Real',
            description: 'Las fotos aparecen en la pantalla al instante gracias a la tecnología de tiempo real de Supabase.',
            gradient: 'from-yellow-500 to-orange-500',
        },
    ];

    return (
        <section id="features" className="py-24 md:py-32 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-950/30 via-transparent to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="section-title">¿Por qué FotoEvento?</h2>
                    <p className="section-subtitle">
                        Todo lo que necesitás para que las fotos de tu evento sean una experiencia inolvidable.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="card group cursor-default"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-display text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-white/50 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── How It Works Section ─── */
function HowItWorks() {
    const steps = [
        { step: '01', title: 'Creá tu Evento', desc: 'Personalizá nombre, fecha, tipo y skin de pantalla.' },
        { step: '02', title: 'Compartí el QR', desc: 'Imprimí el QR o compartí el link corto con tus invitados.' },
        { step: '03', title: 'Recibí las Fotos', desc: 'Los invitados suben fotos desde su celular, la IA las modera.' },
        { step: '04', title: 'Proyectá en Vivo', desc: 'Conectá la pantalla y disfrutá las fotos en tiempo real.' },
    ];

    return (
        <section className="py-24 md:py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="section-title">¿Cómo Funciona?</h2>
                    <p className="section-subtitle">En 4 simples pasos, tu evento cobra vida.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="relative text-center"
                        >
                            <div className="text-7xl font-display font-black text-primary-500/10 mb-4">{s.step}</div>
                            <h3 className="font-display text-xl font-bold text-white mb-2 -mt-6">{s.title}</h3>
                            <p className="text-white/50">{s.desc}</p>
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 right-0 w-full h-px bg-gradient-to-r from-primary-500/30 to-transparent translate-x-1/2" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── Event Types Section ─── */
function EventTypes() {
    const types = [
        { name: 'Bodas', emoji: '💍', color: 'from-pink-500/20 to-rose-500/20' },
        { name: 'Cumpleaños', emoji: '🎂', color: 'from-amber-500/20 to-orange-500/20' },
        { name: 'Corporativos', emoji: '🏢', color: 'from-blue-500/20 to-cyan-500/20' },
        { name: 'Conferencias', emoji: '🎤', color: 'from-purple-500/20 to-violet-500/20' },
        { name: 'Graduaciones', emoji: '🎓', color: 'from-green-500/20 to-emerald-500/20' },
        { name: 'Fiestas', emoji: '🎉', color: 'from-red-500/20 to-pink-500/20' },
    ];

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="section-title">Para Todo Tipo de Evento</h2>
                    <p className="section-subtitle">Adaptamos la experiencia visual a cada ocasión.</p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {types.map((type, i) => (
                        <motion.div
                            key={type.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className={`bg-gradient-to-br ${type.color} backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center cursor-default`}
                        >
                            <span className="text-4xl mb-3 block">{type.emoji}</span>
                            <span className="font-display font-semibold text-white">{type.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── FAQ Section ─── */
function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            q: '¿Los invitados necesitan descargar una app?',
            a: 'No. FotoEvento es una aplicación web progresiva (PWA). Los invitados solo necesitan escanear el QR o ingresar el código corto desde el navegador de su celular.'
        },
        {
            q: '¿Cómo funciona la moderación por IA?',
            a: 'Cada foto subida es analizada por un modelo de inteligencia artificial que detecta contenido inapropiado, ofensivo o NSFW. Solo las fotos aptas se muestran en la pantalla del evento.'
        },
        {
            q: '¿Puedo descargar todas las fotos después del evento?',
            a: 'Sí. Todas las fotos aprobadas se almacenan de forma segura y podés descargarlas desde tu dashboard en cualquier momento.'
        },
        {
            q: '¿Qué tipos de eventos soportan?',
            a: 'Bodas, cumpleaños, eventos corporativos, conferencias, graduaciones, fiestas y cualquier reunión social. Cada tipo de evento ofrece skins personalizados para la pantalla.'
        },
        {
            q: '¿Puedo personalizar la pantalla de proyección?',
            a: 'Sí. Ofrecemos diferentes temas y configuraciones: modo oscuro/claro, mostrar/ocultar QR en pantalla, diferentes layouts de transición y más.'
        },
        {
            q: '¿Necesito registrarme para subir fotos?',
            a: 'Depende de la configuración del evento. El organizador puede elegir si requiere registro o permite subir fotos como invitado anónimo.'
        },
    ];

    return (
        <section id="faq" className="py-24 md:py-32 relative">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="section-title">Preguntas Frecuentes</h2>
                    <p className="section-subtitle">Todo lo que necesitás saber sobre FotoEvento.</p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="glass rounded-xl overflow-hidden"
                        >
                            <button
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            >
                                <span className="font-semibold text-white pr-4">{faq.q}</span>
                                {openIndex === i ? (
                                    <ChevronUp className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0" />
                                )}
                            </button>
                            <motion.div
                                initial={false}
                                animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <p className="px-5 pb-5 text-white/50 leading-relaxed">{faq.a}</p>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── CTA Section ─── */
function CTA() {
    return (
        <section className="py-24 relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20" />
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                            ¿Listo para tu próximo evento?
                        </h2>
                        <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                            Creá tu primer evento gratis y sorprendé a tus invitados con fotos en vivo.
                        </p>
                        <Link to="/register" className="btn-primary text-lg inline-flex items-center gap-2 group">
                            Empezar Ahora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ─── Chatbot ─── */
function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: 'bot', text: '¡Hola! 👋 Soy el asistente de FotoEvento. ¿En qué puedo ayudarte?' }
    ]);
    const [input, setInput] = useState('');
    const messagesEnd = useRef(null);

    const botResponses = {
        precio: '¡Tenemos planes depuis $0/mes! El plan gratuito incluye 1 evento con hasta 50 fotos. Visitá /pricing para ver todos los planes.',
        funciona: 'Es muy simple: 1) Creás tu evento 2) Compartís el QR 3) Los invitados suben fotos 4) Se proyectan en vivo. ¡La IA modera todo automáticamente!',
        registro: 'Es opcional según la config del evento. El organizador decide si los invitados deben registrarse o pueden subir fotos como anónimos.',
        segur: 'Las fotos son moderadas por IA antes de mostrarse. Contenido inapropiado es rechazado automáticamente.',
        descarg: 'Sí, desde tu dashboard podés descargar todas las fotos del evento en alta calidad.',
        default: 'Gracias por tu consulta. Te recomiendo revisar nuestra sección de FAQ o contactarnos en contacto@fotoevento.com para más detalles.'
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
                        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-dark rounded-2xl overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-primary-600 to-accent-600 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">Asistente FotoEvento</p>
                                <p className="text-white/60 text-xs">Online ahora</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="h-72 overflow-y-auto p-4 space-y-3">
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
                        <div className="p-3 border-t border-white/5 flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribí tu consulta..."
                                className="flex-1 input-field !py-2 !text-sm !rounded-lg"
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

/* ─── Landing Page ─── */
export default function Landing() {
    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <EventTypes />
            <FAQ />
            <CTA />
            <Footer />
            <Chatbot />
        </div>
    );
}
