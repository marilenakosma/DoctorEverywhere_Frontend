import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { DAYS, DoctorProfile, WeeklySchedule, WeeklyAvailability } from '../models/doctor.models';

// Maps day name → backend DayOfWeekOption enum integer
const DAY_TO_INT: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
};

// Maps backend DayOfWeekOption integer → day name
const INT_TO_DAY: Record<number, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday',
};

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly USE_MOCK = false;
  private readonly base = `${environment.apiUrl}/api`;
  private readonly SCHEDULE_KEY = 'doctor_weekly_schedule';
  private readonly AVAILABILITY_KEY = 'doctor_weekly_availability';

  constructor(private http: HttpClient) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  getMyProfile(): Observable<DoctorProfile> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_PROFILE);
    return this.http.get<DoctorProfile>(`${this.base}/doctor/me`);
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  getAppointments(): Observable<Appointment[]> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_APPOINTMENTS);
    // Backend returns { appointments: [...], result: {...} } for doctors
    // We only need the appointments array
    return this.http.get<{ appointments: Appointment[] }>(`${this.base}/appointment/my`).pipe(
      map(res => res.appointments ?? [])
    );
  }

  // ── Requests (pending appointments) ──────────────────────────────────────

  getRequests(): Observable<Appointment[]> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_APPOINTMENTS.filter(a => a.statusId === AppointmentStatus.Pending));
    // Same endpoint as getAppointments — filter client-side for pending only
    return this.http.get<{ appointments: Appointment[] }>(`${this.base}/appointment/my`).pipe(
      map(res => (res.appointments ?? []).filter(a => a.statusId === AppointmentStatus.Pending))
    );
  }

  acceptRequest(id: string): Observable<void> {
    if (this.USE_MOCK) return of(void 0);
    return this.http.patch<void>(
      `${this.base}/appointment/${id}/status`,
      { statusId: AppointmentStatus.Confirmed }  // = 1
    );
  }

  rejectRequest(id: string): Observable<void> {
    if (this.USE_MOCK) return of(void 0);
    return this.http.patch<void>(
      `${this.base}/appointment/${id}/status`,
      { statusId: AppointmentStatus.Rejected }   // = 3
    );
  }

  // ── Availability ──────────────────────────────────────────────────────────

  getAvailability(): Observable<WeeklyAvailability> {
    if (this.USE_MOCK) {
      const stored = localStorage.getItem(this.AVAILABILITY_KEY);
      const parsed = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY));
      return of(parsed);
    }
    // Backend returns: [{ dayOfWeek: 0, shiftStartTime: "09:00:00", shiftEndTime: "13:00:00" }, ...]
    return this.http.get<any[]>(`${this.base}/availability/slots`).pipe(
      map(dtos => {
        const result: WeeklyAvailability = {
          Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [],
        };
        for (const dto of dtos) {
          const day = INT_TO_DAY[dto.dayOfWeek] as keyof WeeklyAvailability;
          if (day && day in result) {
            result[day].push({
              start: dto.shiftStartTime.slice(0, 5),  // "09:00:00" → "09:00"
              end:   dto.shiftEndTime.slice(0, 5),
            });
          }
        }
        return result;
      })
    );
  }

  saveAvailability(availability: WeeklyAvailability): Observable<void> {
    if (this.USE_MOCK) {
      localStorage.setItem(this.AVAILABILITY_KEY, JSON.stringify(availability));
      return of(void 0);
    }
    // Backend expects a flat array — no wrapper object
    // dayOfWeek must be integer (0=Monday), times need seconds suffix "09:00:00"
    const payload = DAYS.flatMap(day =>
      availability[day].map(r => ({
        dayOfWeek:      DAY_TO_INT[day],
        shiftStartTime: r.start + ':00',  // "09:00" → "09:00:00"
        shiftEndTime:   r.end   + ':00',
      }))
    );
    return this.http.post<void>(`${this.base}/availability/slots`, payload);
  }

  deleteDoctorProfile(): Observable<string> {
    // Because the C# backend returns a plain string in the 200 OK response, 
    // we MUST tell Angular to expect text, not JSON.
    return this.http.delete(`${this.base}/doctor/delete`, { responseType: 'text' });
  }
  // ── Messages ──────────────────────────────────────────────────────────────

  getMessages(): Observable<Message[]> {
    if (this.USE_MOCK) return of(MOCK_DOCTOR_MESSAGES);
    return of([]);
  }

  sendMessage(appointmentId: string, content: string): Observable<Message> {
    if (this.USE_MOCK) {
      const msg: Message = {
        id: 'msg-' + Date.now(),
        appointmentId,
        doctorName: 'Dr. You',
        content,
        sentAt: new Date().toISOString(),
        fromPatient: false,
        read: true,
      };
      MOCK_DOCTOR_MESSAGES.unshift(msg);
      return of(msg);
    }
    return throwError(() => new Error('Messages not yet implemented on backend'));
  }

  // ── Weekly schedule (local only) ──────────────────────────────────────────

  getWeeklySchedule(): WeeklySchedule {
    const stored = localStorage.getItem(this.SCHEDULE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
  }

  saveWeeklySchedule(schedule: WeeklySchedule): void {
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedule));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const addDays = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

