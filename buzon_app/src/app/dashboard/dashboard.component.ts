import { Component, OnInit,ChangeDetectorRef  } from '@angular/core';
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

  
constructor(private claseService: ClaseService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
   

     //this.cargarClases();
    const userStorage = localStorage.getItem('user');

      

    if (!userStorage) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = JSON.parse(userStorage);
     console.log("🔵 ngOnInit ejecutado");
       console.log("➡️ Ejecutando cargarClases()", this.user);
    this.cargarClases(); // Carga las clases al iniciar
  }

  cargarClases() {
  console.log("➡️ Ejecutando cargarClases()", this.user);

  this.claseService.fetchClases(this.user.id, this.user.rol).subscribe({
    next: (clases) => {
      console.log("📦 Clases recibidas desde API:", clases);

      if (clases && clases.length > 0) {
        console.log("🔍 Primera clase recibida:", clases[0]);
      }

      // 👇👇👇 INSERTA ESTO AQUÍ
      this.clases = clases;
      this.cdr.detectChanges();   // fuerza a Angular a refrescar
      console.log("👀 Clases en el componente:", this.clases);
      // ☝️☝️☝️
    },
    error: (err) => {
      console.error("❌ ERROR en fetchClases:", err);
      this.errorMessage = 'Error cargando clases';
    }
  });
}





  abrirModalCrearClase() {
    this.nuevoNombre = '';
    this.errorMessage = ''; // Limpiar errores al abrir el modal
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
      return; // Valida que el nombre no esté vacío
    }

    // --- AJUSTE CLAVE: Validación para nombres duplicados ---
    const nombreDuplicado = this.clases.some(clase => 
      clase.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (nombreDuplicado) {
      this.errorMessage = `Ya existe una clase con el nombre "${nombreLimpio}".`;
      // Opcional: podrías usar alert, pero actualizar la propiedad errorMessage 
      // y mostrarla en el modal es mejor práctica.
      return; 
    }
    // --------------------------------------------------------

    const nuevoCodigo = this.generarCodigoAleatorio();
    this.claseService.crearClase(nombreLimpio, nuevoCodigo, this.user.id).subscribe({
      next: () => {
        this.cerrarModalCrearClase(); // Cierra el modal solo si la creación es exitosa
        this.cargarClases();
      },
      error: () => (this.errorMessage = 'No se pudo crear la clase')
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
      }
    });
  }

  entrarClase(clase: Clase) {
    this.router.navigate(['/class-room', clase.id_clase]);
  }

  unirseClase() {
    const codigo = prompt('Ingresa el código temporal de la clase:');
    if (!codigo || !codigo.trim()) return;
    
    this.claseService.unirseClase(this.user.id, codigo.trim()).subscribe({
      next: () => {
        alert('¡Te has unido a la clase!');
        this.cargarClases();
      },
      error: (err) => {
        this.errorMessage = 'No se pudo unir a la clase. Código incorrecto o ya estás unido.';
        alert('No se pudo unir a la clase. Código incorrecto.');
        console.error(err);
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  esModerador(): boolean {
    return this.user.rol === 'moderador';
  }
}