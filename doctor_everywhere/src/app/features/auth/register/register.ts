import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { UserRole } from '../../../shared/models/user-identity.model';

function noSpacesValidator(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value.includes(' ')
    ? { noSpaces: true }
    : null;
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw      = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading      = false;
  errorMessage = '';
  showPassword = false;
  showConfirm  = false;
  geocoding    = false;

  readonly roles = [
    { value: UserRole.Patient, label: 'Patient',  description: 'Book & manage appointments' },
    { value: UserRole.Doctor,  label: 'Doctor',   description: 'Manage availability & patients' },
  ];

  readonly specialties = [
    { value: 0, label: 'General Practitioner' },
    { value: 1, label: 'Cardiologist' },
    { value: 2, label: 'Dermatologist' },
    { value: 3, label: 'Neurologist' },
    { value: 4, label: 'Pediatrician' },
    { value: 5, label: 'Psychiatrist' },
    { value: 6, label: 'Orthopedic' },
    { value: 7, label: 'Gynecologist' },
    { value: 8, label: 'Dentist' },
    { value: 9, label: 'Ophthalmologist' },
  ];

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username:         ['', [Validators.required, Validators.minLength(3), noSpacesValidator]],
      firstName:        ['', [Validators.required, Validators.minLength(2)]],
      lastName:         ['', [Validators.required, Validators.minLength(2)]],
      role:             [UserRole.Patient, Validators.required],
      specialty:        [0],
      officeName:       [''],
      officeAddress:    [''],
      officeCity:       [''],
      officePostalCode: [''],
      password:         ['', [Validators.required, Validators.minLength(8)]],  // ← 8 chars
      confirmPassword:  ['', Validators.required],
    }, { validators: passwordMatchValidator });

    this.role.valueChanges.subscribe((role: UserRole) => {
      const doctorFields = ['officeName', 'officeAddress', 'officeCity', 'officePostalCode'];
      doctorFields.forEach(f => {
        const ctrl = this.form.get(f)!;
        role === UserRole.Doctor
          ? ctrl.setValidators([Validators.required])
          : ctrl.clearValidators();
        ctrl.updateValueAndValidity();
      });
    });
  }

  get username()         { return this.form.get('username')!; }
  get firstName()        { return this.form.get('firstName')!; }
  get lastName()         { return this.form.get('lastName')!; }
  get role()             { return this.form.get('role')!; }
  get officeName()       { return this.form.get('officeName')!; }
  get officeAddress()    { return this.form.get('officeAddress')!; }
  get officeCity()       { return this.form.get('officeCity')!; }
  get officePostalCode() { return this.form.get('officePostalCode')!; }
  get password()         { return this.form.get('password')!; }
  get confirmPassword()  { return this.form.get('confirmPassword')!; }

  get isDoctor(): boolean { return this.role.value === UserRole.Doctor; }
  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.confirmPassword.touched;
  }

  get passwordValue(): string { return this.password.value ?? ''; }
  get hasMinLength(): boolean { return this.passwordValue.length >= 8; }  // ← 8 chars
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
    if (!this.passwordValue || this.strengthScore === 0) return '';
    if (index >= this.strengthScore) return '';
    const classes = ['active-weak', 'active-fair', 'active-good', 'active-strong'];
    return classes[this.strengthScore - 1];
  }

  private async geocodeAddress(): Promise<{ lat: number; lng: number } | null> {
    const address = this.form.get('officeAddress')!.value;
    const city    = this.form.get('officeCity')!.value;
    const postal  = this.form.get('officePostalCode')!.value;

    const q1 = `${address}, ${postal} ${city}, Greece`;
    const r1  = await this.nominatim(q1);
    if (r1) return r1;

    const q2 = `${address}, ${city}, Greece`;
    const r2  = await this.nominatim(q2);
    if (r2) return r2;

    return await this.nominatim(`${city}, Greece`);
  }

  private async nominatim(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url     = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gr`;
      const res     = await fetch(url);
      const results = await res.json();
      if (results?.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
      return null;
    } catch { return null; }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading      = true;
    this.errorMessage = '';

    const v = this.form.value;

    if (v.role === UserRole.Doctor) {
      this.geocoding = true;
      const coords = await this.geocodeAddress();
      this.geocoding = false;

      if (!coords) {
        this.errorMessage = 'Could not find coordinates for this address. Please check and try again.';
        this.loading = false;
        return;
      }

      const payload = {
        username: v.username, password: v.password,
        firstName: v.firstName, lastName: v.lastName,
        specialty: Number(v.specialty),
        officeName: v.officeName, officeAddress: v.officeAddress,
        officeCity: v.officeCity, officePostalCode: v.officePostalCode,
        latitude: coords.lat, longitude: coords.lng,
        role: v.role,
      };

      this.authService.register(payload).subscribe({
        next: () => { this.loading = false; },
        error: (msg: string) => { this.errorMessage = msg; this.loading = false; }
      });

    } else {
      const payload = {
        username: v.username, password: v.password,
        firstName: v.firstName, lastName: v.lastName,
        role: v.role,
      };

      this.authService.register(payload).subscribe({
        next: () => { this.loading = false; },
        error: (msg: string) => { this.errorMessage = msg; this.loading = false; }
      });
    }
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') this.showPassword = !this.showPassword;
    else this.showConfirm = !this.showConfirm;
  }
}