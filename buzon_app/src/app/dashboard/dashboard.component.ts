import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaseService } from '../services/clase.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit {

  user: any;
  clases: any[] = [];

  // Crear clase
  nuevoNombre = '';
  modalCrearClase = false;
  errorMessage = '';

  // Registro usuario
  modalRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // Mostrar/ocultar contraseña
  mostrarContrasena = false;
  mostrarContrasenaConfirm = false;

  // Colores posibles para clases
  claseColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];

  // -------------------------------
  // PERFIL USUARIO
  // -------------------------------
  mostrarPerfil = false;

  constructor(
    private claseService: ClaseService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userStorage = localStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);
    this.cargarClases();
  }

  // -------------------------------
  // CLASES
  // -------------------------------
  cargarClases() {
    this.claseService.fetchClases(this.user.id, this.user.rol).subscribe({
      next: (clases: any[]) => {
        this.clases = clases.map(clase => {
          const colorLocal = localStorage.getItem(`clase-color-${clase.id_clase}`);
          if (colorLocal) {
            clase.colorClase = colorLocal;
          } else {
            const color = this.claseColors[this.clases.length % this.claseColors.length] + ' text-white';
            clase.colorClase = color;
            localStorage.setItem(`clase-color-${clase.id_clase}`, color);
          }
          return clase;
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Error cargando clases';
      }
    });
  }

  abrirModalCrearClase() {
    this.nuevoNombre = '';
    this.errorMessage = '';
    this.modalCrearClase = true;
  }

  cerrarModalCrearClase() {
    this.modalCrearClase = false;
  }

  generarCodigoAleatorio(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  crearClase() {
    const nombreLimpio = this.nuevoNombre.trim();
    this.errorMessage = '';
    if (!nombreLimpio) return;

    const nombreDuplicado = this.clases.some(
      clase => clase.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (nombreDuplicado) {
      this.errorMessage = `Ya existe una clase con el nombre "${nombreLimpio}".`;
      return;
    }

    const codigo = this.generarCodigoAleatorio();
    const color = this.claseColors[this.clases.length % this.claseColors.length] + ' text-white';

    this.claseService.crearClase(nombreLimpio, codigo, this.user.id).subscribe({
      next: (res: any) => {
        if (res.id_clase) localStorage.setItem(`clase-color-${res.id_clase}`, color);
        this.cerrarModalCrearClase();
        this.cargarClases();
      },
      error: () => {
        this.errorMessage = 'No se pudo crear la clase';
      }
    });
  }

  eliminarClase(idClase: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase?')) return;
    this.claseService.eliminarClase(idClase).subscribe({
      next: () => {
        localStorage.removeItem(`clase-color-${idClase}`);
        this.cargarClases();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la clase.';
      }
    });
  }

  entrarClase(clase: any) {
    this.router.navigate(['/class-room', clase.id_clase]);
  }

  unirseClase() {
    const codigo = prompt('Ingresa el código temporal de la clase:');
    if (!codigo?.trim()) return;

    this.claseService.unirseClase(this.user.id, codigo.trim()).subscribe({
      next: () => {
        alert('¡Te has unido a la clase!');
        this.cargarClases();
      },
      error: () => {
        alert('Código incorrecto o ya estás unido.');
      }
    });
  }

  // -------------------------------
  // REGISTRO USUARIO
  // -------------------------------
  abrirModalRegistro() {
    this.limpiarRegistro();
    this.modalRegistro = true;
  }

  cerrarModalRegistro() {
    this.modalRegistro = false;
  }

  limpiarRegistro() {
    this.nuevoCorreo = '';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';
    this.nuevoRol = 'alumno';
    this.registroError = '';
    this.registroLoading = false;
    this.mostrarContrasena = false;
    this.mostrarContrasenaConfirm = false;
  }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleMostrarContrasenaConfirm() {
    this.mostrarContrasenaConfirm = !this.mostrarContrasenaConfirm;
  }

  registrarUsuario() {
    this.registroError = '';

    if (!this.nuevoCorreo.endsWith('@campuscamara.es')) {
      this.registroError = 'Correo inválido (@campuscamara.es)';
      return;
    }
    if (!this.nuevaContrasena.trim()) {
      this.registroError = 'La contraseña es obligatoria';
      return;
    }
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.registroError = 'Las contraseñas no coinciden';
      return;
    }

    this.registroLoading = true;
    this.authService.register(
      this.nuevoCorreo,
      this.nuevaContrasena,
      this.nuevoCorreo,
      this.nuevoRol
    ).subscribe({
      next: () => {
        alert('Usuario registrado correctamente');
        this.cerrarModalRegistro();
        this.registroLoading = false;
      },
      error: () => {
        this.registroError = 'Error al registrar usuario';
        this.registroLoading = false;
      }
    });
  }

  // -------------------------------
  // PERFIL USUARIO
  // -------------------------------
  togglePerfil(event: Event) {
    event.stopPropagation();
    this.mostrarPerfil = !this.mostrarPerfil;
  }

  getInicialesUsuario(): string {
    if (!this.user || !this.user.nombre) return 'U';
    const nombres = this.user.nombre.trim().split(' ');
    if (nombres.length === 1) return nombres[0].charAt(0).toUpperCase();
    return (nombres[0].charAt(0) + nombres[nombres.length - 1].charAt(0)).toUpperCase();
  }

  getRolFormateado(): string {
    const roles: { [key: string]: string } = {
      'moderador': 'Moderador',
      'profesor': 'Profesor',
      'alumno': 'Alumno'
    };
    return roles[this.user.rol] || this.user.rol;
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }

  // -------------------------------
  // CERRAR MENÚ PERFIL AL HACER CLIC FUERA
  // -------------------------------
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.mostrarPerfil) {
      this.mostrarPerfil = false;
      this.cdr.detectChanges();
    }
  }
}
