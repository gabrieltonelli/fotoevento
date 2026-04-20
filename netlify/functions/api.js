import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

// Importar rutas directamente
import eventRoutes from '../../server/src/routes/events.js';
import photoRoutes from '../../server/src/routes/photos.js';
import paymentRoutes from '../../server/src/routes/payments.js';
import publicRoutes from '../../server/src/routes/public.js';
import profileRoutes from '../../server/src/routes/profile.js';

const app = express();

// Middleware básico
app.use(cors({
    origin: '*', // Permitir todo en serverless, manejado por Netlify
    credentials: true,
}));
app.use(express.json());

// Routes (Mantenemos el prefijo /api porque la redirección de Netlify lo incluye)
app.use('/api/events', eventRoutes);
app.use('/api/events', photoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: 'netlify-lambda' });
});

// Exportar handler
export const handler = serverless(app);
