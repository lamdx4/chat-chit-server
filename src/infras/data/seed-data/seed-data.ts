import "reflect-metadata";
import "dotenv/config";
import { fakerVI as faker } from "@faker-js/faker";
import AppDataSource from "../data-source/data-source";
import seedUser from "./seed-user";
import seedGroup from "./seed-group";
import { seedPermissionsForGroup } from "./seed-permission";

export default async function seed() {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    await seedUser(manager, faker);

    await seedPermissionsForGroup(manager);

    // await seedGroup(manager, faker);
  });

  console.log("✅ Seed data completed!");
}

seed()
  .finally(() => {
    AppDataSource.destroy();
    console.log("Database connection closed.");
    process.exit(0);
  })
  .catch((error) => console.error("Seed error:", error));
