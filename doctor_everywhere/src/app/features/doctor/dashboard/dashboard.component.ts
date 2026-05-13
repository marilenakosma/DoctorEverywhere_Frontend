import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { DoctorService } from '../services/doctor.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { DoctorRequest } from '../models/doctor.models';
import { UserInfo } from '../../../shared/models/user-identity.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private svc  = inject(DoctorService);

  readonly user$: Observable<UserInfo | null> = this.auth.currentUser$;

  todayAppointments: Appointment[] = [];
  pendingRequests: DoctorRequest[]  = [];
  unreadMessages: Message[]         = [];
  loading = true;

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.svc.getAppointments().subscribe(appts => {
      this.todayAppointments = appts.filter(a => a.date === today && a.status !== 'cancelled');
      this.loading = false;
    });

    this.svc.getRequests().subscribe(reqs => {
      this.pendingRequests = reqs.filter(r => r.status === 'pending').slice(0, 3);
    });

    this.svc.getMessages().subscribe(msgs => {
      this.unreadMessages = msgs.filter(m => m.fromPatient && !m.read).slice(0, 3);
    });
  }

  accept(id: string): void {
    this.svc.acceptRequest(id).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
    });
  }

  reject(id: string): void {
    this.svc.rejectRequest(id).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== id);
    });
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
