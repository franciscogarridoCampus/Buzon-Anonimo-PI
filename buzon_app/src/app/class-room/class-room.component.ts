import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajeService } from '../services/mensaje.service';
import { ClaseService } from '../services/clase.service';
import { Mensaje } from '../models/mensaje.model';
import { User } from '../models/user.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  codigoClase: string | null = null;
  mostrarCodigo: boolean = false;
  tiempoRestante: number = 0;

  private temporizador?: ReturnType<typeof setInterval>;
  private pollingSubscription?: Subscription; // Para la actualización automática

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mensajeService: MensajeService,
    private claseService: ClaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const userStorage = sessionStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);

    this.idClase = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarInfoClase();
    this.cargarMensajes();

    // 🔄 INICIAR ACTUALIZACIÓN AUTOMÁTICA
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);

    // 🛑 DETENER ACTUALIZACIÓN AUTOMÁTICA al salir del componente
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // 🔄 MÉTODO PARA ACTUALIZACIÓN AUTOMÁTICA
  iniciarActualizacionAutomatica() {
    // Actualizar cada 3 segundos (3000ms)
    // Puedes ajustar este valor: 2000 = 2 seg, 5000 = 5 seg, etc.
    this.pollingSubscription = interval(3000)
      .pipe(
        switchMap(() => this.mensajeService.fetchMensajes(this.idClase))
      )
      .subscribe({
        next: (msgs) => {
          // Solo actualizar si hay cambios (para evitar parpadeos innecesarios)
          if (JSON.stringify(this.mensajes) !== JSON.stringify(msgs)) {
            this.mensajes = msgs;
            this.cdr.detectChanges();
            console.log('📨 Mensajes actualizados automáticamente');
          }
        },
        error: (err) => {
          console.error('Error en actualización automática:', err);
          // No mostrar error al usuario, simplemente seguir intentando
        }
      });
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
        this.activarTemporizador();
      },
      error: () => {
        this.errorMessage = 'Error al generar nuevo código';
        this.cdr.detectChanges();
      }
    });
  }

  private activarTemporizador() {
    this.tiempoRestante = 60;
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
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;

    this.mensajeService.enviarMensaje(this.idClase, this.user.id, this.nuevoMensaje).subscribe({
      next: (mensajeCreado: Mensaje) => {
        this.nuevoMensaje = '';
        // Ya no necesitas llamar a cargarMensajes() aquí
        // La actualización automática lo hará en máximo 3 segundos
        // Pero si quieres actualización instantánea después de enviar:
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
    return true;
  }

  get tiempoFormateado(): string {
    const minutos = Math.floor(this.tiempoRestante / 60);
    const segundos = this.tiempoRestante % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  }
}