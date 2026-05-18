import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { RequestListComponent } from './components/request-list/request-list.component';

@Component({
  selector: 'app-doctor-requests',
  standalone: true,
  imports: [RequestListComponent],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class DoctorRequestsComponent implements OnInit {
  private svc = inject(DoctorService);
  private cdr = inject(ChangeDetectorRef);

  requests: Appointment[] = [];
  loading = true;
  activeTab: 'pending' | 'accepted' | 'rejected' = 'pending';

  ngOnInit(): void {
    this.svc.getAppointments().subscribe({
      next: r => { this.requests = r; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get pending():  Appointment[] { return this.requests.filter(r => r.statusId === AppointmentStatus.Pending); }
  get accepted(): Appointment[] { return this.requests.filter(r => r.statusId === AppointmentStatus.Confirmed); }
  get rejected(): Appointment[] { return this.requests.filter(r => r.statusId === AppointmentStatus.Rejected); }

  get activeList(): Appointment[] {
    return this.activeTab === 'pending'  ? this.pending
         : this.activeTab === 'accepted' ? this.accepted
         : this.rejected;
  }

  accept(id: string): void {
    this.svc.acceptRequest(id).subscribe(() => {
      const r = this.requests.find(x => x.id === id);
      if (r) r.statusId = AppointmentStatus.Confirmed;
      this.cdr.detectChanges();
    });
  }

  reject(id: string): void {
    this.svc.rejectRequest(id).subscribe(() => {
      const r = this.requests.find(x => x.id === id);
      if (r) r.statusId = AppointmentStatus.Rejected;
      this.cdr.detectChanges();
    });
  }
}
