import fs from 'fs/promises';
import { getCachedData, setCachedData, updateCachedData } from "./redis"
import { prisma } from '../config/prisma';
import { generateHash } from './crypto';
import path from 'path'; 
import { MAX_ITEMS_PER_LAYER, TTL } from '../config/envExports';

export const getFolderHashAndFileCount = async (): Promise<{ folderHash: string; fileCount: number, hashes: string[] }> => {
  let fileStructure = await getCachedData('fileStructure');

  if (!fileStructure) {
    fileStructure = await prisma.fileContainer.findFirst({
      where: { id: 1 },
    });

    if (!fileStructure) {
      fileStructure = await prisma.fileContainer.create({
        data: {
          Layer1_Hash: generateHash(6),
          Layer2_Hash: generateHash(6),
          Layer3_Hash: generateHash(6),
          Layer4_Hash: generateHash(6),
          Layer5_Hash: generateHash(6),
        }
      });
    }

    setCachedData({ key: 'fileStructure', value: fileStructure, ttlSeconds: TTL });
  }

  const projectRoot = process.cwd();

  const hashes: string[] = [
    fileStructure.Layer1_Hash,
    fileStructure.Layer2_Hash,
    fileStructure.Layer3_Hash,
    fileStructure.Layer4_Hash,
    fileStructure.Layer5_Hash,
  ];

  for (let i = 4; i >= 0; i--) {
    const dirPath = path.join(projectRoot, 'uploads', ...hashes.slice(0, i + 1));
    const itemCount = await getTotalItemCount(dirPath);

    if (itemCount === null || itemCount < MAX_ITEMS_PER_LAYER) {
      console.log(`Using layer ${i + 1} with hash ${hashes[i]} and item count ${itemCount}`);
      break;
    } else {
      hashes[i] = await generateUniqueHash(projectRoot, hashes.slice(0, i));
      fileStructure = await prisma.fileContainer.update({
        where: { id: 1 },
        data: { [`Layer${i + 1}_Hash`]: hashes[i] }
      });
      updateCachedData('fileStructure', fileStructure, TTL);
    }
  }

  const pathToUpload = path.join(projectRoot, 'uploads', ...hashes);

  try {
    await fs.access(pathToUpload);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(pathToUpload, { recursive: true });
    } else {
      throw err;
    }
  }

  const folderHash =
    fileStructure.Layer1_Hash +
    fileStructure.Layer2_Hash +
    fileStructure.Layer3_Hash +
    fileStructure.Layer4_Hash +
    fileStructure.Layer5_Hash;

  const fileCount = fileStructure.fileCount || 0;

  return { folderHash, fileCount, hashes };
};

/**
 * Counts the total number of files and directories directly within a given path.
 */
async function getTotalItemCount(directoryPath: string): Promise<number | null> {
  try {
    const items = await fs.readdir(directoryPath);
    return items.length;
  } catch (error: any) {
    if (error.code === "ENOENT") return null;
    console.error(`Error reading directory "${directoryPath}":`, (error as Error).message);
    return null;
  }
}

/**
 * Generates a unique hash ensuring the folder path doesn’t already exist.
 */
async function generateUniqueHash(basePath: string, depthHashes: string[]): Promise<string> {
  let newHash: string;
  let dirExists = true;

  do {
    newHash = generateHash(6);
    const candidatePath = path.join(basePath, 'uploads', ...depthHashes, newHash);

    try {
      await fs.access(candidatePath);
      dirExists = true; // folder exists means collision
    } catch (err: any) {
      if (err.code === "ENOENT") {
        dirExists = false; // no collision
      } else {
        throw err;
      }
    }
  } while (dirExists);

  return newHash;
}
