// utils/class-mapper.ts
import { ClassConstructor, plainToInstance } from "class-transformer";

export function mapToDto<T, V>(dtoClass: ClassConstructor<T>, entity: V): T {
  return plainToInstance(dtoClass, entity, {
    excludeExtraneousValues: true,
  });
}

export function mapArrayToDto<T, V>(
  dtoClass: ClassConstructor<T>,
  entities: V[]
): T[] {
  return plainToInstance(dtoClass, entities, {
    excludeExtraneousValues: true,
  });
}
