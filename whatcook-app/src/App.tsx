import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import TipoPrato from './pages/TipoPrato';
import Tempo from './pages/Tempo';
import CriarReceita from './pages/CriarReceita';
import AdminReceitas from './pages/AdminReceitas';
import Categorias from './pages/Categorias';
import Resultados from './pages/Resultados';
import Salvas from './pages/Salvas';
import Comunidade from './pages/Comunidade';
import RecipeDetail from './pages/RecipeDetail';
import CookingStep from './pages/CookingStep';
import Conclusao from './pages/Conclusao';
import Login from './pages/Login';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Profile from './pages/Profile';
import CookerProfile from './pages/CookerProfile';
import Search from './pages/Search';
import FollowList from './pages/FollowList';
import PostDetail from './pages/PostDetail';
import StoryViewer from './pages/StoryViewer';
import StoryEditor from './pages/StoryEditor';
import StoriesExplore from './pages/StoriesExplore';
import NotFound from './pages/NotFound';
import { playClickSound } from './utils/sound';

const CLICKABLE_SELECTOR =
  'button, .fab, .cta-fixed, .cta-secondary, .tempo-card, .class-card, .ing-card, .pantry-item, .tab, ' +
  '.icon-btn, .selected-chip, .social-btn, .instagram-cta, .dish-photo-box, .save-profile-btn, .dish-save-footer, ' +
  '.camera-shutter-btn, .auth-switch, .auth-google-btn, .result-card, .back, .fav, .profile-badge, ' +
  '.btn-ghost, .btn-next, .btn-finish, .dish-photo-retake, .tipo-prato-half, ' +
  '.profile-bio-edit-btn, .profile-feed-tile, .follow-btn, .post-like-btn, .comment-send-btn, ' +
  '.profile-follow-stat, .comment-like-btn, .comment-reply-btn, .story-avatar-item, .story-add-badge, ' +
  '.story-tap-zone, .story-viewer-close, .cooker-profile-story-ring, .story-editor-tool-btn, ' +
  '.story-editor-publish-btn, .explore-story-row, .story-viewer-viewers-bar, .explore-stories-link';

function App() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(CLICKABLE_SELECTOR)) {
        playClickSound();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/tipo-prato" element={<TipoPrato />} />
      <Route path="/tempo" element={<Tempo />} />
      <Route path="/criar-receita" element={<CriarReceita />} />
      <Route path="/admin/receitas" element={<AdminReceitas />} />
      <Route path="/categorias" element={<Categorias />} />
      {/* Rotas antigas de picker por categoria — unificadas na tela de seções */}
      <Route path="/alimentos" element={<Navigate to="/categorias" replace />} />
      <Route path="/condimentos" element={<Navigate to="/categorias" replace />} />
      <Route path="/temperos" element={<Navigate to="/categorias" replace />} />
      <Route path="/molhos" element={<Navigate to="/categorias" replace />} />
      <Route path="/equipamentos" element={<Navigate to="/categorias" replace />} />
      <Route path="/resultados" element={<Resultados />} />
      <Route path="/salvas" element={<Salvas />} />
      <Route path="/comunidade" element={<Comunidade />} />
      <Route path="/receita/:id" element={<RecipeDetail />} />
      <Route path="/receita/:id/cozinhando/:step" element={<CookingStep />} />
      <Route path="/receita/:id/concluido" element={<Conclusao />} />
      {/* /social foi absorvido pelo ShareSheet disparado da Conclusão */}
      <Route path="/social" element={<Navigate to="/tipo-prato" replace />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/perfil" element={<Profile />} />
      <Route path="/buscar" element={<Search />} />
      <Route path="/cooker/:id" element={<CookerProfile />} />
      <Route path="/rede/:id/:type" element={<FollowList />} />
      <Route path="/publicacao/:dishId" element={<PostDetail />} />
      <Route path="/story/:userId" element={<StoryViewer />} />
      <Route path="/story-editor" element={<StoryEditor />} />
      <Route path="/stories" element={<StoriesExplore />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
