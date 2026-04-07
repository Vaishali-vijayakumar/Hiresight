import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar glass-card">
      <div class="nav-container">
        <a routerLink="/" class="logo">
          <span class="highlight">Hire</span>Sight
        </a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/upload" routerLinkActive="active">Upload Resume</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 1200px;
      z-index: 1000;
      padding: 10px 40px;
      border-radius: 50px;
    }
    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      color: var(--white);
    }
    .highlight {
      color: var(--accent-color);
    }
    .nav-links {
      display: flex;
      gap: 30px;
    }
    .nav-links a {
      font-weight: 500;
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 20px;
    }
    .nav-links a:hover, .nav-links a.active {
      color: var(--accent-color);
      background: rgba(102, 252, 241, 0.1);
    }
  `]
})
export class NavbarComponent {}
