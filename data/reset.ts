import type { VibraDatabase } from "./db";
import { db } from "./db";
import { releaseUploadedAssetObjectUrls } from "./repositories/project-repository";
import { buildDemoSeedData, writeDemoSeedData } from "./seed";

export const clearDemoData = async (database: VibraDatabase): Promise<void> => {
  await Promise.all(database.tables.map((table) => table.clear()));
};

export const resetDemoData = async (database: VibraDatabase = db): Promise<void> => {
  releaseUploadedAssetObjectUrls(database);

  await database.transaction("rw", database.tables, async () => {
    await clearDemoData(database);
    await writeDemoSeedData(database, buildDemoSeedData());
  });
};
