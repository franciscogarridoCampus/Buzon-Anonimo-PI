import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // Registro
  modalRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // Colores posibles
  claseColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];

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

  cargarClases() {
    this.claseService.fetchClases(this.user.id, this.user.rol).subscribe({
      next: (clases: any[]) => {
        this.clases = clases.map(clase => {
          // 1️⃣ Ver si hay color guardado en localStorage
          const colorLocal = localStorage.getItem(`clase-color-${clase.id_clase}`);
          if (colorLocal) {
            clase.colorClase = colorLocal;
          } else {
            // 2️⃣ Si no, asignar color basado en índice
            const color = this.claseColors[this.clases.length % this.claseColors.length] + ' text-white';
            clase.colorClase = color;
            // Guardar en localStorage para persistencia
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
        // 1️⃣ Guardar color en localStorage usando el id_clase que devuelve el backend
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
    this.nuevoRol = 'alumno';
    this.registroError = '';
    this.registroLoading = false;
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

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }
}
