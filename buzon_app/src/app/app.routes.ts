import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClassRoomComponent } from './class-room/class-room.component';
import { AuthGuard } from './guards/auth-guard'; // Asegúrate que la ruta coincide con tu carpeta de guards

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard] // ✔ Protegida
  },
  {
    path: 'class-room/:id',
    component: ClassRoomComponent,
    canActivate: [AuthGuard] // ✔ Protegida
  },
  { path: '**', redirectTo: '/login' }
];
