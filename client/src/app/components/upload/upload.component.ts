import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container container fade-in">
      <div class="upload-card glass-card">
        <h1 class="upload-title">Connect Your <span class="highlight">Future</span></h1>
        <p class="upload-subtitle">Drag and drop your professional resume for instant AI analysis.</p>

        <div class="drop-zone" [class.dragover]="isDragging" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)" (click)="fileInput.click()">
          <div class="drop-icon">📄</div>
          <span class="drop-label">{{ selectedFile ? selectedFile.name : 'Choose a file or drag it here' }}</span>
          <span class="drop-hint">PDF or DOCX (Max 10MB)</span>
          <input type="file" #fileInput (change)="onFileSelected($event)" hidden accept=".pdf,.doc,.docx">
        </div>

        <div class="user-fields" *ngIf="selectedFile">
          <div class="field-group">
            <input type="text" placeholder="First Name" [(ngModel)]="firstName" class="glass-input">
            <input type="text" placeholder="Last Name" [(ngModel)]="lastName" class="glass-input">
          </div>
          <input type="email" placeholder="Email Address" [(ngModel)]="email" class="glass-input">
        </div>

        <div class="upload-actions" *ngIf="selectedFile">
          <button (click)="upload()" class="btn btn-primary" [disabled]="isUploading">
            <span *ngIf="!isUploading">Analyze Resume</span>
            <span *ngIf="isUploading">Processing...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container { padding: 160px 0 100px; display: flex; justify-content: center; }
    .upload-card { padding: 60px; max-width: 700px; width: 100%; text-align: center; }
    .upload-title { font-size: 48px; margin-bottom: 16px; }
    .upload-subtitle { color: var(--text-main); margin-bottom: 40px; }
    .highlight { color: var(--accent-color); }

    .drop-zone { border: 2px dashed var(--glass-border); padding: 60px; border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 12px; transition: all 0.3s ease; background: rgba(255, 255, 255, 0.02); }
    .drop-zone.dragover { border-color: var(--accent-color); background: rgba(102, 252, 241, 0.05); }
    .drop-icon { font-size: 48px; }
    .drop-label { font-weight: 600; color: var(--white); }
    .drop-hint { font-size: 13px; color: var(--text-main); opacity: 0.6; }

    .user-fields { margin-top: 30px; display: flex; flex-direction: column; gap: 16px; }
    .field-group { display: flex; gap: 16px; }
    .glass-input { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px 16px; color: var(--white); outline: none; }
    .glass-input:focus { border-color: var(--accent-color); }
    .upload-actions { margin-top: 30px; }
  `]
})
export class UploadComponent {
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  firstName = '';
  lastName = '';
  email = '';

  constructor(private api: ApiService, private router: Router) {}

  onFileSelected(event: any) { this.selectedFile = event.target.files[0]; }
  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files?.[0]) this.selectedFile = event.dataTransfer.files[0];
  }

  upload() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('resume', this.selectedFile);
    formData.append('first_name', this.firstName);
    formData.append('last_name', this.lastName);
    formData.append('email', this.email);

    this.api.uploadResume(formData).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.id) this.router.navigate(['/analysis', res.id]);
        else this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload Error:', err);
        // Fallback for demo
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
