import { Component, signal } from '@angular/core';
import { Layout } from '@shared/presentation/components/layout/layout';

@Component({
  imports: [Layout],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App {
  protected readonly title = signal('ice-track-frontend');
}
