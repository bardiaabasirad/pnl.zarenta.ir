import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AppUpdateService } from '../services/app-update.service';

@Injectable()
export class ChunkLoadErrorHandler implements ErrorHandler {
  private readonly appUpdate = inject(AppUpdateService);

  handleError(error: unknown): void {
    if (this.isChunkLoadError(error)) {
      this.appUpdate.reloadOnce();
      return;
    }

    console.error(error);
  }

  private isChunkLoadError(error: unknown): boolean {
    const message = this.extractMessage(error);
    return (
      /ChunkLoadError/i.test(message) ||
      /Loading chunk [\w-]+ failed/i.test(message) ||
      /Failed to fetch dynamically imported module/i.test(message) ||
      /error loading dynamically imported module/i.test(message) ||
      /Importing a module script failed/i.test(message)
    );
  }

  private extractMessage(error: unknown): string {
    if (!error) {
      return '';
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return `${error.name} ${error.message}`;
    }

    if (typeof error === 'object') {
      const maybe = error as { message?: unknown; rejection?: unknown; error?: unknown };
      const parts = [maybe.message, maybe.rejection, maybe.error]
        .map((part) => this.extractMessage(part))
        .filter(Boolean);
      return parts.join(' ');
    }

    return String(error);
  }
}
