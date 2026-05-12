import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserRole, UserInfo } from '../../../../shared/models/user-identity.model';
import { AuthService } from '../../../../shared/services/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private auth = inject(AuthService);

  readonly UserRole = UserRole;
  readonly currentUser$: Observable<UserInfo | null> = this.auth.currentUser$;
  readonly role$ = this.currentUser$.pipe(map(user => user?.role));

  initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  }

  logout(): void {
    this.auth.logout();
  }
}
