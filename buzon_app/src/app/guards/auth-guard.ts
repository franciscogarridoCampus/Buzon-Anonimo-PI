import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      console.log('AuthGuard: usuario autenticado ✔');
      return true; // Usuario tiene token y user, puede entrar
    } else {
      console.log('AuthGuard: usuario NO autenticado ❌, redirigiendo a login');
      return this.router.parseUrl('/login'); // No tiene token o user, redirige
    }
  }
}
