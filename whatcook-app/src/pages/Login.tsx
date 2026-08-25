import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [favoriteDish, setFavoriteDish] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/tipo-prato');
  }, [user, navigate]);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    setLoading(true);
    const errMsg =
      mode === 'signup'
        ? await signUp(email.trim(), password, name.trim(), favoriteDish.trim())
        : await signIn(email.trim(), password);
    setLoading(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    navigate('/tipo-prato');
  };

  return (
    <div className="screen">
      <TopBar title={mode === 'signup' ? 'Criar conta' : 'Entrar'} onBack={() => navigate(-1)} hideAccountIcon />

      <div style={{ padding: '0 20px 20px' }}>
        {mode === 'signup' && (
          <>
            <label className="auth-label">Nome</label>
            <input
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
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
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />

        {mode === 'signup' && (
          <>
            <label className="auth-label">Prato favorito (opcional)</label>
            <input
              className="auth-input"
              value={favoriteDish}
              onChange={(e) => setFavoriteDish(e.target.value)}
              placeholder="Ex: Strogonoff"
            />
          </>
        )}

        {mode === 'signin' && (
          <p className="auth-switch" onClick={() => navigate('/esqueci-senha')}>
            Esqueci minha senha
          </p>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>

      <div className="fab-container">
        <div className="fab" onClick={loading ? undefined : handleSubmit}>
          {loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </div>
        <div className="auth-google-btn" onClick={signInWithGoogle}>
          <span>🔵</span>
          <span>Entrar com Google</span>
        </div>
        <p className="auth-switch" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
        </p>
        <p className="auth-switch" style={{ color: 'var(--text-muted)' }} onClick={() => navigate('/tipo-prato')}>
          Continuar sem conta
        </p>
      </div>
    </div>
  );
}
