# GestorPD

Sistema de gestion de pedidos, clientes y cotizaciones con frontend en React + Vite y backend en Express + PostgreSQL.

## Modulos principales
- Login seguro con JWT.
- Gestion de clientes.
- Gestion de pedidos.
- Cotizaciones con descarga en PDF.
- Dashboard con resumen operativo.
- Interfaz adaptable para PC y movil.

## Requisitos
- Node.js 20 o superior.
- PostgreSQL.
- Variables de entorno configuradas.

## Variables de entorno
Copia `.env.example` a `.env` y completa:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/database
JWT_SECRET=clave-larga-y-segura
PORT=3001
RENDER=true
CORS_ORIGIN=https://tu-dominio.onrender.com
ADMIN_NAME=Administrador Principal
ADMIN_EMAIL=admin@tuempresa.com
ADMIN_PASSWORD=cambia-esta-clave-admin
OPERATOR_NAME=Operador Principal
OPERATOR_EMAIL=operador@tuempresa.com
OPERATOR_PASSWORD=cambia-esta-clave-operador
```

## Desarrollo local
```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3001`

## Produccion
```bash
npm install
npm run build
npm start
```

El backend:
- inicializa las tablas necesarias si no existen;
- crea los usuarios iniciales definidos por variables de entorno;
- sirve el frontend compilado desde `dist`.

## Despliegue en Render
- Puedes usar el archivo `render.yaml`.
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`
- Crea o conecta una base PostgreSQL en Render y usa su `connectionString` en `DATABASE_URL`.
- Configura `CORS_ORIGIN` con la URL publica final de tu servicio (o dejala vacia si usas el mismo dominio).
- Define `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, si aplica, las credenciales del operador.
- Verifica en logs que no falten `JWT_SECRET`, `DATABASE_URL` ni credenciales admin.

Si el navegador muestra `Refused to apply style ... MIME type ('application/json')` o fallos en `/assets/*`, el problema comun es:
- Variables de entorno faltantes que impiden que el servicio arranque bien.
- `dist` no se construyo correctamente.
- Revisa primero el endpoint `/api/health` antes de revisar el frontend.

## Validacion antes de entregar
```bash
npm run check
npm test
npm run build
```

## Seguridad aplicada
- JWT obligatorio en produccion.
- `DATABASE_URL` obligatoria en produccion.
- CORS configurable por variable de entorno.
- Encabezados de seguridad basicos.
- Limite de intentos para el login.
- Sin modo demo automatico en el frontend.
- Sin credenciales visibles en la interfaz.
