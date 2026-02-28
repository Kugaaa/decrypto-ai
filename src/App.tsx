import { useGameStore } from './store/gameStore';
import HomePage from './components/HomePage';
import GameBoard from './components/GameBoard';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'idle') {
    return <HomePage />;
  }

  return <GameBoard />;
}
