/**
 * Defines a standard structure for API responses. This interface can be extended to include additional properties as needed.
 */
export interface BaseResponse {}

/**
 * Defines a standard structure for API resources with a unique identifier.
 */
export interface BaseResource<TId = number> {
  /**
   * The unique identifier for the resource.
   */
  id: TId;
}
