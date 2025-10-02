/**
 * Domain configuration for the multi-tenant platform
 * This file centralizes domain management for easier migration and maintenance
 */

// Marketing domains that should not be treated as tenant subdomains
export const MARKETING_DOMAINS = {
  production: [
    process.env.NEXT_PUBLIC_MARKETING_DOMAIN || 'me.databayt.org',
    'ed.databayt.org' // Legacy domain - remove after migration
  ],
  development: [
    'localhost:3000',
    'localhost'
  ]
} as const

// Get all marketing domains based on environment
export const getMarketingDomains = (): string[] => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment
    ? [...MARKETING_DOMAINS.development, ...MARKETING_DOMAINS.production]
    : MARKETING_DOMAINS.production
}

// Check if a host is a marketing domain
export const isMarketingDomain = (host: string): boolean => {
  const marketingDomains = getMarketingDomains()
  return marketingDomains.some(domain =>
    host === domain || host.startsWith(`${domain}:`) // Handle port numbers
  )
}

// Check if a subdomain should be excluded from tenant logic
export const isExcludedSubdomain = (subdomain: string): boolean => {
  const excludedSubdomains = ['me', 'ed', 'www', 'api', 'admin']
  return excludedSubdomains.includes(subdomain.toLowerCase())
}

// Get the current marketing domain
export const getCurrentMarketingDomain = (): string => {
  return process.env.NEXT_PUBLIC_MARKETING_DOMAIN || 'me.databayt.org'
}

// Get the legacy marketing domain (for redirect logic)
export const getLegacyMarketingDomain = (): string => {
  return 'ed.databayt.org'
}

// Check if domain redirect is enabled (ed.databayt.org → me.databayt.org)
export const isDomainRedirectEnabled = (): boolean => {
  return process.env.ENABLE_DOMAIN_REDIRECT === 'true'
}

// Get the root domain for subdomain detection
export const getRootDomain = (): string => {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'databayt.org'
}

// Generate full URL for marketing pages
export const getMarketingUrl = (path: string = '/'): string => {
  const domain = getCurrentMarketingDomain()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${domain}${path}`
}

// Generate full URL for tenant subdomains
export const getTenantUrl = (subdomain: string, path: string = '/'): string => {
  const rootDomain = getRootDomain()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${subdomain}.${rootDomain}${path}`
}