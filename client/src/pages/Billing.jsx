import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Download, ExternalLink, Calendar, CheckCircle, Clock, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Billing() {
    const { profile, getToken, refreshProfile } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const token = getToken();
            const data = await api.getPayments(token);
            setPayments(data.payments || []);
        } catch (err) {
            toast.error('Error al cargar historial de pagos');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = (payment) => {
        // En una app real, aquí generaríamos un PDF o llamaríamos a un endpoint de factura
        // Por ahora, simulamos una vista de impresión de factura simple
        const invoiceWindow = window.open('', '_blank');
        invoiceWindow.document.write(`
            <html>
                <head>
                    <title>Factura #${payment.id.slice(0, 8)}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #fbbf24; padding-bottom: 20px; display: flex; justify-content: space-between; }
                        .details { margin: 40px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                        .total { font-size: 1.2rem; font-weight: bold; text-align: right; margin-top: 20px; }
                        .footer { margin-top: 50px; font-size: 0.8rem; color: #777; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>FOTO EVENTOS</h1>
                        <div>
                            <p><strong>Factura #:</strong> ${payment.id.slice(0, 8).toUpperCase()}</p>
                            <p><strong>Fecha:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="details">
                        <p><strong>Concepto:</strong> Plan ${payment.plan.toUpperCase()} para Foto Eventos</p>
                        <p><strong>Procesador:</strong> ${payment.processor.toUpperCase()}</p>
                        <p><strong>Email:</strong> ${profile.full_name || 'Usuario'}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Licencia Foto Eventos - ${payment.plan.toUpperCase()}</td>
                                <td>1</td>
                                <td>${payment.currency} ${payment.amount}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="total">
                        Total: ${payment.currency} ${payment.amount}
                    </div>
                    <div class="footer">
                        Gracias por confiar en Foto Eventos. Esta es una factura generada automáticamente.
                    </div>
                </body>
            </html>
        `);
        invoiceWindow.document.close();
        invoiceWindow.print();
    };

    const handleCancelSubscription = async () => {
        setCancelling(true);
        try {
            const token = getToken();
            await api.cancelSubscription(token);

            toast.success('Suscripción cancelada correctamente');
            await refreshProfile();
            setShowCancelModal(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-950">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-white">Facturación</h1>
                    <p className="text-white/50 mt-1">Gestioná tus planes y descargá tus facturas.</p>
                </div>

                {/* Resumen del Plan Actual */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 mb-8 border-l-4 border-amber-500"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-1">Tu Plan Actual</p>
                            <h2 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
                                {profile?.subscription_plan || 'Ninguno'}
                                {profile?.subscription_plan === 'premium' && <Crown className="w-6 h-6 text-amber-500" />}
                            </h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-sm text-white/60">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    {profile?.subscription_status === 'active' 
                                        ? 'Suscripción Activa' 
                                        : profile?.subscription_status === 'cancelling'
                                            ? 'Suscripción por finalizar'
                                            : 'Suscripción Inactiva'}
                                </span>
                                {profile?.subscription_expiry && (
                                    <span className="flex items-center gap-1.5 text-sm text-white/60">
                                        <Calendar className="w-4 h-4 text-amber-500" />
                                        {profile?.subscription_status === 'cancelling' ? 'Acceso hasta el:' : 'Vence el:'} {new Date(profile.subscription_expiry).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        {profile?.subscription_plan !== 'premium' && (
                            <Link to="/pricing" className="btn-primary flex items-center gap-2">
                                Cambiar Plan
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        )}
                        {(profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'premium') && 
                          profile?.subscription_status !== 'cancelling' && (
                            <button 
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold"
                            >
                                Cancelar Suscripción
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Historial de Pagos */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary-400" />
                            Historial de Pagos
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="p-12 text-center text-white/40">
                            No se encontraron pagos registrados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider font-bold">
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Plan</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.map((p) => (
                                        <tr key={p.id} className="text-sm text-white/70 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-white uppercase">{p.plan}</span>
                                                {p.events?.name && (
                                                    <p className="text-[10px] text-white/40 truncate max-w-[150px]">
                                                        Evento: {p.events.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {p.currency} {p.amount}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Completado
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => downloadInvoice(p)}
                                                    className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all group"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Factura</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Cancel Subscription Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-dark max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                            
                            <h3 className="text-2xl font-display font-bold text-white mb-4">
                                ¿Estás seguro de cancelar?
                            </h3>
                             <p className="text-white/60 mb-8 text-sm leading-relaxed">
                                Al cancelar tu suscripción, **se detendrán los cobros automáticos** en tu procesador de pago. 
                                <br /><br />
                                Podrás seguir disfrutando de tus beneficios (fotos ilimitadas, skins exclusivos y descarga de álbumes) hasta que finalice tu tiempo contratado el día **{new Date(profile?.subscription_expiry).toLocaleDateString()}**.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancelling}
                                    className="w-full py-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    disabled={cancelling}
                                    className="w-full py-4 rounded-xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-all"
                                >
                                    Mantener mi Plan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
