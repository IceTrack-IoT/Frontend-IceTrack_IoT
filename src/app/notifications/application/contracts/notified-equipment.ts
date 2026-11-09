/**
 * An equipment item of the signed-in owner as Notifications needs it to name the equipment a notification
 * concerns. Assets Management owns the equipment; Notifications only reads its name.
 */
export interface NotifiedEquipment {
  readonly id: number;
  readonly name: string;
}
