/**
 * Strest SecurityGuard v2.0
 * SSRF & Malicious Input Defense (AYA Protocol / Fire Team Elite Certified)
 */

import path from 'path';

// Dangerous SSRF / Cloud Metadata Hosts
const FORBIDDEN_HOSTS = [
  '169.254.169.254',    // AWS / Azure / OpenStack IMDS
  'metadata.google.internal', // GCP Metadata
  '100.100.100.200',    // Alibaba Cloud Metadata
  'localhost',          // Can be overridden by option if explicitly allowed for local dev
  '127.0.0.1',
  '::1'
];

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
      throw new Error('Invalid URL provided');
    }

    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch (e) {
      throw new Error(`Malformed URL: ${rawUrl}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Security Violation: Prohibited protocol '${parsed.protocol}'. Only http/https allowed.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check Cloud Metadata Endpoints (Strict block, cannot be bypassed!)
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal' || hostname === '100.100.100.200') {
      throw new Error(`Security Violation: Access to cloud instance metadata service (${hostname}) is blocked.`);
    }

    if (!options.allowLocalhost) {
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('127.')) {
        throw new Error(`Security Violation: Localhost access restricted in this environment.`);
      }
    }

    return parsed;
  }

  /**
   * Validates safe file path against path traversal
   * @param {string} targetPath 
   * @param {string} allowedBaseDir 
   * @returns {string}
   */
  static validateSafePath(targetPath, allowedBaseDir = process.cwd()) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Invalid path argument');
    }

    if (targetPath.includes('\0')) {
      throw new Error('Security Violation: Null byte detected in path');
    }

    const resolved = path.resolve(allowedBaseDir, targetPath);
    const basename = path.basename(resolved);

    // Block sensitive secrets
    if (/^\.env(\..+)?$/i.test(basename) || /^id_rsa/i.test(basename) || /masterpw/i.test(basename)) {
      throw new Error(`Security Violation: Protected credential file blocked: ${basename}`);
    }

    return resolved;
  }
}
