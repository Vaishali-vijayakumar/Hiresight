import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero-section fade-in">
      <div class="container hero-container">
        <div class="hero-content">
          <h1 class="hero-title">Precision Recruitment with <span class="highlight">HireSight</span></h1>
          <p class="hero-subtitle">
            Leverage advanced AI to screen resumes, extract insights, and find the perfect match for your team in seconds.
          </p>
          <div class="hero-actions">
            <a routerLink="/upload" class="btn btn-primary">Try Now</a>
            <a routerLink="/dashboard" class="btn btn-outline">Go to Dashboard</a>
          </div>
        </div>
        <div class="hero-graphic">
          <div class="abstract-shape"></div>
          <div class="dashboard-preview glass-card">
            <div class="preview-item">
              <span>Matching Accuracy</span>
              <div class="progress-bar"><div class="progress" style="width: 85%"></div></div>
              <span>85%</span>
            </div>
            <div class="preview-item">
              <span>Time Saved</span>
              <div class="progress-bar"><div class="progress" style="width: 70%"></div></div>
              <span>70h</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Why Choose <span class="highlight">HireSight</span>?</h2>
        <div class="features-grid">
          <div class="feature-card glass-card">
            <h3>AI-Powered Analysis</h3>
            <p>Our sophisticated models analyze every detail, extracting skills, experience, and sentiment.</p>
          </div>
          <div class="feature-card glass-card">
            <h3>Automated Scoring</h3>
            <p>Get instant ranking of candidates based on resume quality and JD relevance.</p>
          </div>
          <div class="feature-card glass-card">
            <h3>Fast and Secure</h3>
            <p>Experience lightning-fast processing with top-tier security for sensitive data.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      padding: 160px 0 100px;
      min-height: 100vh;
      display: flex;
      align-items: center;
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }
    .hero-title {
      font-size: 64px;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    .highlight {
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 20px;
      color: var(--text-main);
      margin-bottom: 40px;
      max-width: 500px;
    }
    .hero-actions {
      display: flex;
      gap: 20px;
    }
    .btn-outline {
      border: 1px solid var(--accent-color);
      color: var(--accent-color);
      padding: 12px 24px;
      border-radius: 8px;
    }
    .btn-outline:hover {
      background: var(--accent-color);
      color: var(--primary-bg);
    }
    .hero-graphic {
      position: relative;
    }
    .abstract-shape {
      position: absolute;
      width: 400px;
      height: 400px;
      background: var(--gradient);
      filter: blur(100px);
      opacity: 0.2;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .dashboard-preview {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .preview-item {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .progress-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background: var(--gradient);
    }
    .features-section {
      padding: 100px 0;
    }
    .section-title {
      text-align: center;
      font-size: 48px;
      margin-bottom: 60px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }
    .feature-card {
      padding: 40px;
      text-align: center;
      transition: transform 0.3s ease;
    }
    .feature-card:hover {
      transform: translateY(-10px);
      border-color: var(--accent-color);
    }
    .feature-card h3 {
      font-size: 24px;
      margin-bottom: 16px;
    }
    @media (max-width: 968px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-subtitle {
        margin: 0 auto 40px;
      }
      .hero-actions {
        justify-content: center;
      }
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {}
