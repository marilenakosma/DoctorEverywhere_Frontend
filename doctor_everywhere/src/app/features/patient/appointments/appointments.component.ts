import { Component, inject, OnInit } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { PatientService } from '../services/patient.service';
import { Appointment } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [NgClass, CommonModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private svc = inject(PatientService);

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
      next: a => {
        this.appointments = a;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get today(): string { return new Date().toISOString().split('T')[0]; }

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

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  canCancel(a: Appointment): boolean {
    return a.date >= this.today &&
           a.status !== 'cancelled' &&
           a.status !== 'rejected';
  }
}