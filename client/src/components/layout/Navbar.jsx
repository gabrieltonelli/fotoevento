import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Camera, Menu, X, LogOut, LayoutDashboard, CreditCard, Crown, ChevronDown, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, profile, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        // Navegamos primero para evitar que ProtectedRoute nos mande al /login
        navigate('/', { replace: true });
        await signOut();
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
                                {profile?.subscription_status === 'active' && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                                        profile.subscription_plan === 'premium' 
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                            : profile.subscription_plan === 'pro'
                                                ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                                : 'bg-white/5 text-white/40 border-white/10'
                                    }`}>
                                        {profile.subscription_plan === 'premium' && <Crown className="w-3 h-3" />}
                                        Plan {profile.subscription_plan}
                                    </div>
                                )}
                                <Link to="/billing" className="flex items-center gap-2 btn-ghost text-sm">
                                    <CreditCard className="w-4 h-4" />
                                    Facturación
                                </Link>

                                {/* User Profile Dropdown */}
                                <div className="relative ml-2">
                                    <button 
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors border border-white/10"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                                            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <>
                                                {/* Backdrop to close menu */}
                                                <div 
                                                    className="fixed inset-0 z-10" 
                                                    onClick={() => setUserMenuOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-64 rounded-2xl glass-dark border border-white/10 shadow-2xl py-3 z-20 overflow-hidden"
                                                >
                                                    <div className="px-5 py-3 border-b border-white/10 mb-2">
                                                        <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'Usuario'}</p>
                                                        <p className="text-[11px] text-white/40 truncate mt-0.5">{user?.email}</p>
                                                    </div>
                                                    
                                                    <div className="px-2">
                                                        <button 
                                                            onClick={() => {
                                                                setUserMenuOpen(false);
                                                                handleSignOut();
                                                            }} 
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-colors text-left font-medium"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            Cerrar Sesión
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
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
