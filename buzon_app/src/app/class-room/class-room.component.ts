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

  user?: User;
  idClase!: number;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  errorMessage = '';

  claseNombre = 'Cargando...';
  codigoClase: string | null = null;
  mostrarCodigo = false;
  tiempoRestante = 0;

  private temporizador?: ReturnType<typeof setInterval>;
  private pollingSubscription?: Subscription;

  // id_autor -> numero anonimo
  private aliasMap = new Map<number, number>();

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
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
  }

  cargarInfoClase() {
    this.claseService.fetchClaseById(this.idClase).subscribe({
      next: (clase: any) => {
        this.claseNombre = clase.nombre || `Clase ${this.idClase}`;
        this.codigoClase = null;
        this.mostrarCodigo = false;
        this.tiempoRestante = 0;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarActualizacionAutomatica() {
    this.pollingSubscription = interval(3000)
      .pipe(switchMap(() => this.mensajeService.fetchMensajes(this.idClase)))
      .subscribe(msgs => {
        this.mensajes = msgs;
        this.limpiarAliases(msgs);
        this.cdr.detectChanges();
      });
  }

  getAlias(idAutor: number): string {
    if (!this.aliasMap.has(idAutor)) {
      const usados = Array.from(this.aliasMap.values());
      let n = 1;
      while (usados.includes(n)) n++;
      this.aliasMap.set(idAutor, n);
    }
    return `Anónimo ${this.aliasMap.get(idAutor)}`;
  }

  limpiarAliases(msgs: Mensaje[]) {
    const autores = new Set(msgs.map(m => m.id_autor));
    this.aliasMap.forEach((_, key) => {
      if (!autores.has(key)) this.aliasMap.delete(key);
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.puedeEscribir()) return;

    this.mensajeService.enviarMensaje(
      this.idClase,
      this.user!.id,
      this.nuevoMensaje
    ).subscribe(() => {
      this.nuevoMensaje = '';
      this.cargarMensajes();
    });
  }

  esModerador() { return this.user?.rol === 'moderador'; }
  esProfesor() { return this.user?.rol === 'profesor'; }
  puedeEscribir() { return this.user?.rol === 'alumno'; }

  generarNuevoCodigo() {
    if (!this.esModerador() && !this.esProfesor()) return;

    if (this.temporizador) clearInterval(this.temporizador);
    this.codigoClase = 'Generando...';
    this.mostrarCodigo = true;

    this.claseService.generarCodigoTemporal(this.idClase).subscribe(res => {
      this.codigoClase = res.codigo_temp;
      this.activarTemporizador();
    });
  }

  activarTemporizador() {
    this.tiempoRestante = 60;
    this.temporizador = setInterval(() => {
      this.tiempoRestante--;
      if (this.tiempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.codigoClase = null;
        this.mostrarCodigo = false;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  volverDashboard() { this.router.navigate(['/dashboard']); }

  cargarMensajes() {
    this.mensajeService.fetchMensajes(this.idClase).subscribe(msgs => {
      this.mensajes = msgs;
      this.limpiarAliases(msgs);
      this.cdr.detectChanges();
    });
  }
}
