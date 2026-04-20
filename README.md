# 📸 Foto Eventos

> **Plataforma PWA para compartir fotos en tiempo real durante eventos.**

Foto Eventos permite a los invitados de un evento subir fotos desde su celular, que se proyectan en vivo en una pantalla. Todas las fotos son moderadas por inteligencia artificial antes de ser mostradas.

![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

---

## ✨ Características

- 📱 **PWA Mobile-First** - Los invitados suben fotos desde el navegador, sin instalar nada
- 🤖 **Moderación por IA** - Filtrado automático de contenido inapropiado con GPT-4o Vision
- 📺 **Pantalla en Tiempo Real** - Proyección de fotos con transiciones suaves vía Supabase Realtime
- 🔗 **QR + Código Corto** - Acceso fácil para invitados mediante QR imprimible
- 🎨 **Múltiples Skins** - Temas visuales para bodas, cumpleaños, corporativos, etc.
- 💳 **Pagos Duales** - Stripe + MercadoPago Argentina, habilitables por variable de entorno
- 🔐 **Auth Flexible** - Login con email/password o Google, con opción de acceso anónimo
- 📊 **Dashboard Completo** - Estadísticas, gestión de eventos, configuración
- 🤖 **Chatbot en Landing** - Asistente de preguntas frecuentes
- 🌗 **Modo Oscuro/Claro** - Configurable por evento
- 🐳 **Docker Ready** - Preparado para despliegue en servidor propio

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **React 19** | Frontend SPA |
| **Vite** | Build tool y dev server |
| **TailwindCSS 3** | Estilos con diseño premium |
| **Framer Motion** | Animaciones y parallax |
| **Supabase** | Auth, DB (PostgreSQL), Storage, Realtime |
| **Node.js + Express** | Backend API |
| **OpenAI GPT-4o-mini** | Moderación de contenido de imágenes |
| **Stripe** | Procesamiento de pagos internacional |
| **MercadoPago** | Pagos Argentina (tarjeta, transferencia, Mercado Crédito) |
| **vite-plugin-pwa** | Progressive Web App |

---

## 📁 Estructura del Proyecto

```
fotoevento/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   │   └── layout/     # Navbar, Footer
│   │   ├── context/        # AuthContext (Supabase Auth)
│   │   ├── pages/          # Páginas de la app
│   │   │   ├── Landing.jsx      # Landing con parallax, FAQ, chatbot
│   │   │   ├── Login.jsx        # Login con email/Google
│   │   │   ├── Register.jsx     # Registro
│   │   │   ├── Dashboard.jsx    # Panel de control
│   │   │   ├── CreateEvent.jsx  # Crear evento
│   │   │   ├── EventDetail.jsx  # Detalle + QR + fotos
│   │   │   ├── PhotoUpload.jsx  # Upload de fotos (invitados)
│   │   │   ├── EventScreen.jsx  # Pantalla de proyección
│   │   │   └── Pricing.jsx      # Planes y precios
│   │   ├── services/       # API client, Supabase client
│   │   └── index.css       # Design system TailwindCSS
│   └── public/             # Assets estáticos
├── server/                 # Backend Node.js + Express
│   └── src/
│       ├── routes/         # Event, photo, payment, public routes
│       ├── services/       # Supabase admin, AI moderation
│       └── middleware/     # Auth middleware
├── docker/                 # Docker configs
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   ├── docker-compose.yml
│   └── nginx.conf
├── supabase/               # SQL schema
│   └── schema.sql
├── .env.template           # Variables de entorno documentadas
├── netlify.toml            # Config Netlify
├── vercel.json             # Config Vercel
└── package.json            # Root workspace
```

---

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js >= 18
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) Cuenta en [Stripe](https://stripe.com)
- (Opcional) Cuenta en [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
- (Opcional) API Key de [OpenAI](https://platform.openai.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/gabrieltonelli/fotoevento.git
cd fotoevento
```

### 2. Configurar variables de entorno

```bash
cp .env.template .env
# Editar .env con tus credenciales
```

### 3. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/schema.sql`
3. Ir a **Storage** y asegurarte de que existe el bucket `event-photos` (público). El schema intenta crearlo pero a veces requiere acción manual en el Dashboard.
4. Copiar URL y keys a `.env`

### 4. Personalización y Auth

#### 📧 Emails Personalizados
Para que los correos de confirmación tengan tu marca:
1. Ir a **Authentication** -> **Email Templates** en Supabase.
2. Modificar el template de "Confirm Signup" con tu HTML/Texto.
3. **Importante**: Para cambiar el remitente (que no diga `noreply@mail.app.supabase.io`), debés configurar un servicio de SMTP propio (SendGrid, Resend, etc.) en **Authentication** -> **SMTP Settings**.

#### 🔑 Google Auth
Si recibís el error `Unsupported provider: provider is not enabled`:
1. Ir a **Authentication** -> **Providers** -> **Google**.
2. Habilitar el switch.
3. Configurar el `Client ID` y `Client Secret` obtenidos de Google Cloud Console.
4. Agregar la `Callback URL` que te da Supabase en tu consola de Google.

### 4. Instalar dependencias

```bash
npm install
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Esto inicia:
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`

---

## 📖 Funcionalidades por Página

### Landing Page (`/`)
- Hero con animaciones de parallax y orbs flotantes
- Sección de características con íconos animados
- "Cómo funciona" en 4 pasos
- Tipos de eventos soportados
- FAQ con acordeón
- CTA con glassmorphism
- Chatbot flotante con respuestas automáticas

### Login/Register (`/login`, `/register`)
- Autenticación con email/password
- Google OAuth
- Diseño glassmorphism premium

### Dashboard (`/dashboard`)
- Estadísticas: eventos, fotos, activos
- Lista de eventos con tipo, código, estado
- Acceso a crear nuevo evento

### Crear Evento (`/events/new`)
- Formulario con: nombre, fecha, ubicación
- Selección de tipo de evento (6 tipos)
- Selección de skin de pantalla (6 skins)
- Configuración: auth requerida, QR en pantalla, modo oscuro

### Detalle de Evento (`/events/:id`)
- QR code generado dinámicamente
- Link y código corto copiables
- Estadísticas con barras de progreso
- Grid de fotos del evento
- Acceso directo a pantalla de proyección

### Upload de Fotos (`/e/:shortCode`)
- Mobile-first para invitados
- Drag & drop o selección de cámara
- Preview de fotos antes de enviar
- Estados visuales: pendiente, subiendo, aprobada, rechazada
- Nombre de invitado opcional

### Pantalla del Evento (`/screen/:shortCode`)
- Fullscreen para proyectores
- Transiciones suaves entre fotos (Framer Motion)
- Suscripción en tiempo real a nuevas fotos (Supabase Realtime)
- QR overlay configurable
- Modo oscuro/claro

### Precios (`/pricing`)
- 3 planes: Gratuito, Pro ($4.990 ARS), Premium ($9.990 ARS)
- Selector de procesador de pago: **Stripe** o **Mercado Pago**
- Habilitado dinámicamente según `PAYMENT_PROCESSORS` en `.env`
- Checkout real con redirect a la pasarela seleccionada
- Activación automática del plan al volver del pago exitoso
- **Sistema de Pruebas Gratuitas**: Configurable por cuenta (`VITE_FREE_TRIAL_LIMIT`), con tracking individual por cada evento. Cada evento gratuito tiene una duración limitada configurable (`VITE_FREE_TRIAL_MINUTES`).
- **Bloqueo Automático**: Bloqueo visual y funcional (subidas/descargas) tras el vencimiento de la prueba de cada evento.
- **Facturación Flexible**: Soporte para ciclos mensuales y anuales con descuentos configurables.

---

## 💳 Sistema de Pagos

### Procesadores habilitados por variable de entorno

```bash
# Habilitar solo Stripe
PAYMENT_PROCESSORS=stripe

# Habilitar solo MercadoPago
PAYMENT_PROCESSORS=mercadopago

# Habilitar ambos (el usuario elige en la UI)
PAYMENT_PROCESSORS=stripe,mercadopago
PAYMENT_DEFAULT_PROCESSOR=mercadopago
```

### Flujo de pago

1. El usuario selecciona un plan y procesador en `/pricing`
2. El backend crea una sesión de checkout (Stripe Checkout / MP Preference)
3. El usuario es redirigido a la pasarela de pago
4. Al completar el pago, la pasarela redirige a `/dashboard?payment=success&plan=pro`
5. El Dashboard detecta el parámetro y llama a `/api/payments/activate-from-redirect`
6. El plan se activa automáticamente y se muestra un banner de confirmación
7. En paralelo, el webhook de la pasarela confirma el pago (redundancia)

### Webhooks

| Procesador | Endpoint |
|---|---|
| Stripe | `POST /api/payments/webhook/stripe` |
| MercadoPago | `POST /api/payments/webhook/mercadopago` |

## 🐳 Despliegue

### Netlify (Frontend)
```bash
# El frontend se despliega automáticamente con netlify.toml
```

### Vercel (Frontend)
```bash
# Configurado en vercel.json
```

### Docker (Self-hosted)
```bash
cd docker
docker-compose up -d
```

---

## 🔒 Seguridad

- **RLS (Row Level Security)** en Supabase para protección a nivel de filas
- **Moderación IA** para filtrar contenido inapropiado
- **Auth middleware** en todas las rutas protegidas
- **CORS** configurado correctamente
- **Variables de entorno** para todas las credenciales

---

## 📄 Licencia

MIT © [Gabriel Tonelli](https://github.com/gabrieltonelli)
