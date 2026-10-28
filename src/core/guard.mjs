/**
 * Strest SecurityGuard v2.0
 * SSRF & Malicious Input Defense (AYA Protocol / Fire Team Elite Certified)
 */

import path from 'path';

// Dangerous SSRF / Cloud Metadata Hosts
const METADATA_HOSTS = new Set([
  '169.254.169.254',          // AWS / Azure / OpenStack IMDSv1/v2
  'metadata.google.internal', // GCP Metadata
  'metadata',
  '100.100.100.200',          // Alibaba Cloud Metadata
  'instance-data',
  '[fd00:ec2::254]',          // AWS IPv6 IMDS
  'fd00:ec2::254'
]);

export class SecurityGuard {
  /**
   * Validates target URL against SSRF and Cloud Metadata Exfiltration
   * @param {string} rawUrl 
   * @param {Object} options 
   * @param {boolean} [options.allowLocalhost=true] Allow testing local dev servers (e.g. localhost:5000, 127.0.0.1)
   * @returns {URL} Validated URL object
   */
  static validateUrl(rawUrl, options = { allowLocalhost: true }) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('Security Violation: Invalid URL provided');
    }

    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch (e) {
      throw new Error(`Security Violation: Malformed URL: ${rawUrl}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Security Violation: Prohibited protocol '${parsed.protocol}'. Only http/https allowed.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check Cloud Metadata Endpoints & Link-Local Ranges (Strict block, cannot be bypassed)
    if (
      METADATA_HOSTS.has(hostname) ||
      hostname.startsWith('169.254.') ||
      hostname.includes('ffff:169.254.') ||
      hostname.includes('ffff:a9fe:a9fe')
    ) {
      throw new Error(`Security Violation: Access to cloud instance metadata service (${hostname}) is blocked.`);
    }

    if (!options.allowLocalhost) {
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('127.')
      ) {
        throw new Error('Security Violation: Localhost access restricted in this environment.');
      }
    }

    return parsed;
  }

  /**
   * Validates safe file path against path traversal and sensitive credential exposure
   * @param {string} targetPath 
   * @param {string} allowedBaseDir 
   * @returns {string}
   */
  static validateSafePath(targetPath, allowedBaseDir = process.cwd()) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Security Violation: Invalid path argument');
    }

    if (targetPath.includes('\0')) {
      throw new Error('Security Violation: Null byte detected in path');
    }

    const base = path.resolve(allowedBaseDir);
    const resolved = path.resolve(base, targetPath);
    const basename = path.basename(resolved);

    // Block sensitive secrets first
    if (
      /^\.env(\..+)?$/i.test(basename) ||
      /^id_(rsa|ed25519|ecdsa)/i.test(basename) ||
      /masterpw/i.test(basename) ||
      /credentials/i.test(basename)
    ) {
      throw new Error(`Security Violation: Protected credential file blocked: ${basename}`);
    }

    // Strict containment check inside allowedBaseDir
    const rel = path.relative(base, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`Security Violation: Path traversal outside allowed workspace blocked: ${targetPath}`);
    }

    return resolved;
  }
}
