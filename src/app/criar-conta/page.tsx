'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Check, Eye, EyeOff } from "lucide-react"
import { countries } from '@/lib/data/countries'
import "flag-icons/css/flag-icons.min.css"
import { CountrySelect } from '@/components/CountrySelect'

// Componente principal com Suspense
export default function CriarConta() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Carregando...</span>
      </div>
    }>
      <CriarContaFormWrapper />
    </Suspense>
  )
}

// Componente que carrega useSearchParams se necessário
function CriarContaFormWrapper() {
  // Se a página usa searchParams, deve importar aqui
  // Caso contrário, podemos apenas renderizar o conteúdo diretamente
  return <CriarContaContent />
}

// Funções auxiliares
const formatPhoneNumber = (value: string, mask: string) => {
  if (!value) return '';
  
  let result = '';
  let index = 0;
  
  // Remover qualquer formatação existente
  const rawValue = value.replace(/\D/g, '');
  
  for (let i = 0; i < mask.length && index < rawValue.length; i++) {
    if (mask[i] === '9') {
      result += rawValue[index++];
    } else {
      result += mask[i];
      if (index < rawValue.length && mask[i] === rawValue[index]) {
        index++;
      }
    }
  }
  
  return result;
};

function CriarContaContent() {
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

  // Função para obter o limite máximo de dígitos permitidos por país
  const getMaxDigits = useMemo(() => {
    switch (formData.countryCode) {
      case '+55': // Brasil
        return 11;
      case '+1': // EUA e Canadá
        return 10;
      case '+44': // Reino Unido
        return 10;
      case '+351': // Portugal
        return 9;
      case '+34': // Espanha
        return 9;
      case '+54': // Argentina
        return 10;
      case '+52': // México
        return 10;
      default:
        return 12;
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

  // Uso de useEffect para garantir a aplicação correta da máscara
  useEffect(() => {
    if (formData.phone) {
      // Garante que a formatação é aplicada sempre que o telefone ou o país mudam
      const formatted = formatPhoneNumber(formData.phone, getPhoneMask);
      setFormattedPhone(formatted);
    } else {
      setFormattedPhone('');
    }
  }, [formData.phone, formData.countryCode, getPhoneMask]);

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
    const inputValue = e.target.value;
    
    // Extrair apenas os dígitos para armazenar no state
    let rawValue = inputValue.replace(/\D/g, '');
    
    // Limitar o número de dígitos com base no país selecionado
    if (rawValue.length > getMaxDigits) {
      rawValue = rawValue.substring(0, getMaxDigits);
    }
    
    setFormData(prev => ({
      ...prev,
      phone: rawValue
    }))
  }

  const handlePhoneBlur = () => {
    // Valida o número de telefone ao perder o foco
    const rawPhone = formData.phone.replace(/\D/g, '');
    
    if (rawPhone && !getPhoneRegex.test(rawPhone)) {
      console.log('Número de telefone inválido para', formData.countryCode);
    } else {
      console.log('Número de telefone válido');
    }
  }

  const handleCountrySelect = (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      countryCode
    }))
    
    // Limpar o número se o código do país for alterado
    setFormData(prev => ({
      ...prev,
      countryCode,
      phone: ''
    }))
    setFormattedPhone('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'Nome é obrigatório'
    if (!formData.email.trim()) return 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido'
    if (!formData.phone.trim()) return 'Telefone é obrigatório'
    if (!getPhoneRegex.test(formData.phone)) return 'Telefone inválido'
    if (!passwordValid) return 'Senha não atende aos requisitos mínimos'
    if (formData.password !== formData.confirmPassword) return 'As senhas não coincidem'
    if (!formData.acceptTerms) return 'Você deve aceitar os termos e condições'
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `${formData.countryCode}${formData.phone}`,
          password: formData.password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar cadastro')
      }
      
      setIsSuccess(true)
      
      // Redirecionar ou mostrar mensagem de sucesso
      setTimeout(() => {
        router.push('/verificar-email?email=' + encodeURIComponent(formData.email))
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante o cadastro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="max-w-md w-full space-y-8 p-8 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800">
          <div className="text-center">
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-900/30 mb-4">
              <h2 className="text-xl font-medium text-green-500 mb-2">Cadastro realizado com sucesso!</h2>
              <p className="text-gray-300">Enviamos um email de confirmação para <strong>{formData.email}</strong>.</p>
              <p className="text-gray-400 text-sm mt-2">Verifique sua caixa de entrada para ativar sua conta.</p>
            </div>
            <Link 
              href="/login" 
              className="text-blue-500 hover:text-blue-400 text-sm"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F1115] p-4">
      <div className="max-w-md w-full space-y-6 bg-[#1A1D24] rounded-lg shadow-lg border border-gray-800 p-6">
        <div>
          <h1 className="text-2xl font-bold text-white text-center">
            Criar nova conta
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Preencha os dados abaixo para iniciar seu cadastro
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Nome */}
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
            />
          </div>

          {/* Email */}
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
            />
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
              Telefone
            </label>
            <div className="flex">
              {/* Seletor de país */}
              <div className="relative">
                <button
                  type="button"
                  className="h-full px-3 border border-r-0 border-gray-700 bg-[#0F1115] rounded-l-md flex items-center text-white"
                  onClick={() => {
                    // Função para abrir o selector de país
                    const dropdown = document.getElementById('countryDropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                >
                  <span className={`fi fi-${countries.find(c => c.dialCode === formData.countryCode)?.code.toLowerCase() || 'br'} mr-2`}></span>
                  {formData.countryCode}
                </button>
                
                {/* Dropdown de países */}
                <div id="countryDropdown" className="hidden absolute left-0 top-full mt-1 w-64 max-h-60 overflow-y-auto bg-[#1A1D24] border border-gray-700 rounded-md shadow-lg z-10">
                  <div className="p-2 sticky top-0 bg-[#1A1D24] border-b border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Buscar país..." 
                        className="pl-8 pr-2 py-1 w-full bg-[#0F1115] border border-gray-700 rounded text-white text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-[#282D36] flex items-center text-white text-sm"
                      onClick={() => {
                        handleCountrySelect(country.dialCode);
                        const dropdown = document.getElementById('countryDropdown');
                        if (dropdown) {
                          dropdown.classList.add('hidden');
                        }
                      }}
                    >
                      <span className={`fi fi-${country.code.toLowerCase()} mr-2`}></span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className="text-gray-400">{country.dialCode}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Campo de telefone */}
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-r-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Telefone"
                value={formattedPhone}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Usaremos seu telefone para verificação e segurança.</p>
          </div>

          {/* Senha */}
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
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  formData.password && !passwordValid ? 'border-red-500' : 'border-gray-700'
                } rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors pr-10`}
                placeholder="Criar senha segura"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Requisitos de senha */}
            {showPasswordRequirements && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400 mb-1">Sua senha deve conter:</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className={`text-xs flex items-center ${
                    passwordRequirements.length ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {passwordRequirements.length ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="w-3 h-3 mr-1 border border-gray-500 rounded-full" />
                    )}
                    Mínimo 8 caracteres
                  </div>
                  <div className={`text-xs flex items-center ${
                    passwordRequirements.uppercase ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {passwordRequirements.uppercase ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="w-3 h-3 mr-1 border border-gray-500 rounded-full" />
                    )}
                    Letra maiúscula
                  </div>
                  <div className={`text-xs flex items-center ${
                    passwordRequirements.number ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {passwordRequirements.number ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="w-3 h-3 mr-1 border border-gray-500 rounded-full" />
                    )}
                    Número
                  </div>
                  <div className={`text-xs flex items-center ${
                    passwordRequirements.special ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {passwordRequirements.special ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="w-3 h-3 mr-1 border border-gray-500 rounded-full" />
                    )}
                    Caractere especial
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
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
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-700'
                } rounded-md placeholder-gray-500 text-white bg-[#0F1115] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors pr-10`}
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
            )}
          </div>

          {/* Termos e condições */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                checked={formData.acceptTerms}
                onChange={handleChange}
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="acceptTerms" className="text-gray-400">
                Eu aceito os <a href="#" className="text-blue-500 hover:text-blue-400">termos de uso</a> e <a href="#" className="text-blue-500 hover:text-blue-400">política de privacidade</a>
              </label>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">
              {error}
            </div>
          )}

          {/* Botão de cadastro */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                'Criar conta'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-400">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 