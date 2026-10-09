import { Component, inject, input, type OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Site } from '@assets/domain/model/site.entity';
import { Dialog } from '@shared/presentation/components/dialog/dialog';

/** Digits, spaces, hyphens and parentheses with an optional leading +, 7 to 20 characters. */
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

/** The data of a site collected by the site form. */
export interface SiteFormValue {
  readonly name: string;
  readonly address: string;
  readonly contactName: string;
  readonly phone: string;
}

type SiteFormControl = keyof SiteFormValue;

/**
 * Dialog to register a site or to update the contact of an existing one. A site keeps its name and
 * address once registered; only its contact name and phone can be updated.
 */
@Component({
  imports: [ReactiveFormsModule, TranslatePipe, Dialog],
  selector: 'app-site-form-dialog',
  templateUrl: './site-form-dialog.html',
})
export class SiteFormDialog implements OnInit {
  /** The site to update, or null to register a new site. */
  readonly site = input<Site | null>(null);
  /** Whether the save is in progress. */
  readonly pending = input(false);
  readonly saved = output<SiteFormValue>();
  readonly closed = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    address: ['', [Validators.required, Validators.maxLength(160)]],
    contactName: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  ngOnInit(): void {
    const site = this.site();
    if (site) {
      this.form.setValue({
        name: site.name,
        address: site.address,
        contactName: site.contact_name,
        phone: site.phone.value,
      });
      this.form.controls.name.disable();
      this.form.controls.address.disable();
    }
  }

  protected submit(): void {
    if (this.pending()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }

  protected errorKey(name: SiteFormControl): string | null {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return 'shared.validation.required';
    }
    if (control.hasError('maxlength')) {
      return 'shared.validation.tooLong';
    }
    return control.hasError('pattern') ? 'assets.validation.phone' : null;
  }
}
