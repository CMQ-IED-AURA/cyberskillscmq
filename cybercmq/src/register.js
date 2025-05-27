import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './styles.css';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://cyberskills.onrender.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                Cookies.set('token', data.token, { secure: true, sameSite: 'Strict' });
                navigate('/game');
            } else {
                alert(data.message || "Erreur lors de l'inscription");
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur lors de l'inscription");
        }
    };

    return (
        <div className="page">
            <form onSubmit={handleRegister}>
                <h2>Inscription</h2>
                <input
                    placeholder="Nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-modern">S'inscrire</button>
            </form>
        </div>
    );
}

export default Register;