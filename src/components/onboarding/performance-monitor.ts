/**
 * Performance monitoring utilities for onboarding flow
 * Tracks user interactions, load times, and error rates for optimization
 */

import { useEffect } from 'react'
import { logger } from "@/lib/logger";

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

interface OnboardingEvent {
  type: 'step_view' | 'form_submit' | 'error' | 'completion'
  step: string
  duration?: number
  success?: boolean
  error?: string
  metadata?: Record<string, any>
}

class OnboardingPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private events: OnboardingEvent[] = []
  private stepStartTime = new Map<string, number>()

  // Track when a step is viewed
  trackStepView(stepName: string, metadata?: Record<string, any>) {
    const now = performance.now()
    this.stepStartTime.set(stepName, now)
    
    this.events.push({
      type: 'step_view',
      step: stepName,
      metadata
    })
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendAnalytics('onboarding_step_view', {
        step: stepName,
        timestamp: Date.now(),
        ...metadata
      })
    }
  }

  // Track form submission performance
  trackFormSubmission(stepName: string, success: boolean, error?: string) {
    const startTime = this.stepStartTime.get(stepName)
    const duration = startTime ? performance.now() - startTime : undefined
    
    this.events.push({
      type: 'form_submit',
      step: stepName,
      duration,
      success,
      error
    })
    
    this.recordMetric(`form_submission_${stepName}`, duration || 0, {
      success,
      error
    })
    
    // Track error rates
    if (!success && error) {
      this.recordMetric('form_error_rate', 1, {
        step: stepName,
        error
      })
    }
  }

  // Track completion of onboarding flow
  trackCompletion(totalDuration: number, metadata?: Record<string, any>) {
    this.events.push({
      type: 'completion',
      step: 'complete',
      duration: totalDuration,
      success: true,
      metadata
    })
    
    this.recordMetric('onboarding_completion_time', totalDuration, metadata)
    
    // Calculate step completion rates
    const stepViews = this.events.filter(e => e.type === 'step_view').length
    const completionRate = stepViews > 0 ? (1 / stepViews) * 100 : 0
    
    this.recordMetric('onboarding_completion_rate', completionRate)
  }

  // Record performance metric
  private recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      totalSteps: new Set(this.events.map(e => e.step)).size,
      totalEvents: this.events.length,
      averageStepDuration: 0,
      errorRate: 0,
      completedSteps: this.events.filter(e => e.type === 'form_submit' && e.success).length,
      metrics: this.metrics
    }
    
    // Calculate average step duration
    const durations = this.events
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!) 
    
    if (durations.length > 0) {
      summary.averageStepDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    }
    
    // Calculate error rate
    const totalSubmissions = this.events.filter(e => e.type === 'form_submit').length
    const errors = this.events.filter(e => e.type === 'form_submit' && !e.success).length
    
    if (totalSubmissions > 0) {
      summary.errorRate = (errors / totalSubmissions) * 100
    }
    
    return summary
  }

  // Send analytics to external service (placeholder)
  private sendAnalytics(event: string, data: Record<string, any>) {
    // In production, integrate with analytics service (e.g., Mixpanel, Amplitude)
    if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', event, data)
    }
    
    // Or send to custom analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event, data })
    // })
  }

  // Monitor Core Web Vitals for onboarding pages
  trackWebVitals() {
    if (typeof window === 'undefined') return
    
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('lcp', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.recordMetric('fid', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.recordMetric('cls', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Clear metrics and events
  reset() {
    this.metrics = []
    this.events = []
    this.stepStartTime.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new OnboardingPerformanceMonitor()

// React hook for easy integration
export const useOnboardingPerformance = (stepName: string) => {
  useEffect(() => {
    performanceMonitor.trackStepView(stepName)
    
    return () => {
      // Cleanup if needed
    }
  }, [stepName])
  
  return {
    trackSubmission: (success: boolean, error?: string) => {
      performanceMonitor.trackFormSubmission(stepName, success, error)
    },
    trackCompletion: (duration: number, metadata?: Record<string, any>) => {
      performanceMonitor.trackCompletion(duration, metadata)
    }
  }
}

// Export types for external usage
export type { PerformanceMetric, OnboardingEvent }


// Track onboarding start time
const onboardingStartTimes = new Map<string, number>();

// Track step completion times
const stepCompletionTimes = new Map<string, Map<string, number>>();

/**
 * Start tracking onboarding session
 */
export function startOnboardingSession(merchantId: string) {
  console.log('📊 [PERFORMANCE] Starting onboarding session:', {
    merchantId,
    timestamp: new Date().toISOString()
  });
  onboardingStartTimes.set(merchantId, Date.now());
}

/**
 * Record step completion time
 */
export function recordStepCompletion(merchantId: string, step: string) {
  console.log('📊 [PERFORMANCE] Recording step completion:', {
    merchantId,
    step,
    timestamp: new Date().toISOString()
  });

  if (!stepCompletionTimes.has(merchantId)) {
    stepCompletionTimes.set(merchantId, new Map());
  }

  const merchantSteps = stepCompletionTimes.get(merchantId)!;
  merchantSteps.set(step, Date.now());

  // Calculate time spent on step
  const previousStep = getPreviousStep(step);
  if (previousStep) {
    const previousStepTime = merchantSteps.get(previousStep);
    if (previousStepTime) {
      const timeSpent = Date.now() - previousStepTime;
      console.log('⏱️ [PERFORMANCE] Time spent on step:', {
        merchantId,
        step: previousStep,
        timeSpentMs: timeSpent,
        timeSpentSeconds: Math.round(timeSpent / 1000),
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Complete onboarding session and get metrics
 */
export function completeOnboardingSession(merchantId: string) {
  console.log('📊 [PERFORMANCE] Completing onboarding session:', {
    merchantId,
    timestamp: new Date().toISOString()
  });

  const startTime = onboardingStartTimes.get(merchantId);
  const steps = stepCompletionTimes.get(merchantId);

  if (!startTime || !steps) {
    console.warn('⚠️ [PERFORMANCE] No tracking data found for merchant:', {
      merchantId,
      timestamp: new Date().toISOString()
    });
    return null;
  }

  const totalTime = Date.now() - startTime;
  const stepMetrics = Array.from(steps.entries()).map(([step, time]) => ({
    step,
    completionTime: time - startTime
  }));

  const metrics = {
    merchantId,
    totalTimeMs: totalTime,
    totalTimeMinutes: Math.round(totalTime / (1000 * 60)),
    steps: stepMetrics,
    timestamp: new Date().toISOString()
  };

  console.log('📈 [PERFORMANCE] Onboarding completion metrics:', metrics);

  // Clean up tracking data
  onboardingStartTimes.delete(merchantId);
  stepCompletionTimes.delete(merchantId);

  return metrics;
}

/**
 * Get previous step in onboarding flow
 */
function getPreviousStep(currentStep: string): string | null {
  const steps = ['title', 'branding', 'subdomain'];
  const currentIndex = steps.indexOf(currentStep);
  
  if (currentIndex <= 0) return null;
  return steps[currentIndex - 1];
}

/**
 * Get step completion time
 */
export function getStepCompletionTime(merchantId: string, step: string): number | null {
  const steps = stepCompletionTimes.get(merchantId);
  if (!steps) return null;
  
  const completionTime = steps.get(step);
  if (!completionTime) return null;

  const startTime = onboardingStartTimes.get(merchantId);
  if (!startTime) return null;

  return completionTime - startTime;
}