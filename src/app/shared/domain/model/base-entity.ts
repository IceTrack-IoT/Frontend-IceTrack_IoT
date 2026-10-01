/**
 * Represents a base entity with a unique identifier.
 *
 * @template TId - The type of the unique identifier (default is number).
 */
export interface BaseEntity<TId = number> {
  /**
   * The unique identifier for the entity.
   */
  readonly id: TId;
}
