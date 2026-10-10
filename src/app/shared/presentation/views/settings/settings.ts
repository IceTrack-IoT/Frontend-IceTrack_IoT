import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Settings of the signed-in account. The routes of the settings render in its outlet, so a context adds
 * its own section, such as the owner profile, without the view depending on that context.
 */
@Component({
  imports: [RouterOutlet, TranslatePipe],
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings {}
