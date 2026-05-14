export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Day = typeof DAYS[number];

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
] as const;

export type WeeklySchedule = Record<Day, string[]>;

export interface AvailabilityRange {
  start: string;
  end: string;
}

export type WeeklyAvailability = Record<Day, AvailabilityRange[]>;

export interface AvailabilitySlot {
  dayOfWeek: Day;
  startTime: string;
  endTime: string;
}

export interface SaveSlotsRequest {
  slots: AvailabilitySlot[];
}

export interface DoctorRequest {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
