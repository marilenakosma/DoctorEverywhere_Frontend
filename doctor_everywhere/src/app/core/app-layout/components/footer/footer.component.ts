import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer mt-auto py-2 bg-light border-top">
      <div class="container text-center">
        <span class="text-muted">© 2026 DoctorEverywhere</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      width: 100%;
    }
  `]
})
export class FooterComponent { }
