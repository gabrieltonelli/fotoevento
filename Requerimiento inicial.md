Quiero crear una aplicacion web PWA que permita a los usuarios subir fotos de un evento y que estas se muestren en una pantalla a medida que los usuarios las suben. 
Debe ser una plataforma que sirva para vender la idea desde una landing page muy atractiva. Debemos usar alguna libreria que permita armar un prontend profesional con excelente diseño de aquellas que al escrallear se vean efectos de paralax y transiciones suaves. 

Vincular este proyecto al repositorio de github: https://github.com/gabrieltonelli/fotoevento

Debemos incorporar el registro y login de usuarios usando algun servicio como firebase o supabase signup. 

Debemos incorporar un sistema de pago para que los usuarios puedan comprar las diferentes variantes del servicio.

debemos soportar diferentes tipos de eventos, como bodas, cumpleaños, eventos corporativos, etc.  y diferentes opciones de sking para la pantalla que se proyectara en el evento. 

Las fotos deben llegar desde un dispositivo movil que accede a un formulario de carga de fotos. 

Por detras un agente de IA debe validar que el contenido de las fotos sea apto para todo publico y que no contenga material ofensivo o inapropiado. En caso de no cumplir con las restricciones debe rechazar la foto y notificar al usuario. 

El sistema debe permitir la visualización de las fotos en una pantalla que se proyectara en el evento. 

Las fotos validas deben almacenarse en un directorio del evento para que posteriormente el usuario que contrato el servicio pueda descargarlas.

El stack debe ser react, tailwind, supabase, firebase, nodejs, vite.

Cuando un usuario hace login debe ver un dashboard con los eventos que tiene contratados y las opciones para gestionar cada evento, podrian incorporarse estadisticas de uso, etc.

Por cada evento debe generarse la url unica de la pantalla que se proyectara en el evento. cada pantalla debe tener asociado un codigo qr imprimible y un codigo corto que permita a los usuarios acceder al formulario de carga de fotos.

Desde el dashboard el usuario propietario debe poder activar o desactivar algunos seteos como por ejemplo visualizar en una esquina el QR de vinculacion en la pantalla que se proyectara en el evento, seleccion de modo oscuro o claro, etc.

La primera vez que se accede al formulario para enviar fotos el usuario debe registrarse y loguearse, ello permite asociar fotos a usuarios pero esto debe ser opcional como otro factor de configuracion del evento, es decir, permitir el envio de fotos sin registro y logueo.

En la landingpage, agregar un chatbot y una seccion de FAQ.

En la landing agregar un hero con un video de fondo que muestre el funcionamiento de la aplicacion y animaciones de letras impactantes por encima del video.

Landing y dashboard responsive.

A pesar de que la arquitectura de carpetas debe dividirse en cliente y servidor, el proyecto debe ser un monorepo y debe quedar preparado para netlify y vercel pero tambien para dockerizar y subir a un servidor propio.

