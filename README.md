# BUZÓN ANÓNIMO

Aplicación web para compartir mensajes anónimos entre alumnos, profesores y moderadores dentro de clases.

Este repositorio contiene dos subproyectos:

- `buzon_app` — Frontend Angular (SPA)
- `buzon_api` — Backend Node.js + Express + MySQL (API REST)

## Contenido de este README

- Visión general y arquitectura
- Requisitos previos
- Configuración de la base de datos
- Cómo ejecutar (backend y frontend)
- Endpoints principales (para desarrollo)
- Notas de arquitectura (MVC reducido)
- Troubleshooting y consejos

## 1) Visión general y arquitectura

La aplicación usa una arquitectura cliente‑servidor. El frontend consume la API REST expuesta por el backend.

Backend: se sigue una estructura MVC reducida (separación en `routes`, `controllers`, `services` y `models`). Esto facilita mantenimiento y pruebas.

Frontend: Angular con servicios HTTP en `src/app/services` que llaman exactamente a los endpoints listados más abajo.

## 2) Requisitos previos

- Node.js 18+ (se usó Node 22 en desarrollo)
- npm
- MySQL (local o remoto). Se puede importar `buzon_anonimo.sql` para crear esquema y datos de ejemplo.
- (Opcional) Angular CLI para desarrollo del frontend

## 3) Configuración de la base de datos

1. Crear la base de datos `buzon_anonimo` e importar el fichero SQL:

  - Usando cliente MySQL:

```powershell
mysql -u root -p
CREATE DATABASE buzon_anonimo;
USE buzon_anonimo;
source buzon_anonimo.sql;
```

  - O bien con phpMyAdmin: importar `buzon_anonimo.sql` en la base `buzon_anonimo`.

2. Ajusta credenciales en `buzon_api/server.js` si tu instalación MySQL no usa `root` sin contraseña.

3. Variables sensibles (correo, contraseñas de servicios) no deben guardarse en el repo. Actualmente el backend usa valores de ejemplo para notificaciones; para producción configura variables de entorno o un archivo `.env` y modifica la carga en `server.js`.

## 4) Cómo ejecutar

Recomendación: abrir dos terminales (uno para backend y otro para frontend).

Backend (buzon_api):

```powershell
cd c:\ruta\a\Buzon-Anonimo-PI\buzon_api
npm install
node server.js
# o, si prefieres npm start, añade en package.json: "start": "node server.js" y usa
npm start
```

El servidor por defecto escucha en `http://localhost:3000`.

Frontend (buzon_app):

```powershell
cd c:\ruta\a\Buzon-Anonimo-PI\buzon_app
npm install
npx ng serve
# accesible en http://localhost:4200
```

Si usas Docker o despliegue remoto, adapta los pasos anteriores a tu entorno.

## 5) Endpoints principales (usados por el frontend)

- POST /api/login — body: { correo, pass }
- POST /api/registro — body: { correo, pass, rol, nombre }
- PUT /api/usuario/password — body: { id_user, nuevaPass }
- GET /api/clases/:id/:rol — obtener clases del usuario
- POST /api/crear-clase — body: { nombre, id_creador }
- POST /api/unirse-clase — body: { id_user, codigo }
- GET /api/mensajes/:idClase — obtener mensajes de una clase
- POST /api/mensaje — body: { id_clase, id_autor, texto }
- DELETE /api/mensaje/:id_mensaje — eliminar mensaje
- GET /api/clase/:idClase — info básica de clase
- DELETE /api/clase/:id_clase — borrar clase y mensajes
- PUT /api/clase/codigo/:id_clase — rotar código temporal
- GET /api/clase-usuarios/:id_clase — listar usuarios de la clase
- DELETE /api/clase/:id_clase/usuario/:id_user — expulsar usuario

> Nota: el frontend actual (`buzon_app/src/app/services`) llama a las rutas anteriores; si las cambias debes actualizar también los servicios del frontend.

## 6) Notas de arquitectura (MVC reducido)

Estructura que encontrarás en `buzon_api`:

- `server.js` — punto de entrada y montaje de routers
- `routes/` — definición de rutas (p. ej. `routes/authRoutes.js`)
- `controllers/` — manejo de peticiones y respuestas
- `services/` — reglas de negocio y orquestación
- `models/` — acceso directo a la base de datos (consultas)

Este refactor se hizo de forma incremental para mantener compatibilidad con el frontend. Si añades recursos nuevos, sigue esta separación.

## 7) Troubleshooting rápido

- Error `MODULE_NOT_FOUND` al arrancar: revisa que no falten archivos en `routes/`, `controllers/` o `services` y que no haya cambios de nombres.
- Error de conexión a MySQL: verifica credenciales, host y que el servicio `mysqld` esté corriendo.
- Errores FK al insertar: los IDs referenciados deben existir (crear usuarios/clases antes de insertar mensajes). No agregues datos de prueba en producción.

Comandos útiles (PowerShell):

```powershell
# comprobar puerto 3000
netstat -ano | Select-String ":3000"
# listar procesos node
Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName
```

## 8) Contribuir

Si vas a modificar la API o la estructura, sigue estos pasos mínimos:

1. Crea una rama corta: `git checkout -b feat/mi-cambio`
2. Añade tests o comprueba manualmente los endpoints involucrados.
3. Haz commits claros (ej. `feat(api): mover mensajes a service/controller`).
4. Abre PR describiendo los cambios y pruebas realizadas.

## 9) Licencia y otros

Por defecto no se incluye ninguna en este repo.
