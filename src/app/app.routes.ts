import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { DetailsPage } from './pages/details-page/details-page';
import { ConfigurationPage } from './pages/configuration-page/configuration-page';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'details', component: DetailsPage },
  { path: 'configuration', component: ConfigurationPage },
  { path: '**', redirectTo: '/home' }
];
