'use client'

import { useEffect } from 'react'
import { setupLogMonitor } from '@/lib/utils/log-audit'

export function LogMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setupLogMonitor('development')
    }
  }, [])

  return null
} 