import { Component, inject, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { DoctorService } from '../services/doctor.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { DAYS, Day, TIME_SLOTS, WeeklySchedule } from '../models/doctor.models';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [NgClass],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class DoctorAppointmentsComponent implements OnInit {
  private svc = inject(DoctorService);

  appointments: Appointment[] = [];
  loading = true;
  activeTab: 'upcoming' | 'past' | 'cancelled' | 'slots' = 'upcoming';

  readonly days     = DAYS;
  readonly timeSlots = TIME_SLOTS;
  schedule: WeeklySchedule = {} as WeeklySchedule;
  scheduleSaved = false;

  ngOnInit(): void {
    this.svc.getAppointments().subscribe(a => { this.appointments = a; this.loading = false; });
    this.schedule = this.svc.getWeeklySchedule();
  }

  private get today(): string { return new Date().toISOString().split('T')[0]; }

  get upcoming():  Appointment[] { return this.appointments.filter(a => a.date >= this.today && a.status !== 'cancelled'); }
  get past():      Appointment[] { return this.appointments.filter(a => a.date <  this.today && a.status !== 'cancelled'); }
  get cancelled(): Appointment[] { return this.appointments.filter(a => a.status === 'cancelled'); }

  get activeList(): Appointment[] {
    return this.activeTab === 'upcoming'  ? this.upcoming
         : this.activeTab === 'past'      ? this.past
         : this.cancelled;
  }

  isAvailable(day: Day, time: string): boolean {
    return this.schedule[day]?.includes(time) ?? false;
  }

  toggleSlot(day: Day, time: string): void {
    const slots = this.schedule[day];
    const idx = slots.indexOf(time);
    if (idx > -1) slots.splice(idx, 1);
    else { slots.push(time); slots.sort(); }
  }

  slotCount(day: Day): number {
    return this.schedule[day]?.length ?? 0;
  }

  saveSchedule(): void {
    this.svc.saveWeeklySchedule(this.schedule);
    this.scheduleSaved = true;
    setTimeout(() => this.scheduleSaved = false, 3000);
  }

  statusClass(s: string): string {
    return ({ confirmed: 'status-confirmed', pending: 'status-pending', rejected: 'status-rejected', modified: 'status-modified', cancelled: 'status-cancelled' } as Record<string, string>)[s] ?? '';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
