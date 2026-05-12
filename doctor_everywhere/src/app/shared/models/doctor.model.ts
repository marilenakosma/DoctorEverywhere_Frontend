export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  availableSlots: number;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}
