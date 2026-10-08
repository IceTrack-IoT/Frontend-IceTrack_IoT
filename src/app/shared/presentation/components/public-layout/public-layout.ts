import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shell of the public (unauthenticated) screens: brand header and centered main content. It never
 * renders the owner navigation. Content marked with `publicLayoutActions` replaces the header tagline.
 */
@Component({
  imports: [TranslatePipe],
  selector: 'app-public-layout',
  styleUrl: './public-layout.css',
  templateUrl: './public-layout.html',
})
export class PublicLayout {}
