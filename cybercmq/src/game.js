import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import './game.css';

// Singleton WebSocket instance
let socketInstance = null;

function getSocket(token) {
    if (!socketInstance || socketInstance.disconnected) {
        socketInstance = io('https://cyberskills.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 30000,
        });

        let reconnectFailureCount = 0;
        const maxReconnectFailures = 5;

        socketInstance.on('reconnect_error', (error) => {
            console.error('Erreur de reconnexion WebSocket:', error);
            reconnectFailureCount++;
            if (reconnectFailureCount >= maxReconnectFailures) {
                socketInstance.disconnect();
                reconnectFailureCount = 0;
            }
        });

        socketInstance.on('reconnect', (attempt) => {
            console.log(`Reconnexion réussie après ${attempt} tentatives`);
            reconnectFailureCount = 0;
            socketInstance.emit('authenticate', token);
        });
    }
    return socketInstance;
}

function Game() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [teamMembersByMatch, setTeamMembersByMatch] = useState({});
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState(null);
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const validateToken = async (token) => {
        console.log('Validation du token:', token ? 'Token présent' : 'Token absent');
        if (!token) {
            console.log('Aucun token fourni');
            return false;
        }
        try {
            console.log('Envoi de la requête à /auth/verify');
            const res = await fetch('https://cyberskills.onrender.com/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            console.log('Réponse reçue:', res.status, res.statusText);
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();
            console.log('Données reçues:', data);
            return data.success;
        } catch (error) {
            console.error('Erreur validateToken:', error);
            return false;
        }
    };

    const fetchMatches = useCallback(async (token) => {
        setLoading(true);
        try {
            const res = await fetch('https://cyberskills.onrender.com/api/match/list', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setMatches(data.matches || []);
                console.log('Matchs récupérés:', data.matches);
                for (const match of data.matches) {
                    await fetchTeamMembers(match.id, token);
                }
                if (data.matches.length > 0 && !selectedMatch) {
                    setSelectedMatch(data.matches[0]);
                    localStorage.setItem('selectedGameId', data.matches[0].id);
                }
            } else {
                setError(data.message || 'Erreur lors de la récupération des matchs');
            }
        } catch (error) {
            setError('Erreur serveur lors de la récupération des matchs.');
            console.error('Erreur fetchMatches:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMatch]);

    const fetchTeamMembers = useCallback(async (matchId, token) => {
        if (!matchId) return;
        try {
            const res = await fetch(`https://cyberskills.onrender.com/api/match/${matchId}/teams`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setTeamMembersByMatch((prev) => ({
                    ...prev,
                    [matchId]: {
                        redTeam: data.redTeam?.users || [],
                        blueTeam: data.blueTeam?.users || [],
                    },
                }));
            } else {
                setError(data.message || 'Erreur lors de la récupération des membres');
            }
        } catch (error) {
            setError('Erreur serveur lors de la récupération des membres.');
            console.error('Erreur fetchTeamMembers:', error);
        }
    }, []);

    const fetchUsers = useCallback(async (token) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/api/match/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            } else {
                setError(data.message || 'Erreur lors de la récupération des utilisateurs');
            }
        } catch (error) {
            setError('Erreur lors de la récupération des utilisateurs.');
            console.error('Erreur fetchUsers:', error);
        }
    }, []);

    const handleCreateMatch = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            if (!token) {
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }
            const res = await fetch('https://cyberskills.onrender.com/api/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la création du match');
            }
        } catch (error) {
            setError('Erreur serveur lors de la création du match.');
            console.error('Erreur handleCreateMatch:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, navigate]);

    const handleDeleteMatch = useCallback(async (matchId) => {
        if (!matchId || loading) {
            setError('Match non sélectionné ou invalide.');
            return;
        }
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            if (!token) {
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }
            const res = await fetch(`https://cyberskills.onrender.com/api/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la suppression du match');
            }
        } catch (error) {
            setError('Erreur serveur lors de la suppression du match.');
            console.error('Erreur handleDeleteMatch:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, navigate]);

    const handleAssignTeam = useCallback(async (userId, teamId, matchId) => {
        if (!matchId || !selectedMatch?.id || !userId) {
            setError('Veuillez sélectionner un match et un utilisateur.');
            return;
        }
        if (teamId && teamId !== selectedMatch?.redTeamId && teamId !== selectedMatch?.blueTeamId) {
            setError('Équipe invalide pour ce match.');
            return;
        }
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            if (!token) {
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }
            const res = await fetch('https://cyberskills.onrender.com/api/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, teamId, matchId }),
            });
            if (!res.ok) {
                throw new Error(`Erreur HTTP: ${res.status}`);
            }
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            }
        } catch (error) {
            setError(`Erreur lors de l'assignation: ${error.message}`);
            console.error('Erreur handleAssignTeam:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, selectedMatch, navigate]);

    const canJoinMatch = useCallback((matchId) => {
        if (role === 'ADMIN') return true;
        const matchTeams = teamMembersByMatch[matchId];
        if (!matchTeams) return false;
        const isInRedTeam = matchTeams.redTeam?.some(user => user.id === userId);
        const isInBlueTeam = matchTeams.blueTeam?.some(user => user.id === userId);
        return isInRedTeam || isInBlueTeam;
    }, [role, teamMembersByMatch, userId]);

    const handleJoinMatch = useCallback((matchId) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) {
            setError('Match introuvable.');
            return;
        }

        if (!canJoinMatch(matchId)) {
            setError('Vous devez être assigné à une équipe pour rejoindre ce match.');
            return;
        }

        const token = Cookies.get('token');
        if (!token) {
            setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
            navigate('/login');
            return;
        }

        const ensureSocketConnected = () => {
            return new Promise((resolve, reject) => {
                if (socket && socket.connected) {
                    resolve();
                } else {
                    socket?.once('connect', () => resolve());
                    socket?.once('connect_error', () => reject(new Error('Impossible de se connecter au WebSocket.')));
                    socket?.connect();
                }
            });
        };

        ensureSocketConnected()
            .then(() => {
                console.log('Rejoindre le match, émission de join-game pour gameId:', matchId);
                localStorage.setItem('selectedGameId', matchId);
                socket.emit('join-game', { gameId: matchId, playerName: username || 'Joueur' });
                socket.once('role-assigned', (data) => {
                    console.log('Rôle assigné:', data);
                    navigate('/attack');
                });
                socket.once('error', (data) => {
                    console.log('Erreur reçue lors de join-game:', data);
                    setError(data.message || 'Erreur inconnue lors de la jointure du match.');
                });
            })
            .catch((err) => {
                setError(err.message);
                console.error('Erreur WebSocket:', err);
            });
    }, [matches, canJoinMatch, navigate, socket, username]);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
            navigate('/login');
            return;
        }

        validateToken(token).then((isValid) => {
            if (!isValid) {
                Cookies.remove('token');
                setError('Token invalide ou expiré. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }

            try {
                const payload = token.split('.')[1];
                const decoded = JSON.parse(atob(payload));
                const exp = decoded.exp * 1000;
                if (Date.now() >= exp) {
                    Cookies.remove('token');
                    setError('Session expirée. Veuillez vous reconnecter.');
                    navigate('/login');
                    return;
                }
                setRole(decoded.role);
                setUserId(decoded.userId);
                setUsername(decoded.username);

                const newSocket = getSocket(token);
                setSocket(newSocket);

                newSocket.on('connect', () => {
                    console.log('Connecté au WebSocket:', newSocket.id);
                    newSocket.emit('authenticate', token);
                });

                newSocket.on('authenticated', (data) => {
                    console.log('Authentification WebSocket réussie:', data);
                });

                newSocket.on('authError', (error) => {
                    console.error('Erreur d\'authentification WebSocket:', error);
                    setError('Erreur d\'authentification WebSocket: ' + error.message);
                    validateToken(token).then((isValid) => {
                        if (!isValid) {
                            Cookies.remove('token');
                            navigate('/login');
                        } else {
                            newSocket.emit('authenticate', token);
                        }
                    });
                });

                newSocket.on('connect_error', (error) => {
                    console.error('Erreur de connexion WebSocket:', error);
                    setError('Erreur de connexion au serveur Web - tentative de reconnexion...');
                });

                newSocket.on('reconnect', (attempt) => {
                    console.log(`Reconnexion réussie après ${attempt} tentatives`);
                    setError(null);
                    newSocket.emit('authenticate', token);
                });

                newSocket.on('reconnect_error', (error) => {
                    console.error('Erreur de reconnexion WebSocket:', error);
                    setError('Échec de la reconnexion au serveur: ' + error.message);
                });

                newSocket.on('error', (data) => {
                    console.error('Erreur WebSocket:', { message: data.message, code: data.code, details: data });
                    setError(data.message || 'Erreur inconnue du serveur WebSocket');
                });

                newSocket.on('connectedUsers', (connectedUsers) => {
                    console.log('Mise à jour des utilisateurs connectés:', connectedUsers);
                    setUsers(connectedUsers || []);
                });

                newSocket.on('matchCreated', (newMatch) => {
                    console.log('Nouveau match créé:', newMatch);
                    setMatches((prev) => [...prev, newMatch]);
                    fetchTeamMembers(newMatch.id, token);
                });

                newSocket.on('matchDeleted', (data) => {
                    const matchId = data.matchId || data;
                    console.log('Match supprimé:', matchId);
                    setMatches((prev) => prev.filter((match) => match.id !== matchId));
                    setTeamMembersByMatch((prev) => {
                        const updated = { ...prev };
                        delete updated[matchId];
                        return updated;
                    });
                    if (selectedMatch?.id === matchId) {
                        setSelectedMatch(null);
                    }
                });

                newSocket.on('teamAssigned', ({ matchId, userId, teamId, username, updatedMatch }) => {
                    console.log('Équipe assignée:', { matchId, userId, teamId, username });
                    setTeamMembersByMatch((prev) => ({
                        ...prev,
                        [matchId]: {
                            redTeam: updatedMatch.redTeam?.users || [],
                            blueTeam: updatedMatch.blueTeam?.users || [],
                        },
                    }));
                });

                newSocket.on('game-started', ({ gameId }) => {
                    console.log('Événement game-started reçu pour gameId:', gameId, 'par socketId:', newSocket.id);
                    localStorage.setItem('selectedGameId', gameId);
                    newSocket.emit('join-game', { gameId, playerName: username || 'Joueur' });
                    navigate('/attack');
                });

                fetchMatches(token);
                if (decoded.role === 'ADMIN') {
                    fetchUsers(token);
                }

                return () => {
                    console.log('Déconnexion du socket');
                    newSocket.disconnect();
                };
            } catch (error) {
                console.error('Erreur d\'authentification:', error);
                setError('Erreur d\'authentification, veuillez vous reconnecter.');
                Cookies.remove('token');
                navigate('/login');
            }
        });
    }, [navigate, fetchMatches, fetchUsers, fetchTeamMembers, selectedMatch]);

    const filteredUsers = users.filter(user => user.isConnected || (!user.isConnected && user.teamId));
    const admins = filteredUsers.filter(user => user.role === 'ADMIN');
    const nonAdmins = filteredUsers.filter(user => user.role !== 'ADMIN');

    return (
        <div className="game-page">
            <header className="game-header">
                <h1>CyberSkills</h1>
                <nav>
                    <span className="user-info">
                        Connecté en tant que: {username || 'Inconnu'} ({role || 'Rôle inconnu'})
                    </span>
                    <button
                        onClick={() => {
                            Cookies.remove('token');
                            navigate('/login');
                        }}
                        className="btn btn-modern"
                    >
                        Déconnexion
                    </button>
                </nav>
            </header>
            <main className="game-container">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                {loading && <div className="loading">Chargement...</div>}
                {role === 'ADMIN' ? (
                    <div className="admin-panel">
                        <div className="sidebar">
                            <h3>Utilisateurs ({filteredUsers.length})</h3>
                            <div className="users-list">
                                {filteredUsers.length > 0 ? (
                                    <>
                                        {admins.length > 0 && (
                                            <>
                                                <h4>Administrateurs ({admins.length})</h4>
                                                {admins.map((user) => (
                                                    <div key={user.id} className="user-item">
                                                        <span className={`user-status ${user.isConnected ? 'connected' : 'disconnected'}`}></span>
                                                        <span className="user-username">
                                                            {user.username || 'Inconnu'}
                                                            {user.id === userId && ' (vous)'}
                                                            {!user.isConnected && ' (déconnecté)'}
                                                        </span>
                                                        <div className="user-actions cyber-buttons">
                                                            <button
                                                                onClick={() => handleAssignTeam(user.id, selectedMatch?.redTeamId, selectedMatch?.id)}
                                                                disabled={!selectedMatch || loading}
                                                                className="btn btn-cyber btn-red"
                                                            >
                                                                Équipe Rouge
                                                            </button>
                                                            <button
                                                                onClick={() => handleAssignTeam(user.id, selectedMatch?.blueTeamId, selectedMatch?.id)}
                                                                disabled={!selectedMatch || loading}
                                                                className="btn-cyber btn-blue"
                                                            >
                                                                Équipe Bleue
                                                            </button>
                                                            <button
                                                                onClick={() => handleAssignTeam(user.id, null, selectedMatch?.id)}
                                                                disabled={!selectedMatch || loading}
                                                                className="btn-cyber btn-remove"
                                                            >
                                                                Retirer
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <hr className="role-divider" />
                                            </>
                                        )}
                                        <h4>Joueurs ({nonAdmins.length})</h4>
                                        {nonAdmins.length > 0 ? (
                                            nonAdmins.map((user) => (
                                                <div key={user.id} className="user-item">
                                                    <span className={`user-status ${user.isConnected ? 'connected' : 'disconnected'}`}></span>
                                                    <span className="user-username">
                                                        {user.username || 'Inconnu'}
                                                        {user.id === userId && ' (vous)'}
                                                        {!user.isConnected && ' (déconnecté)'}
                                                    </span>
                                                    <div className="user-actions cyber-buttons">
                                                        <button
                                                            onClick={() => handleAssignTeam(user.id, selectedMatch?.redTeamId, selectedMatch?.id)}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn btn-cyber btn-red"
                                                        >
                                                            Équipe Rouge
                                                        </button>
                                                        <button
                                                            onClick={() => handleAssignTeam(user.id, selectedMatch?.blueTeamId, selectedMatch?.id)}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn-cyber btn-blue"
                                                        >
                                                            Équipe Bleue
                                                        </button>
                                                        <button
                                                            onClick={() => handleAssignTeam(user.id, null, selectedMatch?.id)}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn-cyber btn-remove"
                                                        >
                                                            Retirer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Aucun joueur disponible.</p>
                                        )}
                                    </>
                                ) : (
                                    <p>Aucun utilisateur disponible.</p>
                                )}
                            </div>
                        </div>
                        <div className="main-content">
                            <h2>Administration</h2>
                            <h3 className="selected-match">
                                {selectedMatch ? `Match Sélectionné : ${selectedMatch?.id.slice(0, 8)}` : 'Aucun match sélectionné'}
                            </h3>
                            <div className="admin-controls">
                                <button
                                    onClick={handleCreateMatch}
                                    disabled={loading}
                                    className="btn-modern btn-cyber"
                                >
                                    {loading ? 'Création...' : 'Créer un nouveau match'}
                                </button>
                                <select
                                    value={selectedMatch?.id || ''}
                                    onChange={(e) => {
                                        const match = matches.find((m) => m.id === e.target.value);
                                        setSelectedMatch(match || null);
                                        if (match) localStorage.setItem('selectedGameId', match.id);
                                    }}
                                    className="match-selector"
                                    disabled={loading}
                                >
                                    <option value="">Sélectionner un match</option>
                                    {matches.map((match) => (
                                        <option key={match.id} value={match.id}>
                                            Match {match.id.slice(0, 8)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <h3>Liste des matchs ({matches.length})</h3>
                            <div className="matches-grid">
                                {matches.length > 0 ? (
                                    matches.map((match) => (
                                        <div
                                            key={match.id}
                                            className={`match-card ${selectedMatch?.id === match.id ? 'matched' : ''}`}
                                            onClick={() => {
                                                setSelectedMatch(match);
                                                localStorage.setItem('selectedGameId', match.id);
                                            }}
                                        >
                                            <div className="match-header">
                                                <h4>Match {match.id.slice(0, 8)}</h4>
                                            </div>
                                            <div className="teams">
                                                <div className="team-card red-team">
                                                    <h4>Équipe Rouge ({teamMembersByMatch[match.id]?.redTeam?.length || 0})</h4>
                                                    <ul>
                                                        {teamMembersByMatch[match.id]?.redTeam?.length > 0 ? (
                                                            teamMembersByMatch[match.id].redTeam.map((user) => (
                                                                <li key={user.id}>
                                                                    {user.username}
                                                                    {user.id === userId && ' (vous)'}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Aucun joueur</li>
                                                        )}
                                                    </ul>
                                                </div>
                                                <div className="team-card blue-team">
                                                    <h4>Équipe Bleue ({teamMembersByMatch[match.id]?.blueTeam?.length || 0})</h4>
                                                    <ul>
                                                        {teamMembersByMatch[match.id]?.blueTeam?.length > 0 ? (
                                                            teamMembersByMatch[match.id].blueTeam.map((user) => (
                                                                <li key={user.id}>
                                                                    {user.username}
                                                                    {user.id === userId && ' (vous)'}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Aucun joueur</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="match-actions">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleJoinMatch(match.id);
                                                    }}
                                                    disabled={loading}
                                                    className="btn-modern btn-cyber"
                                                >
                                                    Rejoindre le match
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteMatch(match.id);
                                                    }}
                                                    disabled={loading}
                                                    className="btn-modern btn-delete"
                                                >
                                                    {loading ? 'Suppression...' : 'Supprimer'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucun match disponible.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="user-panel">
                        <h2>Vos matchs</h2>
                        <div className="matches-grid">
                            {matches.length > 0 ? (
                                matches.map((match) => (
                                    <div
                                        key={match.id}
                                        className={`match-card ${selectedMatch?.id === match.id ? 'matched' : ''}`}
                                        onClick={() => {
                                            setSelectedMatch(match);
                                            localStorage.setItem('selectedGameId', match.id);
                                        }}
                                    >
                                        <div className="match-header">
                                            <h4>Match {match.id.slice(0, 8)}</h4>
                                        </div>
                                        <div className="teams">
                                            <div className="team-card red-team">
                                                <h4>Équipe Rouge ({teamMembersByMatch[match.id]?.redTeam?.length || 0})</h4>
                                                <ul>
                                                    {teamMembersByMatch[match.id]?.redTeam?.length > 0 ? (
                                                        teamMembersByMatch[match.id].redTeam.map((user) => (
                                                            <li key={user.id}>
                                                                {user.username}
                                                                {user.id || ' (vous)'}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>Aucun joueur</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <div className="team-card blue-team">
                                                <h4>Équipe Bleue ({teamMembersByMatch[match.id]?.blueTeam?.length || 0})</h4>
                                                <ul>
                                                    {teamMembersByMatch[match.id]?.blueTeam?.length > 0 ? (
                                                        teamMembersByMatch[match.id].blueTeam.map((user) => (
                                                            <li key={user.id}>
                                                                {user.username}
                                                                {user.id === userId && ' (vous)'}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>Aucun joueur</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="match-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleJoinMatch(match.id);
                                                }}
                                                disabled={!canJoinMatch(match.id) || loading}
                                                className="btn-modern btn-cyber"
                                                title={!canJoinMatch(match.id) ? "Vous devez être assigné à une équipe pour rejoindre ce match" : ""}
                                            >
                                                {canJoinMatch(match.id) ? 'Rejoindre le match' : 'Non autorisé'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Aucun match disponible.</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Game;