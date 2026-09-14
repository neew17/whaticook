import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <TopBar title="Página não encontrada" onBack={() => navigate('/tipo-prato')} hideAccountIcon />

      <div className="state-block" style={{ flex: 1 }}>
        <p style={{ fontSize: 40 }}>🔍</p>
        <p>Não encontramos essa página. Ela pode ter mudado de lugar ou o link está quebrado.</p>
        <Button style={{ marginTop: 12 }} onClick={() => navigate('/tipo-prato')}>
          Ir para o início
        </Button>
      </div>
    </div>
  );
}
