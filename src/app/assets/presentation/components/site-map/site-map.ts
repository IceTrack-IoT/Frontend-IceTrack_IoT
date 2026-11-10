import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  signal,
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { TranslatePipe } from '@ngx-translate/core';
import { GoogleMapsLoader } from '@assets/infrastructure/google/google-maps-loader';
import { Icon } from '@shared/presentation/components/icon/icon';

/** Where the map preview stands: loading the API, usable, failed to load, or not configured at all. */
type MapStatus = 'loading' | 'ready' | 'failed' | 'unavailable';

/**
 * Preview of a site location on a Google map, centred on the coordinates the backend resolved for its
 * address. The component hides itself when the platform has no Google Maps API key configured, and says
 * so when the API cannot be loaded; the address is always shown by the owner of this component.
 */
@Component({
  imports: [GoogleMapsModule, TranslatePipe, Icon],
  selector: 'app-site-map',
  styleUrl: './site-map.css',
  templateUrl: './site-map.html',
  host: {
    '[hidden]': "status() === 'unavailable'",
  },
})
export class SiteMap implements OnDestroy {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  /** The translated place the map shows, used as the accessible name of the preview. */
  readonly label = input.required<string>();

  private readonly loader = inject(GoogleMapsLoader);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private errorOverlayObserver: MutationObserver | null = null;

  protected readonly status = signal<MapStatus>(this.loader.configured ? 'loading' : 'unavailable');
  protected readonly center = computed(() => ({ lat: this.latitude(), lng: this.longitude() }));
  protected readonly zoom = 16;
  protected readonly options = {
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    fullscreenControl: false,
  };

  constructor() {
    if (this.status() === 'loading') {
      afterNextRender(() => {
        this.loader.load().then(
          () => {
            this.status.set('ready');
            this.watchErrorOverlay();
          },
          () => this.status.set('failed'),
        );
      });
    }
  }

  ngOnDestroy(): void {
    this.stopWatchingErrorOverlay();
  }

  /** Hides the preview when Google rejects the API key while the map is being rendered. */
  protected fail(): void {
    this.stopWatchingErrorOverlay();
    this.status.set('failed');
  }

  /**
   * Google draws its own error card inside the map when it refuses the key (restrictions, billing or
   * quota). The card is replaced by the fallback of this component, so the owner never sees it.
   */
  private watchErrorOverlay(): void {
    if (this.hasErrorOverlay()) {
      this.fail();
      return;
    }

    this.errorOverlayObserver = new MutationObserver(() => {
      if (this.hasErrorOverlay()) {
        this.fail();
      }
    });
    this.errorOverlayObserver.observe(this.host.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  private stopWatchingErrorOverlay(): void {
    this.errorOverlayObserver?.disconnect();
    this.errorOverlayObserver = null;
  }

  private hasErrorOverlay(): boolean {
    return this.host.nativeElement.querySelector('.gm-err-container') !== null;
  }
}
