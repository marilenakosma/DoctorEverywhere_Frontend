import { Component, inject, OnInit } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { PatientService } from '../services/patient.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [NgClass, CommonModule],
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
      next: a => {
        this.appointments = a;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    this.svc.getMyAppointments().subscribe({
      next: a => { this.appointments = a; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get today(): string { return new Date().toISOString().split('T')[0]; }

  get upcoming(): Appointment[] {
    return this.appointments.filter(a =>
      a.date >= this.today &&
      a.status !== 'cancelled' &&
      a.status !== 'rejected'
      a.startingAt.split('T')[0] >= this.today && a.statusId !== AppointmentStatus.Cancelled
    );
  }

  get past(): Appointment[] {
    return this.appointments.filter(a =>
      a.date < this.today &&
      a.status !== 'cancelled' &&
      a.status !== 'rejected'
      a.startingAt.split('T')[0] < this.today && a.statusId !== AppointmentStatus.Cancelled
    );
  }

  get cancelled(): Appointment[] {
    return this.appointments.filter(a =>
      a.status === 'cancelled' || a.status === 'rejected'
    );
    return this.appointments.filter(a => a.statusId === AppointmentStatus.Cancelled);
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
  cancel(id: number): void {
    this.svc.cancelAppointment(id).subscribe(() => {
      const a = this.appointments.find(x => x.id === id);
      if (a) a.statusId = AppointmentStatus.Cancelled;
      this.cdr.detectChanges();
    });
  }

  getDate(startingAt: string): string { return startingAt.split('T')[0]; }
  getTime(startingAt: string): string { return startingAt.split('T')[1].slice(0, 5); }

  statusLabel(statusId: AppointmentStatus): string {
    return AppointmentStatus[statusId]?.toLowerCase() ?? 'unknown';
  }

  statusClass(statusId: AppointmentStatus): string {
    const map: Record<number, string> = {
      [AppointmentStatus.Confirmed]:   'status-confirmed',
      [AppointmentStatus.Pending]:     'status-pending',
      [AppointmentStatus.Rejected]:    'status-rejected',
      [AppointmentStatus.Rescheduled]: 'status-modified',
      [AppointmentStatus.Cancelled]:   'status-cancelled',
    };
    return map[statusId] ?? '';
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