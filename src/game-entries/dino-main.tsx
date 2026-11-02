import { createRoot } from 'react-dom/client';
import { DinoGame } from '../components/games/DinoGame';
import { postGameOver } from './bridge';
import '../index.css';

function Root() {
  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center">
      <DinoGame onGameOver={postGameOver} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
