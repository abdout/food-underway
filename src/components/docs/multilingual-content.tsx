"use client"

import { useParams } from 'next/navigation'
import type { Locale } from '@/components/internationalization/config'

interface MultilingualContentProps {
  children: React.ReactNode
  lang: 'ar' | 'en'
}

export function AR({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const currentLang = params?.lang as Locale || 'en'

  if (currentLang !== 'ar') return null
  return <>{children}</>
}

export function EN({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const currentLang = params?.lang as Locale || 'en'

  if (currentLang !== 'en') return null
  return <>{children}</>
}

// Alternative approach using a wrapper component
export function MultilingualContent({ children, lang }: MultilingualContentProps) {
  const params = useParams()
  const currentLang = params?.lang as Locale || 'en'

  if (currentLang !== lang) return null
  return <>{children}</>
}