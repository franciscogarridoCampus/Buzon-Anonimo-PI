import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:3000/api'; // Cambiar según tu backend
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  // Observable para suscribirse desde componentes
  get currentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  // LOGIN
  login(correo: string, pass: string): Observable<User> {
    return this.http.post<{ user: any }>(`${this.baseUrl}/login`, { correo, pass })
      .pipe(
        map(res => {
          const user: User = {
            ...res.user,
            rol: res.user.rol // asegurarnos que tenga el rol
          };
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
    this.currentUserSubject.next(null);
  }
}
