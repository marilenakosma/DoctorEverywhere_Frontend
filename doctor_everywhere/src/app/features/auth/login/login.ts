import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  errorMessage = '';
  showPassword = false;

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.auth.login(this.form.value as any).subscribe({
      error: (msg: string) => { this.errorMessage = msg; this.loading = false; }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
}
