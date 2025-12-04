# Buzón Anónimo

Este proyecto consta de dos partes:  

- **Backend:** `buzon_api` (Node.js)  
- **Frontend:** `buzon_app` (Angular)  

Permite a los usuarios interactuar en clases virtuales mediante mensajes anónimos.

---

## Requisitos Previos

- [XAMPP](https://www.apachefriends.org/index.html) (para Apache y MySQL/PHPMyAdmin)  
- Node.js (versión recomendada 18+)  
- Angular CLI (opcional para desarrollo frontend)  

---

## Configuración de la Base de Datos

1. Abrir XAMPP y activar **Apache** y **MySQL**.
2. Acceder a **phpMyAdmin** desde `http://localhost/phpmyadmin`.
3. Crear una nueva base de datos llamada:
4. Importar la estructura de la base de datos con el archivo `buzon_anonimo.sql`. Para ello:
   - Seleccionar la base de datos `buzon_anonimo`.
   - Ir a la pestaña **SQL**.
   - Copiar y ejecutar el contenido de `buzon_anonimo.sql`.

5. Insertar usuarios iniciales y roles ejecutando el siguiente SQL:

```sql
-- Insertar usuarios
INSERT INTO usuario (id_user, correo_cifrado, contrasena_cifrado) 
VALUES 
(1, 'profesor@example.com', '1234'), 
(2, 'moderador@example.com', '1234'), 
(3, 'alumno@example.com', '1234');

-- Insertar roles
INSERT INTO profesor (id_user, nombre) VALUES (1, 'Profesor Ejemplo');
INSERT INTO moderador (id_user, nombre) VALUES (2, 'Moderador Ejemplo');
INSERT INTO alumno (id_user) VALUES (3);

Instalación y Ejecución
Backend (buzon_api)

Abrir una terminal y acceder a la carpeta del backend:

cd buzon_api


Instalar dependencias:

npx npm install


Ejecutar el servidor backend:

node server.js


Esto levantará el backend en el puerto configurado (por defecto suele ser http://localhost:3000).

Frontend (buzon_app)

Abrir otra terminal y acceder a la carpeta del frontend:

cd buzon_app


Instalar dependencias:

npx npm install


Ejecutar Angular en modo desarrollo:

npx ng serve


Angular mostrará la URL donde se está ejecutando el frontend, normalmente:

http://localhost:4200/


Abrir esta URL en el navegador.

Acceso a la Aplicación

Al ingresar, usar los usuarios que insertaste en la base de datos con phpMyAdmin:

Profesor: profesor@example.com
 / 1234

Moderador: moderador@example.com
 / 1234

Alumno: alumno@example.com
 / 1234

Explicación de Roles

Moderador:

Puede crear y eliminar clases.

Acceso a todas las clases.

Puede generar el código temporal para que alumnos y profesores se unan a la clase.

El código temporal dura 1 minuto.

Profesor:

Al estar en una clase, puede leer todos los mensajes de los alumnos.

Puede generar el código temporal para permitir que otros se unan a la clase.

Alumno:

Solo puede escribir mensajes anónimos en la clase.

Solo puede ver sus propios mensajes.