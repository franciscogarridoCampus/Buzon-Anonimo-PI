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
  codigoClase: string | null = null; // el código generado
  mostrarCodigo: boolean = false;    // si se muestra en pantalla
  tiempoRestante: number = 0;        // segundos restantes del código

  private temporizador: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mensajeService: MensajeService,
    private claseService: ClaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userStorage = localStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);
    this.idClase = Number(this.route.snapshot.paramMap.get('id'));

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
    if (!this.esModerador() && !this.esProfesor()) return;

    if (this.temporizador) clearInterval(this.temporizador);

    this.codigoClase = 'Generando...';
    this.mostrarCodigo = true;
    this.cdr.detectChanges();

    this.claseService.generarCodigoTemporal(this.idClase).subscribe({
      next: (res: { codigo_temp: string }) => {
        this.codigoClase = res.codigo_temp;
        this.activarTemporizador(); // activa temporizador de 60s
      },
      error: () => {
        this.errorMessage = 'Error al generar nuevo código';
        this.cdr.detectChanges();
      }
    });
  }

  private activarTemporizador() {
    this.tiempoRestante = 60; // 1 minuto = 60 segundos
    this.mostrarCodigo = true;
    this.cdr.detectChanges();

    this.temporizador = setInterval(() => {
      this.tiempoRestante--;

      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.mostrarCodigo = false;
        this.codigoClase = null; // vuelve a "Generar para ver"
        this.tiempoRestante = 0;
        this.cdr.detectChanges();
      } else {
        this.cdr.detectChanges(); // refresca contador en HTML
      }
    }, 1000);
  }

  cargarMensajes() {
    this.mensajeService.fetchMensajes(this.idClase).subscribe({
      next: (msgs) => {
        if (this.esModerador() || this.esProfesor()) {
          this.mensajes = msgs;
        } else {
          this.mensajes = msgs.filter(m => m.id_autor === this.user.id);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Error cargando mensajes';
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;

    this.mensajeService.enviarMensaje(this.idClase, this.user.id, this.nuevoMensaje).subscribe({
      next: (mensajeCreado: Mensaje) => {
        this.nuevoMensaje = '';
        this.cargarMensajes();
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar el mensaje';
        this.cdr.detectChanges();
      }
    });
  }

  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }

  esProfesor(): boolean {
    return this.user.rol === 'profesor';
  }

  puedeEscribir(): boolean {
    return this.user.rol === 'alumno';
  }

  mostrarMensaje(msg: Mensaje): boolean {
    if (this.esModerador() || this.esProfesor()) return true;
    return msg.id_autor === this.user.id;
  }

  // Método opcional para mostrar tiempo en formato MM:SS
  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }
}
