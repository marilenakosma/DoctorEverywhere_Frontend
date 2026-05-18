export interface AppointmentRequest {
  doctorId: string;
  slotId:   string;
  notes?:   string;
}

// Matches backend AppointmentStatus enum exactly
export enum AppointmentStatus {
  Pending     = 0,
  Confirmed   = 1,
  Cancelled   = 2,
  Rejected    = 3,
  Rescheduled = 4,
}

export const AppointmentStatusLabel: Record<number, string> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Cancelled',
  3: 'Rejected',
  4: 'Rescheduled',
};

// Frontend Appointment model — maps from backend AppointmentDto
export interface Appointment {
  id:              string;
  doctorId:        string;
  patientId?:      string;
  doctorName:      string;
  patientName?:    string;
  doctorSpecialty: string;
  date:            string;  // extracted from startingAt
  time:            string;  // extracted from startingAt
  startingAt:      string;  // ISO string from backend
  status:          string;  // mapped from statusId
  statusId:        number;
  notes?:          string;
  createdAt:       string;
}