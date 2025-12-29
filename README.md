# Oracle UploadThing

A self-hosted, private file upload application using Next.js and Oracle Cloud Infrastructure (OCI) Object Storage.

## Features

- Clean, modern UI for file management
- Drag & drop file uploads with progress tracking
- Project-based file organization
- Basic Auth protection for UI access
- Bearer token authentication for API access
- OCI Object Storage backend
- No database required
- Vercel deployment ready

## Quick Start

### Prerequisites

- Node.js 18+
- OCI account with Object Storage bucket
- OCI API key for authentication

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd oracle-uploadthing
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Configure environment variables (see [Environment Variables](#environment-variables))

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 (you'll be prompted for Basic Auth credentials)

## Environment Variables

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `BASIC_AUTH_USER` | Username for UI Basic Auth | `admin` |
| `BASIC_AUTH_PASS` | Password for UI Basic Auth | `secure-password` |
| `API_TOKEN` | Bearer token for API uploads | `your-api-token` |

### OCI Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `OCI_REGION` | OCI region identifier | `us-ashburn-1` |
| `OCI_BUCKET_NAME` | Object Storage bucket name | `my-files` |
| `OCI_NAMESPACE` | OCI tenancy namespace | `my-namespace` |
| `OCI_AUTH_TYPE` | Authentication method | `env_vars` |

### OCI Authentication (for `env_vars` auth type)

| Variable | Description |
|----------|-------------|
| `OCI_TENANCY_OCID` | Your tenancy OCID |
| `OCI_USER_OCID` | Your user OCID |
| `OCI_FINGERPRINT` | API key fingerprint |
| `OCI_PRIVATE_KEY` | Private key content (PEM format) |

## Deployment on Vercel

1. Push code to a Git repository (GitHub, GitLab, etc.)

2. Import the project in Vercel

3. Configure environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all required variables from `.env.example`
   - For `OCI_PRIVATE_KEY`, paste the entire PEM key content including headers

4. Deploy

### OCI Bucket Setup

1. Create an Object Storage bucket in OCI Console
2. Set bucket visibility to "Public" if you want direct public URLs
3. Note down:
   - Bucket name
   - Namespace (found in bucket details)
   - Region identifier

### OCI API Key Setup

1. Go to OCI Console > Identity > Users > Your User
2. Click "API Keys" > "Add API Key"
3. Download or paste the private key
4. Copy the fingerprint
5. Note your user OCID and tenancy OCID

## API Usage

### Upload File (External Service)

```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "X-Project-Name: my-project" \
  -F "file=@/path/to/file.pdf"
```

Response:
```json
{
  "success": true,
  "file": {
    "name": "abc123-file.pdf",
    "originalName": "file.pdf",
    "size": 12345,
    "contentType": "application/pdf",
    "publicUrl": "https://objectstorage...",
    "project": "my-project"
  }
}
```

### List Projects

```bash
curl https://your-app.vercel.app/api/projects \
  -u "admin:password"
```

### Create Project

```bash
curl -X POST https://your-app.vercel.app/api/projects \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-project"}'
```

### List Files

```bash
curl https://your-app.vercel.app/api/projects/my-project/files \
  -u "admin:password"
```

### Delete File

```bash
curl -X DELETE https://your-app.vercel.app/api/projects/my-project/files/filename.pdf \
  -u "admin:password"
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── upload/route.ts         # External upload API (Bearer auth)
│   │   ├── projects/route.ts       # List/create projects
│   │   └── projects/[name]/
│   │       └── files/
│   │           ├── route.ts        # List/upload files
│   │           └── [fileName]/route.ts  # Get/delete file
│   ├── project/
│   │   └── [name]/page.tsx         # Project detail page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home (project list)
│   ├── globals.css                 # Global styles
│   └── robots.txt/route.ts         # Block crawlers
├── lib/
│   ├── ociClient.ts               # OCI SDK client
│   ├── storage.ts                 # Storage operations
│   ├── auth.ts                    # Authentication utilities
│   └── validation.ts              # Input validation
├── middleware.ts                  # Basic Auth middleware
└── ...config files
```

## Security

See [SECURITY.md](./SECURITY.md) for security documentation.

## Notes

- Files are stored with UUID prefixes to prevent collisions
- Maximum file size: 100MB
- Project names must be lowercase kebab-case (e.g., `my-project`)
- The application is not meant to be publicly accessible
- All routes except `/api/upload` require Basic Auth
- `/api/upload` requires Bearer token authentication

## License

Private - Internal use only
