# DoctorEverywhere Frontend

## Project overview
DoctorEverywhere Frontend is an Angular SPA for a location-aware doctor/patient appointment platform,
with role-specific areas (patient, doctor, manager) behind authentication and a shared app layout.

## Features
- Authentication
  - Register as Patient or Doctor
  - Login with JWT
- Doctor discovery
  - Search doctors by specialty
  - View doctor profile (including office/location details)
- Availability management
  - Doctors can create/update working schedule (availability slots)
  - Patients can view a doctor’s available time slots for a given date
- Appointments
  - Patients can request appointments with a doctor
  - Patients and doctors can view their appointments
  - Appointment status updates (patient cancellation; doctor confirm/reject)
- Reviews
  - Patients can view a rating/comment review for a doctor
- User deletion
   - Users (Patient/Doctors) can delete their account,
      - Patient names are marked as "Deleted Patient" in their reviews,and their appointments are auto-cancelled
      - Doctor appointments are auto-rejected
     
## Contributors
- Maria-Eleni Kosma
- Dimitrios Loukrezis 
- Periklis Tsaousis
- Marios Tzanos

## Tech stack (Frontend)
- Angular 21 + Angular CLI 
- TypeScript 
- RxJS 
- Bootstrap + Bootstrap Icons 
- Leaflet maps 
- JWT decode for auth 

## Key directories 
- src/app/core — app shell, guards, and HTTP interceptors
- src/app/features — feature areas and route configs for auth/patient/doctor/manager 
- src/app/shared — shared models and services used across features 
- src/environments — environment configuration including API base URL 
- public/ and src/assets/ — static assets; global styles are configured in angular.json 

## Essential build/test commands 
- npm run start — dev server 
- npm run build — production build 
- npm test — unit tests 
- npm run watch — dev build with watch
