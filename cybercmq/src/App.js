import React, { useState } from 'react';

function App() {
  const [page, setPage] = useState('home'); // 'home' | 'register' | 'login'
  const [user, setUser] = useState(null); // { username, email } ou null

  // State formulaire register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // State formulaire login
  const [logEmail, setLogEmail] = useState('');
  const [logPassword, setLogPassword] = useState('');

  // Inscription
  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('https://cyberskills.onrender.com/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, password: regPassword, username: regUsername }),
    });
    const data = await res.json();
    if (data.success) {
      setUser({ username: data.user.username, email: data.user.email });
      setPage('home');
    } else {
      alert(data.message || 'Erreur inscription');
    }
  };

  // Connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('https://cyberskills.onrender.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: logEmail, password: logPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setUser({ username: data.user.username, email: data.user.email });
      setPage('home');
    } else {
      alert(data.message || 'Erreur login');
    }
  };

  // Déconnexion
  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  if (page === 'register') {
    return (
        <div>
          <h2>Inscription</h2>
          <form onSubmit={handleRegister}>
            <input
                placeholder="Nom d'utilisateur"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Mot de passe"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
            />
            <button type="submit">S'inscrire</button>
          </form>
          <button onClick={() => setPage('home')}>Retour</button>
        </div>
    );
  }

  if (page === 'login') {
    return (
        <div>
          <h2>Connexion</h2>
          <form onSubmit={handleLogin}>
            <input
                type="email"
                placeholder="Email"
                value={logEmail}
                onChange={e => setLogEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Mot de passe"
                value={logPassword}
                onChange={e => setLogPassword(e.target.value)}
                required
            />
            <button type="submit">Se connecter</button>
          </form>
          <button onClick={() => setPage('home')}>Retour</button>
        </div>
    );
  }

  return (
      <div>
        {!user ? (
            <>
              <button onClick={() => setPage('register')}>Register</button>
              <button onClick={() => setPage('login')}>Login</button>
            </>
        ) : (
            <>
              <h2>Compte enregistré</h2>
              <p>Nom d'utilisateur : {user.username}</p>
              <p>Email : {user.email}</p>
              <button onClick={handleLogout}>Déconnexion</button>
            </>
        )}
      </div>
  );
}

export default App;
