export class ConfigService {
    static tryGet(key: string): string {
        const value = process.env[key];
        if (value === undefined) {
            console.error(`Environment variable "${key}" is not defined`);
            throw new Error(`Environment variable "${key}" is not defined`);
        }
        return value;
    }
}