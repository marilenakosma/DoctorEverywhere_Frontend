import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { Doctor, TimeSlot } from '../../../shared/models/doctor.model';
import { Appointment, AppointmentRequest, AppointmentStatus, AppointmentStatusLabel } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { environment } from '../../../../environments/environment';

// Matches backend Specialty enum exactly
const SpecialtyMap: Record<string, number> = {
  'General Practitioner': 0,
  'Cardiologist':         1,
  'Dermatologist':        2,
  'Neurologist':          3,
  'Pediatrician':         4,
  'Psychiatrist':         5,
  'Orthopedic':           6,
  'Gynecologist':         7,
  'Dentist':              8,
  'Ophthalmologist':      9,
};

const SpecialtyLabel: Record<number, string> = {
  0: 'General Practitioner',
  1: 'Cardiologist',
  2: 'Dermatologist',
  3: 'Neurologist',
  4: 'Pediatrician',
  5: 'Psychiatrist',
  6: 'Orthopedic',
  7: 'Gynecologist',
  8: 'Dentist',
  9: 'Ophthalmologist',
};

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // ── Doctors — REAL API ✅ ─────────────────────────────────────────────────

  getNearbyDoctors(specialty: number | string = ''): Observable<Doctor[]> {
    const params: any = {};
    if (specialty !== '' && specialty !== null && specialty !== undefined) {
      params.specialty = Number(specialty);
    }
    return this.http.get<any[]>(`${this.base}/doctor/search`, { params }).pipe(
      map(doctors => doctors.map(d => this.mapDoctor(d))),
      catchError(() => of([]))
    );
  }

  // ── Reviews — REAL API ✅ ─────────────────────────────────────────────────

  getDoctorReviews(doctorId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/review/${doctorId}`).pipe(
      catchError(() => of([]))
    );
  }

  // ── Slots — REAL API ✅ ───────────────────────────────────────────────────

  getDoctorSlots(doctorId: string, date?: Date): Observable<TimeSlot[]> {
    const selectedDate = date ?? new Date();
    const dateStr = selectedDate.toISOString().split('T')[0];

    return this.http.get<string[]>(
      `${this.base}/availability/doctor/${doctorId}`,
      { params: { date: dateStr } }
    ).pipe(
      map(times => times.map(time => ({
        id:        `${doctorId}-${dateStr}-${time}`,
        date:      dateStr,
        time:      time,
        available: true
      }))),
      catchError(() => of([]))
    );
  }

  // ── Appointments — REAL API ✅ ────────────────────────────────────────────

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<any[]>(`${this.base}/appointment/my`).pipe(
      map(appointments => appointments.map(a => this.mapAppointment(a))),
      catchError(() => of([]))
    );
  }

  // POST /api/appointment/request?doctorId={id}
  // Body: { startingAt: "2026-05-20T09:00:00" }
  bookAppointment(req: AppointmentRequest): Observable<any> {
    // Parse doctorId and startingAt from slotId format: "{doctorId}-{date}-{time}"
    const parts     = req.slotId.split('-');
    const doctorId  = parts[0];
    const date      = parts.slice(1, 4).join('-');  // YYYY-MM-DD
    const time      = parts.slice(4).join(':');      // HH:MM
    const startingAt = `${date}T${time}:00`;

    return this.http.post<any>(
      `${this.base}/appointment/request?doctorId=${doctorId}`,
      { startingAt }
    ).pipe(
      catchError(err => { throw err; })
    );
  }

  // PATCH /api/appointment/{id}/status
  // Body: { statusId: 2 } ← 2 = Cancelled
  cancelAppointment(id: string): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/appointment/${id}/status`,
      { statusId: AppointmentStatus.Cancelled }
    ).pipe(
      catchError(() => of(void 0))
    );
  }

  // ── Messages — MOCK ⏳ ────────────────────────────────────────────────────

  getMyMessages(): Observable<Message[]> {
    return of(MOCK_MESSAGES);
  }

  sendMessage(appointmentId: string, content: string): Observable<Message> {
    const msg: Message = {
      id:            'msg-' + Date.now(),
      appointmentId,
      doctorName:    'Doctor',
      content,
      sentAt:        new Date().toISOString(),
      fromPatient:   true,
      read:          true,
    };
    MOCK_MESSAGES.unshift(msg);
    return of(msg);
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapDoctor(d: any): Doctor {
    return {
      id:             String(d.id),
      firstName:      d.firstName  ?? '',
      lastName:       d.lastName   ?? '',
      specialty:      SpecialtyLabel[d.specialty] ?? String(d.specialty),
      address:        d.office ? `${d.office.address}, ${d.office.city}` : '',
      latitude:       d.office?.latitude  ?? 0,
      longitude:      d.office?.longitude ?? 0,
      distanceKm:     0,
      rating:         0,
      reviewCount:    0,
      availableSlots: 1,
    };
  }

  private mapAppointment(a: any): Appointment {
    const startingAt = new Date(a.startingAt);
    return {
      id:              String(a.id),
      doctorId:        String(a.doctorId),
      patientId:       String(a.patientId),
      doctorName:      a.doctorName   ? `Dr. ${a.doctorName}` : 'Doctor',
      patientName:     a.patientName  ?? '',
      doctorSpecialty: '',  // not returned by backend yet
      date:            startingAt.toISOString().split('T')[0],
      time:            startingAt.toTimeString().slice(0, 5),
      startingAt:      a.startingAt,
      status:          AppointmentStatusLabel[a.statusId]?.toLowerCase() ?? 'pending',
      statusId:        a.statusId,
      notes:           a.notes ?? '',
      createdAt:       a.requestedAt ?? new Date().toISOString(),
    };
  }
}

// ── Mock data — messages only ──────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [
  { id: 'msg-1', appointmentId: '1', doctorName: 'Dr. Elena Papadaki', content: 'Please bring your previous ECG results.', sentAt: new Date(Date.now() - 3600000).toISOString(),  fromPatient: false, read: false },
  { id: 'msg-2', appointmentId: '2', doctorName: 'Dr. Maria Stavrou',  content: 'Your appointment has been confirmed.',    sentAt: new Date(Date.now() - 86400000).toISOString(), fromPatient: false, read: true  },
];