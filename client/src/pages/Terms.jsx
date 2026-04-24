import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Chatbot from '../components/common/Chatbot';

export default function Terms() {
    return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-3xl p-8 md:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="font-display text-4xl font-bold mb-8">Términos y Condiciones</h1>
                        
                        <div className="space-y-6 text-white/70 leading-relaxed">
                            <p>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
                            
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los términos</h2>
                                <p>Al utilizar Foto Evento, usted acepta cumplir con estos términos y condiciones de uso.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">2. Uso del Servicio</h2>
                                <p>Usted es responsable de todo el contenido cargado bajo su cuenta. No se permite el uso del servicio para fines ilegales o contenido inapropiado.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">3. Planes y Pagos</h2>
                                <p>Los pagos se procesan a través de Stripe o MercadoPago. Las suscripciones pueden cancelarse en cualquier momento desde el panel de facturación.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">4. Limitación de Responsabilidad</h2>
                                <p>Foto Evento no se hace responsable por interrupciones en el servicio fuera de nuestro control razonable.</p>
                            </section>
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
            <Chatbot />
        </div>
    );
}
