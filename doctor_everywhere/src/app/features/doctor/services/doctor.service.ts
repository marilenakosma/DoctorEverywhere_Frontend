import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Appointment } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { DAYS, Day, DoctorRequest, WeeklySchedule, WeeklyAvailability, SaveSlotsRequest } from '../models/doctor.models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly USE_MOCK = true;
  private readonly base = `${environment.apiUrl}/api`;
  private readonly SCHEDULE_KEY = 'doctor_weekly_schedule';
  private readonly AVAILABILITY_KEY = 'doctor_weekly_availability';

  constructor(private http: HttpClient) {}

  getRequests(): Observable<DoctorRequest[]> {
    if (this.USE_MOCK) return of(MOCK_REQUESTS);
    return this.http.get<DoctorRequest[]>(`${this.base}/doctor/requests`);
  }

  acceptRequest(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const r = MOCK_REQUESTS.find(x => x.id === id);
      if (r) {
        r.status = 'accepted';
        MOCK_DOCTOR_APPOINTMENTS.unshift({
          id: 'da-' + Date.now(),
          doctorId: 'self',
          doctorName: 'Dr. You',
          doctorSpecialty: 'Cardiology',
          patientName: r.patientName,
          date: r.date,
          time: r.time,
          status: 'confirmed',
          notes: r.notes,
          createdAt: new Date().toISOString(),
        });
      }
      return of(void 0);
    }
    return this.http.patch<void>(`${this.base}/doctor/requests/${id}/accept`, {});
  }

  rejectRequest(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const r = MOCK_REQUESTS.find(x => x.id === id);
      if (r) r.status = 'rejected';
      return of(void 0);
    }
    return this.http.patch<void>(`${this.base}/doctor/requests/${id}/reject`, {});
  }

  getAppointments(): Observable<Appointment[]> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_APPOINTMENTS);
    return this.http.get<Appointment[]>(`${this.base}/doctor/appointments`);
  }

  getMessages(): Observable<Message[]> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_MESSAGES);
    return this.http.get<Message[]>(`${this.base}/doctor/messages`);
  }

  sendMessage(appointmentId: string, content: string): Observable<Message> {
    if (this.USE_MOCK) {
      const appt = MOCK_DOCTOR_APPOINTMENTS.find(a => a.id === appointmentId);
      const msg: Message = {
        id: 'dm-' + Date.now(),
        appointmentId,
        doctorName: 'Dr. You',
        patientName: appt?.patientName,
        content,
        sentAt: new Date().toISOString(),
        fromPatient: false,
        read: true,
      };
      MOCK_DOCTOR_MESSAGES.unshift(msg);
      return of(msg);
    }
    return this.http.post<Message>(`${this.base}/messages`, { appointmentId, content });
  }

  getWeeklySchedule(): WeeklySchedule {
    const stored = localStorage.getItem(this.SCHEDULE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through to default */ }
    }
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  }

  saveWeeklySchedule(schedule: WeeklySchedule): void {
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedule));
  }

  getAvailability(): WeeklyAvailability {
    const stored = localStorage.getItem(this.AVAILABILITY_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through to default */ }
    }
    return JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY));
  }

  saveAvailability(availability: WeeklyAvailability): Observable<void> {
    const payload: SaveSlotsRequest = {
      slots: DAYS.flatMap(day =>
        availability[day].map(r => ({
          dayOfWeek: day,
          startTime: r.start,
          endTime: r.end,
        }))
      ),
    };
    if (this.USE_MOCK) {
      console.log('POST /api/availability/slots (mock)', payload);
      localStorage.setItem(this.AVAILABILITY_KEY, JSON.stringify(availability));
      return of(void 0);
    }
    return this.http.post<void>(`${this.base}/availability/slots`, payload);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const addDays = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const today = new Date().toISOString().split('T')[0];

// ── Default weekly schedule (legacy) ─────────────────────────────────────────

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday:    ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'],
  Tuesday:   ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30'],
  Wednesday: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'],
  Thursday:  ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30'],
  Friday:    ['09:00', '09:30', '10:00', '10:30'],
  Saturday:  [],
};

