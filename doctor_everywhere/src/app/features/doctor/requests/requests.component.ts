import { Component, inject, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { DoctorRequest } from '../models/doctor.models';

@Component({
  selector: 'app-doctor-requests',
  standalone: true,
  imports: [],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class DoctorRequestsComponent implements OnInit {
  private svc = inject(DoctorService);

  requests: DoctorRequest[] = [];
  loading = true;
  activeTab: 'pending' | 'accepted' | 'rejected' = 'pending';

  ngOnInit(): void {
    this.svc.getRequests().subscribe(r => { this.requests = r; this.loading = false; });
  }

  get pending():  DoctorRequest[] { return this.requests.filter(r => r.status === 'pending'); }
  get accepted(): DoctorRequest[] { return this.requests.filter(r => r.status === 'accepted'); }
  get rejected(): DoctorRequest[] { return this.requests.filter(r => r.status === 'rejected'); }

  get activeList(): DoctorRequest[] {
    return this.activeTab === 'pending'  ? this.pending
         : this.activeTab === 'accepted' ? this.accepted
         : this.rejected;
  }

  accept(id: string): void {
    this.svc.acceptRequest(id).subscribe(() => {
      const r = this.requests.find(x => x.id === id);
      if (r) r.status = 'accepted';
    });
  }

  reject(id: string): void {
    this.svc.rejectRequest(id).subscribe(() => {
      const r = this.requests.find(x => x.id === id);
      if (r) r.status = 'rejected';
    });
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
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
