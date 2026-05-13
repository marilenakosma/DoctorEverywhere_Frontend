export interface AppointmentRequest {
  doctorId: string;
  slotId: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'modified';
  notes?: string;
  createdAt: string;
}
