import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { BaseEntity } from '@shared/domain/model/base-entity';
import { BaseResource, BaseResponse } from '@shared/infrastructure/api/base-response';
import { BaseAssembler } from '@shared/infrastructure/api/base-assembler';
import { handleError } from '@shared/infrastructure/http/handle-error-http';

/**
 * Base class for API endpoint operations with generic CRUD functionality.
 *
 * @template TEntity - The entity type, which must extend BaseEntity.
 * @template TResource - The resource type, must extend BaseResource.
 * @template TResponse - The response type, must extend BaseResponse.
 * @template TAssembler - The assembler type implementing BaseAssembler with matching generics.
 * @template TId - The type of the unique identifier for the entity and resource (default is number).
 */
export abstract class BaseApiEndpoint<
  TEntity extends BaseEntity<TId>,
  TResource extends BaseResource<TId>,
  TResponse extends BaseResponse,
  TAssembler extends BaseAssembler<TEntity, TResource, TResponse, TId>,
  TId = number
> {
  protected constructor(
    protected http: HttpClient,
    protected endpointUrl: string,
    protected assembler: TAssembler
  ) {}

  /**
   * Retrieves all entities from the API, handling both response objects and arrays.
   * @returns An Observable for an array of entities.
   */
  getAll(): Observable<TEntity[]> {
    return this.http.get<TResponse | TResource[]>(this.endpointUrl).pipe(
      map(response => {
        console.log(response);
        if (Array.isArray(response)) {
          return response.map(resource => this.assembler.toEntityFromResource(resource));
        }
        return this.assembler.toEntitiesFromResponse(response as TResponse);
      }),
      catchError(handleError('Failed to fetch entities'))
    );
  }

  /**
   * Retrieves a single entity by ID.
   * @param id - The ID of the entity.
   * @returns An Observable of the entity.
   */
  getById(id: number): Observable<TEntity> {
    return this.http.get<TResource>(`${this.endpointUrl}/${id}`).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      catchError(handleError('Failed to fetch entity'))
    );
  }

  /**
   * Creates a new entity.
   * @param entity - The entity to create.
   * @returns An Observable of the created entity.
   */
  create(entity: TEntity): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.post<TResource>(this.endpointUrl, resource).pipe(
      map(created => this.assembler.toEntityFromResource(created)),
      catchError(handleError('Failed to create entity'))
    );
  }

  /**
   * Updates an existing entity.
   * @param entity - The entity to update.
   * @param id - The ID of the entity.
   * @returns An Observable of the updated entity.
   */
  update(entity: TEntity, id: number): Observable<TEntity> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.put<TResource>(`${this.endpointUrl}/${id}`, resource).pipe(
      map(updated => this.assembler.toEntityFromResource(updated)),
      catchError(handleError('Failed to update entity'))
    );
  }

  /**
   * Deletes an entity by ID.
   * @param id - The ID of the entity to delete.
   * @returns An Observable of void.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`).pipe(
      catchError(handleError('Failed to delete entity'))
    );
  }
}
