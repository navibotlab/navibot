// Impedir vazamento de credenciais na URL
async redirects() {
  return [
    {
      // Redirecionar qualquer URL que contenha credenciais para página de login limpa
      source: '/:path*',
      destination: '/:path*',
      permanent: false,
      has: [
        {
          type: 'query',
          key: 'email',
        },
      ],
    },
    {
      // Redirecionar qualquer URL que contenha senha para página de login limpa
      source: '/:path*',
      destination: '/:path*',
      permanent: false,
      has: [
        {
          type: 'query',
          key: 'password',
        },
      ],
    },
    {
      // Corrigir o loop de redirecionamento detectando rotas específicas
      source: '/login',
      destination: '/diagnostico-publico',
      permanent: false,
      has: [
        {
          type: 'header',
          key: 'referer',
          value: '(.*?/login.*?)',
        }
      ]
    }
  ]
}, 