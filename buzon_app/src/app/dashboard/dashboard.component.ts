// Imports de Angular
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicios
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

  // Usuario y listado de clases
  user: any;
  clases: any[] = [];

  // Control visual general
  mostrarPerfil = false;
  fabExpandido = false; 

  // Cambio de contraseña
  modalPass = false;
  passNueva = '';
  passConfirmar = '';
  passError = '';
  passSuccess = '';
  passLoading = false;
  verPass1 = false;
  verPass2 = false;

  // Crear clase
  nuevoNombre = '';
  modalCrearClase = false;
  errorMessage = '';

  // Registro de usuarios
  modalRegistro = false;
  nuevoCorreo = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  nuevoRol: 'alumno' | 'profesor' | 'moderador' = 'alumno';
  registroError = '';
  registroLoading = false;

  // Unirse a una clase por código
  modalUnirseClase = false;
  codigoUnirse = '';
  unirseError = '';
  unirseLoading = false;

  // Mostrar u ocultar contraseñas
  mostrarContrasena = false;
  mostrarContrasenaConfirm = false;

  // Colores disponibles para las clases
  claseColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info'];

  // Control de eliminación de clase
  clasePendienteEliminar: number | null = null;

  // Personalización de imagen de la clase
  modalImagen = false;
  imagenPreview: string | null = null;
  claseSeleccionadaParaImagen: any = null;

  constructor(
    private claseService: ClaseService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Se ejecuta al entrar al dashboard
  ngOnInit(): void {
    const userStorage = localStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);
    this.cargarClases();
  }

  // ===============================
  // GESTIÓN DE CONTRASEÑA
  // ===============================

  // Abre el modal de cambio de contraseña
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

  // Cierra el modal de contraseña
  cerrarModalPass() {
    this.modalPass = false;
  }

  // Valida y envía el cambio de contraseña
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
        this.cerrarModalPass();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passError = err.error?.msg || 'Error al actualizar la contraseña';
        this.passLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===============================
  // GESTIÓN DE CLASES
  // ===============================

  // Carga las clases del usuario
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

  // Abre el modal para crear una clase
  abrirModalCrearClase() {
    this.nuevoNombre = '';
    this.errorMessage = '';
    this.modalCrearClase = true;
    this.fabExpandido = false; 
  }

  // Cierra el modal de crear clase
  cerrarModalCrearClase() {
    this.modalCrearClase = false;
  }

  // Genera un código aleatorio para la clase
  generarCodigoAleatorio(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Crea una nueva clase
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

  // Solicita confirmación para eliminar clase
  solicitarEliminarClase(idClase: number) {
    this.clasePendienteEliminar = idClase;
  }

  // Cancela la eliminación
  cancelarEliminarClase() {
    this.clasePendienteEliminar = null;
  }

  // Elimina definitivamente la clase
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

  // Entra a una clase seleccionada
  entrarClase(clase: any) {
    this.router.navigate(['/class-room', clase.id_clase]);
  }

  // ===============================
  // UNIRSE A CLASE
  // ===============================

  // Abre el modal para unirse a una clase
  abrirModalUnirse() {
    this.codigoUnirse = '';
    this.unirseError = '';
    this.unirseLoading = false;
    this.modalUnirseClase = true;
  }

  // Cierra el modal de unirse
  cerrarModalUnirse() {
    this.modalUnirseClase = false;
    this.codigoUnirse = '';
    this.unirseError = '';
    this.unirseLoading = false;
  }

  // Envía el código para unirse a una clase
  confirmarUnirseClase() {
    const codigo = this.codigoUnirse.trim();
    if (!codigo) return;

    this.unirseError = '';
    this.unirseLoading = true;

    this.claseService.unirseClase(this.user.id, codigo).subscribe({
      next: (res) => {
        this.unirseLoading = false;
        this.cerrarModalUnirse();
        this.cargarClases();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.unirseLoading = false;
        this.unirseError = err.error?.msg || 'El código no es válido o ha expirado';
        this.cdr.detectChanges();
      }
    });
  }

  // ===============================
  // REGISTRO DE USUARIOS
  // ===============================

  // Abre el modal de registro
  abrirModalRegistro() {
    this.limpiarRegistro();
    this.modalRegistro = true;
    this.fabExpandido = false; 
  }

  // Cierra el modal de registro
  cerrarModalRegistro() {
    this.modalRegistro = false;
  }

  // Limpia los campos del registro
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

  // Muestra u oculta contraseña
  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  // Muestra u oculta confirmar contraseña
  toggleMostrarContrasenaConfirm() {
    this.mostrarContrasenaConfirm = !this.mostrarContrasenaConfirm;
  }

  // Registra un nuevo usuario
  registrarUsuario() {
    this.registroError = '';

    const permitido = [
      '@campuscamara.es',
      '@camaradesevilla.es',
      '@eusa.es',
      '@fpcampuscamara.es',
      '@campuscamaraformacion.com',
      '@campuscamarasevilla.com'
    ];

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
        this.cerrarModalRegistro();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.registroError = err.error?.msg || 'Error al registrar usuario';
        this.registroLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===============================
  // PERFIL Y SESIÓN
  // ===============================

  // Muestra u oculta el menú de perfil
  togglePerfil(event: Event) {
    event.stopPropagation();
    this.mostrarPerfil = !this.mostrarPerfil;
  }

  // Devuelve el rol con nombre legible
  getRolFormateado(): string {
    const roles: { [key: string]: string } = {
      'moderador': 'Moderador',
      'profesor': 'Profesor',
      'alumno': 'Alumno'
    };
    return roles[this.user.rol] || this.user.rol;
  }

  // Cierra sesión
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // Comprueba si el usuario es moderador
  esModerador(): boolean {
    return this.user?.rol === 'moderador';
  }

  // Cierra el menú de perfil al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.mostrarPerfil) this.mostrarPerfil = false;
    this.cdr.detectChanges();
  }

  // ===============================
  // IMAGEN DE CLASE
  // ===============================

  // Abre el modal para cambiar imagen
  abrirModalImagen(event: Event, clase: any) {
    event.stopPropagation();
    this.claseSeleccionadaParaImagen = clase;
    this.imagenPreview = localStorage.getItem(`clase-img-${clase.id_clase}`);
    this.modalImagen = true;
  }

  // Previsualiza la imagen seleccionada
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

  // Guarda la imagen de la clase
  guardarImagenClase() {
    if (this.claseSeleccionadaParaImagen && this.imagenPreview) {
      localStorage.setItem(`clase-img-${this.claseSeleccionadaParaImagen.id_clase}`, this.imagenPreview);
      this.claseSeleccionadaParaImagen.imagenPortada = this.imagenPreview;
      this.modalImagen = false;
    }
  }

  // Borra la imagen de la clase
  borrarImagen() {
    if (this.claseSeleccionadaParaImagen) {
      localStorage.removeItem(`clase-img-${this.claseSeleccionadaParaImagen.id_clase}`);
      this.claseSeleccionadaParaImagen.imagenPortada = null;
      this.modalImagen = false;
    }
  }
}
