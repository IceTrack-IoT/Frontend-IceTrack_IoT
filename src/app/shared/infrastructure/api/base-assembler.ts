import { BaseEntity } from '@shared/domain/model/base-entity';
import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';

/**
 * Defines a contract for assembler classes that convert between entities, resources, and API responses.
 *
 * @template TEntity - The entity type (e.g., Course), must
 * @template TResource - The resource type, must extend BaseResource.
 * @template TResponse - The response type, must extend BaseResponse.
 * @template TId - The type of the unique identifier for the entity and resource (default is number).
 */
export interface BaseAssembler<
  TEntity extends BaseEntity<TId>,
  TResource extends BaseResource<TId>,
  TResponse extends BaseResponse,
  TId = number,
> {
  /**
   * Converts a resource to an entity.
   * @param resource - The resource to convert.
   * @returns The converted entity.
   */
  toEntityFromResource(resource: TResource): TEntity;

  /**
   * Converts an entity to a resource.
   * @param entity - The entity to convert.
   * @returns The converted resource.
   */
  toResourceFromEntity(entity: TEntity): TResource;

  /**
   * Converts an API response to an array of entities.
   * @param response - The API response containing entities.
   * @returns An array of entities.
   */
  toEntitiesFromResponse(response: TResponse): TEntity[];
}
