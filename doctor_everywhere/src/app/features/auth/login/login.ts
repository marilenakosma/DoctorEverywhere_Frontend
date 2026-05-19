import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value.includes(' ')
    ? { noSpaces: true }
    : null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading      = false;
  errorMessage = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), noSpacesValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }

  get passwordValue(): string { return this.password.value ?? ''; }
  get hasMinLength(): boolean { return this.passwordValue.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.passwordValue); }
  get hasNumber(): boolean    { return /[0-9]/.test(this.passwordValue); }
  get hasSpecial(): boolean   { return /[^A-Za-z0-9]/.test(this.passwordValue); }

  get strengthScore(): number {
    return [this.hasMinLength, this.hasUppercase, this.hasNumber, this.hasSpecial]
      .filter(Boolean).length;
  }

  get strengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.strengthScore] ?? '';
  }

  get strengthClass(): string {
    const classes = ['', 'weak', 'fair', 'good', 'strong'];
    return classes[this.strengthScore] ?? '';
  }

  barClass(index: number): string {
    if (this.strengthScore === 0 || !this.passwordValue) return '';
    if (index >= this.strengthScore) return '';
    const classes = ['active-weak', 'active-fair', 'active-good', 'active-strong'];
    return classes[this.strengthScore - 1];
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading      = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => { this.loading = false; },
      error: () => {
        this.loading      = false;
        this.errorMessage = 'Incorrect username or password. Please try again.';
      }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
}