// ── Default weekly schedule (local only) ──────────────────────────────────────

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday:    ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'],
  Tuesday:   ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30'],
  Wednesday: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'],
  Thursday:  ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30'],
  Friday:    ['09:00', '09:30', '10:00', '10:30'],
  Saturday:  [],
};

// ── Default weekly availability ───────────────────────────────────────────────

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  Monday:    [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
  Tuesday:   [{ start: '09:00', end: '13:00' }],
  Wednesday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '18:00' }],
  Thursday:  [{ start: '09:00', end: '12:00' }],
  Friday:    [{ start: '09:00', end: '11:00' }],
  Saturday:  [],
};

// ── Mock data (used only when USE_MOCK = true) ────────────────────────────────

const MOCK_DOCTOR_PROFILE: DoctorProfile = {
  id: 1,
  firstName: 'Alexandros',
  lastName: 'Papadopoulos',
  specialty: 1,
  office: {
    id: 1,
    name: 'Papadopoulos Cardiology Clinic',
    address: 'Ermou 45',
    city: 'Athens',
    postalCode: '10563',
    latitude: 37.9838,
    longitude: 23.7275,
  },
};

const MOCK_DOCTOR_APPOINTMENTS: Appointment[] = [
  { id: '1', patientId: '1', doctorId: '1', startingAt: `${addDays(0)}T09:00:00`,  statusId: AppointmentStatus.Confirmed, requestedAt: new Date(Date.now() - 86400000).toISOString(),  doctorName: 'Dr. You', patientName: 'Dimitris Alexiou',   doctorSpecialty: 'Cardiologist', date: addDays(0),  time: '09:00', status: 'confirmed', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', patientId: '2', doctorId: '1', startingAt: `${addDays(0)}T11:00:00`,  statusId: AppointmentStatus.Confirmed, requestedAt: new Date(Date.now() - 86400000).toISOString(),  doctorName: 'Dr. You', patientName: 'Sofia Petrou',       doctorSpecialty: 'Cardiologist', date: addDays(0),  time: '11:00', status: 'confirmed', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', patientId: '3', doctorId: '1', startingAt: `${addDays(1)}T09:30:00`,  statusId: AppointmentStatus.Pending,   requestedAt: new Date(Date.now() - 3600000).toISOString(),   doctorName: 'Dr. You', patientName: 'Nikos Konstantinou', doctorSpecialty: 'Cardiologist', date: addDays(1),  time: '09:30', status: 'pending',   createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', patientId: '4', doctorId: '1', startingAt: `${addDays(-2)}T10:00:00`, statusId: AppointmentStatus.Confirmed, requestedAt: new Date(Date.now() - 259200000).toISOString(), doctorName: 'Dr. You', patientName: 'Maria Papadaki',     doctorSpecialty: 'Cardiologist', date: addDays(-2), time: '10:00', status: 'confirmed', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', patientId: '5', doctorId: '1', startingAt: `${addDays(-1)}T14:00:00`, statusId: AppointmentStatus.Cancelled, requestedAt: new Date(Date.now() - 172800000).toISOString(), doctorName: 'Dr. You', patientName: 'Kostas Dimitriou',   doctorSpecialty: 'Cardiologist', date: addDays(-1), time: '14:00', status: 'cancelled', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const MOCK_DOCTOR_MESSAGES: Message[] = [
  { id: 'dm-1', appointmentId: '1', doctorName: 'Dr. You', patientName: 'Dimitris Alexiou',   content: 'Do I need to fast before the appointment?', sentAt: new Date(Date.now() - 3600000).toISOString(),  fromPatient: true,  read: false },
  { id: 'dm-2', appointmentId: '3', doctorName: 'Dr. You', patientName: 'Nikos Konstantinou', content: 'Please bring your previous test results.',   sentAt: new Date(Date.now() - 86400000).toISOString(), fromPatient: false, read: true  },
  { id: 'dm-3', appointmentId: '3', doctorName: 'Dr. You', patientName: 'Nikos Konstantinou', content: 'Of course, I will bring them. Thank you!',   sentAt: new Date(Date.now() - 82800000).toISOString(), fromPatient: true,  read: true  },
];
