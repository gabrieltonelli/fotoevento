const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de red' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Events
    getEvents: (token) =>
        fetchAPI('/api/events', { headers: { Authorization: `Bearer ${token}` } }),

    createEvent: (data, token) =>
        fetchAPI('/api/events', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        }),

    getEvent: (id, token) =>
        fetchAPI(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } }),

    updateEvent: (id, data, token) =>
        fetchAPI(`/api/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        }),

    deleteEvent: (id, token) =>
        fetchAPI(`/api/events/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }),

    // Photos
    uploadPhoto: async (eventId, file, token, guestName) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (guestName) formData.append('guest_name', guestName);

        const response = await fetch(`${API_URL}/api/events/${eventId}/photos`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error al subir foto' }));
            throw new Error(error.message);
        }
        return response.json();
    },

    getPhotos: (eventId) =>
        fetchAPI(`/api/events/${eventId}/photos`),

    // Payments
    getProcessors: () =>
        fetchAPI('/api/payments/processors'),

    createCheckout: (data, token) =>
        fetchAPI('/api/payments/checkout', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        }),

    activateFromRedirect: (data, token) =>
        fetchAPI('/api/payments/activate-from-redirect', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { Authorization: `Bearer ${token}` },
        }),

    getPaymentStatus: (eventId, token) =>
        fetchAPI(`/api/payments/status/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` },
        }),

    // Public event info
    getPublicEvent: (shortCode) =>
        fetchAPI(`/api/public/event/${shortCode}`),
};
