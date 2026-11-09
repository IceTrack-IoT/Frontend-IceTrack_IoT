/** Body of `POST /assets/sites/validate-address`. */
export interface ValidateAddressRequest {
  address: string;
  place_id: string | null;
}

/** Body of `POST /assets/sites`. The optional pin is not sent, so the verified point is used. */
export interface RegisterSiteRequest {
  name: string;
  contact_name: string;
  phone: string;
  validation_token: string;
}

/** Body of `PUT /assets/sites/{siteId}`. */
export interface UpdateSiteRequest {
  name: string;
  contact_name: string;
  phone: string;
}

/** Body of `PUT /assets/sites/{siteId}/address`. The optional pin is not sent. */
export interface UpdateSiteAddressRequest {
  validation_token: string;
}

/** Body of `POST /assets/equipments`. */
export interface RegisterEquipmentRequest {
  site_id: number;
  uid: string;
  name: string;
  equipment_type: string;
  min_celsius: number;
  max_celsius: number;
  reminder_interval_days: number;
}

/** Body of `PUT /assets/equipments/{equipmentId}`. */
export interface UpdateEquipmentRequest {
  name: string;
  equipment_type: string;
  reminder_interval_days: number;
}

/** Body of `PUT /assets/equipments/{equipmentId}/threshold`. */
export interface ChangeThresholdRequest {
  min_celsius: number;
  max_celsius: number;
}

/** Body of `PUT /assets/equipments/{equipmentId}/status`. */
export interface ChangeStatusRequest {
  new_status: string;
}
