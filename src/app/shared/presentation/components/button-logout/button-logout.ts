import { Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '@shared/presentation/components/icon/icon';

/**
 * Sign-out button of the authenticated shell. It only emits the user's intent; the shell decides what
 * signing out does. It takes the text color of its container, so it fits light and dark surfaces.
 */
@Component({
  imports: [TranslatePipe, Icon],
  selector: 'app-button-logout',
  styleUrl: './button-logout.css',
  templateUrl: './button-logout.html',
})
export class ButtonLogout {
  readonly signOut = output<void>();
}
