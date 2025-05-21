'use client'

import {
  FadeIn,
  SlideUp,
  SlideDown,
  SlideLeft,
  SlideRight,
  AnimatedButton,
  AnimatedLink,
  Switch,
  AnimatedErrorMessage,
  AnimatedPresence,
  AnimatedDiv,
  Spinner,
  useInView,
  useCycle
} from './index'
import { useState } from 'react'

// Exemplo de página completa com todos os componentes de animação
export default function AnimationExamples() {
  const [isVisible, setIsVisible] = useState(true)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const [checked, setChecked] = useState(false)
  const [ref, inView] = useInView({ threshold: 0.5, once: false })
  const [animationState, cycleAnimation] = useCycle('estado1', 'estado2', 'estado3')

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const toggleError = () => {
    if (showError) {
      setShowError(false)
      setError('Este é um exemplo de mensagem de erro animada.')
    } else {
      setError('Este é um exemplo de mensagem de erro animada.')
      setShowError(true)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[#1A1D24] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Exemplos de Componentes de Animação
      </h1>

      <div className="grid gap-8">
        {/* Seção 1: Animações Básicas */}
        <section className="space-y-4 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold">Animações Básicas</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">FadeIn</h3>
              <AnimatedPresence>
                {isVisible && (
                  <FadeIn delay={100} className="p-4 bg-blue-600 rounded">
                    Animação de Fade In
                  </FadeIn>
                )}
              </AnimatedPresence>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">SlideUp</h3>
              <AnimatedPresence>
                {isVisible && (
                  <SlideUp delay={200} className="p-4 bg-green-600 rounded">
                    Animação de Slide Up
                  </SlideUp>
                )}
              </AnimatedPresence>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">SlideDown</h3>
              <AnimatedPresence>
                {isVisible && (
                  <SlideDown delay={300} className="p-4 bg-purple-600 rounded">
                    Animação de Slide Down
                  </SlideDown>
                )}
              </AnimatedPresence>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">SlideLeft</h3>
              <AnimatedPresence>
                {isVisible && (
                  <SlideLeft delay={400} className="p-4 bg-red-600 rounded">
                    Animação de Slide Left
                  </SlideLeft>
                )}
              </AnimatedPresence>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-2">SlideRight</h3>
              <AnimatedPresence>
                {isVisible && (
                  <SlideRight delay={500} className="p-4 bg-yellow-600 rounded">
                    Animação de Slide Right
                  </SlideRight>
                )}
              </AnimatedPresence>
            </div>
          </div>

          <div className="flex justify-center mt-4">
            <AnimatedButton
              onClick={toggleVisibility}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              {isVisible ? 'Esconder' : 'Mostrar'} Animações
            </AnimatedButton>
          </div>
        </section>

        {/* Seção 2: Componentes Interativos */}
        <section className="space-y-4 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold">Componentes Interativos</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">AnimatedButton</h3>
              <div className="space-y-2">
                <AnimatedButton className="w-full bg-blue-500 text-white px-4 py-2 rounded-md">
                  Botão Padrão
                </AnimatedButton>
                
                <AnimatedButton 
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-md"
                  scaleAmount="[1.05]"
                  scaleAmountActive="[0.95]"
                >
                  Efeito Aumentado
                </AnimatedButton>

                <AnimatedButton 
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-md"
                  disabled={true}
                >
                  Botão Desabilitado
                </AnimatedButton>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">AnimatedLink</h3>
              <div className="space-y-2">
                <AnimatedLink 
                  href="#" 
                  className="block text-center bg-purple-500 text-white px-4 py-2 rounded-md"
                >
                  Link Padrão
                </AnimatedLink>
                
                <AnimatedLink 
                  href="#" 
                  className="block text-center bg-yellow-500 text-white px-4 py-2 rounded-md"
                  scaleAmount="[1.1]"
                  scaleAmountActive="[0.9]"
                >
                  Efeito Aumentado
                </AnimatedLink>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Switch</h3>
              <div className="flex items-center space-x-3">
                <Switch checked={checked} onChange={() => setChecked(!checked)} />
                <span>{checked ? 'Ativado' : 'Desativado'}</span>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">AnimatedErrorMessage</h3>
              <div className="space-y-4">
                <AnimatedButton 
                  onClick={toggleError}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  {showError ? 'Esconder' : 'Mostrar'} Erro
                </AnimatedButton>
                
                <AnimatedErrorMessage 
                  message={error} 
                  show={showError}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seção 3: Componentes Avançados */}
        <section className="space-y-4 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold">Componentes Avançados</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">AnimatedDiv</h3>
              <AnimatedDiv
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 500 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white text-center"
              >
                AnimatedDiv com várias propriedades
              </AnimatedDiv>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg" ref={ref}>
              <h3 className="font-medium mb-3">useInView Hook</h3>
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-lg text-white text-center">
                {inView ? 'Este elemento está visível!' : 'Role para ver este elemento'}
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">useCycle Hook</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-600 to-red-600 p-4 rounded-lg text-white text-center">
                  Estado atual: {animationState}
                </div>
                <AnimatedButton 
                  onClick={() => cycleAnimation()}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md"
                >
                  Alterar Estado
                </AnimatedButton>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Spinner</h3>
              <div className="flex space-x-4 justify-center">
                <Spinner size="6" color="blue-500" />
                <Spinner size="8" color="green-500" borderWidth="3" />
                <Spinner size="10" color="purple-500" borderWidth="4" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Estes componentes de animação substituem o framer-motion com CSS e JS puro,
          eliminando a incompatibilidade com React 19.
        </p>
      </div>
    </div>
  )
} 