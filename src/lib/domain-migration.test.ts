/**
 * Tests for domain migration from ed.databayt.org to me.databayt.org
 */

import { describe, it, expect } from 'vitest';
import { extractSubdomain } from './subdomain';

describe('Domain Migration Tests', () => {
  describe('extractSubdomain', () => {
    it('should treat me.databayt.org as marketing domain (special case)', () => {
      const result = extractSubdomain('me.databayt.org', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(true);
      expect(result.reason).toContain('marketing route');
    });

    it('should treat ed.databayt.org as marketing domain (legacy, special case)', () => {
      const result = extractSubdomain('ed.databayt.org', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(true);
      expect(result.reason).toContain('marketing route');
    });

    it('should extract subdomain for school1.databayt.org', () => {
      const result = extractSubdomain('school1.databayt.org', 'databayt.org');
      expect(result.subdomain).toBe('school1');
      expect(result.isSpecialCase).toBe(false);
    });

    it('should extract subdomain for demo.databayt.org', () => {
      const result = extractSubdomain('demo.databayt.org', 'databayt.org');
      expect(result.subdomain).toBe('demo');
      expect(result.isSpecialCase).toBe(false);
    });

    it('should handle localhost without subdomain', () => {
      const result = extractSubdomain('localhost:3000', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
      expect(result.reason).toContain('Localhost');
    });

    it('should handle Vercel preview URLs', () => {
      const result = extractSubdomain('tenant---branch.vercel.app', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
    });

    it('should not extract www as a subdomain', () => {
      const result = extractSubdomain('www.databayt.org', 'databayt.org');
      expect(result.subdomain).toBe('www');
      expect(result.isSpecialCase).toBe(false);
    });

    it('should handle multi-level subdomains correctly', () => {
      const result = extractSubdomain('api.v2.databayt.org', 'databayt.org');
      expect(result.subdomain).toBe('api.v2');
      expect(result.isSpecialCase).toBe(false);
    });
  });

  describe('Marketing Domain Behavior', () => {
    it('should recognize both me and ed as marketing domains', () => {
      const meResult = extractSubdomain('me.databayt.org', 'databayt.org');
      const edResult = extractSubdomain('ed.databayt.org', 'databayt.org');

      expect(meResult.isSpecialCase).toBe(true);
      expect(edResult.isSpecialCase).toBe(true);
      expect(meResult.subdomain).toBeNull();
      expect(edResult.subdomain).toBeNull();
    });

    it('should not treat school subdomains as marketing domains', () => {
      const schoolDomains = [
        'hogwarts.databayt.org',
        'stanford.databayt.org',
        'mit.databayt.org',
        'harvard.databayt.org'
      ];

      schoolDomains.forEach(domain => {
        const result = extractSubdomain(domain, 'databayt.org');
        expect(result.isSpecialCase).toBe(false);
        expect(result.subdomain).not.toBeNull();
        expect(result.subdomain).not.toBe('me');
        expect(result.subdomain).not.toBe('ed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty host', () => {
      const result = extractSubdomain('', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
      expect(result.reason).toContain('Missing');
    });

    it('should handle null root domain', () => {
      const result = extractSubdomain('test.databayt.org', '');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
      expect(result.reason).toContain('Missing');
    });

    it('should handle domain without subdomain', () => {
      const result = extractSubdomain('databayt.org', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
    });

    it('should handle non-matching domain', () => {
      const result = extractSubdomain('example.com', 'databayt.org');
      expect(result.subdomain).toBeNull();
      expect(result.isSpecialCase).toBe(false);
      expect(result.reason).toContain('No subdomain');
    });
  });
});

describe('Migration Readiness', () => {
  it('confirms both marketing domains are configured', () => {
    const marketingDomains = ['me', 'ed'];

    marketingDomains.forEach(domain => {
      const fullDomain = `${domain}.databayt.org`;
      const result = extractSubdomain(fullDomain, 'databayt.org');

      expect(result.isSpecialCase).toBe(true);
      expect(result.subdomain).toBeNull();
      expect(result.reason).toContain('marketing route');
    });
  });

  it('confirms tenant subdomains still work', () => {
    const tenantDomains = ['school1', 'demo', 'test', 'hogwarts'];

    tenantDomains.forEach(subdomain => {
      const fullDomain = `${subdomain}.databayt.org`;
      const result = extractSubdomain(fullDomain, 'databayt.org');

      expect(result.isSpecialCase).toBe(false);
      expect(result.subdomain).toBe(subdomain);
      expect(result.reason).toBeUndefined();
    });
  });
});