# Security Documentation

This document outlines the security model, threat considerations, and best practices for this private file storage application.

## Overview

This application is designed as a private, internal file storage tool. It is NOT intended for public use or multi-tenant scenarios. The security model is optimized for simplicity and self-hosting use cases.

## Authentication Model

### UI Access - HTTP Basic Auth

- **Method**: HTTP Basic Authentication
- **Credentials**: Single username/password pair from environment variables
- **Scope**: All UI routes and most API routes
- **Implementation**: Applied globally via Next.js middleware

Why Basic Auth:
- Simple and universally supported
- No login page required (browser handles credentials)
- Credentials cached by browser for session
- Suitable for single-user/team internal tools
- Works seamlessly with password managers

### API Access - Bearer Token

- **Method**: Bearer token in Authorization header
- **Token**: Single API token from environment variables
- **Scope**: `/api/upload` endpoint only
- **Usage**: External services uploading files programmatically

Why separate auth for uploads:
- Allows external services to upload without Basic Auth complexity
- Token-based auth is standard for machine-to-machine communication
- Prevents credential exposure in application code

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Request                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  /api/upload? │
                   └───────────────┘
                      │         │
                     Yes        No
                      │         │
                      ▼         ▼
              ┌──────────┐  ┌──────────────┐
              │  Bearer  │  │  Basic Auth  │
              │  Token   │  │  Middleware  │
              └──────────┘  └──────────────┘
                      │         │
                      ▼         ▼
              ┌──────────┐  ┌──────────────┐
              │  Valid?  │  │    Valid?    │
              └──────────┘  └──────────────┘
                │      │       │        │
               Yes     No     Yes       No
                │      │       │        │
                ▼      ▼       ▼        ▼
              Allow  401    Allow     401
```

## Threat Model

### In Scope

| Threat | Mitigation |
|--------|------------|
| Unauthorized access | Basic Auth + Bearer token authentication |
| Search engine indexing | robots.txt + noindex meta tags + X-Robots-Tag header |
| Credential brute force | Rate limiting at edge (Vercel) + timing-safe comparison |
| Path traversal | Filename sanitization, UUID prefixes |
| File type attacks | Content type validation, blocked executable types |
| XSS via filenames | Filename sanitization, React auto-escaping |
| Clickjacking | X-Frame-Options: DENY header |
| MIME sniffing | X-Content-Type-Options: nosniff header |
| Timing attacks | Constant-time string comparison for credentials |

### Out of Scope

This application is NOT designed to protect against:

- **DDoS attacks**: Rely on Vercel's edge protection or additional WAF
- **Nation-state attackers**: Use additional network-level protection
- **Physical access**: Standard infrastructure security applies
- **Compromised OCI credentials**: Secure your OCI account separately
- **Zero-day vulnerabilities**: Keep dependencies updated

## Secret Management

### Environment Variables

All secrets are stored as environment variables:

| Secret | Purpose | Security |
|--------|---------|----------|
| `BASIC_AUTH_USER` | UI username | Never logged, not exposed to client |
| `BASIC_AUTH_PASS` | UI password | Never logged, not exposed to client |
| `API_TOKEN` | Upload API auth | Never logged, not exposed to client |
| `OCI_PRIVATE_KEY` | OCI API auth | Never logged, never exposed |

### Best Practices

1. **Generate strong credentials**:
   ```bash
   # Generate password
   openssl rand -base64 32

   # Generate API token
   openssl rand -hex 32
   ```

2. **Rotate credentials periodically**:
   - Update environment variables in Vercel dashboard
   - Redeploy application
   - Update any external services using the API

3. **Never commit secrets**:
   - `.env.local` is in `.gitignore`
   - `.env.example` contains only placeholders
   - Use Vercel's environment variable system

## Why No Login Page?

Traditional login pages introduce complexity:

- Session management
- CSRF protection
- Cookie security
- Password reset flows
- Account lockout logic

Basic Auth provides equivalent security for this use case:
- Credentials transmitted via HTTPS (encrypted)
- Browser caches credentials securely
- No session to hijack
- Simpler attack surface

## Crawler Protection

Multiple layers prevent indexing:

1. **robots.txt**: Disallow all crawlers
2. **Meta tags**: noindex, nofollow
3. **HTTP headers**: X-Robots-Tag: noindex, nofollow, noarchive
4. **Authentication**: Crawlers can't bypass Basic Auth

## File Security

### Upload Protection

- Maximum file size: 100MB
- Blocked content types: executables, shell scripts
- Filename sanitization: removes path traversal, control chars
- UUID prefix: prevents filename collisions and guessing

### Storage Security

- Files stored in OCI Object Storage
- Access controlled by OCI IAM policies
- Public URLs require knowing the exact object path
- No directory listing exposed

## Network Security

### Vercel Edge

- TLS 1.3 encryption
- DDoS protection
- Geographic distribution
- Automatic HTTPS

### Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-Robots-Tag: noindex, nofollow, noarchive
Referrer-Policy: strict-origin-when-cross-origin
```

## Recommendations

### For Deployment

1. Use strong, unique passwords (32+ characters)
2. Enable Vercel's attack protection
3. Consider IP allowlisting if possible
4. Monitor for unusual access patterns

### For OCI

1. Use dedicated IAM user for this application
2. Grant minimal required permissions
3. Enable OCI audit logging
4. Use private endpoint if available

### For Maintenance

1. Keep dependencies updated
2. Review access logs periodically
3. Rotate credentials quarterly
4. Monitor for security advisories

## Incident Response

If credentials are compromised:

1. Immediately update environment variables in Vercel
2. Trigger a new deployment
3. Review access logs for unauthorized activity
4. Rotate OCI API keys if exposed
5. Audit files for unauthorized uploads

## Compliance Note

This application is designed for internal use and may not meet compliance requirements for:

- HIPAA (health data)
- PCI DSS (payment data)
- GDPR (EU personal data)
- SOC 2 (enterprise security)

For regulated data, implement additional controls or use a compliant file storage solution.

## Contact

For security concerns, contact your system administrator.
