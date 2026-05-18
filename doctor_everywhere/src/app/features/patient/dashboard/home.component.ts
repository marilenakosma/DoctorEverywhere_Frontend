import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { PatientService } from '../services/patient.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { UserInfo } from '../../../shared/models/user-identity.model';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [AsyncPipe, NgClass, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class PatientHomeComponent implements OnInit {
  private auth = inject(AuthService);
  private svc  = inject(PatientService);
  private cdr  = inject(ChangeDetectorRef);

  readonly user$: Observable<UserInfo | null> = this.auth.currentUser$;

  upcomingConfirmedAppointments: Appointment[] = [];
  pendingAppointments: Appointment[] = [];
  unreadMessages: Message[] = [];
  loading = true;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.svc.getMyAppointments().subscribe(appts => {
      this.upcomingConfirmedAppointments = appts
        .filter(a => a.startingAt.split('T')[0] >= today && a.statusId === AppointmentStatus.Confirmed)
        .slice(0, 3);
      this.pendingAppointments = appts
        .filter(a => a.statusId === AppointmentStatus.Pending)
        .slice(0, 3);
      this.loading = false;
      this.cdr.detectChanges();
    });

    this.svc.getMyMessages().subscribe(msgs => {
      this.unreadMessages = msgs.filter(m => !m.read && !m.fromPatient).slice(0, 3);
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

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  timeAgo(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
