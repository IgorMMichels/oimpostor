import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import Home from './pages/Home';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Demo from './pages/Demo';

function App() {
    const { connect, disconnect, room } = useGameStore();

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            {/* Join room from link - shows join form OR lobby if already in room */}
            <Route path="/sala/:code" element={room ? <Lobby /> : <JoinRoom />} />
            <Route path="/jogo/:code" element={<Game />} />
            <Route path="/demo" element={<Demo />} />
        </Routes>
    );
}

export default App;
