import { getObjectStorageClient, getNamespace, getBucketName, getPublicUrl } from './ociClient';

const KEEP_FILE = '.keep';

export interface ProjectInfo {
  name: string;
  createdAt?: Date;
}

export interface FileInfo {
  name: string;
  fullPath: string;
  size: number;
  contentType?: string;
  lastModified: Date;
  publicUrl: string;
}

/**
 * List all projects (prefixes) in the bucket
 */
export async function listProjects(): Promise<ProjectInfo[]> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const response = await client.listObjects({
    namespaceName: namespace,
    bucketName: bucketName,
    delimiter: '/',
  });

  const projects: ProjectInfo[] = [];

  // Projects are represented as prefixes
  if (response.listObjects.prefixes) {
    for (const prefix of response.listObjects.prefixes) {
      // Remove trailing slash
      const projectName = prefix.replace(/\/$/, '');
      projects.push({ name: projectName });
    }
  }

  return projects;
}

/**
 * Create a new project by creating a .keep file
 */
export async function createProject(projectName: string): Promise<void> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const objectName = `${projectName}/${KEEP_FILE}`;

  await client.putObject({
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
    putObjectBody: Buffer.from(''),
    contentLength: 0,
    contentType: 'application/octet-stream',
  });
}

/**
 * Check if a project exists
 */
export async function projectExists(projectName: string): Promise<boolean> {
  const projects = await listProjects();
  return projects.some((p) => p.name === projectName);
}

/**
 * List all files in a project
 */
export async function listFiles(projectName: string): Promise<FileInfo[]> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const prefix = `${projectName}/`;

  const response = await client.listObjects({
    namespaceName: namespace,
    bucketName: bucketName,
    prefix: prefix,
    fields: 'name,size,timeCreated',
  });

  const files: FileInfo[] = [];

  if (response.listObjects.objects) {
    for (const obj of response.listObjects.objects) {
      // Skip .keep files
      if (obj.name.endsWith(`/${KEEP_FILE}`)) {
        continue;
      }

      // Extract filename from path
      const fileName = obj.name.substring(prefix.length);

      files.push({
        name: fileName,
        fullPath: obj.name,
        size: obj.size || 0,
        lastModified: obj.timeCreated ? new Date(obj.timeCreated) : new Date(),
        publicUrl: getPublicUrl(obj.name),
      });
    }
  }

  return files;
}

/**
 * Upload a file to a project
 */
export async function uploadFile(
  projectName: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<FileInfo> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const objectName = `${projectName}/${fileName}`;

  await client.putObject({
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
    putObjectBody: fileBuffer,
    contentLength: fileBuffer.length,
    contentType: contentType,
  });

  return {
    name: fileName,
    fullPath: objectName,
    size: fileBuffer.length,
    contentType: contentType,
    lastModified: new Date(),
    publicUrl: getPublicUrl(objectName),
  };
}

/**
 * Delete a file from a project
 */
export async function deleteFile(projectName: string, fileName: string): Promise<void> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const objectName = `${projectName}/${fileName}`;

  await client.deleteObject({
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: objectName,
  });
}

/**
 * Delete a project and all its files
 */
export async function deleteProject(projectName: string): Promise<void> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  // List all files in the project
  const files = await listFiles(projectName);

  // Delete all files
  for (const file of files) {
    await client.deleteObject({
      namespaceName: namespace,
      bucketName: bucketName,
      objectName: file.fullPath,
    });
  }

  // Delete the .keep file
  await client.deleteObject({
    namespaceName: namespace,
    bucketName: bucketName,
    objectName: `${projectName}/${KEEP_FILE}`,
  });
}

/**
 * Get file info
 */
export async function getFileInfo(projectName: string, fileName: string): Promise<FileInfo | null> {
  const client = await getObjectStorageClient();
  const namespace = getNamespace();
  const bucketName = getBucketName();

  const objectName = `${projectName}/${fileName}`;

  try {
    const response = await client.headObject({
      namespaceName: namespace,
      bucketName: bucketName,
      objectName: objectName,
    });

    return {
      name: fileName,
      fullPath: objectName,
      size: response.contentLength || 0,
      contentType: response.contentType || undefined,
      lastModified: response.lastModified ? new Date(response.lastModified) : new Date(),
      publicUrl: getPublicUrl(objectName),
    };
  } catch {
    return null;
  }
}
