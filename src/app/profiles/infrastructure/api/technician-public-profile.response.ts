/**
 * TechnicianPublicProfileResource is returned by `GET /profiles/technicians/{technicianId}/public`. It
 * never carries contact data.
 */
export interface TechnicianPublicProfileResource {
  id: number;
  full_name: string;
  speciality: string;
  certification_number: string;
  completed_services: number;
  /** Between 1 and 5; null until the technician's first review. */
  average_rating: number | null;
  rating_available: boolean;
}

/**
 * PagedTechnicianPublicProfileResource is returned by `GET /profiles/technicians/public`.
 */
export interface PagedTechnicianPublicProfileResource {
  content: TechnicianPublicProfileResource[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}
