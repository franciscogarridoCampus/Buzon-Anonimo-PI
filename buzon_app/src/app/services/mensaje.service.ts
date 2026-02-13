import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje } from '../models/mensaje.model';

@Injectable({
  providedIn: 'root' // Servicio disponible en toda la app
})
export class MensajeService {
  private baseUrl = 'http://localhost:3000/api'; // URL base del backend

  constructor(private http: HttpClient) {}

  // Traer todos los mensajes de una clase
  fetchMensajes(idClase: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/${idClase}`);
  }

  // Enviar un mensaje a la clase
  enviarMensaje(idClase: number, idAutor: number, texto: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/mensaje`, { id_clase: idClase, id_autor: idAutor, texto });
  }

  // Eliminar un mensaje por su ID
  eliminarMensaje(idMensaje: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/mensaje/${idMensaje}`);
  }
}
