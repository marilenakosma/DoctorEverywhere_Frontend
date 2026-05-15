export interface UserInfo {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  unique_name: string;
  role: string;
  exp: number;
  iat: number;
}

export enum UserRole {
  Patient = 'Patient',
  Doctor  = 'Doctor',
  Manager = 'Manager'
}