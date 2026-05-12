import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterRequest } from '../../../shared/models/auth.model';
import { UserRole } from '../../../shared/models/user-identity.model';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    role:      [UserRole.Patient, Validators.required],
    specialty:     [''],
    licenseNumber: [''],
    address:       [''],
    password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirm = false;

  readonly roles = [
    { value: UserRole.Patient, label: 'Patient',  description: 'Book & manage appointments' },
    { value: UserRole.Doctor,  label: 'Doctor',   description: 'Manage availability & patients' },
  ];

  ngOnInit(): void {
    this.role.valueChanges.subscribe((role: UserRole | null) => {
      if (role === UserRole.Doctor) {
        this.specialty.setValidators([Validators.required]);
        this.licenseNumber.setValidators([Validators.required]);
      } else {
        this.specialty.clearValidators();
        this.licenseNumber.clearValidators();
      }
      this.specialty.updateValueAndValidity();
      this.licenseNumber.updateValueAndValidity();
    });
  }

  get firstName()       { return this.form.get('firstName')!; }
  get lastName()        { return this.form.get('lastName')!; }
  get email()           { return this.form.get('email')!; }
  get role()            { return this.form.get('role')!; }
  get specialty()       { return this.form.get('specialty')!; }
  get licenseNumber()   { return this.form.get('licenseNumber')!; }
  get address()         { return this.form.get('address')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  get isDoctor(): boolean { return this.role.value === UserRole.Doctor; }
  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.confirmPassword.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    const { confirmPassword, ...payload } = this.form.value;
    this.auth.register(payload as RegisterRequest).subscribe({
      error: (msg: string) => { this.errorMessage = msg; this.loading = false; }
    });
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') this.showPassword = !this.showPassword;
    else this.showConfirm = !this.showConfirm;
  }
}
