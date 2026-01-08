import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajeService } from '../services/mensaje.service';
import { ClaseService } from '../services/clase.service';
import { Mensaje } from '../models/mensaje.model';
import { User } from '../models/user.model';

@Component({
  selector: 'app-class-room',
  standalone: true,
  templateUrl: './class-room.component.html',
  styleUrls: ['./class-room.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ClassRoomComponent implements OnInit, OnDestroy {
  user!: User;
  idClase!: number;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  errorMessage = '';

  claseNombre: string = 'Cargando...';
  codigoClase: string | null = null; // código temporal
  mostrarCodigo: boolean = false;    // si mostrar el código en pantalla
  tiempoRestante: number = 0;        // segundos restantes

  private temporizador: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mensajeService: MensajeService,
    private claseService: ClaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener usuario desde localStorage
    const userStorage = localStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);

    // Obtener idClase de la ruta
    this.idClase = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar info de clase y mensajes
    this.cargarInfoClase();
    this.cargarMensajes();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  volverDashboard(): void {
    if (['profesor', 'moderador', 'alumno'].includes(this.user.rol)) {
      this.router.navigate(['/dashboard']);
    }
  }

  cargarInfoClase() {
    this.claseService.fetchClaseById(this.idClase).subscribe({
      next: (clase: any) => {
        this.claseNombre = clase.nombre || `Clase ${this.idClase}`;
        this.codigoClase = null;
        this.mostrarCodigo = false;
        this.tiempoRestante = 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Error cargando info de la clase';
        this.cdr.detectChanges();
      }
    });
  }

  generarNuevoCodigo() {
    // Solo moderador o profesor pueden generar código temporal
    if (!this.esModerador() && !this.esProfesor()) return;

    if (this.temporizador) clearInterval(this.temporizador);

    this.codigoClase = 'Generando...';
    this.mostrarCodigo = true;
    this.cdr.detectChanges();

    this.claseService.generarCodigoTemporal(this.idClase).subscribe({
      next: (res: { codigo_temp: string }) => {
        this.codigoClase = res.codigo_temp;
        this.activarTemporizador();
      },
      error: () => {
        this.errorMessage = 'Error al generar nuevo código';
        this.cdr.detectChanges();
      }
    });
  }

  private activarTemporizador() {
    this.tiempoRestante = 60; // 60 segundos
    this.mostrarCodigo = true;
    this.cdr.detectChanges();

    this.temporizador = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.mostrarCodigo = false;
        this.codigoClase = null;
        this.tiempoRestante = 0;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  cargarMensajes() {
    this.mensajeService.fetchMensajes(this.idClase).subscribe({
      next: (msgs) => {
        // TODOS los usuarios ven todos los mensajes
        this.mensajes = msgs;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Error cargando mensajes';
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensaje() {
    // Evita enviar mensaje vacío o si el usuario no puede escribir
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;

    this.mensajeService.enviarMensaje(this.idClase, this.user.id, this.nuevoMensaje).subscribe({
      next: (mensajeCreado: Mensaje) => {
        this.nuevoMensaje = '';
        this.cargarMensajes(); // recarga todos los mensajes
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar el mensaje';
        this.cdr.detectChanges();
      }
    });
  }

  // Roles
  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }

  esProfesor(): boolean {
    return this.user.rol === 'profesor';
  }

  puedeEscribir(): boolean {
  // Solo los alumnos pueden enviar mensajes
  return this.user.rol === 'alumno';
}


  mostrarMensaje(msg: Mensaje): boolean {
    // Todos los mensajes se muestran
    return true;
  }

  // Formato de tiempo MM:SS
  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }
}
