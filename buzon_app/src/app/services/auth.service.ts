import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:3000/api'; // Cambiar según tu backend
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    // Si hay token en localStorage, reconstruimos user
    const token = this.obtenerToken();
    if (token) {
      const payload = this.decodePayload(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        const user: User = {
          id: payload.sub,
          nombre: payload.nombre,
          rol: payload.rol,
          correo: payload.correo || ''
        };
        this.currentUserSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        this.logout();
      }
    }
  }

  // Observable para suscribirse
  get currentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  // LOGIN
  login(correo: string, pass: string): Observable<User> {
    return this.http.post<{ user: any, token: string }>(`${this.baseUrl}/login`, { correo, pass })
      .pipe(
        map(res => {
          const user: User = { ...res.user, rol: res.user.rol };
          localStorage.setItem('user', JSON.stringify(user));
          this.guardarToken(res.token);
          this.currentUserSubject.next(user);
          return user;
        })
      );
  }

  // REGISTRO
  register(correo: string, pass: string, nombre: string, rol: string): Observable<boolean> {
    return this.http.post(`${this.baseUrl}/registro`, { correo, pass, nombre, rol })
      .pipe(map(res => true));
  }

  // LOGOUT
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // --- TOKEN ---
  private guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodePayload(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    return payload && payload.exp * 1000 > Date.now();
  }

  // Headers con Authorization
  getAuthHeaders(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // CAMBIAR CONTRASEÑA
cambiarPassword(id_user: number, nuevaPass: string): Observable<any> {
  return this.http.put(`${this.baseUrl}/usuario/password`, { id_user, nuevaPass });
}
}
