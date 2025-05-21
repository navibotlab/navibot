/**
 * Stub avançado para framer-motion
 * Resolve problemas de compatibilidade com Next.js 15 e React 19
 * 
 * Este é um stub mais completo que fornece implementações básicas
 * de todos os principais componentes e funções do framer-motion.
 */

'use strict';

// Função para criar um componente genérico
const createComponent = (name) => {
  // Stub básico para qualquer componente
  const Component = ({ children, ...props }) => {
    return children || null;
  };
  
  // Adicionar propriedades comuns
  Component.displayName = `Motion${name}`;
  
  return Component;
};

// Função para criar funções vazias que retornam o seu primeiro argumento
const createPassthrough = (name) => {
  const fn = (arg) => arg;
  fn.displayName = name;
  return fn;
};

// Criação do objeto motion com componentes comuns
const motion = {
  div: createComponent('Div'),
  span: createComponent('Span'),
  a: createComponent('A'),
  button: createComponent('Button'),
  ul: createComponent('Ul'),
  li: createComponent('Li'),
  ol: createComponent('Ol'),
  p: createComponent('P'),
  h1: createComponent('H1'),
  h2: createComponent('H2'),
  h3: createComponent('H3'),
  h4: createComponent('H4'),
  h5: createComponent('H5'),
  h6: createComponent('H6'),
  img: createComponent('Img'),
  svg: createComponent('Svg'),
  path: createComponent('Path'),
  circle: createComponent('Circle'),
  rect: createComponent('Rect'),
  input: createComponent('Input'),
  textarea: createComponent('Textarea'),
  select: createComponent('Select'),
  form: createComponent('Form'),
  nav: createComponent('Nav'),
  header: createComponent('Header'),
  footer: createComponent('Footer'),
  main: createComponent('Main'),
  section: createComponent('Section'),
  article: createComponent('Article'),
  aside: createComponent('Aside'),
};

// AnimatePresence como um componente simples que renderiza seus filhos
const AnimatePresence = ({ children }) => {
  return children || null;
};

AnimatePresence.displayName = 'AnimatePresence';

// Funções de utilidade do framer-motion
const animate = createPassthrough('animate');
const animatePresence = () => ({ isPresent: true });
const transform = createPassthrough('transform');
const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
  set: () => {},
});

const useMotionValue = (initialValue) => ({
  get: () => initialValue,
  set: () => {},
  onChange: () => () => {},
});

const useTransform = (value, inputRange, outputRange) => useMotionValue(outputRange[0]);
const useCycle = (...items) => [items[0], () => {}];

// useScroll com valores básicos
const useScroll = () => ({
  scrollX: useMotionValue(0),
  scrollY: useMotionValue(0),
  scrollXProgress: useMotionValue(0),
  scrollYProgress: useMotionValue(0),
});

// Valores de transição padrão
const transition = {
  default: { duration: 0.3 },
  quick: { duration: 0.1 },
  slow: { duration: 0.6 },
};

// Exportar todos os componentes e utilitários
module.exports = {
  motion,
  AnimatePresence,
  animate,
  animatePresence,
  transform,
  useAnimation,
  useMotionValue,
  useTransform,
  useCycle,
  useScroll,
  transition,
  // Aliases para diferentes variantes de APIs
  m: motion,
  a: AnimatePresence,
  domAnimation: { createDomMotionComponent: createComponent },
  domMax: { createDomMotionComponent: createComponent },
  // Funções adicionais
  usePresence: () => [true, () => {}],
  useViewportScroll: useScroll,
  useSpring: useMotionValue,
  useInView: () => true,
  useReducedMotion: () => false,
  useMotionTemplate: (...args) => args.join(''),
};

// Garantir compatibilidade com diferentes formas de importação
module.exports.default = module.exports; 