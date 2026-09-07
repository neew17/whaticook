import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { GoogleGlyph } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { AUTH_INTENT_COPY, type AuthIntent } from '../utils/authIntent';
import { isUsernameAvailable, sanitizeUsernameInput, validateUsername } from '../utils/username';

type UsernameState = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const intent = (location.state as { intent?: AuthIntent } | null)?.intent;
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/tipo-prato');
  }, [user, navigate]);

  // Checa disponibilidade do username com debounce enquanto digita.
  const usernameDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (mode !== 'signup') return;
    clearTimeout(usernameDebounce.current);
    const value = username.trim().toLowerCase();
    if (!value) {
      setUsernameState('idle');
      return;
    }
    if (validateUsername(value)) {
      setUsernameState('invalid');
      return;
    }
    setUsernameState('checking');
    let cancelled = false;
    usernameDebounce.current = setTimeout(async () => {
      const free = await isUsernameAvailable(value);
      if (!cancelled) setUsernameState(free ? 'ok' : 'taken');
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(usernameDebounce.current);
    };
  }, [username, mode]);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (mode === 'signup') {
      const uErr = validateUsername(username);
      if (uErr) {
        setError(uErr);
        return;
      }
      setLoading(true);
      const free = await isUsernameAvailable(username);
      if (!free) {
        setLoading(false);
        setUsernameState('taken');
        setError('Esse nome de usuário já está em uso. Escolha outro.');
        return;
      }
    } else {
      setLoading(true);
    }
    const errMsg =
      mode === 'signup'
        ? await signUp(email.trim(), password, name.trim(), username.trim().toLowerCase(), '')
        : await signIn(email.trim(), password);
    setLoading(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    // Volta pra onde a pessoa estava (a receita, o prato, o perfil) quando o
    // login foi disparado por uma ação. Sem intent, cai no funil.
    if (intent) navigate(-1);
    else navigate('/tipo-prato');
  };

  const blockSubmit = mode === 'signup' && (usernameState === 'taken' || usernameState === 'invalid');

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    // Em caso de sucesso o navegador redireciona pro Google e volta pra /tipo-prato.
    const errMsg = await signInWithGoogle();
    if (errMsg) {
      setLoading(false);
      setError('Não foi possível entrar com o Google agora. Tente com email e senha.');
    }
  };

  return (
    <div className="screen">
      <TopBar title={mode === 'signup' ? 'Criar conta' : 'Entrar'} onBack={() => navigate(-1)} hideAccountIcon />

      <div className="auth-body">
        {intent && <p className="auth-intent">{AUTH_INTENT_COPY[intent]}</p>}

        {mode === 'signup' && (
          <>
            <label className="auth-label">Nome</label>
            <input
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />

            <label className="auth-label">Nome de usuário</label>
            <div className="auth-username-field">
              <span className="auth-username-at">@</span>
              <input
                className="auth-input"
                value={username}
                onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
                placeholder="soninha92"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
              />
            </div>
            {username.trim() !== '' && (
              <p className={`auth-username-hint${usernameState === 'taken' || usernameState === 'invalid' ? ' bad' : usernameState === 'ok' ? ' good' : ''}`}>
                {usernameState === 'checking' && 'Verificando...'}
                {usernameState === 'ok' && '✓ Disponível'}
                {usernameState === 'taken' && 'Já está em uso'}
                {usernameState === 'invalid' && 'Só letras e números, de 3 a 20 caracteres'}
              </p>
            )}
          </>
        )}

        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />

        <label className="auth-label">Senha</label>
        <div className="auth-password-field">
          <input
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? 'ocultar' : 'mostrar'}
          </button>
        </div>

        {mode === 'signin' && (
          <p className="auth-switch" onClick={() => navigate('/esqueci-senha')}>
            Esqueci minha senha
          </p>
        )}

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-actions">
        <div
          className={`fab${loading || blockSubmit ? ' disabled' : ''}`}
          onClick={loading || blockSubmit ? undefined : handleSubmit}
        >
          {loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </div>
        {GOOGLE_AUTH_ENABLED && (
          <>
            <div className="auth-divider">
              <span>ou</span>
            </div>
            <button type="button" className="auth-google-btn" onClick={loading ? undefined : handleGoogle}>
              <GoogleGlyph />
              Continuar com Google
            </button>
          </>
        )}
        <p className="auth-switch" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
        </p>
        <p className="auth-switch" style={{ color: 'var(--text-muted)' }} onClick={() => navigate(-1)}>
          Agora não
        </p>
        </div>
      </div>
    </div>
  );
}
