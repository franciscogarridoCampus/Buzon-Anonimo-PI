export interface User {
  id: number;
  email?: string;
  rol: 'alumno' | 'profesor' | 'moderador';
  nombre: string;
}