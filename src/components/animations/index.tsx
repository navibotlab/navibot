'use client'

import React, { useState, useEffect, useRef, RefObject } from 'react'

// ===== COMPONENTES BÁSICOS DE ANIMAÇÃO =====

// FadeIn: Animação de fade in
export const FadeIn = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 500,
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-opacity ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// SlideUp: Animação deslizante de baixo para cima
export const SlideUp = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 500,
  distance = "4",
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: string
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : `translate-y-${distance} opacity-0`} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// SlideDown: Animação deslizante de cima para baixo
export const SlideDown = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 500,
  distance = "4",
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: string
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : `-translate-y-${distance} opacity-0`} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// SlideLeft: Animação deslizante da direita para a esquerda
export const SlideLeft = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 500,
  distance = "4",
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: string
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : `translate-x-${distance} opacity-0`} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// SlideRight: Animação deslizante da esquerda para a direita
export const SlideRight = ({ 
  children, 
  className = "", 
  delay = 0,
  duration = 500,
  distance = "4",
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: string
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={`transition-all ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : `-translate-x-${distance} opacity-0`} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        ...props.style 
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ===== COMPONENTES DE INTERAÇÃO =====

// AnimatedButton: Botão com animação
export const AnimatedButton = ({ 
  children, 
  className = "", 
  disabled = false,
  type = "button",
  scaleAmount = "[1.01]",
  scaleAmountActive = "[0.99]",
  onClick,
  ...props 
}: {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  scaleAmount?: string
  scaleAmountActive?: string
  onClick?: () => void
  [key: string]: any
}) => {
  return (
    <button 
      type={type}
      className={`transition-transform duration-150 hover:scale-${scaleAmount} active:scale-${scaleAmountActive} ${className}`} 
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// AnimatedLink: Link com animação
export const AnimatedLink = ({ 
  children, 
  className = "", 
  href = "#",
  scaleAmount = "[1.05]",
  scaleAmountActive = "[0.95]",
  ...props 
}: {
  children: React.ReactNode
  className?: string
  href?: string
  scaleAmount?: string
  scaleAmountActive?: string
  [key: string]: any
}) => {
  return (
    <a 
      href={href}
      className={`transition-transform duration-150 inline-block hover:scale-${scaleAmount} active:scale-${scaleAmountActive} ${className}`} 
      {...props}
    >
      {children}
    </a>
  )
}

// Switch: Componente de interruptor
export const Switch = ({ 
  checked, 
  onChange, 
  className = "",
  ...props
}: {
  checked: boolean
  onChange: () => void
  className?: string
  [key: string]: any
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-green-500' : 'bg-gray-500'
      } ${className}`}
      {...props}
    >
      <span 
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200`}
        style={{ transform: `translateX(${checked ? '16px' : '4px'})` }}
      />
    </button>
  )
}

// AnimatedErrorMessage: Mensagem de erro animada
export const AnimatedErrorMessage = ({ 
  message, 
  show,
  className = "",
  ...props
}: { 
  message: string
  show: boolean
  className?: string
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [show])
  
  if (!show) return null
  
  return (
    <div
      className={`text-red-500 text-xs mt-1 transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
      } ${className}`}
      {...props}
    >
      {message}
    </div>
  )
}

// ===== COMPONENTES AVANÇADOS =====

// AnimatedPresence: Gerencia a presença de componentes
export const AnimatedPresence = ({ 
  children,
  ...props
}: { 
  children: React.ReactNode
  [key: string]: any
}) => {
  return <>{children}</>
}

// AnimatedDiv: Componente genérico para animações customizadas
export const AnimatedDiv = ({ 
  children, 
  className = "", 
  onClick,
  initial = {},
  animate = {},
  exit = {},
  transition = {},
  style = {},
  ...props
}: { 
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  initial?: any
  animate?: any
  exit?: any
  transition?: any
  style?: React.CSSProperties
  [key: string]: any
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])
  
  let animationClassName = ""
  
  // Suporte para animações comuns
  if (initial?.opacity === 0 && animate?.opacity === 1) {
    animationClassName += " transition-opacity duration-200 " + (isVisible ? "opacity-100" : "opacity-0")
  }
  
  if (initial?.scale === 0.9 && animate?.scale === 1) {
    animationClassName += " transition-transform duration-200 " + (isVisible ? "scale-100" : "scale-90")
  }

  if (initial?.y !== undefined && animate?.y !== undefined) {
    animationClassName += " transition-transform duration-200 " + (
      isVisible 
        ? "translate-y-0" 
        : initial.y > 0 
          ? `translate-y-${Math.abs(initial.y)}` 
          : `-translate-y-${Math.abs(initial.y)}`
    )
  }
  
  const transitionDuration = transition?.duration || 200
  const transitionDelay = transition?.delay || 0
  
  return (
    <div 
      className={`${className} ${animationClassName}`}
      onClick={onClick}
      style={{
        ...style,
        transitionDuration: `${transitionDuration}ms`,
        transitionDelay: `${transitionDelay}ms`
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ===== HOOKS =====

// useAnimation: Hook para controlar animações
export const useAnimation = () => {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {}
  }
}

// useInView: Detecta quando um elemento está visível na viewport
export const useInView = (options?: {
  threshold?: number
  rootMargin?: string
  once?: boolean
}): [RefObject<any>, boolean] => {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  
  useEffect(() => {
    const currentRef = ref.current
    if (currentRef && typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting)
          
          // Se a opção once for true e o elemento estiver visível, desconecta o observer
          if (options?.once && entry.isIntersecting) {
            observer.disconnect()
          }
        },
        {
          threshold: options?.threshold || 0,
          rootMargin: options?.rootMargin || '0px'
        }
      )
      
      observer.observe(currentRef)
      
      return () => {
        if (currentRef) {
          observer.unobserve(currentRef)
        }
      }
    }
    
    return undefined
  }, [options?.threshold, options?.rootMargin, options?.once])
  
  return [ref, isInView]
}

// useCycle: Cicla entre vários estados
export const useCycle = <T,>(...args: T[]): [T, (index?: number) => void] => {
  const [index, setIndex] = useState(0)
  const value = args[index % args.length]
  
  const cycle = (nextIndex?: number) => {
    if (nextIndex !== undefined) {
      setIndex(nextIndex % args.length)
    } else {
      setIndex((index + 1) % args.length)
    }
  }
  
  return [value, cycle]
}

// Spinner para substituir loaders
export const Spinner = ({ 
  className = "", 
  size = "5", 
  color = "white",
  borderWidth = "2",
  ...props 
}: {
  className?: string
  size?: string
  color?: string
  borderWidth?: string
  [key: string]: any
}) => (
  <div 
    className={`animate-spin rounded-full h-${size} w-${size} border-t-${borderWidth} border-b-${borderWidth} border-${color} ${className}`}
    {...props}
  ></div>
) 