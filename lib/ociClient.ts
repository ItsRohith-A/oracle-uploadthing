import * as os from 'oci-objectstorage';
import * as common from 'oci-common';

let objectStorageClient: os.ObjectStorageClient | null = null;
let clientInitPromise: Promise<os.ObjectStorageClient> | null = null;

async function createAuthProvider(): Promise<common.AuthenticationDetailsProvider> {
  const authType = process.env.OCI_AUTH_TYPE || 'env_vars';

  switch (authType) {
    case 'instance_principal': {
      const builder = new common.InstancePrincipalsAuthenticationDetailsProviderBuilder();
      return await builder.build();
    }

    case 'resource_principal': {
      // Resource Principal is automatically configured by OCI Functions runtime
      // This method is not supported in Vercel - use env_vars instead
      throw new Error(
        'Resource Principal authentication is not supported. Use env_vars auth type instead.'
      );
    }

    case 'config_file': {
      const configPath = process.env.OCI_CONFIG_FILE_PATH || '~/.oci/config';
      const profile = process.env.OCI_CONFIG_PROFILE || 'DEFAULT';
      return new common.ConfigFileAuthenticationDetailsProvider(configPath, profile);
    }

    case 'env_vars':
    default:
      const tenancy = process.env.OCI_TENANCY_OCID;
      const user = process.env.OCI_USER_OCID;
      const fingerprint = process.env.OCI_FINGERPRINT;
      const privateKey = process.env.OCI_PRIVATE_KEY;
      const region = process.env.OCI_REGION;

      if (!tenancy || !user || !fingerprint || !privateKey || !region) {
        throw new Error(
          'Missing required OCI environment variables. ' +
          'Required: OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_PRIVATE_KEY, OCI_REGION'
        );
      }

      return new common.SimpleAuthenticationDetailsProvider(
        tenancy,
        user,
        fingerprint,
        privateKey,
        null, // passphrase
        common.Region.fromRegionId(region)
      );
  }
}

async function initializeClient(): Promise<os.ObjectStorageClient> {
  const provider = await createAuthProvider();
  const client = new os.ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });

  const region = process.env.OCI_REGION;
  if (region) {
    client.region = common.Region.fromRegionId(region);
  }

  return client;
}

export async function getObjectStorageClient(): Promise<os.ObjectStorageClient> {
  if (objectStorageClient) {
    return objectStorageClient;
  }

  // Prevent multiple simultaneous initializations
  if (!clientInitPromise) {
    clientInitPromise = initializeClient().then((client) => {
      objectStorageClient = client;
      return client;
    });
  }

  return clientInitPromise;
}

export function getNamespace(): string {
  const namespace = process.env.OCI_NAMESPACE;
  if (!namespace) {
    throw new Error('OCI_NAMESPACE environment variable is required');
  }
  return namespace;
}

export function getBucketName(): string {
  const bucketName = process.env.OCI_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('OCI_BUCKET_NAME environment variable is required');
  }
  return bucketName;
}

export function getPublicUrl(objectName: string): string {
  const region = process.env.OCI_REGION;
  const namespace = getNamespace();
  const bucketName = getBucketName();

  // OCI Object Storage public URL format
  return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucketName}/o/${encodeURIComponent(objectName)}`;
}



// for local

// import * as os from 'oci-objectstorage';
// import * as common from 'oci-common';
// import * as fs from 'fs';

// let objectStorageClient: os.ObjectStorageClient | null = null;
// let clientInitPromise: Promise<os.ObjectStorageClient> | null = null;

// function getPrivateKey(): string {
//   // First check if private key content is provided directly
//   const privateKeyContent = process.env.OCI_PRIVATE_KEY;
//   if (privateKeyContent) {
//     return privateKeyContent;
//   }

//   // Otherwise read from file path
//   const privateKeyPath = process.env.OCI_PRIVATE_KEY_PATH;
//   if (privateKeyPath) {
//     return fs.readFileSync(privateKeyPath, 'utf8');
//   }

//   throw new Error('Either OCI_PRIVATE_KEY or OCI_PRIVATE_KEY_PATH must be provided');
// }

// function createAuthProvider(): common.AuthenticationDetailsProvider {
//   const tenancy = process.env.OCI_TENANCY_OCID;
//   const user = process.env.OCI_USER_OCID;
//   const fingerprint = process.env.OCI_FINGERPRINT;
//   const region = process.env.OCI_REGION;

//   if (!tenancy || !user || !fingerprint || !region) {
//     throw new Error(
//       'Missing required OCI environment variables. ' +
//       'Required: OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_REGION, and either OCI_PRIVATE_KEY or OCI_PRIVATE_KEY_PATH'
//     );
//   }

//   const privateKey = getPrivateKey();

//   return new common.SimpleAuthenticationDetailsProvider(
//     tenancy,
//     user,
//     fingerprint,
//     privateKey,
//     null, // passphrase
//     common.Region.fromRegionId(region)
//   );
// }

// function initializeClient(): os.ObjectStorageClient {
//   const provider = createAuthProvider();
//   const client = new os.ObjectStorageClient({
//     authenticationDetailsProvider: provider,
//   });

//   const region = process.env.OCI_REGION;
//   if (region) {
//     client.region = common.Region.fromRegionId(region);
//   }

//   return client;
// }

// export async function getObjectStorageClient(): Promise<os.ObjectStorageClient> {
//   if (objectStorageClient) {
//     return objectStorageClient;
//   }

//   // Prevent multiple simultaneous initializations
//   if (!clientInitPromise) {
//     clientInitPromise = Promise.resolve(initializeClient()).then((client) => {
//       objectStorageClient = client;
//       return client;
//     });
//   }

//   return clientInitPromise;
// }

// export function getNamespace(): string {
//   const namespace = process.env.OCI_NAMESPACE;
//   if (!namespace) {
//     throw new Error('OCI_NAMESPACE environment variable is required');
//   }
//   return namespace;
// }

// export function getBucketName(): string {
//   const bucketName = process.env.OCI_BUCKET_NAME;
//   if (!bucketName) {
//     throw new Error('OCI_BUCKET_NAME environment variable is required');
//   }
//   return bucketName;
// }

// export function getPublicUrl(objectName: string): string {
//   const region = process.env.OCI_REGION;
//   const namespace = getNamespace();
//   const bucketName = getBucketName();

//   // OCI Object Storage public URL format
//   return `https://objectstorage.${region}.oraclecloud.com/n/${namespace}/b/${bucketName}/o/${encodeURIComponent(objectName)}`;
// }
