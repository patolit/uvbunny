import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../services/firebase';

@Component({
  selector: 'bunny-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @Input() avatarUrl: string | null = null;
  @Input() bunnyId!: string;
  @Output() avatarUploaded = new EventEmitter<string>();

  private firebaseService = inject(FirebaseService);
  uploading = false;
  error: string | null = null;

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploading = true;
    this.error = null;
    try {
      // Read file as base64
      const base64 = await this.readFileAsBase64(file);
      // Call the backend function using FirebaseService
      this.firebaseService.uploadBunnyAvatar(this.bunnyId, base64, file.type)
        .subscribe({
          next: (result: any) => {
            if (result && result.avatarUrl) {
              this.avatarUploaded.emit(result.avatarUrl);
            } else {
              this.error = result?.error || 'Upload failed';
            }
            this.uploading = false;
          },
          error: (err: any) => {
            this.error = err.message || 'Upload failed';
            this.uploading = false;
          }
        });
    } catch (err: any) {
      this.error = err.message || 'Upload failed';
      this.uploading = false;
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix if present
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
