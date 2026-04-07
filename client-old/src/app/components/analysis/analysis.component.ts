import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="analysis-container container fade-in" *ngIf="applicant">
      <div class="back-link">
        <a routerLink="/dashboard">← Back to Dashboard</a>
      </div>
      
      <div class="analysis-grid">
        <!-- Left: Summary Card -->
        <div class="summary-card glass-card">
          <div class="profile-header">
            <div class="profile-avatar">{{ applicant.first_name?.[0] }}</div>
            <div class="profile-info">
              <h1>{{ applicant.first_name }} {{ applicant.last_name }}</h1>
              <p>{{ applicant.email }}</p>
            </div>
          </div>
          
          <div class="score-display">
            <div class="radial-progress" [style.--value]="applicant.ai_score">
              <span class="score-num">{{ applicant.ai_score }}%</span>
              <span class="score-label">Match Score</span>
            </div>
          </div>

          <div class="status-actions">
            <label>Current Status: <strong>{{ applicant.status }}</strong></label>
            <div class="action-btns">
              <button (click)="setStatus('Shortlisted')" class="btn-status shortlist">Shortlist</button>
              <button (click)="setStatus('Rejected')" class="btn-status reject">Reject</button>
            </div>
          </div>
        </div>

        <!-- Right: Detailed Insights -->
        <div class="details-column">
          <div class="insight-card glass-card">
            <h3><span class="icon">✨</span> AI Insights</h3>
            <p class="insight-text">
              {{ applicant.summary }}
            </p>
            <div class="tone-badge" [class]="applicant.tone?.toLowerCase()">Tone: {{ applicant.tone }}</div>
          </div>

          <div class="skills-grid">
            <div class="skill-card glass-card">
              <h4>Hard Skills</h4>
              <div class="keyword-tags">
                <span *ngFor="let s of applicant.skills?.hard" class="tag hard">{{ s }}</span>
              </div>
            </div>
            <div class="skill-card glass-card">
              <h4>Other Keywords</h4>
              <div class="keyword-tags">
                <span *ngFor="let s of applicant.skills?.others" class="tag">{{ s }}</span>
              </div>
            </div>
          </div>

          <div class="entities-grid">
            <div class="entity-card glass-card">
              <h4>Organizations</h4>
              <ul>
                <li *ngFor="let org of applicant.entities?.organizations">{{ org }}</li>
              </ul>
            </div>
            <div class="entity-card glass-card">
              <h4>Extracted People</h4>
              <ul>
                <li *ngFor="let p of applicant.entities?.people">{{ p }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analysis-container { padding: 160px 0 100px; }
    .back-link { margin-bottom: 30px; }
    .back-link a { color: var(--accent-dim); display: flex; align-items: center; gap: 8px; }
    .back-link a:hover { color: var(--accent-color); }

    .analysis-grid { display: grid; grid-template-columns: 350px 1fr; gap: 40px; align-items: start; }
    
    .summary-card { padding: 40px; text-align: center; }
    .profile-header { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 30px; }
    .profile-avatar { width: 80px; height: 80px; background: var(--gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: var(--primary-bg); }
    
    .radial-progress { 
      width: 150px; height: 150px; border-radius: 50%; 
      background: conic-gradient(var(--accent-color) calc(var(--value) * 1%), rgba(255,255,255,0.1) 0);
      display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 30px;
      position: relative;
    }
    .radial-progress::after { content: ""; position: absolute; inset: 10px; background: var(--secondary-bg); border-radius: 50%; }
    .score-num { position: relative; z-index: 1; font-size: 32px; font-weight: 700; color: var(--white); }
    .score-label { position: relative; z-index: 1; font-size: 12px; color: var(--text-main); }

    .status-actions { border-top: 1px solid var(--glass-border); padding-top: 30px; }
    .action-btns { display: flex; gap: 12px; margin-top: 16px; justify-content: center; }
    .btn-status { padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .btn-status.shortlist { background: rgba(0, 255, 136, 0.1); color: var(--success); border: 1px solid var(--success); }
    .btn-status.reject { background: rgba(255, 77, 77, 0.1); color: var(--danger); border: 1px solid var(--danger); }

    .details-column { display: flex; flex-direction: column; gap: 30px; }
    .insight-card, .skill-card, .entity-card { padding: 30px; }
    .insight-card h3 { margin-bottom: 16px; color: var(--accent-color); }
    .insight-text { font-size: 18px; color: var(--white); line-height: 1.6; margin-bottom: 16px; }
    .tone-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; background: rgba(255,255,255,0.1); font-size: 12px; }

    .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .skill-card h4 { margin-bottom: 16px; font-size: 14px; color: var(--accent-dim); text-transform: uppercase; }
    .keyword-tags { display: flex; flex-wrap: wrap; gap: 10px; }
    .tag { background: rgba(255, 255, 255, 0.05); color: var(--text-main); padding: 6px 14px; border-radius: 20px; font-size: 13px; border: 1px solid var(--glass-border); }
    .tag.hard { background: rgba(102, 252, 241, 0.1); color: var(--accent-color); border-color: rgba(102, 252, 241, 0.2); }

    .entities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .entity-card h4 { margin-bottom: 12px; color: var(--accent-dim); }
    .entity-card ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .entity-card li { color: var(--text-main); font-size: 14px; }

    @media (max-width: 968px) {
      .analysis-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnalysisComponent implements OnInit {
  applicant: any = null;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getResumeDetail(id).subscribe({
        next: (data) => this.applicant = data,
        error: (err) => {
          console.error(err);
          // Fallback mock
          this.applicant = {
            first_name: 'David', last_name: 'Chen', email: 'd.chen@dev.com',
            ai_score: 88, status: 'Pending',
            keywords: ['Angular', 'TypeScript', 'Node.js', 'Cloud Architecture', 'System Design'],
            entities: { organizations: ['Google', 'Meta', 'Amazon'], people: ['David Chen'] }
          };
        }
      });
    }
  }

  setStatus(status: string) {
    if (!this.applicant.id) {
      this.applicant.status = status;
      return;
    }
    this.api.updateStatus(this.applicant.id, status).subscribe(() => this.applicant.status = status);
  }
}
