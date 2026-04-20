import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ createdAt, className = '' }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const start = new Date(createdAt);
            const trialMinutes = parseInt(import.meta.env.VITE_FREE_TRIAL_MINUTES || '30', 10);
            const end = new Date(start.getTime() + trialMinutes * 60 * 1000);
            const now = new Date();
            const diff = end - now;

            if (diff <= 0) {
                return 'Expirado';
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [createdAt]);

    if (!timeLeft || timeLeft === 'Expirado') return null;

    return (
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 tabular-nums ${className}`}>
            <Clock className="w-3 h-3" />
            Finalización del Trial en {timeLeft}
        </span>
    );
};

export default CountdownTimer;
