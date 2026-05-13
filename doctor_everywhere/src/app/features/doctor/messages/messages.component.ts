import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../services/doctor.service';
import { Message } from '../../../shared/models/message.model';
import { Appointment } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-doctor-messages',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class DoctorMessagesComponent implements OnInit {
  private svc = inject(DoctorService);

  messages: Message[]      = [];
  appointments: Appointment[] = [];
  loading = true;
  selectedAppointmentId = '';
  newMessage = '';
  sending = false;

  ngOnInit(): void {
    this.svc.getMessages().subscribe(m => { this.messages = m; this.loading = false; });
    this.svc.getAppointments().subscribe(a => {
      this.appointments = a.filter(x => x.status !== 'cancelled');
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedAppointmentId) return;
    this.sending = true;
    this.svc.sendMessage(this.selectedAppointmentId, this.newMessage.trim()).subscribe(msg => {
      this.messages.unshift(msg);
      this.newMessage = '';
      this.sending = false;
    });
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
