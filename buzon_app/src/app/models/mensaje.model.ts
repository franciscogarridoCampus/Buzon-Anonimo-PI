export interface Mensaje {
  id_mensaje: number;
  texto: string;
  fecha: string; // YYYY-MM-DD
  hora_minuto: string; // HH:MM:SS
  id_autor: number;
  id_clase: number;
}
