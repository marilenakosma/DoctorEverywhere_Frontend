import { Component, inject, OnDestroy, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PatientService } from '../services/patient.service';
import { Doctor, TimeSlot } from '../../../shared/models/doctor.model';
import { AppointmentRequest } from '../../../shared/models/appointment.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements AfterViewInit, OnDestroy {

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
  specialtyFilter = '';
  hoveredDoctorId: string | null = null;
  specialties = ['All', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'General Practice'];

  selectedDoctor: Doctor | null = null;
  slots: TimeSlot[] = [];
  selectedSlotId = '';
  bookingNotes = '';
  bookingSuccess = false;
  bookingLoading = false;

  private svc = inject(PatientService);

  ngAfterViewInit(): void {
    // Wait for DOM to fully render before initializing map
    setTimeout(() => {
      this.initMap();
      this.locationReady = true;
      this.loadDoctors();
      this.useGPS();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    const mapEl = document.getElementById('search-map');
    if (!mapEl) return;

    this.map = L.map('search-map', {
      center: this.center,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Force size recalculation after tiles load
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private setUserMarker(lat: number, lng: number): void {
    if (this.userMarker) this.map.removeLayer(this.userMarker);
    this.userMarker = L.circleMarker([lat, lng], {
      radius: 10,
      fillColor: '#185FA5',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 2,
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
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    this.doctors.forEach(doctor => {
      const marker = L.marker([doctor.latitude, doctor.longitude], { icon: redIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="min-width:160px">
            <strong>Dr. ${doctor.firstName} ${doctor.lastName}</strong><br>
            <span style="color:#185FA5;font-size:12px">${doctor.specialty}</span><br>
            <span style="color:#64748b;font-size:12px">⭐ ${doctor.rating} · ${doctor.distanceKm} km</span><br>
            <span style="color:#16a34a;font-size:12px">${doctor.availableSlots} slots available</span>
          </div>
        `);
      marker.on('click', () => this.openBooking(doctor));
      this.doctorMarkers.push(marker);
    });
  }

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
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.manualAddress)}&limit=1`;
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
          this.gpsError = 'Address not found. Try a more specific address.';
        }
      })
      .catch(() => { this.gpsError = 'Could not search address.'; });
  }

  loadDoctors(): void {
    this.loading = true;
    const specialty = this.specialtyFilter === 'All' ? '' : this.specialtyFilter;
    this.svc.getNearbyDoctors(specialty).subscribe(d => {
      this.doctors = d;
      this.loading = false;
      if (this.map) this.renderDoctorMarkers();
    });
  }

  openBooking(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.bookingSuccess = false;
    this.selectedSlotId = '';
    this.bookingNotes = '';
    this.svc.getDoctorSlots(doctor.id).subscribe(s => this.slots = s);
  }

  closeBooking(): void { this.selectedDoctor = null; }

  book(): void {
    if (!this.selectedSlotId || !this.selectedDoctor) return;
    this.bookingLoading = true;
    const req: AppointmentRequest = {
      doctorId: this.selectedDoctor.id,
      slotId: this.selectedSlotId,
      notes: this.bookingNotes
    };
    this.svc.bookAppointment(req).subscribe(() => {
      this.bookingSuccess = true;
      this.bookingLoading = false;
    });
  }

  stars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆');
  }

  availableSlots(slots: TimeSlot[]): TimeSlot[] { return slots.filter(s => s.available); }

  formatSlotDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}