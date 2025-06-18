import { ClassTransformOptions, plainToClass } from "class-transformer";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";

export class TransformUtil {
  private static cloudService = CloudService.getInstance();

  static async toDto<V, T>(
    cls: new () => T,
    plain: V,
    options?: ClassTransformOptions
  ): Promise<T> {
    const dto = plainToClass(cls, plain, options);
    return await this.transformObject(dto);
  }

  private static async transformObject<T>(obj: any): Promise<any> {
    if (!obj) return obj;

    // Xử lý mảng
    if (Array.isArray(obj)) {
      return Promise.all(obj.map((item) => this.transformObject(item)));
    }

    // Thu thập transform tasks
    const transformTasks: Promise<void>[] = [];
    const keyEntries: { key: string; entries: { obj: any; prop: string }[] }[] =
      [];

    const processValue = (currentObj: any) => {
      if (!currentObj || typeof currentObj !== "object") return;

      for (const prop of Object.keys(currentObj)) {
        const value = currentObj[prop];

        // Đệ quy vào object con
        if (Array.isArray(value)) {
          value.forEach((item) => processValue(item));
        } else if (typeof value === "object") {
          processValue(value);
        }

        // Kiểm tra transform metadata
        const sourceField = Reflect.getMetadata(
          "transform:source",
          currentObj,
          prop
        );
        const isDirect = Reflect.getMetadata(
          "transform:direct",
          currentObj,
          prop
        );

        if (sourceField || isDirect) {
          const sourceValue = sourceField ? currentObj[sourceField] : value;

          if (sourceValue && typeof sourceValue === "string") {
            // Thêm vào batch processing
            let entry = keyEntries.find((e) => e.key === sourceValue);
            if (!entry) {
              entry = { key: sourceValue, entries: [] };
              keyEntries.push(entry);
            }
            entry.entries.push({ obj: currentObj, prop });
          }
        }
      }
    };

    processValue(obj);

    // Batch request tất cả URLs
    const keys = keyEntries.map((e) => e.key);
    const urlMap = await this.batchGetUrls(keys);

    // Ánh xạ kết quả
    keyEntries.forEach((entry) => {
      const url = urlMap.get(entry.key);
      if (url) {
        entry.entries.forEach(({ obj, prop }) => {
          obj[prop] = url;
        });
      }
    });

    return obj;
  }

  private static async batchGetUrls(
    keys: string[]
  ): Promise<Map<string, string>> {
    const uniqueKeys = [...new Set(keys.filter((k) => k))];
    if (uniqueKeys.length === 0) return new Map();
    return this.cloudService.batchGetSignedUrls(uniqueKeys);
  }
}
