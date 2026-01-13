import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Clase } from '../models/clase.model';

@Injectable({
  providedIn: 'root'
})
export class ClaseService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // 3. Obtiene las clases del usuario (Moderador, Profesor o Alumno)
  fetchClases(userId: number, rol: string): Observable<Clase[]> {
    // Asume que tienes una ruta en tu backend que maneja esto: /api/clases/:id/:rol
    return this.http.get<Clase[]>(`${this.baseUrl}/clases`, {
      params: { userId: userId.toString(), rol }
    });
  }

  // Nueva: Obtiene la información de una clase específica (usado en ClassRoom)
  // Asume que tu backend tiene una ruta para esto, por ejemplo: /api/clase/:id
  fetchClaseById(idClase: number): Observable<Clase> {
    return this.http.get<Clase>(`${this.baseUrl}/clase/${idClase}`);
  }

  // 4. Crear Clase (Solo Moderador)
  crearClase(nombre: string, codigo: string, id_creador: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/clases`, { nombre, codigo, id_creador });
  }

  // 5. Unirse a Clase (Alumno/Profesor)
  unirseClase(id_user: number, codigo: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/clases`, { id_user, codigo });
  }

  // 8. ELIMINAR CLASE (Solo Moderador creador)
  // Asume que tu backend tiene una ruta DELETE: /api/clase/:id_clase
  eliminarClase(idClase: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clases/${idClase}`);
  }

  // 9. GENERAR/ACTUALIZAR CÓDIGO TEMPORAL (Solo Moderador)
  // Asume que tu backend tiene una ruta PUT: /api/clase/codigo/:id_clase
  generarCodigoTemporal(idClase: number): Observable<{ codigo_temp: string }> {
    // El backend debe generar un nuevo código, actualizarlo en DB y devolverlo.
    return this.http.put<{ codigo_temp: string }>(`${this.baseUrl}/clases/codigo/${idClase}`, {});
  }


  validarCodigoAcceso(idClase: number, codigo: string): Observable<{ valido: boolean }> {
    return this.http.post<{ valido: boolean }>(`${this.baseUrl}/validar-codigo`, {
      id_clase: idClase,
      codigo_temp: codigo
    });
  }
}