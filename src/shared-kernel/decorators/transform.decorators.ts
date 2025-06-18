import 'reflect-metadata';

export function TransformUrlFrom(sourceField: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        Reflect.defineMetadata('transform:source', sourceField, target, propertyKey);
    };
}

export function TransformUrl(): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        Reflect.defineMetadata('transform:direct', true, target, propertyKey);
    };
}