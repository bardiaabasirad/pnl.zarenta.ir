import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
  }

  public playCreatedSound() {
    try {
      this.audio.src = 'assets/audio/new-01.mp3';
      this.audio.load();
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  public playSucceedSound() {
    try {
      this.audio.src = 'assets/audio/succeed-01.mp3';
      this.audio.load();
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  public playRejectSound() {
    try {
      this.audio.src = 'assets/audio/reject-01.mp3';
      this.audio.load();
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }
}
