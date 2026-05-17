import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { DoctorService } from '../services/doctor.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { UserInfo } from '../../../shared/models/user-identity.model';
import { StatCardsComponent } from './components/stat-cards/stat-cards.component';
import { TodayScheduleComponent } from './components/today-schedule/today-schedule.component';
import { PendingRequestsPreviewComponent } from './components/pending-requests-preview/pending-requests-preview.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink, StatCardsComponent, TodayScheduleComponent, PendingRequestsPreviewComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private svc  = inject(DoctorService);
  private cdr  = inject(ChangeDetectorRef);

  readonly user$: Observable<UserInfo | null> = this.auth.currentUser$;

  todayAppointments: Appointment[] = [];
  pendingRequests: Appointment[]   = [];
  unreadMessages: Message[]        = [];
  loading = true;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    // Single call — avoids concurrent requests to the same endpoint
    this.svc.getAppointments().subscribe({
      next: appts => {
        this.todayAppointments = appts.filter(a =>
          a.startingAt.startsWith(today) && a.statusId === AppointmentStatus.Confirmed
        );
        this.pendingRequests = appts
          .filter(a => a.statusId === AppointmentStatus.Pending)
          .slice(0, 3);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.svc.getMessages().subscribe({
      next: msgs => { this.unreadMessages = msgs.filter(m => m.fromPatient && !m.read); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  accept(id: number): void {
    this.svc.acceptRequest(id).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
      this.cdr.detectChanges();
    });
  }

  reject(id: number): void {
    this.svc.rejectRequest(id).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
      this.cdr.detectChanges();
    });
  }
}
