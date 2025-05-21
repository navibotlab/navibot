# Biblioteca de Animações para React 19

Esta biblioteca fornece componentes e hooks para criar animações em aplicativos React, eliminando a dependência do `framer-motion` e solucionando problemas de compatibilidade com o React 19.

## Por que esta biblioteca?

O `framer-motion` utiliza o método `findDOMNode` do React, que foi descontinuado e causa problemas de compatibilidade com o React 19. Esta biblioteca oferece alternativas que funcionam bem com o React 19, usando CSS e JavaScript puro para animações.

## Componentes Disponíveis

### Animações Básicas

- `FadeIn`: Animação de fade-in
- `SlideUp`: Slide de baixo para cima
- `SlideDown`: Slide de cima para baixo
- `SlideLeft`: Slide da direita para a esquerda
- `SlideRight`: Slide da esquerda para a direita

### Componentes Interativos

- `AnimatedButton`: Botão com efeito de escala
- `AnimatedLink`: Link com efeito de escala
- `Switch`: Interruptor com animação
- `AnimatedErrorMessage`: Mensagem de erro animada
- `Spinner`: Indicador de carregamento

### Componentes Avançados

- `AnimatedPresence`: Gerencia a presença de componentes na DOM
- `AnimatedDiv`: Componente genérico para várias animações

### Hooks

- `useInView`: Detecta quando um elemento está na viewport
- `useCycle`: Cicla entre diferentes estados
- `useAnimation`: Controla animações programaticamente

## Guia de Migração do framer-motion

### Antes (com framer-motion)

```jsx
import { motion, AnimatePresence } from 'framer-motion';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          Conteúdo animado
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Depois (com nossa biblioteca)

```jsx
import { AnimatedDiv, AnimatedPresence } from '@/components/animations';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <AnimatedPresence>
      {isVisible && (
        <AnimatedDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 500 }}
        >
          Conteúdo animado
        </AnimatedDiv>
      )}
    </AnimatedPresence>
  );
}
```

### Exemplos de Migração

#### Fade In

**Antes:**
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo com fade in
</motion.div>
```

**Depois:**
```jsx
<FadeIn delay={0} duration={500}>
  Conteúdo com fade in
</FadeIn>
```

#### Slide Up

**Antes:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo deslizando para cima
</motion.div>
```

**Depois:**
```jsx
<SlideUp delay={0} duration={500} distance="5">
  Conteúdo deslizando para cima
</SlideUp>
```

#### Button com Animação

**Antes:**
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Botão Animado
</motion.button>
```

**Depois:**
```jsx
<AnimatedButton
  className="bg-blue-500 text-white px-4 py-2 rounded"
  scaleAmount="[1.05]"
  scaleAmountActive="[0.95]"
>
  Botão Animado
</AnimatedButton>
```

## Compatibilidade com framer-motion

Para facilitar a migração, mantivemos uma API semelhante onde possível. A biblioteca também inclui um objeto `motion` que imita a API do framer-motion:

```jsx
import { motion } from '@/components/animations';

function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Conteúdo animado
    </motion.div>
  );
}
```

## Exemplos

Para ver exemplos de todos os componentes em ação, visite:

- Página de exemplos: `/examples/animations` (se implementada)
- Arquivo de exemplos: `src/components/animations/examples.tsx`

## Considerações

- A biblioteca prioriza compatibilidade com React 19 e simplicidade
- As animações são baseadas em CSS para melhor desempenho
- Alguns recursos avançados do framer-motion podem não estar disponíveis
- Os parâmetros podem diferir ligeiramente da API original

## Referência Rápida

| framer-motion | Nossa Biblioteca | Notas |
|---------------|------------------|-------|
| `<motion.div>` | `<AnimatedDiv>` ou componentes específicos | Use componentes específicos quando possível |
| `<AnimatePresence>` | `<AnimatedPresence>` | API simplificada |
| `useInView()` | `useInView()` | Implementação baseada em IntersectionObserver |
| `useCycle()` | `useCycle()` | Mesma API |
| `useAnimation()` | `useAnimation()` | API simplificada | 