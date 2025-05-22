import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './styles.css';

function Game() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    return (
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
                <nav>
                    <button onClick={() => {
                        Cookies.remove('token');
                        navigate('/');
                    }} className="btn-modern">Déconnexion</button>
                </nav>
            </header>
            <main className="container">
                <h2>Choix des équipes</h2>
                <div className="teams">
                    <div className="team-card red-team">
                        <h3>Équipe Rouge</h3>
                        <button className="btn-modern">Rejoindre</button>
                    </div>
                    <div className="team-card blue-team">
                        <h3>Équipe Bleue</h3>
                        <button className="btn-modern">Rejoindre</button>
                    </div>
                </div>
                <button className="launch-button" style={{ marginTop: '2rem' }}>Lancer</button>
            </main>
        </div>
    );
}

export default Game;
