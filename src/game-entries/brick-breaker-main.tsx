import { createRoot } from 'react-dom/client';
import { BrickBreakerGame } from '../components/games/BrickBreakerGame';
import { postGameOver, postHaptic } from './bridge';
import '../index.css';

function Root() {
  return (
    <div className="w-screen h-screen bg-white">
      <BrickBreakerGame onGameOver={postGameOver} onHaptic={postHaptic} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
