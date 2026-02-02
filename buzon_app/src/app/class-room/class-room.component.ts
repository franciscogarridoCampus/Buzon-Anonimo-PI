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

  user?: User;
  idClase!: number;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  claseNombre = 'Cargando...';

  // --- ESTILOS VISUALES SINCRONIZADOS ---
  bannerColor: string = 'bg-primary';
  bannerImagen: string | null = null;

  // Navegación
  tabActiva: 'tablon' | 'personas' = 'tablon';
  usuariosClase: any[] = [];

  // Código Temporal
  codigoClase: string | null = null;
  mostrarCodigo = false;
  tiempoRestante = 0;

  // Estados de eliminación
  mensajePendienteEliminar: number | null = null;
  usuarioPendienteEliminar: number | null = null;

  private temporizador?: ReturnType<typeof setInterval>;
  private pollingSubscription?: Subscription;

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

    // RECUPERAR ESTILOS DEL DASHBOARD
    this.bannerColor = localStorage.getItem(`clase-color-${this.idClase}`) || 'bg-primary';
    this.bannerImagen = localStorage.getItem(`clase-img-${this.idClase}`);

    this.cargarInfoClase();
    this.cargarMensajes();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
  }

  cambiarTab(tab: 'tablon' | 'personas') {
    this.tabActiva = tab;
    if (tab === 'personas') this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.claseService.fetchUsuariosClase(this.idClase).subscribe(users => {
      this.usuariosClase = users;
      this.cdr.detectChanges();
    });
  }

  confirmarExpulsar(idUser: number) {
    this.claseService.expulsarUsuario(this.idClase, idUser).subscribe(() => {
      this.usuariosClase = this.usuariosClase.filter(u => u.id_user !== idUser);
      this.usuarioPendienteEliminar = null;
      this.cdr.detectChanges();
    });
  }

  cargarInfoClase() {
    this.claseService.fetchClaseById(this.idClase).subscribe({
      next: (clase: any) => {
        this.claseNombre = clase.nombre || `Clase ${this.idClase}`;
        this.cargarCodigoPersistente();
        this.cdr.detectChanges();
      }
    });
  }

  generarNuevoCodigo() {
    if (!this.esModerador() && !this.esProfesor()) return;
    this.claseService.generarCodigoTemporal(this.idClase).subscribe(res => {
      this.codigoClase = res.codigo_temp;
      const expiresAt = Math.floor(Date.now() / 1000) + 60;
      localStorage.setItem(`codigoClase_${this.idClase}`, JSON.stringify({ codigo: this.codigoClase, expiresAt }));
      this.mostrarCodigo = true;
      this.activarTemporizador(expiresAt);
    });
  }

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

  confirmarEliminar(idMensaje: number) {
    this.mensajeService.eliminarMensaje(idMensaje).subscribe(() => {
      this.mensajes = this.mensajes.filter(m => m.id_mensaje !== idMensaje);
      this.mensajePendienteEliminar = null;
      this.cdr.detectChanges();
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;
    this.mensajeService.enviarMensaje(this.idClase, this.user!.id, this.nuevoMensaje).subscribe(() => {
      this.nuevoMensaje = '';
      this.cargarMensajes();
    });
  }

  cargarMensajes() {
    this.mensajeService.fetchMensajes(this.idClase).subscribe(msgs => {
      this.mensajes = msgs;
      this.cdr.detectChanges();
    });
  }

  iniciarActualizacionAutomatica() {
    this.pollingSubscription = interval(3000)
      .pipe(switchMap(() => this.mensajeService.fetchMensajes(this.idClase)))
      .subscribe(msgs => {
        this.mensajes = msgs;
        this.cdr.detectChanges();
      });
  }

  esModerador() { return this.user?.rol === 'moderador'; }
  esProfesor() { return this.user?.rol === 'profesor'; }
  puedeEscribir() { return this.user?.rol === 'alumno'; }
  volverDashboard() { this.router.navigate(['/dashboard']); }
}