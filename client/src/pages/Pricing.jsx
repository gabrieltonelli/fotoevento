import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Pricing() {
    const plans = [
        {
            name: 'Gratuito',
            price: '0',
            period: 'siempre',
            description: 'Probá FotoEvento en tu próximo evento.',
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
            name: 'Pro',
            price: '4.990',
            period: 'por evento',
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
            name: 'Premium',
            price: '9.990',
            period: 'por evento',
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
                        className="text-center mb-16"
                    >
                        <h1 className="section-title">Planes y Precios</h1>
                        <p className="section-subtitle">
                            Elegí el plan que mejor se adapte a tu evento. Sin sorpresas, sin costos ocultos.
                        </p>
                    </motion.div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-2xl p-1 ${plan.popular
                                        ? 'bg-gradient-to-br from-primary-500 to-accent-500'
                                        : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-xs font-bold text-white">
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

                                    <div className="mb-6">
                                        <span className="font-display text-4xl font-black text-white">${plan.price}</span>
                                        <span className="text-white/40 text-sm ml-2">ARS / {plan.period}</span>
                                    </div>

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
                                    <Link
                                        to="/register"
                                        className={`w-full py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 transition-all ${plan.popular
                                                ? 'btn-primary'
                                                : 'btn-secondary'
                                            }`}
                                    >
                                        {plan.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ Link */}
                    <div className="text-center mt-12">
                        <p className="text-white/40">
                            ¿Tenés dudas? Revisá nuestras{' '}
                            <Link to="/#faq" className="text-primary-400 hover:text-primary-300 transition-colors">
                                preguntas frecuentes
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
