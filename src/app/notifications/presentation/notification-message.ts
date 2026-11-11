import type { Notification } from '@notifications/domain/model/notification.entity';

/** A notification message to show in the interface language: its translation key and values. */
export interface LocalizedNotificationMessage {
  readonly key: string;
  readonly params: Readonly<Record<string, string>>;
}

/** Formats a number in the interface language with the given number of decimals. */
export type NumberFormatter = (value: number, fractionDigits: number) => string;

/** How the values of a documented message template are read. */
interface MessageTemplate {
  /** Values shown as text, as received (names, and free text such as a reason typed by a person). */
  readonly texts: readonly string[];
  /** Values shown as numbers, with their number of decimals. */
  readonly numbers?: Readonly<Record<string, number>>;
  /** The value that picks a variant of the template, with the values it may take. */
  readonly variant?: { readonly param: string; readonly values: readonly string[] };
}

const PREFIX = 'notifications.messages.';

/**
 * The documented message templates (`message_key`) with the values each needs. A key missing here, such
 * as `notification.untemplated`, is shown with the English `message`.
 */
const TEMPLATES: Readonly<Record<string, MessageTemplate>> = {
  'alert.temperature_excursion.raised': {
    texts: ['equipment_name'],
    numbers: { temperature: 1, threshold: 1 },
    variant: { param: 'limit', values: ['MAX', 'MIN'] },
  },
  'alert.device_offline.raised': { texts: ['equipment_name'], numbers: { silent_minutes: 0 } },
  'alert.sensor_failure.raised': { texts: ['equipment_name'] },
  'service_request.assigned': {
    texts: ['equipment_name', 'technician_name'],
    numbers: { service_request_id: 0 },
  },
  'service_request.unassigned': { texts: ['equipment_name'], numbers: { service_request_id: 0 } },
  'service_request.rejected': {
    texts: ['equipment_name', 'reason'],
    numbers: { service_request_id: 0 },
  },
  'service_request.canceled': {
    texts: ['equipment_name', 'reason'],
    numbers: { service_request_id: 0 },
  },
  'maintenance_window.opened': {
    texts: ['equipment_name'],
    variant: { param: 'origin', values: ['APP', 'BUTTON'] },
  },
  'maintenance_window.closed': {
    texts: ['equipment_name'],
    variant: {
      param: 'closure_reason',
      values: ['MANUAL_APP', 'MANUAL_BUTTON', 'INTERVENTION_COMPLETED', 'EXPIRED', 'SAFETY_LIMIT'],
    },
  },
};

/**
 * Resolves how a notification message is shown in the interface language, from its template key and
 * values. Returns null, so the English `message` is shown instead, when the key is not a documented
 * template or a value it needs is missing or undocumented.
 * @param notification - The notification.
 * @param formatNumber - Formats numeric values in the interface language.
 * @returns The translation key and its values, or null.
 */
export function localizedNotificationMessage(
  notification: Notification,
  formatNumber: NumberFormatter,
): LocalizedNotificationMessage | null {
  const template = TEMPLATES[notification.message_key];
  if (template === undefined) {
    return null;
  }
  const values = notification.message_params;
  const params: Record<string, string> = {};
  for (const name of template.texts) {
    const value = values[name];
    if (value === undefined) {
      return null;
    }
    params[name] = String(value);
  }
  for (const [name, fractionDigits] of Object.entries(template.numbers ?? {})) {
    const value = values[name];
    if (typeof value !== 'number') {
      return null;
    }
    params[name] = name.endsWith('_id') ? String(value) : formatNumber(value, fractionDigits);
  }
  let key = PREFIX + notification.message_key;
  if (template.variant !== undefined) {
    const variant = values[template.variant.param];
    if (typeof variant !== 'string' || !template.variant.values.includes(variant)) {
      return null;
    }
    key = `${key}.${variant}`;
  }
  return { key, params };
}
