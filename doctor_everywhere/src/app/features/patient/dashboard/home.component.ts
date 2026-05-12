import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { PatientService } from '../services/patient.service';
import { Appointment } from '../../../shared/models/appointment.model';
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
  private svc = inject(PatientService);

  readonly user$: Observable<UserInfo | null> = this.auth.currentUser$;

  upcomingAppointments: Appointment[] = [];
  pendingAppointments: Appointment[] = [];
  unreadMessages: Message[] = [];
  loading = true;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.svc.getMyAppointments().subscribe(appts => {
      this.upcomingAppointments = appts
        .filter(a => a.date >= today && a.status !== 'cancelled')
        .slice(0, 3);
      this.pendingAppointments = appts.filter(a => a.status === 'pending');
      this.loading = false;
    });

    this.svc.getMyMessages().subscribe(msgs => {
      this.unreadMessages = msgs.filter(m => !m.read && !m.fromPatient).slice(0, 3);
    });
  }

  statusClass(status: string): string {
    return ({
      confirmed: 'status-confirmed',
      pending:   'status-pending',
      rejected:  'status-rejected',
      modified:  'status-modified',
      cancelled: 'status-cancelled',
    } as Record<string, string>)[status] ?? '';
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
