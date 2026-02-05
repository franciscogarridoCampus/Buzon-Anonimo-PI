import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
// Usamos el punto para que el editor no se queje
import { AuthGuard } from './auth-guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        // Creamos un "Router de mentira" simple para que el test no explote
        { provide: Router, useValue: { parseUrl: (url: string) => url } }
      ]
    });
    
    // Sacamos el guard del sistema de Angular
    guard = TestBed.inject(AuthGuard);
  });

  // Test 1: Verificar que el Guard existe
  it('debe crearse correctamente', () => {
    expect(guard).toBeTruthy();
  });

  // Test 2: Probar tu lógica de login (sin spies complicados)
  it('debe devolver true si hay token y usuario', () => {
    // 1. Preparamos el terreno manualmente
    localStorage.setItem('token', 'mi-token');
    localStorage.setItem('user', 'mi-usuario');

    // 2. Ejecutamos TU función del guard
    const resultado = guard.canActivate();

    // 3. Verificamos que sea true
   expect(resultado).toBe(true);

    // Limpiamos al terminar para no ensuciar otros tests
    localStorage.clear();
  });
});