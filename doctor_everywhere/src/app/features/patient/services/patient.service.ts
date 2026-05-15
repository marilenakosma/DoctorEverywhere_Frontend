import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { Doctor, TimeSlot } from '../../../shared/models/doctor.model';
import { Appointment, AppointmentRequest } from '../../../shared/models/appointment.model';
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

    // specialty can be a number (from dropdown value) or empty string (All)
    if (specialty !== '' && specialty !== null && specialty !== undefined) {
      params.specialty = Number(specialty);
    }

    return this.http.get<any[]>(`${this.base}/doctor/search`, { params }).pipe(
      map(doctors => doctors.map(d => this.mapDoctor(d))),
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

  // ── Appointments — MOCK ⏳ ────────────────────────────────────────────────

  getMyAppointments(): Observable<Appointment[]> {
    return of(MOCK_APPOINTMENTS);
  }

  bookAppointment(req: AppointmentRequest): Observable<Appointment> {
    const appt: Appointment = {
      id:              'appt-' + Date.now(),
      doctorId:        req.doctorId,
      doctorName:      'Doctor',
      doctorSpecialty: '',
      date:            req.slotId.split('-').slice(1, 4).join('-'),
      time:            req.slotId.split('-').slice(4).join(':'),
      status:          'pending',
      notes:           req.notes,
      createdAt:       new Date().toISOString(),
    };
    MOCK_APPOINTMENTS.unshift(appt);
    return of(appt);
  }

  cancelAppointment(id: string): Observable<void> {
    const a = MOCK_APPOINTMENTS.find(x => x.id === id);
    if (a) a.status = 'cancelled';
    return of(void 0);
  }

  // ── Messages — MOCK ⏳ ────────────────────────────────────────────────────

  getMyMessages(): Observable<Message[]> {
    return of(MOCK_MESSAGES);
  }

  sendMessage(appointmentId: string, content: string): Observable<Message> {
    const appt = MOCK_APPOINTMENTS.find(a => a.id === appointmentId);
    const msg: Message = {
      id:            'msg-' + Date.now(),
      appointmentId,
      doctorName:    appt?.doctorName ?? 'Doctor',
      content,
      sentAt:        new Date().toISOString(),
      fromPatient:   true,
      read:          true,
    };
    MOCK_MESSAGES.unshift(msg);
    return of(msg);
  }

  // ── Mapper ────────────────────────────────────────────────────────────────

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
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const addDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'appt-1', doctorId: '1', doctorName: 'Dr. Elena Papadaki', doctorSpecialty: 'Cardiologist',  date: addDays(2),  time: '09:30', status: 'confirmed', createdAt: new Date().toISOString() },
  { id: 'appt-2', doctorId: '2', doctorName: 'Dr. Maria Stavrou',  doctorSpecialty: 'Neurologist',   date: addDays(5),  time: '10:00', status: 'pending',   createdAt: new Date().toISOString() },
  { id: 'appt-3', doctorId: '3', doctorName: 'Dr. Nikos Georgiou', doctorSpecialty: 'Dermatologist', date: addDays(-3), time: '11:00', status: 'confirmed', createdAt: new Date().toISOString() },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'msg-1', appointmentId: 'appt-1', doctorName: 'Dr. Elena Papadaki', content: 'Please bring your previous ECG results.', sentAt: new Date(Date.now() - 3600000).toISOString(),  fromPatient: false, read: false },
  { id: 'msg-2', appointmentId: 'appt-2', doctorName: 'Dr. Maria Stavrou',  content: 'Your appointment has been confirmed.',    sentAt: new Date(Date.now() - 86400000).toISOString(), fromPatient: false, read: true  },
];