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

  // Datos del formulario de login
  correo = '';
  pass = '';
  errorMessage = '';
  loading = false;

  // Control para mostrar formulario de registro
  mostrarRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // Dominios permitidos para registro/login
  private dominios = [
    '@campuscamara.es',
    '@camaradesevilla.es',
    '@eusa.es',
    '@fpcampuscamara.es',
    '@campuscamaraformacion.com',
    '@campuscamarasevilla.com'
  ];

  constructor(private authService: AuthService,
              private router: Router,
              private cdr: ChangeDetectorRef
  ) { }

  // -------------------------------
  // FUNCIONES DE LOGIN
  // -------------------------------
  login() {
    this.errorMessage = '';

    // Validamos que el correo tenga un dominio permitido
    if (!this.dominios.some(d => this.correo.trim().toLowerCase().endsWith(d))) {
      this.errorMessage = `Dominio no permitido. Use: ${this.dominios.join(', ')}`;
      return;
    }

    this.loading = true;

    // Llamada al servicio de autenticación
    this.authService.login(this.correo, this.pass).subscribe({
      next: (user: User) => {
        // Guardamos usuario en localStorage y navegamos al dashboard
        localStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
        // Mostramos error si falla login
        if (err.error && err.error.msg) {
          this.errorMessage = err.error.msg;
        } else {
          this.errorMessage = 'Credenciales incorrectas o error de conexión';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // -------------------------------
  // FUNCIONES DE REGISTRO
  // -------------------------------
  toggleRegistro() {
    // Muestra u oculta el formulario de registro
    this.mostrarRegistro = !this.mostrarRegistro;
    this.limpiarRegistro();
  }

  limpiarRegistro() {
    // Reinicia los campos de registro
    this.nuevoCorreo = '';
    this.nuevaContrasena = '';
    this.nuevoRol = 'alumno';
    this.registroError = '';
    this.registroLoading = false;
  }

  registrar() {
    this.registroError = '';
    
    // Validación de correo
    if (!this.nuevoCorreo.trim() || !this.dominios.some(d => this.nuevoCorreo.toLowerCase().endsWith(d))) {
      this.registroError = `Use un correo de: ${this.dominios.join(', ')}`;
      return;
    }
    
    // Validación de contraseña
    if (!this.nuevaContrasena.trim()) {
      this.registroError = 'Contraseña vacía';
      return;
    }

    this.registroLoading = true;

    // Llamada al servicio para registrar usuario
    this.authService.register(this.nuevoCorreo, this.nuevaContrasena, this.nuevoCorreo, this.nuevoRol)
      .subscribe({
        next: () => {
          // Al registrarse correctamente, ocultamos el formulario y limpiamos campos
          this.mostrarRegistro = false;
          this.correo = this.nuevoCorreo;
          this.pass = '';
          this.limpiarRegistro();
          this.registroLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          // Mostramos mensaje de error si falla el registro
          this.registroError = err.error?.msg || 'Error al registrar usuario';
          this.registroLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}
