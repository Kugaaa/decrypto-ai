import { Analytics } from '@vercel/analytics/react';
import { useGameStore } from './store/gameStore';
import HomePage from './components/HomePage';
import GameBoard from './components/GameBoard';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <>
      {phase === 'idle' ? <HomePage /> : <GameBoard />}
      <Analytics />
    </>
  );
}
