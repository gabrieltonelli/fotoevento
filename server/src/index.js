import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import eventRoutes from './routes/events.js';
import photoRoutes from './routes/photos.js';
import paymentRoutes from './routes/payments.js';
import publicRoutes from './routes/public.js';
import profileRoutes from './routes/profile.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.VITE_APP_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/events', photoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
    });
});

// Export app for serverless use
export default app;

// Only listen if not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
    app.listen(PORT, () => {
        console.log(`🚀 Foto Eventos API running on http://localhost:${PORT}`);
    });
}
