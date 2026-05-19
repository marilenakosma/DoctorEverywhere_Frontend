import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private svc = inject(PatientService);
  private cdr = inject(ChangeDetectorRef);

  appointments: Appointment[] = [];
  loading    = true;
  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  cancellingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getMyAppointments().subscribe({
      next: a => { this.appointments = a; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

get today(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Athens'
  }); // returns YYYY-MM-DD in Athens time
}

  get upcoming(): Appointment[] {
    return this.appointments.filter(a =>
      a.date >= this.today &&
      a.status !== 'cancelled' &&
      a.status !== 'rejected'
    );
  }

  get past(): Appointment[] {
    return this.appointments.filter(a =>
      a.date < this.today &&
      a.status !== 'cancelled' &&
      a.status !== 'rejected'
    );
  }

  get cancelled(): Appointment[] {
    return this.appointments.filter(a =>
      a.status === 'cancelled' || a.status === 'rejected'
    );
  }

  get activeList(): Appointment[] {
    return this.activeTab === 'upcoming' ? this.upcoming
         : this.activeTab === 'past'     ? this.past
         : this.cancelled;
  }

  cancel(id: string): void {
    this.cancellingId = id;
    this.svc.cancelAppointment(id).subscribe({
      next: () => {
        const a = this.appointments.find(x => x.id === id);
        if (a) { a.status = 'cancelled'; a.statusId = 2; }
        this.cancellingId = null;
        this.cdr.detectChanges();
      },
      error: () => { this.cancellingId = null; }
    });
  }

  statusClass(s: string): string {
    return ({
      confirmed:   'status-confirmed',
      pending:     'status-pending',
      rejected:    'status-rejected',
      rescheduled: 'status-modified',
      cancelled:   'status-cancelled',
    } as Record<string, string>)[s] ?? '';
  }

  canCancel(a: Appointment): boolean {
    return a.date >= this.today &&
           a.status !== 'cancelled' &&
           a.status !== 'rejected';
  }

  getDate(startingAt: string): string {
  return new Date(startingAt).toLocaleDateString('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }); // returns YYYY-MM-DD
}

getTime(startingAt: string): string {
  return new Date(startingAt).toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Athens',
    hour: '2-digit', minute: '2-digit'
  });
}

formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    timeZone: 'Europe/Athens',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}
}
