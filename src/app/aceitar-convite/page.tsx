'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function AceitarConvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AceitarConviteForm />
    </div>
  );
}

function AceitarConviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState<'pending' | 'verified' | 'error'>('pending');
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    password: '',
    confirmPassword: '',
  });
  const [tokenIsValid, setTokenIsValid] = useState(false);

  // Recuperar token e email da URL
  useEffect(() => {
    const token = searchParams?.get('token');
    const email = searchParams?.get('email');

    if (token && email) {
      setFormData(prev => ({ ...prev, token, email }));
      validateToken(token, email);
    }
  }, [searchParams]);

  // Função para verificar se o token é válido
  const validateToken = async (token: string, email: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verificar-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, email, type: 'invitation' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Token inválido ou expirado');
      }

      setTokenIsValid(true);
    } catch (err: any) {
      console.error('Erro ao validar token:', err);
      setError(err.message || 'Erro ao validar o token');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validar senha
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/aceitar-convite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          token: formData.token,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar o convite');
      }

      setSuccess('Convite aceito com sucesso! Você será redirecionado para a página de login...');
      setStatus('verified');

      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      setError(err.message || 'Ocorreu um erro ao aceitar o convite');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar mensagem de erro se o token for inválido
  if (status === 'error') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Convite Inválido</CardTitle>
          <CardDescription className="text-center">
            Este convite não é válido ou já expirou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/login')}>
            Ir para Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Mostrar mensagem de sucesso após confirmar o convite
  if (status === 'verified') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-green-600">Convite Aceito</CardTitle>
          <CardDescription className="text-center">
            Seu convite foi aceito com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Sucesso</AlertTitle>
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/login')}>
            Ir para Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Mostrar formulário para definir senha
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Aceitar Convite</CardTitle>
        <CardDescription className="text-center">
          Configure sua conta para acessar o workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading || !tokenIsValid}
              required
              placeholder="Digite sua senha"
            />
            <p className="text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading || !tokenIsValid}
              required
              placeholder="Confirme sua senha"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !tokenIsValid}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processando...' : 'Confirmar Cadastro'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 