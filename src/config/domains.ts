/**
 * Domain configuration for the multi-tenant platform
 * Permanent migration to me.databayt.org completed
 */

// The one and only marketing domain
export const MARKETING_DOMAIN = 'me.databayt.org'

// Marketing domains based on environment
export const getMarketingDomains = (): string[] => {
  if (process.env.NODE_ENV === 'development') {
    return [MARKETING_DOMAIN, 'localhost:3000', 'localhost']
  }
  return [MARKETING_DOMAIN]
}

// Check if a host is the marketing domain
export const isMarketingDomain = (host: string): boolean => {
  return host === MARKETING_DOMAIN ||
         host === 'localhost:3000' ||
         host === 'localhost'
}

// Check if a subdomain should be excluded from tenant logic
export const isExcludedSubdomain = (subdomain: string): boolean => {
  const excludedSubdomains = ['me', 'www', 'api', 'admin']
  return excludedSubdomains.includes(subdomain.toLowerCase())
}

// Get the marketing domain
export const getMarketingDomain = (): string => {
  return MARKETING_DOMAIN
}

// Get the root domain for subdomain detection
export const getRootDomain = (): string => {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'databayt.org'
}

// Generate full URL for marketing pages
export const getMarketingUrl = (path: string = '/'): string => {
  const domain = getMarketingDomain()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${domain}${path}`
}

// Generate full URL for tenant subdomains
export const getTenantUrl = (subdomain: string, path: string = '/'): string => {
  const rootDomain = getRootDomain()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${subdomain}.${rootDomain}${path}`
}