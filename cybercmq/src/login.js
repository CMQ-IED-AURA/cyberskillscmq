import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('https://cyberskills.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include', // Nécessaire pour envoyer/recevoir les cookies
            });
            const data = await res.json();
            if (data.success) {
                console.log('Connexion réussie:', data.data.user);
                navigate('/match');
            } else {
                setError(data.error || 'Erreur lors de la connexion');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            setError('Erreur serveur, veuillez réessayer');
        }
    };

    return (
        <div className="login-page">
            <h1>CyberSkills - Connexion</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="username">Nom d'utilisateur</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Entrez votre nom d'utilisateur"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe"
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="btn-modern" disabled={!username || !password}>
                    Se connecter
                </button>
            </form>
            <p>
                Pas de compte ? <a href="/register">Inscrivez-vous</a>
            </p>
        </div>
    );
}

export default Login;