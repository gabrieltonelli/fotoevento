import { Link } from 'react-router-dom';
import { Camera, Heart, Github, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative bg-dark-950 border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-display text-xl font-bold gradient-text">FotoEvento</span>
                        </Link>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Captura cada momento especial de tu evento. Fotos en vivo, moderadas por IA, proyectadas en tiempo real.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-display font-semibold text-white mb-4">Producto</h4>
                        <ul className="space-y-3">
                            <li><Link to="/#features" className="text-white/50 hover:text-white text-sm transition-colors">Características</Link></li>
                            <li><Link to="/pricing" className="text-white/50 hover:text-white text-sm transition-colors">Precios</Link></li>
                            <li><Link to="/#faq" className="text-white/50 hover:text-white text-sm transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display font-semibold text-white mb-4">Eventos</h4>
                        <ul className="space-y-3">
                            <li><span className="text-white/50 text-sm">Bodas</span></li>
                            <li><span className="text-white/50 text-sm">Cumpleaños</span></li>
                            <li><span className="text-white/50 text-sm">Corporativos</span></li>
                            <li><span className="text-white/50 text-sm">Conferencias</span></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-display font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Términos de Servicio</a></li>
                            <li><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Política de Privacidad</a></li>
                            <li><a href="#" className="text-white/50 hover:text-white text-sm transition-colors">Contacto</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm flex items-center gap-1">
                        © {new Date().getFullYear()} FotoEvento. Hecho con <Heart className="w-3 h-3 text-red-500 fill-current" /> en Argentina.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/gabrieltonelli/fotoevento" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-white/40 hover:text-white transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-white/40 hover:text-white transition-colors">
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
