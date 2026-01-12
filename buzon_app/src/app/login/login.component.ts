import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {

  // LOGIN
  correo = '';
  pass = '';
  errorMessage = '';
  loading = false;

  // REGISTRO
  mostrarRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  constructor(private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  // ======================
  // LOGIN
  // ======================
  login() {
    this.errorMessage = '';

    if (!this.correo.trim().endsWith('@campuscamara.es')) {
      this.errorMessage = 'Solo se permiten correos de @campuscamara.es';
      return;
    }

    this.loading = true;

    this.authService.login(this.correo, this.pass).subscribe({
      next: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Credenciales incorrectas o error de conexión';
        this.loading = false;
      }
    });
  }

  // ======================
  // REGISTRO
  // ======================
  toggleRegistro() {
    this.mostrarRegistro = !this.mostrarRegistro;
    this.limpiarRegistro();
  }

  limpiarRegistro() {
    this.nuevoCorreo = '';
    this.nuevaContrasena = '';
    this.nuevoRol = 'alumno';
    this.registroError = '';
    this.registroLoading = false;
  }

  registrar() {
    this.registroError = '';

    if (!this.nuevoCorreo.trim() || !this.nuevoCorreo.endsWith('@campuscamara.es')) {
      this.registroError = 'Correo inválido (@campuscamara.es)';
      return;
    }

    if (!this.nuevaContrasena.trim()) {
      this.registroError = 'Contraseña vacía';
      return;
    }

    this.registroLoading = true;

    this.authService
      .register(this.nuevoCorreo, this.nuevaContrasena, this.nuevoCorreo, this.nuevoRol)
      .subscribe({
        next: () => {
          this.mostrarRegistro = false;
          this.correo = this.nuevoCorreo;
          this.pass = '';
          this.limpiarRegistro();
          this.registroLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.registroError = 'Error al registrar usuario';
          this.registroLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
