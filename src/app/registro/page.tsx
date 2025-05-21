'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Check, Eye, EyeOff } from "lucide-react"
import { countries } from '@/lib/data/countries'
import "flag-icons/css/flag-icons.min.css"
import Script from 'next/script'

// Componente de registro
const RegistroPage = () => {
  return <RegistroContent />
}

export default RegistroPage

// Funções auxiliares
const formatPhoneNumber = (value: string, mask: string) => {
  let result = '';
  let index = 0;
  
  for (let i = 0; i < mask.length && index < value.length; i++) {
    if (mask[i] === '9') {
      result += value[index++];
    } else {
      result += mask[i];
      if (index < value.length && mask[i] === value[index]) {
        index++;
      }
    }
  }
  
  return result;
};

// Componentes puros sem dependências externas
const FadeIn = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
};

const SlideUp = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const AnimatedButton = ({ children, className = "", disabled = false, ...props }: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  return (
    <button 
      className={`transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] ${className}`} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const RegistroContent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+55', // Brasil como padrão
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  
  // Estado para rastrear os requisitos da senha
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  })
  
  // Estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('') // Simplificando para busca no array, não no UI
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const [formattedPhone, setFormattedPhone] = useState('') // Estado para o número formatado
  const router = useRouter()

  // Filtrar países baseado na pesquisa (simplificado)
  const filteredCountries = searchTerm 
    ? countries.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dialCode.includes(searchTerm)
      )
    : countries;

  // Função para determinar a máscara com base no código do país
  const getPhoneMask = useMemo(() => {
    switch (formData.countryCode) {
      case '+55': // Brasil
        return '(99) 99999-9999';
      case '+1': // EUA e Canadá
        return '(999) 999-9999';
      case '+44': // Reino Unido
        return '9999 999999';
      case '+351': // Portugal
        return '999 999 999';
      case '+34': // Espanha
        return '999 999 999';
      case '+54': // Argentina
        return '(999) 999-9999';
      case '+52': // México
        return '(999) 999-9999';
      default:
        // Fallback para outros países - máscara genérica
        return '999999999999';
    }
  }, [formData.countryCode]);

  // Função para obter o formato sem máscara para validação
  const getPhoneRegex = useMemo(() => {
    switch (formData.countryCode) {
      case '+55': // Brasil - 10 ou 11 dígitos (com 9)
        return /^\d{10,11}$/;
      case '+1': // EUA - 10 dígitos
        return /^\d{10}$/;
      case '+44': // Reino Unido - 10 dígitos
        return /^\d{10}$/;
      case '+351': // Portugal - 9 dígitos
        return /^\d{9}$/;
      default:
        // Padrão para outros países - de 7 a 12 dígitos
        return /^\d{7,12}$/;
    }
  }, [formData.countryCode]);

  // Atualiza o telefone formatado quando o valor bruto ou a máscara mudam
  useEffect(() => {
    if (formData.phone) {
      setFormattedPhone(formatPhoneNumber(formData.phone, getPhoneMask));
    } else {
      setFormattedPhone('');
    }
  }, [formData.phone, getPhoneMask]);

  // Verificar os requisitos da senha sempre que o valor da senha mudar
  useEffect(() => {
    if (formData.password) {
      setShowPasswordRequirements(true)
      setPasswordRequirements({
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)
      })
    } else {
      setShowPasswordRequirements(false)
    }
  }, [formData.password])

  // Verificar se todos os requisitos de senha foram cumpridos
  const passwordValid = useMemo(() => {
    return Object.values(passwordRequirements).every(Boolean)
  }, [passwordRequirements])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extrai apenas os dígitos do valor de entrada
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Atualiza o estado com apenas os dígitos (sem formatação)
    setFormData(prev => ({ ...prev, phone: rawValue }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validação básica
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
      setError('Todos os campos são obrigatórios')
      setIsLoading(false)
      return
    }

    if (!passwordValid) {
      setError('A senha não atende a todos os requisitos de segurança')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError('Você precisa aceitar os termos de uso')
      setIsLoading(false)
      return
    }

    // Validação do telefone com base na regex específica do país
    if (formData.phone && !getPhoneRegex.test(formData.phone)) {
      setError('Formato de telefone inválido para o país selecionado')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone ? `${formData.countryCode}${formData.phone}` : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar o registro')
      }

      // Registro bem-sucedido
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/verificar-email?email=' + encodeURIComponent(formData.email))
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar o registro')
    } finally {
      setIsLoading(false)
    }
  }

  // Spinner animado sem usar framer-motion
  const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <FadeIn className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SlideUp 
        className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800"
        delay={200}
      >
        <div>
          <h1 className="text-2xl font-bold text-white text-center">
            Criar uma conta
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Registre-se para acessar nossa plataforma
          </p>
        </div>

        {isSuccess ? (
          <FadeIn className="text-green-500 bg-green-900/20 p-4 rounded-md border border-green-800 text-center">
            <p className="font-medium">Registro realizado com sucesso!</p>
            <p className="text-sm mt-1">Enviamos um e-mail de verificação. Redirecionando...</p>
          </FadeIn>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                  Nome completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Telefone
                </label>
                <div className="flex gap-2">
                  {/* Substituindo o componente Select por um select nativo */}
                  <div className="w-[140px]">
                    <select
                      id="countryCode"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-[#0F1115] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.dialCode}>
                          {country.code.toUpperCase()} {country.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Input para telefone com formatação nativa */}
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formattedPhone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder={formData.countryCode === '+55' ? '(DDD) 99999-9999' : 'Número de telefone'}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Crie uma senha forte"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {showPasswordRequirements && (
                  <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700 text-sm space-y-2">
                    <p className="text-gray-400 text-xs mb-2">Sua senha precisa conter:</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${passwordRequirements.length ? 'bg-green-500' : 'bg-red-500'}`}>
                          {passwordRequirements.length ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs ${passwordRequirements.length ? 'text-green-500' : 'text-gray-400'}`}>
                          No mínimo 8 caracteres
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${passwordRequirements.uppercase ? 'bg-green-500' : 'bg-red-500'}`}>
                          {passwordRequirements.uppercase ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs ${passwordRequirements.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                          Uma letra maiúscula
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${passwordRequirements.number ? 'bg-green-500' : 'bg-red-500'}`}>
                          {passwordRequirements.number ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs ${passwordRequirements.number ? 'text-green-500' : 'text-gray-400'}`}>
                          Um número
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${passwordRequirements.special ? 'bg-green-500' : 'bg-red-500'}`}>
                          {passwordRequirements.special ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-xs ${passwordRequirements.special ? 'text-green-500' : 'text-gray-400'}`}>
                          Um caractere especial (@, #, &, etc)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                  Confirme a senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-400">
                  Eu aceito os{' '}
                  <a href="#" className="text-blue-500 hover:text-blue-400">
                    termos de uso
                  </a>{' '}
                  e a{' '}
                  <a href="#" className="text-blue-500 hover:text-blue-400">
                    política de privacidade
                  </a>
                </label>
              </div>
            </div>

            {error && (
              <FadeIn className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
                {error}
              </FadeIn>
            )}

            <div className="flex flex-col space-y-4">
              <AnimatedButton
                type="submit"
                disabled={isLoading}
                className={`relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-blue-600/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              >
                {isLoading ? <Spinner /> : 'Criar conta'}
              </AnimatedButton>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="text-blue-500 hover:text-blue-400 transition-colors">
                    Faça login
                  </Link>
                </p>
              </div>
            </div>
          </form>
        )}
      </SlideUp>
    </FadeIn>
  )
} 