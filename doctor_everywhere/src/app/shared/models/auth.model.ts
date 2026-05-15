import { UserRole } from './user-identity.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterPatientRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole.Patient;
}

export interface RegisterDoctorRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  specialty: number;
  officeName: string;
  officeAddress: string;
  officeCity: string;
  officePostalCode: string;
  latitude: number;
  longitude: number;
  role: UserRole.Doctor;
}

export type RegisterRequest = RegisterPatientRequest | RegisterDoctorRequest;

export interface AuthResponse {
  token: string;
}

export enum Specialty {
  Cardiology      = 0,
  Dermatology     = 1,
  Neurology       = 2,
  Orthopedics     = 3,
  GeneralPractice = 4,
}