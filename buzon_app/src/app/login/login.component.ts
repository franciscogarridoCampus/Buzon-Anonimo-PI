import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  correo = '';
  pass = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.loading = true;
    this.authService.login(this.correo, this.pass).subscribe({
      next: (res) => {
        let user: User;

        if ('user' in res) {
          user = (res as { user: User }).user;
        } else {
          user = res as User;
        }

        localStorage.setItem('user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Credenciales incorrectas o error de conexión';
        this.loading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
