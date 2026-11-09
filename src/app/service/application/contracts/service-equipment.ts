/**
 * An equipment item of the owner that a service can be requested for. Assets owns the equipment and its
 * site; Service Request Management only refers to them by id and shows their names.
 */
export interface ServiceEquipment {
  readonly id: number;
  readonly name: string;
  readonly siteId: number;
}

/**
 * A site of the owner, by id and name, as Service Request Management shows it next to a request.
 */
export interface ServiceSite {
  readonly id: number;
  readonly name: string;
}

/**
 * The owner's equipment and sites that service requests refer to.
 */
export interface ServiceEquipmentDirectory {
  readonly equipment: readonly ServiceEquipment[];
  readonly sites: readonly ServiceSite[];
}
