import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Doctor, TimeSlot } from '../../../shared/models/doctor.model';
import { Appointment, AppointmentRequest } from '../../../shared/models/appointment.model';
import { Message } from '../../../shared/models/message.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly USE_MOCK = true;
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // ── Doctors ───────────────────────────────────────────────────────────────

  getNearbyDoctors(specialty = ''): Observable<Doctor[]> {
    if (this.USE_MOCK) {
      return of(MOCK_DOCTORS.filter(d =>
        specialty ? d.specialty.toLowerCase().includes(specialty.toLowerCase()) : true
      ));
    }
    return this.http.get<Doctor[]>(`${this.base}/doctors/nearby`, { params: { specialty } });
  }

  getDoctorSlots(doctorId: string): Observable<TimeSlot[]> {
    if (this.USE_MOCK) return of(MOCK_SLOTS);
    return this.http.get<TimeSlot[]>(`${this.base}/doctors/${doctorId}/slots`);
  }

  // ── Appointments ──────────────────────────────────────────────────────────

  getMyAppointments(): Observable<Appointment[]> {
    if (this.USE_MOCK) return of(MOCK_APPOINTMENTS);
    return this.http.get<Appointment[]>(`${this.base}/appointments/my`);
  }

  bookAppointment(req: AppointmentRequest): Observable<Appointment> {
    if (this.USE_MOCK) {
      const doctor = MOCK_DOCTORS.find(d => d.id === req.doctorId)!;
      const slot   = MOCK_SLOTS.find(s => s.id === req.slotId)!;
      const appt: Appointment = {
        id: 'appt-' + Date.now(),
        doctorId: req.doctorId,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialty: doctor.specialty,
        date: slot.date,
        time: slot.time,
        status: 'pending',
        notes: req.notes,
        createdAt: new Date().toISOString(),
      };
      MOCK_APPOINTMENTS.unshift(appt);
      return of(appt);
    }
    return this.http.post<Appointment>(`${this.base}/appointments`, req);
  }

  cancelAppointment(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const a = MOCK_APPOINTMENTS.find(x => x.id === id);
      if (a) a.status = 'cancelled';
      return of(void 0);
    }
    return this.http.delete<void>(`${this.base}/appointments/${id}`);
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  getMyMessages(): Observable<Message[]> {
    if (this.USE_MOCK) return of(MOCK_MESSAGES);
    return this.http.get<Message[]>(`${this.base}/messages/my`);
  }

  sendMessage(appointmentId: string, content: string): Observable<Message> {
    if (this.USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find(a => a.id === appointmentId);
      const msg: Message = {
        id: 'msg-' + Date.now(),
        appointmentId,
        doctorName: appt?.doctorName ?? 'Doctor',
        content,
        sentAt: new Date().toISOString(),
        fromPatient: true,
        read: true,
      };
      MOCK_MESSAGES.unshift(msg);
      return of(msg);
    }
    return this.http.post<Message>(`${this.base}/messages`, { appointmentId, content });
  }
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_DOCTORS: Doctor[] = [
  { id: 'd1', firstName: 'Elena',  lastName: 'Papadaki',  specialty: 'Cardiology',      address: 'Kifisias 12, Athens',     latitude: 37.9838, longitude: 23.7275, distanceKm: 1.2, rating: 4.8, reviewCount: 124, availableSlots: 3 },
  { id: 'd2', firstName: 'Nikos',  lastName: 'Georgiou',  specialty: 'Dermatology',     address: 'Ermou 45, Athens',        latitude: 37.9755, longitude: 23.7348, distanceKm: 2.4, rating: 4.5, reviewCount: 89,  availableSlots: 5 },
  { id: 'd3', firstName: 'Maria',  lastName: 'Stavrou',   specialty: 'Neurology',       address: 'Syntagma 8, Athens',      latitude: 37.9752, longitude: 23.7356, distanceKm: 3.1, rating: 4.9, reviewCount: 201, availableSlots: 1 },
  { id: 'd4', firstName: 'Kostas', lastName: 'Dimitriou', specialty: 'Orthopedics',     address: 'Patision 67, Athens',     latitude: 37.9901, longitude: 23.7294, distanceKm: 4.0, rating: 4.3, reviewCount: 56,  availableSlots: 7 },
  { id: 'd5', firstName: 'Sofia',  lastName: 'Alexiou',   specialty: 'Cardiology',      address: 'Vouliagmenis 23, Athens', latitude: 37.9612, longitude: 23.7412, distanceKm: 5.5, rating: 4.7, reviewCount: 143, availableSlots: 2 },
  { id: 'd6', firstName: 'Yannis', lastName: 'Petrou',    specialty: 'General Practice',address: 'Academias 11, Athens',    latitude: 37.9801, longitude: 23.7369, distanceKm: 6.2, rating: 4.6, reviewCount: 310, availableSlots: 8 },
];

const addDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const MOCK_SLOTS: TimeSlot[] = [
  { id: 's1', date: addDays(1), time: '09:00', available: true },
  { id: 's2', date: addDays(1), time: '10:00', available: true },
  { id: 's3', date: addDays(1), time: '11:30', available: false },
  { id: 's4', date: addDays(2), time: '09:30', available: true },
  { id: 's5', date: addDays(2), time: '14:00', available: true },
  { id: 's6', date: addDays(3), time: '10:00', available: true },
  { id: 's7', date: addDays(3), time: '15:00', available: true },
  { id: 's8', date: addDays(5), time: '09:00', available: true },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'appt-1', doctorId: 'd1', doctorName: 'Dr. Elena Papadaki', doctorSpecialty: 'Cardiology',  date: addDays(2),  time: '09:30', status: 'confirmed', createdAt: new Date().toISOString() },
  { id: 'appt-2', doctorId: 'd3', doctorName: 'Dr. Maria Stavrou',  doctorSpecialty: 'Neurology',   date: addDays(5),  time: '10:00', status: 'pending',   createdAt: new Date().toISOString() },
  { id: 'appt-3', doctorId: 'd2', doctorName: 'Dr. Nikos Georgiou', doctorSpecialty: 'Dermatology', date: addDays(-3), time: '11:00', status: 'confirmed', createdAt: new Date().toISOString() },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'msg-1', appointmentId: 'appt-1', doctorName: 'Dr. Elena Papadaki', content: 'Please bring your previous ECG results to the appointment.', sentAt: new Date(Date.now() - 3600000).toISOString(),  fromPatient: false, read: false },
  { id: 'msg-2', appointmentId: 'appt-2', doctorName: 'Dr. Maria Stavrou',  content: 'Your appointment has been confirmed for next week.',         sentAt: new Date(Date.now() - 86400000).toISOString(), fromPatient: false, read: true  },
];