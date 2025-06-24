import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import './game.css';

// Singleton WebSocket instance
let socketInstance = null;

function getSocket(token) {
    if (!socketInstance || !socketInstance.connected) {
        socketInstance = io('https://cyberskills.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
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

    const fetchMatches = useCallback(async (token) => {
        setLoading(true);
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/list', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
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
        } finally {
            setLoading(false);
        }
    }, [selectedMatch]);

    const fetchTeamMembers = useCallback(async (matchId, token) => {
        if (!matchId) return;
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}/teams`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
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
        }
    }, []);

    const fetchUsers = useCallback(async (token) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
            } else {
                setError(data.message || 'Erreur lors de la récupération des utilisateurs');
            }
        } catch (error) {
            setError('Erreur lors de la récupération des utilisateurs.');
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
            const res = await fetch('https://cyberskills.onrender.com/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la création du match');
            }
        } catch (error) {
            setError('Erreur serveur lors de la création du match.');
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
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la suppression du match');
            }
        } catch (error) {
            setError('Erreur serveur lors de la suppression du match.');
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
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId, teamId, matchId }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            }
        } catch (error) {
            setError(`Erreur lors de l'assignation: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [loading, selectedMatch, navigate]);

    const handleResetGame = useCallback(async (matchId) => {
        if (!matchId || loading) {
            setError('Match non sélectionné ou invalide.');
            return;
        }
        if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser ce match ?')) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            if (!token) {
                setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }
            console.log(`Tentative de réinitialisation du match ${matchId}`);
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'Erreur lors de la réinitialisation du match');
                console.log(`Échec de la réinitialisation: ${data.message}`);
            } else {
                console.log(`Match ${matchId} réinitialisé avec succès`);
                setError('Match réinitialisé. Essayez de lancer à nouveau.');
            }
        } catch (error) {
            setError('Erreur serveur lors de la réinitialisation du match.');
            console.error('Erreur reset:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, navigate]);

    const handleLaunchMatch = useCallback(() => {
        if (!selectedMatch || loading) {
            setError('Veuillez sélectionner un match.');
            return;
        }
        if (!teamMembersByMatch[selectedMatch.id]?.redTeam?.length || !teamMembersByMatch[selectedMatch.id]?.blueTeam?.length) {
            setError('Chaque équipe doit avoir au moins un joueur.');
            return;
        }
        const token = Cookies.get('token');
        if (!token) {
            setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
            navigate('/login');
            return;
        }
        if (socket && socket.connected) {
            console.log('Émission de start-game pour gameId:', selectedMatch.id, 'socketId:', socket.id);
            socket.emit('start-game', { gameId: selectedMatch.id });
            socket.once('error', (data) => {
                console.log('Erreur reçue lors de start-game:', data);
                if (data.message === 'Partie non disponible ou déjà commencée') {
                    setError('Le match est déjà en cours ou terminé. Veuillez cliquer sur "Réinitialiser le match" avant de relancer.');
                } else {
                    setError(data.message || 'Erreur inconnue lors du lancement du match.');
                }
            });
        } else {
            setError('Impossible de lancer le match: non connecté au serveur.');
        }
    }, [selectedMatch, loading, socket, teamMembersByMatch, navigate]);

    const handleJoinMatch = useCallback(() => {
        if (!selectedMatch) {
            setError('Veuillez sélectionner un match.');
            return;
        }
        const token = Cookies.get('token');
        if (!token) {
            setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
            navigate('/login');
            return;
        }
        console.log('Rejoindre le match, navigation vers /attack pour gameId:', selectedMatch.id);
        localStorage.setItem('selectedGameId', selectedMatch.id);
        socket.emit('join-game', { gameId: selectedMatch.id, playerName: username || 'Joueur' });
        navigate('/attack');
    }, [selectedMatch, navigate, socket, username]);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
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
                console.log('Erreur d\'authentification WebSocket:', error);
                setError('Erreur d\'authentification WebSocket: ' + error.message);
                Cookies.remove('token');
                navigate('/login');
            });

            newSocket.on('connect_error', (error) => {
                console.log('Erreur de connexion WebSocket:', error);
                setError('Erreur de connexion au serveur WebSocket: ' + error.message);
            });

            newSocket.on('error', (data) => {
                console.log('Erreur WebSocket reçue:', data);
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
                navigate('/attack');
            });

            newSocket.on('game-reset', ({ matchId }) => {
                console.log('Événement game-reset reçu pour matchId:', matchId);
                setError('Match réinitialisé par le serveur. Essayez de lancer à nouveau.');
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
            console.log('Erreur d\'authentification:', error);
            setError('Erreur d\'authentification, veuillez vous reconnecter.');
            Cookies.remove('token');
            navigate('/login');
        }
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
                                <button
                                    onClick={handleLaunchMatch}
                                    disabled={!selectedMatch || loading}
                                    className="btn-modern btn-cyber"
                                >
                                    Lancer le match
                                </button>
                                <button
                                    onClick={() => handleResetGame(selectedMatch?.id)}
                                    disabled={!selectedMatch || loading}
                                    className="btn-modern btn-cyber btn-reset"
                                >
                                    Réinitialiser le match
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
                                                    handleJoinMatch();
                                                }}
                                                disabled={!selectedMatch || loading}
                                                className="btn-modern btn-cyber"
                                            >
                                                Rejoindre le match
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