import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container container fade-in">
      <div class="dashboard-header">
        <h1>Applicant <span class="highlight">Insights</span></h1>
        <div class="stats-grid">
          <div class="stat-card glass-card"><span>Total Applicants</span><span class="stat-value">{{ applicants.length }}</span></div>
          <div class="stat-card glass-card"><span>Avg. Score</span><span class="stat-value">{{ avgScore }}%</span></div>
          <div class="stat-card glass-card"><span>Shortlisted</span><span class="stat-value">{{ countByStatus('Shortlisted') }}</span></div>
        </div>
      </div>

      <div class="applicants-section glass-card">
        <div class="section-top">
          <h2>Recent Resumes</h2>
          <div class="filter-controls">
            <input type="text" placeholder="Search by name or keyword..." class="search-input glass-card" (input)="filterApplicants($event)">
          </div>
        </div>

        <table class="applicants-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Status</th>
              <th>AI Score</th>
              <th>Uploaded At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let app of filteredApplicants">
              <td>
                <div class="user-info">
                  <div class="user-avatar">{{ app.first_name?.[0] || 'A' }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ app.first_name }} {{ app.last_name }}</span>
                    <span class="user-email">{{ app.email }}</span>
                  </div>
                </div>
              </td>
              <td><span class="status-badge" [class]="app.status.toLowerCase()">{{ app.status }}</span></td>
              <td>
                <div class="score-container">
                  <div class="score-bar"><div class="score-fill" [style.width.%]="app.ai_score"></div></div>
                  <span>{{ app.ai_score }}%</span>
                </div>
              </td>
              <td class="date-cell">{{ app.created_at | date:'mediumDate' }}</td>
              <td>
                <a [routerLink]="['/analysis', app.id]" class="view-btn">View Analysis</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 160px 0 100px; }
    .dashboard-header { margin-bottom: 40px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; }
    .stat-card { padding: 24px; display: flex; flex-direction: column; gap: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; color: var(--accent-color); }
    .highlight { color: var(--accent-color); }
    
    .applicants-section { padding: 30px; }
    .section-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .search-input { border: 1px solid var(--glass-border); padding: 8px 20px; border-radius: 20px; color: var(--white); outline: none; width: 300px; }
    .search-input:focus { border-color: var(--accent-color); }

    .applicants-table { width: 100%; border-collapse: collapse; text-align: left; }
    .applicants-table th { padding: 16px; border-bottom: 1px solid var(--glass-border); color: var(--accent-dim); text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
    .applicants-table td { padding: 20px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

    .user-info { display: flex; align-items: center; gap: 12px; }
    .user-avatar { width: 40px; height: 40px; background: var(--gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-bg); font-weight: 700; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: var(--white); }
    .user-email { font-size: 13px; color: var(--text-main); }

    .score-container { display: flex; align-items: center; gap: 10px; min-width: 140px; }
    .score-bar { height: 6px; flex-grow: 1; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; background: var(--gradient); }

    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.shortlisted { background: rgba(0, 255, 136, 0.1); color: var(--success); }
    .status-badge.pending { background: rgba(255, 255, 255, 0.1); color: var(--text-main); }
    .status-badge.rejected { background: rgba(255, 77, 77, 0.1); color: var(--danger); }

    .view-btn { padding: 6px 16px; border-radius: 6px; border: 1px solid var(--accent-color); color: var(--accent-color); font-size: 13px; }
    .view-btn:hover { background: var(--accent-color); color: var(--primary-bg); }
  `]
})
export class DashboardComponent implements OnInit {
  applicants: any[] = [];
  filteredApplicants: any[] = [];
  avgScore: number = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Mock data for initial visualization if backend is not running
    this.applicants = [
      { id: '1', first_name: 'Alex', last_name: 'Johnson', email: 'alex.j@example.com', status: 'Shortlisted', ai_score: 92, created_at: new Date() },
      { id: '2', first_name: 'Sarah', last_name: 'Williams', email: 's.williams@tech.io', status: 'Pending', ai_score: 75, created_at: new Date() },
      { id: '3', first_name: 'David', last_name: 'Chen', email: 'd.chen@dev.com', status: 'Pending', ai_score: 88, created_at: new Date() },
      { id: '4', first_name: 'Emily', last_name: 'Davis', email: 'emily.d@corp.com', status: 'Rejected', ai_score: 45, created_at: new Date() },
    ];
    this.filteredApplicants = [...this.applicants];
    this.calculateStats();

    // Actual fetch
    this.api.getApplicants().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.applicants = data;
          this.filteredApplicants = [...this.applicants];
          this.calculateStats();
        }
      },
      error: (err) => console.log('API Error (expected if server not started):', err)
    });
  }

  calculateStats() {
    if (this.applicants.length === 0) return;
    const totalScore = this.applicants.reduce((sum, app) => sum + (app.ai_score || 0), 0);
    this.avgScore = Math.round(totalScore / this.applicants.length);
  }

  countByStatus(status: string) {
    return this.applicants.filter(a => a.status === status).length;
  }

  filterApplicants(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredApplicants = this.applicants.filter(a => 
      a.first_name.toLowerCase().includes(query) || 
      a.last_name.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query)
    );
  }
}
