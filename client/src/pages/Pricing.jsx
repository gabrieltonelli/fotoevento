import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Check, X, Star, Zap, Crown, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';

// Logos de procesadores
const ProcessorLogo = ({ name, className = '' }) => {
    if (name === 'stripe') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.893 5.575C4.746 22.81 7.762 24 11.469 24c2.626 0 4.75-.7 6.225-1.96 1.614-1.365 2.449-3.395 2.449-5.87 0-4.136-2.516-5.846-6.167-7.02z" />
                </svg>
                <span className="font-semibold text-sm">Stripe</span>
            </div>
        );
    }
    if (name === 'mercadopago') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.004 1.2C5.665 1.2.525 6.34.525 12.68S5.665 24.16 12.004 24.16s11.48-5.14 11.48-11.48S18.344 1.2 12.004 1.2zM8.17 16.42c-.47 0-.85-.38-.85-.85V9.89c0-.47.38-.85.85-.85h2.55c1.17 0 2.12.95 2.12 2.12v.85c0 1.17-.95 2.12-2.12 2.12H9.02v1.44c0 .47-.38.85-.85.85zm5.1 0c-.47 0-.85-.38-.85-.85V9.89c0-.47.38-.85.85-.85h2.55c1.17 0 2.12.95 2.12 2.12v.85c0 1.17-.95 2.12-2.12 2.12h-1.7v1.44c0 .47-.38.85-.85.85z" />
                </svg>
                <span className="font-semibold text-sm">Mercado Pago</span>
            </div>
        );
    }
    return <span className="text-sm font-semibold">{name}</span>;
};

