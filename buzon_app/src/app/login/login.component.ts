import { Component } from '@angular/core';
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

  constructor(private authService: AuthService, private router: Router) { }

  // LOGIN
  login() {
    this.errorMessage = '';
    if (!this.correo.trim().endsWith('@campuscamara.es')) {
      this.errorMessage = 'Solo se permiten correos de @campuscamara.es';
      return;
    }

    this.loading = true;
    this.authService.login(this.correo, this.pass).subscribe({
      next: (user: User) => {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Credenciales incorrectas o error de conexión';
        this.loading = false;
      }
    });
  }

  // ABRIR / CERRAR VENTANA DE REGISTRO
  toggleRegistro() {
    this.mostrarRegistro = !this.mostrarRegistro;
    this.limpiarRegistro();
  }

  // VOLVER AL LOGIN (BOTÓN)
  volverAlLogin() {
    this.mostrarRegistro = false;
    this.limpiarRegistro();
    this.errorMessage = '';
    this.correo = '';
    this.pass = '';
  }

  // LIMPIAR CAMPOS DE REGISTRO
  limpiarRegistro() {
    this.nuevoCorreo = '';
    this.nuevaContrasena = '';
    this.nuevoRol = 'alumno';
    this.registroError = '';
    this.registroLoading = false;
  }

  // REGISTRAR NUEVO USUARIO
  registrar() {
    this.registroError = '';
    this.registroLoading = false;

    // Validaciones
    if (!this.nuevoCorreo.trim() || !this.nuevoCorreo.endsWith('@campuscamara.es')) {
      this.registroError = 'Correo inválido. Solo se permiten correos de @campuscamara.es';
      return;
    }

    if (!this.nuevaContrasena.trim()) {
      this.registroError = 'La contraseña no puede estar vacía';
      return;
    }

    this.registroLoading = true;

    this.authService.register(this.nuevoCorreo, this.nuevaContrasena, this.nuevoCorreo, this.nuevoRol)
      .subscribe({
        next: () => {
          this.registroLoading = false;
          // Registro exitoso → mostrar alert
          alert('Usuario registrado correctamente. Pulsa VOLVER AL LOGIN para continuar.');
          // Limpiamos campos pero no cerramos el registro automáticamente
          this.limpiarRegistro();
        },
        error: () => {
          this.registroError = 'Error al registrar usuario. El correo puede estar en uso.';
          this.registroLoading = false;
        }
      });
  }
}
