import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

const RECOVERY_CHECK_TIMEOUT_MS = 2500;

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { passwordRecovery, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkTimedOut, setCheckTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCheckTimedOut(true), RECOVERY_CHECK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/tipo-prato'), 1500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    const errMsg = await updatePassword(password);
    setSubmitting(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setSuccess(true);
  };

  if (!passwordRecovery && !checkTimedOut) {
    return (
      <div className="screen">
        <TopBar title="Redefinir senha" onBack={() => navigate('/entrar')} hideAccountIcon />
        <div style={{ padding: '0 20px 20px' }}>
          <p className="auth-label">Verificando link...</p>
        </div>
      </div>
    );
  }

  if (!passwordRecovery && checkTimedOut) {
    return (
      <div className="screen">
        <TopBar title="Redefinir senha" onBack={() => navigate('/entrar')} hideAccountIcon />
        <div style={{ padding: '0 20px 20px' }}>
          <p className="auth-error">Link inválido ou expirado, solicite um novo.</p>
        </div>
        <div className="fab-container">
          <div className="fab" onClick={() => navigate('/esqueci-senha')}>
            Solicitar novo link
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar title="Redefinir senha" onBack={() => navigate('/entrar')} hideAccountIcon />

      <div style={{ padding: '0 20px 20px' }}>
        {success ? (
          <p className="auth-success">Senha atualizada! Redirecionando...</p>
        ) : (
          <>
            <label className="auth-label">Nova senha</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />

            <label className="auth-label">Confirmar nova senha</label>
            <input
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />

            {error && <p className="auth-error">{error}</p>}
          </>
        )}
      </div>

      {!success && (
        <div className="fab-container">
          <div className="fab" onClick={submitting ? undefined : handleSubmit}>
            {submitting ? 'Salvando...' : 'Salvar nova senha'}
          </div>
        </div>
      )}
    </div>
  );
}
