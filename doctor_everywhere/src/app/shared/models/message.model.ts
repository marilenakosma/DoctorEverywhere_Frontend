export interface Message {
  id: string;
  appointmentId: string;
  doctorName: string;
  content: string;
  sentAt: string;
  fromPatient: boolean;
  read: boolean;
}
