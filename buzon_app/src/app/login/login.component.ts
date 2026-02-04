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

  correo = '';
  pass = '';
  errorMessage = '';
  loading = false;

  mostrarRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // Dominios permitidos centralizados para facilitar el mensaje
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

  login() {
    this.errorMessage = '';

    if (!this.dominios.some(d => this.correo.trim().toLowerCase().endsWith(d))) {
      this.errorMessage = `Dominio no permitido. Use: ${this.dominios.join(', ')}`;
      return;
    }

    this.loading = true;

    this.authService.login(this.correo, this.pass).subscribe({
      next: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
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
    
    if (!this.nuevoCorreo.trim() || !this.dominios.some(d => this.nuevoCorreo.toLowerCase().endsWith(d))) {
      this.registroError = `Use un correo de: ${this.dominios.join(', ')}`;
      return;
    }
    
    if (!this.nuevaContrasena.trim()) {
      this.registroError = 'Contraseña vacía';
      return;
    }

    this.registroLoading = true;

    this.authService.register(this.nuevoCorreo, this.nuevaContrasena, this.nuevoCorreo, this.nuevoRol)
      .subscribe({
        next: () => {
          this.mostrarRegistro = false;
          this.correo = this.nuevoCorreo;
          this.pass = '';
          this.limpiarRegistro();
          this.registroLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.registroError = err.error?.msg || 'Error al registrar usuario';
          this.registroLoading = false;
          this.cdr.detectChanges();
        }
      });
  }
}