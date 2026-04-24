import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Chatbot from '../components/common/Chatbot';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-3xl p-8 md:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="font-display text-4xl font-bold mb-8">Política de Privacidad</h1>
                        
                        <div className="space-y-6 text-white/70 leading-relaxed">
                            <p>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
                            
                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">1. Información que recopilamos</h2>
                                <p>Recopilamos información personal que usted nos proporciona directamente al registrarse, como su nombre, dirección de correo electrónico y datos de facturación.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">2. Uso de las imágenes</h2>
                                <p>Las fotos cargadas en los eventos son propiedad del organizador del evento. Foto Evento utiliza estas imágenes únicamente para proporcionar el servicio de proyección y visualización contratado.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">3. Seguridad</h2>
                                <p>Implementamos medidas de seguridad para proteger su información personal. Sin embargo, ninguna transmisión por internet es 100% segura.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">4. Cookies</h2>
                                <p>Utilizamos cookies para mejorar su experiencia de usuario y mantener su sesión activa.</p>
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
