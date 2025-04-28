# Backend PuraVida E-commerce

## 🟢 Estado Actual (2024)

- Todas las rutas de autenticación están centralizadas en `src/routes/auth.js`.
- El sistema de autenticación utiliza JWT almacenado en cookies seguras (`httpOnly`, `secure`, `sameSite`).
- El frontend debe verificar la autenticación consultando `/api/auth/verify` (usuario) o `/api/auth/verify/admin` (admin), sin necesidad de manejar el token manualmente.
- Se eliminaron rutas y middlewares duplicados para mayor claridad y seguridad.
- El flujo de autenticación soporta login tradicional y Google OAuth, ambos con el mismo sistema de cookies.
- El middleware de autenticación (`auth.js`) valida el JWT desde la cookie y expone el usuario en `req.user`.
- El sistema es robusto, seguro y preparado para producción.

API REST completa y robusta para la aplicación de e-commerce PuraVida.

## Estado Actual del Proyecto

El backend se encuentra en un estado avanzado (8.5/10) con las siguientes características:

✅ Sistema robusto de gestión de órdenes con información de pago completa  
✅ Procesamiento de pagos con captura detallada de información del pagador  
✅ Gestión profesional de imágenes a través de integración con Cloudinary  
✅ Estructura de código organizada siguiendo buenas prácticas  
✅ Medidas de seguridad adecuadas: autenticación JWT y gestión de roles  
✅ Pruebas unitarias e integración pasando correctamente  
✅ Documentación API disponible vía Swagger  
✅ Seguimiento detallado del historial de órdenes  
✅ Panel administrativo con estadísticas de ventas y métricas  
✅ Sistema de monitoreo de salud para verificar el estado del servicio  

Áreas de mejora:
- Integración con pasarelas de pago como Stripe o PayPal
- Optimización de rendimiento mediante caché

## Flujo de la Aplicación Backend

1. **Autenticación**: 
   - Los usuarios se registran o inician sesión
   - El sistema valida credenciales y genera tokens JWT
   - Los tokens permiten acceso a recursos protegidos

2. **Gestión de Productos**:
   - Administradores pueden crear, editar y eliminar productos
   - Los productos incluyen imágenes, descripciones y precios
   - Las imágenes se gestionan a través de Cloudinary

3. **Proceso de Compra**:
   - Usuarios autenticados crean órdenes
   - El sistema registra los productos, cantidades y precios
   - Se calculan totales y se asigna un estado inicial a la orden

4. **Gestión de Pagos**:
   - Los usuarios suben comprobantes de pago
   - Se registran detalles completos del pagador (nombre, banco, ID, etc.)
   - La administración verifica y aprueba los pagos
   - Se actualiza el estado de la orden y se registra en el historial

5. **Panel Administrativo**:
   - Dashboard con estadísticas de ventas
   - Gestión de órdenes y actualización de estados
   - Visualización de métricas de rendimiento

6. **Monitoreo de Salud**:
   - Endpoints para verificar el estado del servicio
   - Métricas operacionales para monitorización
   - Verificación de disponibilidad y dependencias

## Características Técnicas

- **Arquitectura**: MVC con separación clara de responsabilidades
- **Base de datos**: PostgreSQL con Sequelize ORM
- **Autenticación**: JWT, cookies seguras, Google OAuth
- **Seguridad**: CSRF, Helmet, Rate Limiting, validación de inputs
- **Almacenamiento**: Cloudinary para imágenes
- **Logs**: Sistema avanzado de logging con rotación y niveles
- **Monitoreo**: Healthchecks, liveness probes, métricas de rendimiento
- **Documentación**: Swagger UI para explorar la API
- **Tests**: Suite completa de pruebas automatizadas

## Configuración del proyecto

### Requisitos previos

- Node.js (v14 o superior)
- PostgreSQL
- Cuenta en Cloudinary para almacenamiento de imágenes

### Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/usuario/puravida_backend.git
cd puravida_backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear un archivo `.env` basado en `.env.example` y configurar las variables de entorno:
```
# Variables de entorno para la aplicación

# Configuración de la base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/puravida

# Configuración del servidor
PORT=2300
NODE_ENV=development

# Configuración de JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1d

# URLs
FRONTEND_URL=http://localhost:3000

# Swagger
SWAGGER_PASSWORD=admin

# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Iniciar el servidor:
```bash
npm run dev
```

5. Acceder a la documentación Swagger:
```
http://localhost:2300/api-docs
```

## Endpoints Principales

### Autenticación

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión
- `GET /api/auth/verify` - Verificación de token

### Productos y Categorías

- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto específico
- `POST /api/products` - Crear producto (admin)
- `GET /api/categories` - Listar categorías

### Carrito y Órdenes

- `GET /api/cart` - Obtener carrito del usuario
- `POST /api/cart` - Añadir producto al carrito
- `POST /api/orders` - Crear orden desde carrito
- `GET /api/orders/:id` - Obtener detalles de una orden

### Pagos y Comprobantes

- `POST /api/uploads/payment-proof/:orderId` - Subir comprobante de pago con datos
- `POST /api/orders/:id/payment` - Procesar pago
- `POST /api/orders/:id/payment-proof` - Registrar datos de pago con comprobante ya subido

### Administración

- `GET /api/admin/dashboard` - Obtener estadísticas para dashboard
- `GET /api/admin/stats/sales` - Obtener estadísticas de ventas
- `PUT /api/admin/orders/:orderId/status` - Actualizar estado de orden
- `POST /api/admin/maintenance` - Activar/desactivar modo mantenimiento

## Estructura del proyecto

```
src/
├── app.js                    # Punto de entrada de la aplicación
├── configs/                  # Configuraciones de la aplicación
│   ├── database.js           # Configuración de la base de datos
│   ├── logger.js             # Configuración del logger
│   ├── passport.js           # Estrategias de autenticación
│   └── swagger.js            # Configuración de Swagger
├── controllers/              # Controladores
│   ├── admin_controller.js   # Administración y reportes
│   ├── auth_controller.js    # Autenticación
│   ├── order_controller.js   # Gestión de órdenes
│   ├── product_controller.js # Gestión de productos
│   └── upload_controller.js  # Gestión de subida de archivos
├── middlewares/              # Middlewares
│   ├── auth.js               # Autenticación y autorización
│   ├── logger.middleware.js  # Logging de solicitudes y errores
│   └── upload.js             # Procesamiento de archivos
├── models/                   # Modelos de datos
│   ├── model_products.js     # Modelo de productos
│   ├── model_order.js        # Modelo de órdenes
│   └── model_user.js         # Modelo de usuarios
├── routes/                   # Rutas de la API
├── tests/                    # Tests
└── utils/                    # Utilidades
    ├── cloudinaryConfig.js   # Configuración de Cloudinary
    └── taxCalculator.js      # Cálculo de impuestos
```

## Ejecución de tests

```bash
npm test
```

## Mantenimiento

### Logs y Monitoreo

El sistema implementa un registro detallado y visualmente claro para facilitar el monitoreo y la resolución de problemas.

#### Sistema de Logs

Los logs se almacenan en el directorio `/logs` con las siguientes características:

- **Rotación automática**: Los archivos se rotan diariamente y se comprimen automáticamente
- **Niveles de severidad**: ERROR, WARN, INFO, HTTP, DEBUG
- **Formato humanizado**: Incluye timestamp, nivel, mensaje y contexto estructurado
- **Retención configurable**: 
  - `debug-YYYY-MM-DD.log` - 14 días para logs detallados (desarrollo)
  - `error-YYYY-MM-DD.log` - 30 días para errores (producción)

**Ejemplo de formato de log**:
```
[2025-04-20 01:05:39] [INFO] GET /api/health 200 1405ms | Usuario: ID:35 (admin) | Ruta: GET /api/health | Estado: 200 | Tiempo: 1405ms | ReqID: req-1745125538384-xfohbqcj7
```

**Campos principales**:
- Timestamp: `[2025-04-20 01:05:39]`
- Nivel: `[INFO]`
- Mensaje principal: `GET /api/health 200 1405ms`
- Usuario: ID y rol
- Ruta: método HTTP y URL
- Estado: código de respuesta HTTP
- Tiempo: tiempo de respuesta en milisegundos
- ReqID: identificador único de solicitud para seguimiento

#### Endpoints de Monitoreo

El sistema proporciona varios endpoints para monitorear la salud y rendimiento:

1. **Estado General**: `GET /api/health`
   - Proporciona información completa sobre el estado del servicio y sus dependencias
   - Incluye estado de la base de datos, memoria, uptime y versión
   - Códigos de respuesta: 200 (OK/Degradado), 500 (Crítico)

2. **Verificación Rápida**: `GET /api/health/liveness`
   - Comprobación liviana para confirmar que el servicio está respondiendo
   - Ideal para sondeos frecuentes y balanceadores de carga
   - Respuesta rápida sin consultar dependencias

3. **Verificación de Disponibilidad**: `GET /api/health/readiness`
   - Verifica la disponibilidad del servicio y sus dependencias
   - Confirma que el sistema está listo para recibir tráfico
   - Consulta la conexión a base de datos con timeout
   - Códigos de respuesta: 200 (Listo), 503 (No Disponible)

4. **Métricas de Rendimiento**: `GET /api/health/metrics`
   - Proporciona métricas detalladas sobre el rendimiento del sistema
   - Incluye uso de memoria, CPU, carga del sistema
   - Formato compatible con sistemas de monitoreo como Prometheus

#### Visualización y Análisis

Para el análisis de logs, se recomienda:

- **Desarrollo**: Lectura directa desde la consola o archivos de log
- **Producción**: Implementación de ELK Stack (Elasticsearch, Logstash, Kibana) para análisis avanzado

El sistema de métricas `/api/health/metrics` está diseñado para ser consumido por herramientas de monitoreo como Grafana, permitiendo la creación de dashboards visuales para seguimiento del rendimiento.

## Licencia

MIT