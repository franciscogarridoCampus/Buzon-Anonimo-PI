import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje } from '../models/mensaje.model';

@Injectable({
  providedIn: 'root'
})
export class MensajeService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  fetchMensajes(idClase: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/${idClase}`);
  }

  enviarMensaje(idClase: number, idAutor: number, texto: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/mensaje`, { id_clase: idClase, id_autor: idAutor, texto });
  }
}
