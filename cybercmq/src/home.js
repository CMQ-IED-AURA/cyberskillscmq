import React from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './styles.css';

function Home() {
    const navigate = useNavigate();
    const isLoggedIn = Cookies.get('token');

    return (
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
                {!isLoggedIn && (
                    <div>
                        <button onClick={() => navigate('/login')} className="btn-modern">Connexion</button>
                        <button onClick={() => navigate('/register')} className="btn-modern">S'inscrire</button>
                    </div>
                )}
            </header>
            <main>
                <p>Bienvenue sur la plateforme de formation en cybersécurité !</p>
            </main>
        </div>
    );
}

export default Home;