// ── Default weekly availability (ranges) ──────────────────────────────────────

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  Monday:    [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
  Tuesday:   [{ start: '09:00', end: '13:00' }],
  Wednesday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '18:00' }],
  Thursday:  [{ start: '09:00', end: '12:00' }],
  Friday:    [{ start: '09:00', end: '11:00' }],
  Saturday:  [],
};

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: DoctorRequest[] = [
  { id: 'req-1', patientId: 'p1', patientName: 'Maria Papadopoulou', date: addDays(2), time: '09:00', notes: 'Annual checkup, no specific concerns.', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'req-2', patientId: 'p2', patientName: 'Giorgos Nikolaou',   date: addDays(2), time: '10:30', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'req-3', patientId: 'p3', patientName: 'Anna Kostopoulos',   date: addDays(3), time: '14:00', notes: 'Follow-up after ECG results.', status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'req-4', patientId: 'p4', patientName: 'Dimitris Alexiou',   date: addDays(1), time: '09:30', notes: 'Chest pain evaluation.', status: 'accepted', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'req-5', patientId: 'p5', patientName: 'Eleni Stavrou',      date: addDays(4), time: '11:00', status: 'rejected', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 'req-6', patientId: 'p6', patientName: 'Nikos Konstantinou', date: addDays(5), time: '15:30', notes: 'Requesting earlier appointment if possible.', status: 'pending', createdAt: new Date(Date.now() - 43200000).toISOString() },
];

export const MOCK_DOCTOR_APPOINTMENTS: Appointment[] = [
  { id: 'da-1', doctorId: 'self', doctorName: 'Dr. You', doctorSpecialty: 'Cardiology', patientName: 'Dimitris Alexiou',   date: today,        time: '09:00', status: 'confirmed', createdAt: new Date().toISOString() },
  { id: 'da-2', doctorId: 'self', doctorName: 'Dr. You', doctorSpecialty: 'Cardiology', patientName: 'Sofia Petrou',       date: today,        time: '11:00', status: 'confirmed', createdAt: new Date().toISOString() },
  { id: 'da-3', doctorId: 'self', doctorName: 'Dr. You', doctorSpecialty: 'Cardiology', patientName: 'Nikos Konstantinou', date: addDays(1),   time: '09:30', status: 'confirmed', createdAt: new Date().toISOString() },
  { id: 'da-4', doctorId: 'self', doctorName: 'Dr. You', doctorSpecialty: 'Cardiology', patientName: 'Maria Papadaki',     date: addDays(-2),  time: '10:00', status: 'confirmed', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'da-5', doctorId: 'self', doctorName: 'Dr. You', doctorSpecialty: 'Cardiology', patientName: 'Kostas Dimitriou',   date: addDays(-1),  time: '14:00', status: 'cancelled', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export const MOCK_DOCTOR_MESSAGES: Message[] = [
  { id: 'dm-1', appointmentId: 'da-1', doctorName: 'Dr. You', patientName: 'Dimitris Alexiou',   content: 'Do I need to fast before the appointment?', sentAt: new Date(Date.now() - 3600000).toISOString(),  fromPatient: true,  read: false },
  { id: 'dm-2', appointmentId: 'da-3', doctorName: 'Dr. You', patientName: 'Nikos Konstantinou', content: 'Please bring your previous test results.',   sentAt: new Date(Date.now() - 86400000).toISOString(), fromPatient: false, read: true  },
  { id: 'dm-3', appointmentId: 'da-3', doctorName: 'Dr. You', patientName: 'Nikos Konstantinou', content: 'Of course, I will bring them. Thank you!',   sentAt: new Date(Date.now() - 82800000).toISOString(), fromPatient: true,  read: true  },
];
