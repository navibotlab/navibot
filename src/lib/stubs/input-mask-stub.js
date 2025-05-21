'use strict';

// Este é um stub para substituir react-input-mask em produção
// Ele resolve o problema de findDOMNode incompatível com React 19
const InputMaskStub = (props) => {
  const { value, onChange, onBlur, onFocus, mask, maskChar, alwaysShowMask, ...rest } = props;
  
  // Implementação mínima que apenas passa os props para um input normal
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return {
    ...rest,
    value: value || '',
    onChange: handleChange,
    onBlur: onBlur || (() => {}),
    onFocus: onFocus || (() => {}),
    // Retorna um componente compatível com o React que não usa findDOMNode
    render: function(props) {
      return props.children || null;
    }
  };
};

// Exporta um componente que é compatível com a API do InputMask
// mas não usa findDOMNode internamente
module.exports = InputMaskStub;
module.exports.default = InputMaskStub; 