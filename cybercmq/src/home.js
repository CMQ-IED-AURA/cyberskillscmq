import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
            </header>
            <main className="container">
                <div className="hero">
                    <h1>Bienvenue sur CyberSkills</h1>
                    <div>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-modern"
                        >
                            Connexion
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="btn-modern btn-accent"
                        >
                            Inscription
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;