import { Equipment } from '@assets/domain/model/equipment.entity';
import { EquipmentType } from '@assets/domain/value-objects/equipment-type';
import { StatusEquipment } from '@assets/domain/value-objects/status-equipment';

describe('Equipment', () => {
  const freezer = new Equipment({
    id: 1,
    owner_id: 1,
    equipment_code_uid: '3f6c1a2e-8b4d-4e71-9a0f-1c2d3e4f5a01',
    name: 'Walk-In Freezer #02',
    equipment_type: EquipmentType.FREEZER,
    status: StatusEquipment.ACTIVE,
    site_id: 1,
    online: true,
    reminder_interval_days: 90,
    temperature_threshold: { min_celsius: -20, max_celsius: -16 },
    last_reading_at: null,
    last_known_temperature: null,
  });

  it('treats temperatures within the threshold, limits included, as in range', () => {
    expect(freezer.isOutRange(-18)).toBe(false);
    expect(freezer.isOutRange(-20)).toBe(false);
    expect(freezer.isOutRange(-16)).toBe(false);
  });

  it('treats temperatures below the minimum or above the maximum as out of range', () => {
    expect(freezer.isOutRange(-20.1)).toBe(true);
    expect(freezer.isOutRange(-12.1)).toBe(true);
  });
});
