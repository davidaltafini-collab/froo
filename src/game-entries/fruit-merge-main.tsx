import { createRoot } from 'react-dom/client';
import { FruitMergeGame } from '../components/games/FruitMergeGame';
import { postGameOver, postHaptic } from './bridge';
import '../index.css';

function Root() {
  return (
    <div className="w-screen h-screen bg-white">
      <FruitMergeGame onGameOver={postGameOver} onHaptic={postHaptic} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
