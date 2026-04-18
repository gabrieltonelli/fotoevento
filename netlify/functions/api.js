import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import eventRoutes from '../../server/src/routes/events.js';
import photoRoutes from '../../server/src/routes/photos.js';
import paymentRoutes from '../../server/src/routes/payments.js';
import publicRoutes from '../../server/src/routes/public.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Note: Netlify functions already have the function name in the path
// so we need to handle the /api part if the redirect doesn't strip it
// The redirect is: from = "/api/*" to = "/.netlify/functions/api/:splat"
// So if we request /api/events, it hits the function with path /events
app.use('/events', eventRoutes);
app.use('/events', photoRoutes); // Both use /events or nested
app.use('/payments', paymentRoutes);
app.use('/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), serverless: true });
});

export const handler = serverless(app);
