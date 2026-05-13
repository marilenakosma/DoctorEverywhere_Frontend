export interface Message {
  id: string;
  appointmentId: string;
  doctorName: string;
  patientName?: string;
  content: string;
  sentAt: string;
  fromPatient: boolean;
  read: boolean;
}
