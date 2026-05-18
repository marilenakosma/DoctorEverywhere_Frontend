import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PatientService } from '../services/patient.service';
import { Doctor, TimeSlot } from '../../../shared/models/doctor.model';
import { AppointmentRequest } from '../services/patient.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {

  private map!: L.Map;
  private userMarker!: L.CircleMarker;
  private doctorMarkers: L.Marker[] = [];
  private center: [number, number] = [37.9838, 23.7275];

  locationMode: 'gps' | 'manual' = 'gps';
  manualAddress = '';
  gpsLoading = false;
  gpsError = '';
  locationReady = false;

  doctors: Doctor[] = [];
  loading = false;
  searched = false;
  specialtyFilter: number | string = '';
  hoveredDoctorId: string | null = null;

  // Specialty dropdown options
  specialtyOptions = [
    { value: 0, label: 'General Practitioner' },
    { value: 1, label: 'Cardiologist' },
    { value: 2, label: 'Dermatologist' },
    { value: 3, label: 'Neurologist' },
    { value: 4, label: 'Pediatrician' },
    { value: 5, label: 'Psychiatrist' },
    { value: 6, label: 'Orthopedic' },
    { value: 7, label: 'Gynecologist' },
    { value: 8, label: 'Dentist' },
    { value: 9, label: 'Ophthalmologist' },
  ];

  // Booking
  selectedDoctor: Doctor | null = null;
  slots: TimeSlot[] = [];
  selectedSlotId = '';
  bookingNotes = '';
  bookingSuccess = false;
  bookingLoading = false;
  slotsLoading = false;

  // Reviews
  reviews: any[] = [];
  reviewsLoading = false;
  averageRating = 0;

  // Date picker
  selectedDate = '';
  minDate = new Date().toISOString().split('T')[0];

  constructor(private svc: PatientService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.locationReady = true;
      this.useGPS();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  private initMap(): void {
    const mapEl = document.getElementById('search-map');
    if (!mapEl) return;

    this.map = L.map('search-map', { center: this.center, zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private setUserMarker(lat: number, lng: number): void {
    if (this.userMarker) this.map.removeLayer(this.userMarker);
    this.userMarker = L.circleMarker([lat, lng], {
      radius: 10, fillColor: '#185FA5', fillOpacity: 1,
      color: '#ffffff', weight: 2,
    }).addTo(this.map);
    this.userMarker.bindPopup('<b>Your location</b>').openPopup();
    this.map.setView([lat, lng], 13);
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  private renderDoctorMarkers(): void {
    this.doctorMarkers.forEach(m => this.map.removeLayer(m));
    this.doctorMarkers = [];

    const redIcon = L.divIcon({
      className: '',
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });

    this.doctors.forEach(doctor => {
      if (doctor.latitude === 0 && doctor.longitude === 0) return;
      const marker = L.marker([doctor.latitude, doctor.longitude], { icon: redIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="min-width:160px">
            <strong>Dr. ${doctor.firstName} ${doctor.lastName}</strong><br>
            <span style="color:#185FA5;font-size:12px">${doctor.specialty}</span><br>
            <span style="color:#64748b;font-size:12px">${doctor.address}</span>
          </div>
        `);
      marker.on('click', () => this.openBooking(doctor));
      this.doctorMarkers.push(marker);
    });
  }

  // ── Location ──────────────────────────────────────────────────────────────

  useGPS(): void {
    if (!navigator.geolocation) {
      this.locationMode = 'manual';
      return;
    }
    this.gpsLoading = true;
    this.gpsError = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.center = [pos.coords.latitude, pos.coords.longitude];
        this.setUserMarker(this.center[0], this.center[1]);
        this.gpsLoading = false;
        this.locationMode = 'gps';
        this.renderDoctorMarkers();
      },
      () => {
        this.gpsLoading = false;
        this.locationMode = 'manual';
      },
      { timeout: 10000 }
    );
  }

 searchByAddress(): void {
  if (!this.manualAddress.trim()) return;
  
  const query = this.manualAddress.includes('Greece')
    ? this.manualAddress
    : `${this.manualAddress}, Greece`;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gr`;
  
  fetch(url)
    .then(r => r.json())
    .then(results => {
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        this.center = [lat, lng];
        this.setUserMarker(lat, lng);
        this.gpsError = '';
        this.renderDoctorMarkers();
      } else {
        this.gpsError = 'Address not found. Try: "Street number, City"';
      }
    })
    .catch(() => { this.gpsError = 'Could not search address.'; });
}

  // ── Doctors ───────────────────────────────────────────────────────────────

  loadDoctors(): void {
    this.loading  = true;
    this.searched = true;
    this.svc.getNearbyDoctors(this.specialtyFilter).subscribe(d => {
      this.doctors = d;
      this.loading = false;
      if (this.map) this.renderDoctorMarkers();
      this.cdr.detectChanges();
    });
  }

  // ── Booking ───────────────────────────────────────────────────────────────

  openBooking(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.bookingSuccess = false;
    this.selectedSlotId = '';
    this.bookingNotes   = '';
    this.slots          = [];
    this.reviews        = [];
    this.averageRating  = 0;
    this.selectedDate   = this.minDate;
    this.loadSlotsForDate();
    this.loadReviews();
  }

  loadReviews(): void {
    if (!this.selectedDoctor) return;
    this.reviewsLoading = true;
    this.svc.getDoctorReviews(this.selectedDoctor.id).subscribe(r => {
      this.reviews = r;
      this.averageRating = r.length > 0
        ? Math.round((r.reduce((sum: number, x: any) => sum + x.rating, 0) / r.length) * 10) / 10
        : 0;
      this.reviewsLoading = false;
      this.cdr.detectChanges();
    });
  }

  starsFromRating(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆');
  }

  loadSlotsForDate(): void {
    if (!this.selectedDoctor) return;
    this.slotsLoading = true;
    this.selectedSlotId = '';
    const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
    this.svc.getDoctorSlots(this.selectedDoctor.id, date).subscribe(s => {
      this.slots = s;
      this.slotsLoading = false;
      this.cdr.detectChanges();
    });
  }

  closeBooking(): void { this.selectedDoctor = null; }

  book(): void {
    if (!this.selectedSlotId || !this.selectedDoctor) return;
    this.bookingLoading = true;
    const req: AppointmentRequest = {
      doctorId: this.selectedDoctor.id,
      slotId:   this.selectedSlotId,
      notes:    this.bookingNotes,
    };
    this.svc.bookAppointment(req).subscribe({
      next: () => {
        this.bookingSuccess  = true;
        this.bookingLoading  = false;
      },
      error: () => {
        this.bookingLoading = false;
      }
    this.svc.bookAppointment(req).subscribe(() => {
      this.bookingSuccess = true;
      this.bookingLoading = false;
      this.cdr.detectChanges();
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  stars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆');
  }

  availableSlots(slots: TimeSlot[]): TimeSlot[] {
    return slots.filter(s => s.available);
  }

  formatSlotDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }
}