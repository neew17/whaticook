import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Digite seu email.');
      return;
    }
    setLoading(true);
    const errMsg = await resetPasswordForEmail(email.trim());
    setLoading(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="screen">
      <TopBar title="Esqueci minha senha" onBack={() => navigate('/entrar')} hideAccountIcon />

      <div style={{ padding: '0 20px 20px' }}>
        {success ? (
          <p className="auth-success">
            Se esse email existir, enviamos um link de recuperação. Confira sua caixa de entrada (e a de spam).
          </p>
        ) : (
          <>
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            {error && <p className="auth-error">{error}</p>}
          </>
        )}
      </div>

      {!success && (
        <div className="fab-container">
          <div className="fab" onClick={loading ? undefined : handleSubmit}>
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </div>
          <p className="auth-switch" onClick={() => navigate('/entrar')}>
            Voltar para o login
          </p>
        </div>
      )}
    </div>
  );
}
