import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [CommonModule, FormsModule, RouterModule] // necesario para *ngIf, *ngFor, ngModel y rutas
})
export class AppComponent {
  title = 'buzon_anonimo';
}
