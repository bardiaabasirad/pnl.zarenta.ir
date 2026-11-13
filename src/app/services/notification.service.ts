import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private audio: HTMLAudioElement;
  private lastPlay: { key: string; at: number } | null = null;
  private readonly dedupeWindowMs = 3000;

  constructor() {
    this.audio = new Audio();
  }

  public playCreatedSound(trackingCode?: string | number) {
    this.play('audio/new-01.mp3', this.buildKey('created', trackingCode));
  }

  public playSucceedSound(trackingCode?: string | number) {
    this.play('audio/succeed-01.mp3', this.buildKey('succeed', trackingCode));
  }

  public playRejectSound(trackingCode?: string | number) {
    this.play('audio/reject-01.mp3', this.buildKey('rejected', trackingCode));
  }

  private buildKey(type: string, trackingCode?: string | number): string {
    return trackingCode == null ? type : `${type}:${trackingCode}`;
  }

  private shouldPlay(key: string): boolean {
    const now = Date.now();
    if (this.lastPlay && this.lastPlay.key === key && now - this.lastPlay.at < this.dedupeWindowMs) {
      return false;
    }
    this.lastPlay = {key, at: now};
    return true;
  }

  private play(src: string, key: string) {
    if (!this.shouldPlay(key)) {
      return;
    }

    try {
      this.audio.src = src;
      this.audio.load();
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }
}
