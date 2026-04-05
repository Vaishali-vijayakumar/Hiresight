import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UploadComponent } from './components/upload/upload.component';
import { AnalysisComponent } from './components/analysis/analysis.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'analysis/:id', component: AnalysisComponent },
  { path: '**', redirectTo: '' }
];
