📨 Buzón Anónimo

Aplicación web que permite la interacción anónima entre alumnos, profesores y moderadores en clases virtuales.

El proyecto está dividido en dos partes principales:

Frontend: buzon_app (Angular)

Backend: buzon_api (Node.js + Express + MySQL)

🏗️ Arquitectura del Proyecto

La aplicación sigue una arquitectura cliente-servidor, separada en dos módulos independientes.

🔹 1. Frontend – buzon_app (Angular)

Es una Single Page Application (SPA) donde el usuario interactúa con la plataforma.

Responsabilidades:

Interfaz gráfica para alumnos, profesores y moderadores.

Gestión de formularios (login, mensajes, clases).

Comunicación con el backend mediante servicios Angular (HTTPClient).

Enrutamiento interno con control de acceso según rol.

Estructura lógica típica:

components/ → Pantallas y elementos visuales

services/ → Comunicación con la API

models/ → Interfaces TS para tipado

guards/ → Protección de rutas por rol

🔹 2. Backend – buzon_api (Node.js + Express)

Exposición de una API REST que gestiona la lógica del sistema.

Responsabilidades:

Validación de usuarios y roles.

CRUD de clases.

Gestión de códigos temporales.

Registro y consulta de mensajes.

Conexión con la base de datos MySQL.

Estructura típica:

server.js → Punto de entrada

routes/ → Endpoints del sistema

controllers/ → Lógica de negocio

models/ → Consultas a MySQL

middlewares/ → Autorización y permisos

🔹 3. Comunicación Frontend ↔ Backend

Toda la comunicación se hace mediante:

HTTP REST

JSON como formato de intercambio

Validación de roles en cada petición

Ejemplos de endpoints:

POST /login

POST /clases

GET /clases/:id/mensajes

POST /mensaje

⚙️ Requisitos Previos

XAMPP (MySQL + phpMyAdmin)

Node.js 18+

Angular CLI (opcional pero recomendado)

🗄️ Configuración de la Base de Datos

Iniciar Apache y MySQL en XAMPP

Entrar en: http://localhost/phpmyadmin

Crear la base de datos buzon_anonimo

Importar buzon_anonimo.sql

Insertar usuarios de ejemplo:

INSERT INTO usuario (id_user, correo_cifrado, contrasena_cifrado) 
VALUES 
(1, 'profesor@example.com', '1234'),
(2, 'moderador@example.com', '1234'),
(3, 'alumno@example.com', '1234');

INSERT INTO profesor (id_user, nombre) VALUES (1, 'Profesor Ejemplo');
INSERT INTO moderador (id_user, nombre) VALUES (2, 'Moderador Ejemplo');
INSERT INTO alumno (id_user) VALUES (3);

▶️ Ejecución del Proyecto
Backend – buzon_api
cd buzon_api
npx npm install
node server.js


Backend en:
http://localhost:3000

Frontend – buzon_app
cd buzon_app
npx npm install
npx ng serve


Frontend en:
http://localhost:4200

🔑 Acceso de Prueba
Rol	Usuario	Contraseña
Profesor	profesor@example.com
	1234
Moderador	moderador@example.com
	1234
Alumno	alumno@example.com
	1234
🧩 Roles del Sistema
🛡️ Moderador

Crear y eliminar clases

Acceso total a todas las clases

Generar códigos temporales (1 minuto)

👨‍🏫 Profesor

Puede leer todos los mensajes de la clase

Puede generar códigos temporales

🎓 Alumno

Solo puede escribir mensajes anónimos

Solo ve sus propios mensajes
