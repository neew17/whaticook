import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <TopBar title="Página não encontrada" onBack={() => navigate('/')} />

      <div className="state-block">
        <p style={{ fontSize: 40 }}>🍽️</p>
        <p>Estamos em preparação para uma nova invenção, agradecemos a compreensão.</p>
        <div className="fab" style={{ marginTop: 12 }} onClick={() => navigate('/')}>
          Voltar para o início
        </div>
      </div>
    </div>
  );
}
