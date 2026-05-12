export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  exp: number;
  iat: number;
}

export enum UserRole {
  Patient = 'Patient',
  Doctor = 'Doctor',
  Manager = 'Manager'
}
