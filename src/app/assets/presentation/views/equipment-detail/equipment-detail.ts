import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Equipment } from '@assets/domain/model/equipment.entity';
import { Site } from '@assets/domain/model/site.entity';
import type { TemperatureThreshold } from '@assets/domain/value-objects/temperature-threshold';
import { EquipmentThresholdForm } from '@assets/presentation/components/equipment-threshold-form/equipment-threshold-form';
import { STATUS_EQUIPMENT_APPEARANCE } from '@assets/presentation/equipment-appearance';
import { createEquipmentMock, createSitesMock } from '@assets/presentation/mocks/assets.mock';
import { Icon } from '@shared/presentation/components/icon/icon';
import { StatePanel } from '@shared/presentation/components/state-panel/state-panel';
import { StatusTag } from '@shared/presentation/components/status-tag/status-tag';
import { injectMockDataSource } from '@shared/presentation/mock/mock-data-source';
import { LocalizedDatePipe } from '@shared/presentation/pipes/localized-date.pipe';
import { RelativeTimePipe } from '@shared/presentation/pipes/relative-time.pipe';
import { TemperaturePipe } from '@shared/presentation/pipes/temperature.pipe';

/**
 * Detail of an equipment item: identity, operational state, last known temperature and threshold
 * configuration. Device, telemetry, alert and service information belong to other contexts, so the view
 * links to them by equipment identifier instead of composing their data.
 */
@Component({
  imports: [
    RouterLink,
    TranslatePipe,
    Icon,
    StatePanel,
    StatusTag,
    EquipmentThresholdForm,
    LocalizedDatePipe,
    RelativeTimePipe,
    TemperaturePipe,
  ],
  selector: 'app-equipment-detail',
  styleUrl: './equipment-detail.css',
  templateUrl: './equipment-detail.html',
})
export class EquipmentDetail {
  protected readonly source = injectMockDataSource();
  protected readonly statusAppearance = STATUS_EQUIPMENT_APPEARANCE;

  // The mocked mutations update the entity in place, so setting the same instance must notify.
  protected readonly equipment = signal<Equipment | null>(null, { equal: () => false });
  protected readonly site = signal<Site | null>(null);
  protected readonly thresholdSaved = signal(false);

  private equipmentId = 0;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.equipmentId = Number(params.get('equipmentId'));
        this.load();
      });
  }

  protected load(): void {
    this.thresholdSaved.set(false);
    this.source.load((empty) => {
      const equipment = empty
        ? undefined
        : createEquipmentMock().find((item) => item.id === this.equipmentId);
      this.equipment.set(equipment ?? null);
      this.site.set(createSitesMock().find((site) => site.id === equipment?.site_id) ?? null);
    });
  }

  protected saveThreshold(threshold: TemperatureThreshold): void {
    const equipment = this.equipment();
    if (!equipment) {
      return;
    }
    this.thresholdSaved.set(false);
    // TODO: Delegate to the assets store (update equipment threshold use case).
    this.source.mutate(() => {
      equipment.temperature_threshold = threshold;
      this.equipment.set(equipment);
      this.thresholdSaved.set(true);
    });
  }
}
