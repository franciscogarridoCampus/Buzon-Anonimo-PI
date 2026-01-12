import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaseService } from '../services/clase.service';
import { Clase } from '../models/clase.model';
import { User } from '../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit {
  user!: User;
  clases: Clase[] = [];
  nuevoNombre = '';
  modalCrearClase = false;
  errorMessage = '';
  mostrarPerfil = false;

  modalAccesoClase = false;
  modalUnirseClase = false;
  claseSeleccionada: Clase | null = null;
  codigoAcceso = '';

  constructor(
    private claseService: ClaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const userStorage = sessionStorage.getItem('user');

    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = JSON.parse(userStorage);
    console.log("🔵 ngOnInit ejecutado");
    console.log("➡️ Ejecutando cargarClases()", this.user);
    this.cargarClases();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Solo cierra el menú si está abierto
    if (this.mostrarPerfil) {
      this.mostrarPerfil = false;
      this.cdr.detectChanges();
    }
  }

  cargarClases() {
    console.log("➡️ Ejecutando cargarClases()", this.user);

    this.claseService.fetchClases(this.user.id, this.user.rol).subscribe({
      next: (clases) => {
        console.log("📦 Clases recibidas desde API:", clases);

        if (clases && clases.length > 0) {
          console.log("🔍 Primera clase recibida:", clases[0]);
        }

        this.clases = clases;
        this.cdr.detectChanges();
        console.log("👀 Clases en el componente:", this.clases);
      },
      error: (err) => {
        console.error("❌ ERROR en fetchClases:", err);
        this.errorMessage = 'Error cargando clases';
        this.cdr.detectChanges();
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

    if (!nombreLimpio) {
      return;
    }

    const nombreDuplicado = this.clases.some(clase =>
      clase.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (nombreDuplicado) {
      this.errorMessage = `Ya existe una clase con el nombre "${nombreLimpio}".`;
      return;
    };

    const nuevoCodigo = this.generarCodigoAleatorio();
    this.claseService.crearClase(nombreLimpio, nuevoCodigo, this.user.id).subscribe({
      next: () => {
        this.cerrarModalCrearClase();
        this.cargarClases();
      },
      error: () => {
        this.errorMessage = 'No se pudo crear la clase';
        this.cdr.detectChanges();
      }
    });
  }

  eliminarClase(idClase: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase? Esto es irreversible.')) {
      return;
    }

    this.claseService.eliminarClase(idClase).subscribe({
      next: () => {
        alert('Clase eliminada con éxito.');
        this.cargarClases();
      },
      error: (err) => {
        this.errorMessage = 'Error al eliminar la clase.';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalAccesoClase(clase: Clase) {
    if (this.user.rol === 'profesor' || this.user.rol === 'alumno') {
      this.entrarClase(clase);
      return;
    }
    this.claseSeleccionada = clase;
    this.codigoAcceso = '';
    this.modalUnirseClase = false;
    this.modalAccesoClase = true;
  }

  abrirModalUnirseClase() {
    this.claseSeleccionada = null;
    this.codigoAcceso = '';
    this.errorMessage = '';
    this.modalUnirseClase = true;
    this.modalAccesoClase = true;
  }

  cerrarModalAccesoClase() {
    this.modalAccesoClase = false;
    this.modalUnirseClase = false;
    this.claseSeleccionada = null;
    this.codigoAcceso = '';
    this.errorMessage = '';
  }

  confirmarAccesoClase() {
    // CASO 1: Unirse a una nueva clase
    if (this.modalUnirseClase && !this.claseSeleccionada) {
      this.unirseClaseConCodigo();
      return;
    }

    // CASO 2: Acceder a una clase existente
    if (!this.claseSeleccionada) return;

    // Si es profesor o moderador, acceso directo
    if (this.user.rol === 'profesor' || this.user.rol === 'moderador') {
      this.entrarClase(this.claseSeleccionada);
      return;
    }

    // Si es alumno, validar código
    if (this.user.rol === 'alumno') {
      if (!this.codigoAcceso.trim()) {
        this.errorMessage = 'Debes introducir el código de acceso';
        return;
      }

      this.claseService.validarCodigoAcceso(this.claseSeleccionada.id_clase, this.codigoAcceso.trim()).subscribe({
        next: (resultado) => {
          if (resultado.valido) {
            this.cerrarModalAccesoClase();
            this.entrarClase(this.claseSeleccionada!);
          } else {
            this.errorMessage = 'Código incorrecto o expirado';
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.errorMessage = 'Error al validar el código. Inténtalo de nuevo.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  unirseClaseConCodigo() {
    if (!this.codigoAcceso.trim()) {
      this.errorMessage = 'Debes introducir el código de la clase';
      this.cdr.detectChanges();
      return;
    }

    this.claseService.unirseClase(this.user.id, this.codigoAcceso.trim()).subscribe({
      next: () => {
        this.errorMessage = '¡Te has unido a la clase con éxito!';
        this.cerrarModalAccesoClase();
        this.cargarClases();
        setTimeout(() => {
          alert('Te has unido a la clase con exito');
        }, 100);
      },
      error: (err) => {
        this.errorMessage = 'No se pudo unir a la clase. Verifica el código.';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  mostrarCampoCodigoAcceso(): boolean {
    return this.user.rol === 'alumno' || this.modalUnirseClase;
  }

  mensajeInstruccionCodigo(): string {
    if (this.modalUnirseClase && !this.claseSeleccionada) {
      return 'Solicita al profesor el código temporal para unirte a la clase';
    }
    return 'Solicita al profesor el código temporal de acceso a la clase';
  }

  textoBotonAcceso(): string {
    if (this.modalUnirseClase && !this.claseSeleccionada) {
      return 'Unirse';
    }
    return 'Acceder';
  }

  get tituloModalAcceso(): string {
    if (this.modalUnirseClase && !this.claseSeleccionada) {
      return 'Unirse a una clase';
    }
    return 'Acceder a clase';
  }

  entrarClase(clase: Clase) {
    this.cerrarModalAccesoClase();
    this.router.navigate(['/class-room', clase.id_clase]);
  }

  unirseClase() {
    this.abrirModalUnirseClase();
    //const codigo = prompt('Ingresa el código temporal de la clase:');
    //if (!codigo || !codigo.trim()) return;

    /*this.claseService.unirseClase(this.user.id, codigo.trim()).subscribe({
      next: () => {
        alert('¡Te has unido a la clase!');
        this.cargarClases();
      },
      error: (err) => {
        this.errorMessage = 'No se pudo unir a la clase. Código incorrecto o ya estás unido.';
        alert('No se pudo unir a la clase. Código incorrecto.');
        console.error(err);
        this.cdr.detectChanges();*/
  }


  logout() {
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }

  togglePerfil(event: Event) {
    event.stopPropagation();
    this.mostrarPerfil = !this.mostrarPerfil;
    this.cdr.detectChanges();
  }

  getInicialesUsuario(): string {
    if (!this.user || !this.user.nombre) return 'U';
    const nombres = this.user.nombre.trim().split(' ');
    if (nombres.length === 1) {
      return nombres[0].charAt(0).toUpperCase();
    }
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
}