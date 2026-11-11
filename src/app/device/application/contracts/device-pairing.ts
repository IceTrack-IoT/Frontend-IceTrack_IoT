import type { Device } from '@device/domain/model/device.entity';

/** The longest device UID, board model or firmware version the backend accepts. */
export const DEVICE_TEXT_MAX_LENGTH = 64;

/**
 * The data with which the owner pairs a board with one of their equipment items. Pairing a board that was
 * unpaired earlier reuses it under the same UID.
 */
export interface DevicePairing {
  readonly equipmentId: number;
  /** The unique identifier of the board; not blank, up to 64 characters. */
  readonly deviceUid: string;
  /** The board model; not blank, up to 64 characters. */
  readonly boardModel: string;
  /** The firmware version running on the board, up to 64 characters, or null when not declared. */
  readonly firmwareVersion: string | null;
}

/**
 * A device together with the API key the backend has just issued for it. The plaintext key is returned
 * only once, on pairing and on rotation; it must be handed to the owner and never stored.
 */
export interface IssuedDeviceCredential {
  readonly device: Device;
  /**
   * The plaintext API key. Null only for a pairing whose answer was replayed after a retry: the key was
   * issued by the first attempt and can only be seen again by rotating it.
   */
  readonly apiKey: string | null;
}
