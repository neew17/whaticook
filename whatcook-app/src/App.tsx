import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import TipoPrato from './pages/TipoPrato';
import Tempo from './pages/Tempo';
import CriarReceita from './pages/CriarReceita';
import AdminReceitas from './pages/AdminReceitas';
import Categorias from './pages/Categorias';
import Alimentos from './pages/Alimentos';
import PantryScreen from './components/PantryScreen';
import { CONDIMENTOS, TEMPEROS, MOLHOS, EQUIPAMENTOS } from './data/ingredients';
import Resultados from './pages/Resultados';
import RecipeDetail from './pages/RecipeDetail';
import CookingStep from './pages/CookingStep';
import Conclusao from './pages/Conclusao';
import Social from './pages/Social';
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
      <Route path="/alimentos" element={<Alimentos />} />
      <Route
        path="/condimentos"
        element={<PantryScreen title="Condimentos" category="condimentos" items={CONDIMENTOS} />}
      />
      <Route
        path="/temperos"
        element={<PantryScreen title="Temperos" category="temperos" items={TEMPEROS} />}
      />
      <Route path="/molhos" element={<PantryScreen title="Molhos" category="molhos" items={MOLHOS} />} />
      <Route
        path="/equipamentos"
        element={<PantryScreen title="Equipamentos" category="equipamentos" items={EQUIPAMENTOS} />}
      />
      <Route path="/resultados" element={<Resultados />} />
      <Route path="/receita/:id" element={<RecipeDetail />} />
      <Route path="/receita/:id/cozinhando/:step" element={<CookingStep />} />
      <Route path="/receita/:id/concluido" element={<Conclusao />} />
      <Route path="/social" element={<Social />} />
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
