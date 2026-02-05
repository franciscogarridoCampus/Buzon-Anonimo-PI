// Imports principales de Angular (componentes, rutas, ciclos de vida)
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// RxJS para actualizaciones automáticas
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Servicios para comunicar con el backend
import { MensajeService } from '../services/mensaje.service';
import { ClaseService } from '../services/clase.service';

// Modelos de datos
import { Mensaje } from '../models/mensaje.model';
import { User } from '../models/user.model';

// Interface para guardar el código temporal en localStorage
interface CodigoPersistente {
  codigo: string;
  expiresAt: number;
}

@Component({
  selector: 'app-class-room',
  standalone: true,
  templateUrl: './class-room.component.html',
  styleUrls: ['./class-room.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ClassRoomComponent implements OnInit, OnDestroy {

  // Datos del usuario y la clase actual
  user?: User;
  idClase!: number;
  claseNombre = 'Cargando...';

  // Mensajes del tablón de la clase
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';

  // Estilos visuales del banner de la clase
  bannerColor: string = 'bg-primary';
  bannerImagen: string | null = null;

  // Navegación interna entre tabs
  tabActiva: 'tablon' | 'personas' = 'tablon';
  usuariosClase: any[] = [];

  // Código temporal para unirse a la clase
  codigoClase: string | null = null;
  mostrarCodigo = false;
  tiempoRestante = 0;

  // Estados para confirmar eliminaciones
  mensajePendienteEliminar: number | null = null;
  usuarioPendienteEliminar: number | null = null;

  // Timers y subscripciones activas
  private temporizador?: ReturnType<typeof setInterval>;
  private pollingSubscription?: Subscription;

  // Inyección de servicios
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mensajeService: MensajeService,
    private claseService: ClaseService,
    private cdr: ChangeDetectorRef
  ) {}

  // Se ejecuta al entrar al componente
  ngOnInit(): void {
    // Verifica si el usuario está logueado
    const userStorage = localStorage.getItem('user');
    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }

    // Carga usuario y clase
    this.user = JSON.parse(userStorage);
    this.idClase = Number(this.route.snapshot.paramMap.get('id'));

    // Recupera estilos guardados de la clase
    this.bannerColor = localStorage.getItem(`clase-color-${this.idClase}`) || 'bg-primary';
    this.bannerImagen = localStorage.getItem(`clase-img-${this.idClase}`);

    // Carga información inicial
    this.cargarInfoClase();
    this.cargarMensajes();
    this.iniciarActualizacionAutomatica();
  }

  // Se ejecuta al salir del componente
  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
  }

  // Cambia entre el tablón y la lista de personas
  cambiarTab(tab: 'tablon' | 'personas') {
    this.tabActiva = tab;
    if (tab === 'personas') this.cargarUsuarios();
  }

  // Vuelve al dashboard principal
  volverDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Carga los usuarios de la clase
  cargarUsuarios() {
    this.claseService.fetchUsuariosClase(this.idClase).subscribe(users => {
      this.usuariosClase = users;
      this.cdr.detectChanges();
    });
  }

  // Expulsa un usuario de la clase
  confirmarExpulsar(idUser: number) {
    this.claseService.expulsarUsuario(this.idClase, idUser).subscribe(() => {
      this.usuariosClase = this.usuariosClase.filter(u => u.id_user !== idUser);
      this.usuarioPendienteEliminar = null;
      this.cdr.detectChanges();
    });
  }

  // Carga la información básica de la clase
  cargarInfoClase() {
    this.claseService.fetchClaseById(this.idClase).subscribe({
      next: (clase: any) => {
        this.claseNombre = clase.nombre || `Clase ${this.idClase}`;
        this.cargarCodigoPersistente();
        this.cdr.detectChanges();
      }
    });
  }

  // Genera un nuevo código temporal
  generarNuevoCodigo() {
    if (!this.esModerador() && !this.esProfesor()) return;

    this.claseService.generarCodigoTemporal(this.idClase).subscribe(res => {
      this.codigoClase = res.codigo_temp;
      const expiresAt = Math.floor(Date.now() / 1000) + 60;

      localStorage.setItem(
        `codigoClase_${this.idClase}`,
        JSON.stringify({ codigo: this.codigoClase, expiresAt })
      );

      this.mostrarCodigo = true;
      this.activarTemporizador(expiresAt);
    });
  }

  // Recupera un código guardado si aún no expira
  cargarCodigoPersistente() {
    const json = localStorage.getItem(`codigoClase_${this.idClase}`);
    if (!json) return;

    const datos: CodigoPersistente = JSON.parse(json);
    const ahora = Math.floor(Date.now() / 1000);

    if (datos.expiresAt > ahora) {
      this.codigoClase = datos.codigo;
      this.mostrarCodigo = true;
      this.activarTemporizador(datos.expiresAt);
    }
  }

  // Controla el tiempo restante del código
  activarTemporizador(expiresAt: number) {
    if (this.temporizador) clearInterval(this.temporizador);

    const actualizar = () => {
      const ahora = Math.floor(Date.now() / 1000);
      this.tiempoRestante = expiresAt - ahora;

      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.mostrarCodigo = false;
        this.codigoClase = null;
        localStorage.removeItem(`codigoClase_${this.idClase}`);
      }

      this.cdr.detectChanges();
    };

    actualizar();
    this.temporizador = setInterval(actualizar, 1000);
  }

  // Carga los mensajes de la clase
  cargarMensajes() {
    this.mensajeService.fetchMensajes(this.idClase).subscribe(msgs => {
      this.mensajes = msgs;
      this.cdr.detectChanges();
    });
  }

  // Envía un nuevo mensaje
  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;

    this.mensajeService.enviarMensaje(this.idClase, this.user!.id, this.nuevoMensaje)
      .subscribe(() => {
        this.nuevoMensaje = '';
        this.cargarMensajes();
      });
  }

  // Elimina un mensaje
  confirmarEliminar(idMensaje: number) {
    this.mensajeService.eliminarMensaje(idMensaje).subscribe(() => {
      this.mensajes = this.mensajes.filter(m => m.id_mensaje !== idMensaje);
      this.mensajePendienteEliminar = null;
      this.cdr.detectChanges();
    });
  }

  // Actualiza los mensajes automáticamente cada 3 segundos
  iniciarActualizacionAutomatica() {
    this.pollingSubscription = interval(3000)
      .pipe(switchMap(() => this.mensajeService.fetchMensajes(this.idClase)))
      .subscribe(msgs => {
        this.mensajes = msgs;
        this.cdr.detectChanges();
      });
  }

  // Validaciones de roles
  esModerador() { return this.user?.rol === 'moderador'; }
  esProfesor() { return this.user?.rol === 'profesor'; }
  puedeEscribir() { return this.user?.rol === 'alumno'; }
}
