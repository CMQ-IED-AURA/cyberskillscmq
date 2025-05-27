import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './styles.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://cyberskills.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                Cookies.set('token', data.token, { secure: true, sameSite: 'Strict' });
                navigate('/game');
            } else {
                alert('Erreur lors de la connexion:' data.message || 'Erreur lors de la connexion');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la connexion');
        }
    };

    return (
        <div className="page">
            <form onSubmit={handleLogin}>
                <h2>Connexion</h2>
                <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChange={(e) => {setUsername(e.target.value)}}
                    required
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-modern">Se connecter</button>
            </form>
        </div>
    );
}

export default Login;