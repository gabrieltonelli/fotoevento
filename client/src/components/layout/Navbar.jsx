import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Camera, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display text-xl font-bold gradient-text">Foto Eventos</span>
                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/30 self-center">
                            v{__APP_VERSION__}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {!user ? (
                            <>
                                <Link to="/#features" className="btn-ghost text-sm">Características</Link>
                                <Link to="/pricing" className="btn-ghost text-sm">Precios</Link>
                                <Link to="/#faq" className="btn-ghost text-sm">FAQ</Link>
                                <div className="flex items-center gap-3">
                                    <Link to="/login" className="btn-ghost text-sm">Iniciar Sesión</Link>
                                    <Link to="/register" className="btn-primary text-sm !px-6 !py-2">Comenzar Gratis</Link>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/dashboard" className="flex items-center gap-2 btn-ghost text-sm">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <button onClick={handleSignOut} className="flex items-center gap-2 btn-ghost text-sm text-red-400 hover:text-red-300">
                                    <LogOut className="w-4 h-4" />
                                    Salir
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-white/70 hover:text-white"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass-dark border-t border-white/5"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {!user ? (
                                <>
                                    <Link to="/#features" className="block btn-ghost text-sm" onClick={() => setMobileOpen(false)}>Características</Link>
                                    <Link to="/pricing" className="block btn-ghost text-sm" onClick={() => setMobileOpen(false)}>Precios</Link>
                                    <Link to="/#faq" className="block btn-ghost text-sm" onClick={() => setMobileOpen(false)}>FAQ</Link>
                                    <Link to="/login" className="block btn-ghost text-sm" onClick={() => setMobileOpen(false)}>Iniciar Sesión</Link>
                                    <Link to="/register" className="block btn-primary text-sm text-center" onClick={() => setMobileOpen(false)}>Comenzar Gratis</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/dashboard" className="block btn-ghost text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                                    <button onClick={handleSignOut} className="block w-full text-left btn-ghost text-sm text-red-400">Salir</button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
