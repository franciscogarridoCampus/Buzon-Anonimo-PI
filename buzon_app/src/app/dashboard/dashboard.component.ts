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

  // UI CONTROL
  mostrarPerfil = false;
  fabExpandido = false; 

  // --- CAMBIO DE CONTRASEÑA ---
  modalPass = false;
  passNueva = '';
  passConfirmar = '';
  passError = '';
  passSuccess = '';
  passLoading = false;
  verPass1 = false;
  verPass2 = false;

  // CREAR CLASE
  nuevoNombre = '';
  modalCrearClase = false;
  errorMessage = '';

  // REGISTRO USUARIO
  modalRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // MODAL UNIRSE A CLASE
  modalUnirseClase = false;
  codigoUnirse = '';
  unirseError = '';

  // MOSTRAR/OCULTAR CONTRASEÑA
  mostrarContrasena = false;
  mostrarContrasenaConfirm = false;

  // COLORES POSIBLES PARA CLASES
  claseColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];

  // VIÑETA ELIMINAR CLASE
  clasePendienteEliminar: number | null = null;

  // --- NUEVO: PERSONALIZACIÓN DE IMAGEN ---
  modalImagen = false;
  imagenPreview: string | null = null;
  claseSeleccionadaParaImagen: any = null;

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
  // GESTIÓN DE CONTRASEÑA (AJUSTADO)
  // -------------------------------
  abrirModalPass() {
    this.mostrarPerfil = false;
    this.passNueva = '';
    this.passConfirmar = '';
    this.passError = '';
    this.passSuccess = '';
    this.verPass1 = false;
    this.verPass2 = false;
    this.modalPass = true;
  }

  cerrarModalPass() {
    this.modalPass = false;
  }

  confirmarCambioPass() {
    this.passError = '';
    this.passSuccess = '';

    const pass = this.passNueva.trim();
    if (pass.length < 4) {
      this.passError = 'La contraseña es demasiado corta (mín. 4)';
      return;
    }

    if (this.passNueva !== this.passConfirmar) {
      this.passError = 'Las contraseñas no coinciden';
      return;
    }

    this.passLoading = true;
    this.authService.cambiarPassword(this.user.id, this.passNueva).subscribe({
      next: (res) => {
        this.passLoading = false;
        this.cerrarModalPass(); // Cierre instantáneo como en crear clase
        this.cdr.detectChanges();
        console.log('Contraseña actualizada con éxito');
      },
      error: (err) => {
        this.passError = err.error?.msg || 'Error al actualizar la contraseña';
        this.passLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // -------------------------------
  // GESTIÓN DE CLASES
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
          // Recuperar imagen si existe
          clase.imagenPortada = localStorage.getItem(`clase-img-${clase.id_clase}`);
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
    this.fabExpandido = false; 
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

  solicitarEliminarClase(idClase: number) {
    this.clasePendienteEliminar = idClase;
  }

  cancelarEliminarClase() {
    this.clasePendienteEliminar = null;
  }

  confirmarEliminarClase(idClase: number) {
    this.claseService.eliminarClase(idClase).subscribe({
      next: () => {
        localStorage.removeItem(`clase-color-${idClase}`);
        localStorage.removeItem(`clase-img-${idClase}`);
        this.clasePendienteEliminar = null;
        this.cargarClases();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la clase.';
        this.clasePendienteEliminar = null;
      }
    });
  }

  entrarClase(clase: any) {
    this.router.navigate(['/class-room', clase.id_clase]);
  }

  // -------------------------------
  // UNIRSE A CLASE
  // -------------------------------
  abrirModalUnirse() {
    this.codigoUnirse = '';
    this.unirseError = '';
    this.modalUnirseClase = true;
  }

  cerrarModalUnirse() {
    this.modalUnirseClase = false;
    this.codigoUnirse = '';
    this.unirseError = '';
  }

  confirmarUnirseClase() {
    const codigo = this.codigoUnirse.trim();
    if (!codigo) return;

    this.claseService.unirseClase(this.user.id, codigo).subscribe({
      next: (res) => {
        this.modalUnirseClase = false;
        this.cargarClases();
        this.codigoUnirse = '';
        this.unirseError = '';
      },
      error: (err) => {
        this.unirseError = err.error?.msg || 'Código incorrecto o ya estás unido.';
        this.cdr.detectChanges();
      }
    });
  }

  // -------------------------------
  // REGISTRO DE USUARIOS (AJUSTADO)
  // -------------------------------
  abrirModalRegistro() {
    this.limpiarRegistro();
    this.modalRegistro = true;
    this.fabExpandido = false; 
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

    const permitido = ['@campuscamara.es', '@camaradesevilla.com'];
    if (!permitido.some(d => this.nuevoCorreo.endsWith(d))) {
      this.registroError = `Correo inválido (${permitido.join(' o ')})`;
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
        this.registroLoading = false;
        this.cerrarModalRegistro(); // Cierre instantáneo tras éxito
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.registroError = err.error?.msg || 'Error al registrar usuario';
        this.registroLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // -------------------------------
  // PERFIL Y SESIÓN
  // -------------------------------
  togglePerfil(event: Event) {
    event.stopPropagation();
    this.mostrarPerfil = !this.mostrarPerfil;
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
    return this.user?.rol === 'moderador';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.mostrarPerfil) this.mostrarPerfil = false;
    this.cdr.detectChanges();
  }

  // --- NUEVAS FUNCIONES PARA IMAGEN ---
  abrirModalImagen(event: Event, clase: any) {
    event.stopPropagation();
    this.claseSeleccionadaParaImagen = clase;
    this.imagenPreview = localStorage.getItem(`clase-img-${clase.id_clase}`);
    this.modalImagen = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  guardarImagenClase() {
    if (this.claseSeleccionadaParaImagen && this.imagenPreview) {
      localStorage.setItem(`clase-img-${this.claseSeleccionadaParaImagen.id_clase}`, this.imagenPreview);
      this.claseSeleccionadaParaImagen.imagenPortada = this.imagenPreview;
      this.modalImagen = false;
    }
  }

  borrarImagen() {
    if (this.claseSeleccionadaParaImagen) {
      localStorage.removeItem(`clase-img-${this.claseSeleccionadaParaImagen.id_clase}`);
      this.claseSeleccionadaParaImagen.imagenPortada = null;
      this.modalImagen = false;
    }
  }
}