export interface User {
  id: number;
  correo: string;
  rol: 'alumno' | 'profesor' | 'moderador';
  nombre: string;
}