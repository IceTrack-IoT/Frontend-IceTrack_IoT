/**
 * The contact data of a site that an owner gives when registering it and may change afterwards. The
 * address is not part of it: it only changes through a verified address.
 */
export interface SiteDetails {
  /** Up to 30 characters. */
  readonly name: string;
  /** Up to 30 characters. */
  readonly contactName: string;
  /** Digits with an optional leading '+' and single spaces as separators. */
  readonly phone: string;
}

/**
 * The data an owner gives to register a site: its contact data and the token of its verified address.
 */
export interface NewSite extends SiteDetails {
  /** The token returned by the address verification, valid for 15 minutes. */
  readonly validationToken: string;
}

/** The longest site name the backend accepts. */
export const SITE_NAME_MAX_LENGTH = 30;
/** The longest site contact name the backend accepts. */
export const SITE_CONTACT_NAME_MAX_LENGTH = 30;
/** The longest address text the backend verifies. */
export const SITE_ADDRESS_MAX_LENGTH = 255;
/** The format of a site phone: digits with an optional leading '+' and single spaces as separators. */
export const SITE_PHONE_PATTERN = /^\+?\d+( \d+)*$/;

/**
 * Trims the contact data of a site as the owner typed it.
 * @param details - The contact data as collected.
 * @returns The trimmed contact data.
 */
export function trimSiteDetails(details: SiteDetails): SiteDetails {
  return {
    name: details.name.trim(),
    contactName: details.contactName.trim(),
    phone: details.phone.trim(),
  };
}