export default function Pricing() {
    const { user, getToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [processors, setProcessors] = useState([]);
    const [defaultProcessor, setDefaultProcessor] = useState('');
    const [selectedProcessor, setSelectedProcessor] = useState('');
    const [loadingPlan, setLoadingPlan] = useState(null);

    // Cargar procesadores habilitados
    useEffect(() => {
        const envProcessors = (import.meta.env.VITE_PAYMENT_PROCESSORS || 'stripe').split(',').map(p => p.trim());
        setProcessors(envProcessors);
        setSelectedProcessor(envProcessors[0] || 'stripe');

        // Si hay API, cargar desde el backend
        api.getProcessors()
            .then(data => {
                setProcessors(data.processors || envProcessors);
                setDefaultProcessor(data.default || envProcessors[0]);
                setSelectedProcessor(data.default || envProcessors[0]);
            })
            .catch(() => {
                // Fallback a env vars
            });
    }, []);

    // Mostrar mensaje si viene de un pago cancelado
    useEffect(() => {
        if (searchParams.get('payment') === 'cancelled') {
            toast.error('Pago cancelado. Podés intentar de nuevo cuando quieras.');
        }
    }, [searchParams]);

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

    const handleCheckout = async (planId) => {
        if (!user) {
            toast('Necesitás iniciar sesión para comprar un plan', { icon: '🔐' });
            navigate('/register');
            return;
        }

        if (planId === 'free') {
            navigate('/dashboard');
            return;
        }

        setLoadingPlan(planId);
        try {
            const token = getToken();
            const result = await api.createCheckout({
                plan: planId,
                processor: selectedProcessor,
                cycle: billingCycle // Pasar el ciclo al backend
            }, token);

            // Redirigir a la pasarela de pago
            if (result.url) {
                window.location.href = result.url;
            } else if (result.sandboxUrl) {
                // MercadoPago sandbox para development
                window.location.href = result.sandboxUrl;
            }
        } catch (err) {
            toast.error(err.message || 'Error al iniciar el pago');
        } finally {
            setLoadingPlan(null);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Gratuito',
            price: { monthly: 0, annual: 0 },
            period: 'siempre',
            description: 'Probá Foto Eventos en tu próximo evento.',
            icon: Star,
            gradient: 'from-gray-500 to-gray-600',
            features: [
                { text: '1 evento', included: true },
                { text: 'Hasta 50 fotos', included: true },
                { text: 'Pantalla en vivo', included: true },
                { text: 'QR + código corto', included: true },
                { text: 'Moderación IA', included: true },
                { text: 'Descarga de fotos', included: false },
                { text: 'Skins premium', included: false },
                { text: 'Sin marca de agua', included: false },
            ],
            cta: 'Comenzar Gratis',
            popular: false,
        },
        {
            id: 'pro',
            name: 'Pro',
            price: { monthly: 4990, annual: 3990 }, // ~20% desc
            period: 'mes',
            description: 'Ideal para eventos medianos.',
            icon: Zap,
            gradient: 'from-primary-500 to-accent-500',
            features: [
                { text: 'Eventos ilimitados', included: true },
                { text: 'Hasta 500 fotos', included: true },
                { text: 'Pantalla en vivo', included: true },
                { text: 'QR + código corto', included: true },
                { text: 'Moderación IA', included: true },
                { text: 'Descarga de fotos', included: true },
                { text: 'Skins premium', included: true },
                { text: 'Sin marca de agua', included: false },
            ],
            cta: 'Elegir Pro',
            popular: true,
        },
        {
            id: 'premium',
            name: 'Premium',
            price: { monthly: 9990, annual: 7990 }, // ~20% desc
            period: 'mes',
            description: 'Para grandes eventos sin límites.',
            icon: Crown,
            gradient: 'from-amber-500 to-orange-500',
            features: [
                { text: 'Eventos ilimitados', included: true },
                { text: 'Fotos ilimitadas', included: true },
                { text: 'Pantalla en vivo', included: true },
                { text: 'QR + código corto', included: true },
                { text: 'Moderación IA', included: true },
                { text: 'Descarga de fotos', included: true },
                { text: 'Todos los skins', included: true },
                { text: 'Sin marca de agua', included: true },
            ],
            cta: 'Elegir Premium',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            <main className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="section-title">Planes y Precios</h1>
                        <p className="section-subtitle">
                            Elegí el plan que mejor se adapte a tu evento. Sin sorpresas, sin costos ocultos.
                        </p>
                    </motion.div>

                    {/* Billing Cycle Toggle */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-center gap-4 mb-12"
                    >
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-white/40'}`}>Mensual</span>
                        <button 
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                            className="relative w-14 h-7 rounded-full bg-white/10 p-1 transition-colors hover:bg-white/20"
                        >
                            <motion.div 
                                animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                                className="w-5 h-5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50"
                            />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-white' : 'text-white/40'}`}>Anual</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                Ahorrá 20%
                            </span>
                        </div>
                    </motion.div>

                    {/* Payment Processor Selector */}
                    {processors.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-center mb-12"
                        >
                            <div className="glass rounded-2xl p-2 inline-flex items-center gap-1">
                                <span className="text-white/40 text-sm px-3 hidden sm:block">
                                    <CreditCard className="w-4 h-4 inline mr-1" />
                                    Pagá con:
                                </span>
                                {processors.map((proc) => (
                                    <button
                                        key={proc}
                                        onClick={() => setSelectedProcessor(proc)}
                                        className={`px-4 py-2.5 rounded-xl transition-all duration-200 ${selectedProcessor === proc
                                            ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/20'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <ProcessorLogo name={proc} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                className={`relative rounded-2xl p-1 ${plan.popular
                                    ? 'bg-gradient-to-br from-primary-500 to-accent-500'
                                    : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-xs font-bold text-white z-10">
                                        Más Popular
                                    </div>
                                )}

                                <div className={`h-full rounded-[14px] ${plan.popular ? 'bg-dark-900' : 'glass'} p-8 flex flex-col`}>
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                                        <plan.icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Name & Price */}
                                    <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                                    <p className="text-white/40 text-sm mt-1 mb-4">{plan.description}</p>

                                    <div className="mb-2">
                                        <span className="font-display text-4xl font-black text-white">
                                            ${plan.price[billingCycle].toLocaleString('es-AR')}
                                        </span>
                                        <span className="text-white/40 text-sm ml-2">ARS / {plan.period}</span>
                                    </div>

                                    {/* Savings indicator */}
                                    {billingCycle === 'annual' && plan.price.monthly > 0 && (
                                        <div className="mb-6">
                                            <span className="text-green-400 text-xs font-semibold">
                                                Ahorrás ${(plan.price.monthly - plan.price.annual).toLocaleString('es-AR')} por mes
                                            </span>
                                        </div>
                                    )}
                                    {billingCycle === 'monthly' && (
                                        <div className="mb-6 h-4" /> // Spacer to keep heights even
                                    )}

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map((feature) => (
                                            <li key={feature.text} className="flex items-center gap-3">
                                                {feature.included ? (
                                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                ) : (
                                                    <X className="w-4 h-4 text-white/20 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-white/70' : 'text-white/30'}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <button
                                        onClick={() => handleCheckout(plan.id)}
                                        disabled={loadingPlan === plan.id}
                                        className={`w-full py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${plan.popular ? 'btn-primary' : 'btn-secondary'
                                            }`}
                                    >
                                        {loadingPlan === plan.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Redirigiendo...
                                            </>
                                        ) : (
                                            <>
                                                {plan.cta}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* Processor badge for paid plans */}
                                    {plan.id !== 'free' && processors.length > 0 && (
                                        <div className="mt-3 text-center">
                                            <span className="text-white/20 text-xs">
                                                Procesado por {selectedProcessor === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Payment Methods Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center mt-12 space-y-4"
                    >
                        {processors.includes('mercadopago') && (
                            <div className="glass rounded-xl p-4 max-w-lg mx-auto">
                                <p className="text-sm text-white/50">
                                    🇦🇷 Con <span className="text-sky-400 font-semibold">Mercado Pago</span> podés pagar con tarjeta de crédito, débito, transferencia, Mercado Crédito y más medios de pago argentinos.
                                </p>
                            </div>
                        )}

                        <p className="text-white/40">
                            ¿Tenés dudas? Revisá nuestras{' '}
                            <Link to="/#faq" className="text-primary-400 hover:text-primary-300 transition-colors">
                                preguntas frecuentes
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
