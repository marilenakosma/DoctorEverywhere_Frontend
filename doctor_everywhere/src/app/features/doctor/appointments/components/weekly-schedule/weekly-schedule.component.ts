import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../services/doctor.service';
import { DAYS, TIME_SLOTS, Day, AvailabilityRange, WeeklyAvailability } from '../../../models/doctor.models';

@Component({
  selector: 'app-weekly-schedule',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './weekly-schedule.component.html',
  styleUrls: ['./weekly-schedule.component.scss']
})
export class WeeklyScheduleComponent implements OnInit {
  private svc = inject(DoctorService);

  readonly days = DAYS;
  readonly timeOptions: string[] = [...TIME_SLOTS];
  schedule!: WeeklyAvailability;
  saved = false;
  error = '';

  ngOnInit(): void {
    this.schedule = this.svc.getAvailability();
  }

  endTimeOptions(startTime: string): string[] {
    const idx = this.timeOptions.indexOf(startTime);
    return idx >= 0 ? this.timeOptions.slice(idx + 1) : this.timeOptions.slice(1);
  }

  onStartChange(range: AvailabilityRange): void {
    const startIdx = this.timeOptions.indexOf(range.start);
    const endIdx = this.timeOptions.indexOf(range.end);
    if (endIdx <= startIdx) {
      range.end = this.timeOptions[Math.min(startIdx + 1, this.timeOptions.length - 1)];
    }
  }

  addRange(day: Day): void {
    const ranges = this.schedule[day];
    const lastEnd = ranges.length > 0 ? ranges[ranges.length - 1].end : this.timeOptions[0];
    const lastEndIdx = this.timeOptions.indexOf(lastEnd);
    const newStart = this.timeOptions[Math.min(lastEndIdx + 1, this.timeOptions.length - 2)] ?? this.timeOptions[this.timeOptions.length - 2];
    const newEnd = this.timeOptions[this.timeOptions.indexOf(newStart) + 1] ?? this.timeOptions[this.timeOptions.length - 1];
    ranges.push({ start: newStart, end: newEnd });
  }

  removeRange(day: Day, index: number): void {
    this.schedule[day].splice(index, 1);
  }

  rangeCount(day: Day): number {
    return this.schedule[day]?.length ?? 0;
  }

  save(): void {
    this.error = '';
    for (const day of this.days) {
      for (const range of this.schedule[day]) {
        if (range.start >= range.end) {
          this.error = `${day}: end time must be after start time.`;
          return;
        }
      }
    }
    this.svc.saveAvailability(this.schedule).subscribe({
      next: () => {
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.error = 'Failed to save. Please try again.';
      },
    });
  }
}
