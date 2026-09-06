import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Headset, Bike, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { loginSchema, type LoginFormInput } from '@/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const formSchema = z.object({
  identifier: z.string().min(1, 'Informe e-mail, apelido ou telefone'),
  password: z.string().min(1, 'Campo obrigatório'),
});

/**
 * Puramente visual — o backend não recebe "papel escolhido" no login (o
 * `/auth/login` só usa identificador+senha; o papel de verdade vem do
 * usuário resolvido no JWT). Serve só pra bater com o design em telas
 * pequenas; não altera em nada o que é enviado no submit.
 */
type RoleSwitch = 'operator' | 'motoboy' | 'admin';

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [serverError, setServerError] = useState<string | null>(null);
  const [roleSwitch, setRoleSwitch] = useState<RoleSwitch>('operator');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: LoginFormInput) => {
    setServerError(null);
    try {
      const payload = loginSchema.parse(values);
      await login(payload);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Falha ao entrar');
    }
  };

  if (isMobile) {
    return (
      <div className="mobile-login">
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
          }}
        />

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 14px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 26,
            }}
          >
            G
          </div>
          <h1 style={{ color: 'var(--color-accent)', fontSize: 26, margin: '0 0 4px' }}>Geladinha</h1>
          <p style={{ color: 'var(--color-neutral-300)', fontSize: 13, margin: 0 }}>
            Painel de entregas &amp; motoboys
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 1 }}
        >
          {serverError && <ErrorMessage message={serverError} />}

          <div className="form-field">
            <label htmlFor="identifier-mobile" style={{ color: 'var(--color-neutral-300)' }}>
              E-mail, apelido ou telefone
            </label>
            <Input id="identifier-mobile" {...register('identifier')} />
            {errors.identifier && <span className="error">{errors.identifier.message}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password-mobile" style={{ color: 'var(--color-neutral-300)' }}>
              Senha
            </label>
            <Input id="password-mobile" type="password" {...register('password')} />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          <div style={{ marginTop: 4 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-neutral-300)', marginBottom: 6 }}>
              Entrar como
            </label>
            <div
              className="seg"
              role="radiogroup"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)', width: '100%' }}
            >
              <label className="seg-opt" style={{ color: 'var(--color-neutral-100)', flex: 1, justifyContent: 'center' }}>
                <input
                  type="radio"
                  name="role"
                  checked={roleSwitch === 'operator'}
                  onChange={() => setRoleSwitch('operator')}
                />
                <Headset size={13} /> Televendas
              </label>
              <label className="seg-opt" style={{ color: 'var(--color-neutral-100)', flex: 1, justifyContent: 'center' }}>
                <input
                  type="radio"
                  name="role"
                  checked={roleSwitch === 'motoboy'}
                  onChange={() => setRoleSwitch('motoboy')}
                />
                <Bike size={13} /> Motoboy
              </label>
              <label className="seg-opt" style={{ color: 'var(--color-neutral-100)', flex: 1, justifyContent: 'center' }}>
                <input
                  type="radio"
                  name="role"
                  checked={roleSwitch === 'admin'}
                  onChange={() => setRoleSwitch('admin')}
                />
                <Shield size={13} /> Admin
              </label>
            </div>
          </div>

          <Button type="submit" isLoading={isLoggingIn} className="btn-block" style={{ marginTop: 8 }}>
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-grid">
      {/* Painel de marca — escondido em telas estreitas, sobra só o formulário. */}
      <div
        className="login-brand-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-accent-2-800)',
          color: 'var(--color-neutral-100)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 48,
        }}
      >
        <div
          className="blob"
          style={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-accent-2-500) 55%, transparent)',
          }}
        />
        <div
          className="blob"
          style={{
            position: 'absolute',
            bottom: -80,
            right: -40,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-accent-500) 45%, transparent)',
            animationDelay: '-3s',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28 }}>Geladinha</div>
          <div style={{ fontSize: 13, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
            Painel administrativo
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <h1 style={{ fontSize: 38, lineHeight: 1.15, marginBottom: 14 }}>
            Gerencie sua rede de entregas de um só lugar
          </h1>
          <p style={{ opacity: 0.85, fontSize: 15, margin: 0 }}>
            Estabelecimentos, motoboys, entregas, adiantamentos, pagamentos e caixas — tudo
            espelhando os endpoints reais da API.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, opacity: 0.6 }}>
          © {new Date().getFullYear()} Geladinha Delivery
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div className="card elev-lg" style={{ width: 'min(400px, 100%)', padding: 36 }}>
          <div className="card-kicker">Bem-vindo(a) de volta</div>
          <h2 className="card-title" style={{ fontSize: 26, marginBottom: 4 }}>
            Entrar
          </h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Use seu e-mail, apelido ou telefone.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && <ErrorMessage message={serverError} />}

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label htmlFor="identifier">E-mail, apelido ou telefone</label>
              <Input id="identifier" {...register('identifier')} />
              {errors.identifier && <span className="error">{errors.identifier.message}</span>}
            </div>

            <div className="form-field" style={{ marginBottom: 8 }}>
              <label htmlFor="password">Senha</label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <span className="error">{errors.password.message}</span>}
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12 }}>
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" isLoading={isLoggingIn} className="btn-block">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
