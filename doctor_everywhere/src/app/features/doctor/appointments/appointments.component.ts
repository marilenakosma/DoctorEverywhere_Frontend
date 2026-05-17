import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { WeeklyScheduleComponent } from './components/weekly-schedule/weekly-schedule.component';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [AppointmentListComponent, WeeklyScheduleComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class DoctorAppointmentsComponent implements OnInit {
  private svc = inject(DoctorService);
  private cdr = inject(ChangeDetectorRef);

  appointments: Appointment[] = [];
  loading = true;
  activeTab: 'upcoming' | 'past' | 'cancelled' | 'slots' = 'upcoming';

  ngOnInit(): void {
    this.svc.getAppointments().subscribe({
      next: a => { this.appointments = a; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private get today(): string { return new Date().toISOString().split('T')[0]; }

  get upcoming():  Appointment[] {
    return this.appointments.filter(a =>
      a.startingAt.split('T')[0] >= this.today && a.statusId === AppointmentStatus.Confirmed
    );
  }
  get past():      Appointment[] {
    return this.appointments.filter(a =>
      a.startingAt.split('T')[0] < this.today && a.statusId !== AppointmentStatus.Cancelled
    );
  }
  get cancelled(): Appointment[] {
    return this.appointments.filter(a => a.statusId === AppointmentStatus.Cancelled);
  }

  get activeList(): Appointment[] {
    return this.activeTab === 'upcoming' ? this.upcoming
         : this.activeTab === 'past'     ? this.past
         : this.cancelled;
  }
}
