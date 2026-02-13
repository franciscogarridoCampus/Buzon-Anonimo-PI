import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

// Guard para proteger rutas que requieren autenticación
@Injectable({
  providedIn: 'root' // Disponible en toda la aplicación
})
export class AuthGuard implements CanActivate {

  // Inyectamos el router para poder redirigir
  constructor(private router: Router) {}

  // Método que se ejecuta antes de entrar a una ruta
  canActivate(): boolean | UrlTree {

    // Obtenemos token y usuario guardados en el navegador
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Si existen token y usuario, se permite el acceso
    if (token && user) {
      console.log('AuthGuard: usuario autenticado');
      return true; // Puede entrar a la ruta
    } 
    // Si falta alguno, se redirige al login
    else {
      console.log('AuthGuard: usuario NO autenticado, redirigiendo a login');
      return this.router.parseUrl('/login'); // Redirección al login
    }
  }
}
