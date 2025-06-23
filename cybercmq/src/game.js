import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import './game.css';

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

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            console.error('Aucun token trouvé, redirection vers login.');
            navigate('/login');
            return;
        }

        try {
            const payload = token.split('.')[1];
            if (!payload) throw new Error('Payload du token manquant.');
            const decoded = JSON.parse(atob(payload));
            const exp = decoded.exp * 1000;
            if (Date.now() >= exp) {
                console.error('Token expiré, redirection vers login.');
                Cookies.remove('token');
                navigate('/login');
                return;
            }

            console.log('Token décodé:', decoded);
            setRole(decoded.role);
            setUserId(decoded.userId);
            setUsername(decoded.username);

            const newSocket = io('https://cyberskills.onrender.com', {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            setSocket(newSocket);

            newSocket.onAny((eventName, ...args) => {
                console.log('Événement WebSocket reçu:', eventName, args);
            });

            fetchMatches(token);
            if (decoded.role === 'ADMIN') {
                fetchUsers(token);
            }

            newSocket.on('connect', () => {
                console.log('Connecté au WebSocket:', newSocket.id);
                newSocket.emit('authenticate', token);
            });

            newSocket.on('authenticated', (data) => {
                console.log('Authentification WebSocket réussie:', data);
            });

            newSocket.on('authError', (error) => {
                console.error('Erreur d\'authentification WebSocket:', error);
                setError('Erreur d\'authentification WebSocket.');
                Cookies.remove('token');
                navigate('/login');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Erreur de connexion WebSocket:', error.message);
                setError('Erreur de connexion au serveur WebSocket.');
            });

            newSocket.on('connectedUsers', (connectedUsers) => {
                console.log('Utilisateurs reçus via WebSocket:', connectedUsers);
                setUsers(connectedUsers || []);
            });

            newSocket.on('matchCreated', (newMatch) => {
                console.log('Nouveau match créé:', newMatch);
                setMatches((prev) => [...prev, newMatch]);
                fetchTeamMembers(newMatch.id, token);
            });

            newSocket.on('matchDeleted', (data) => {
                console.log('Match supprimé:', data);
                const matchId = data.matchId || data;
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

            newSocket.on('matchUpdated', (updatedMatch) => {
                console.log('Match mis à jour:', updatedMatch);
                setMatches((prev) =>
                    prev.map((match) => (match.id === updatedMatch.id ? updatedMatch : match))
                );
                if (selectedMatch?.id === updatedMatch.id) {
                    setSelectedMatch(updatedMatch);
                }
                fetchTeamMembers(updatedMatch.id, token);
            });

            newSocket.on('teamAssigned', ({ matchId, userId, teamId, username, updatedMatch }) => {
                console.log('Événement teamAssigned reçu:', { matchId, userId, teamId, username, updatedMatch });
                setTeamMembersByMatch((prev) => ({
                    ...prev,
                    [matchId]: {
                        redTeam: updatedMatch.redTeam?.users || [],
                        blueTeam: updatedMatch.blueTeam?.users || [],
                    },
                }));
            });

            newSocket.on('teamsUpdated', ({ matchId, redTeam, blueTeam }) => {
                console.log('Équipes mises à jour:', { matchId, redTeam, blueTeam });
                setTeamMembersByMatch((prev) => ({
                    ...prev,
                    [matchId]: {
                        redTeam: redTeam || [],
                        blueTeam: blueTeam || [],
                    },
                }));
            });

            newSocket.on('start-game', ({ matchId, gameId }) => {
                console.log('Démarrage du jeu reçu:', { matchId, gameId });
                // Vérifier si l'utilisateur est dans le match
                const match = matches.find(m => m.id === matchId);
                if (match) {
                    const isInMatch = [
                        ...match.redTeam.users,
                        ...match.blueTeam.users
                    ].some(user => user.id === userId);
                    if (isInMatch) {
                        console.log('Redirection vers le jeu:', `/gameplay?gameId=${gameId}`);
                        navigate(`/gameplay?gameId=${gameId}`);
                    }
                }
            });

            return () => {
                console.log('Déconnexion du WebSocket');
                newSocket.disconnect();
            };
        } catch (error) {
            console.error('Erreur de décodage du token:', error.message);
            setError('Erreur d\'authentification, veuillez vous reconnecter.');
            Cookies.remove('token');
            navigate('/login');
        }
    }, [navigate, userId, matches, selectedMatch]);

    const fetchMatches = async (token) => {
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
                    console.log('Premier match sélectionné automatiquement:', data.matches[0].id);
                }
            } else {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la récupération des matchs');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des matchs:', error);
            setError('Erreur serveur lors de la récupération des matchs.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async (matchId, token) => {
        if (!matchId) {
            console.error('Match ID invalide:', matchId);
            return;
        }
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
                console.log('Membres des équipes récupérés pour match:', matchId, {
                    redTeam: data.redTeam?.users,
                    blueTeam: data.blueTeam?.users,
                });
            } else {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la récupération des membres');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des membres pour match:', matchId, error);
            setError('Erreur serveur lors de la récupération des membres.');
        }
    };

    const fetchUsers = async (token) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                console.log('Utilisateurs récupérés via API:', data.users);
                setUsers(data.users || []);
            } else {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la récupération des utilisateurs');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            setError('Erreur lors de la récupération des utilisateurs.');
        }
    };

    const handleCreateMatch = async () => {
        if (loading) return;

        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('token');
            const res = await fetch('https://cyberskills.onrender.com/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la création du match');
            } else {
                console.log('Match créé avec succès:', data.matchId);
            }
        } catch (error) {
            console.error('Erreur lors de la création du match:', error);
            setError('Erreur serveur lors de la création du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartMatch = async (matchId) => {
        if (!matchId || loading) {
            setError('Match non sélectionné ou invalide.');
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir démarrer ce match ?')) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Tentative de démarrage du match:', matchId);
            const token = Cookies.get('token');
            const res = await fetch('https://cyberskills.onrender.com/match/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ matchId }),
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur lors du démarrage:', data.message);
                setError(data.message || 'Erreur lors du démarrage du match');
            } else {
                console.log('Match démarré avec succès:', matchId);
            }
        } catch (error) {
            console.error('Erreur lors du démarrage du match:', error);
            setError('Erreur serveur lors du démarrage du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (matchId) => {
        if (!matchId || loading) {
            setError('Match non sélectionné ou invalide.');
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Tentative de suppression du match:', matchId);
            const token = Cookies.get('token');
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur lors de la suppression:', data.message);
                setError(data.message || 'Erreur lors de la suppression du match');
            } else {
                console.log('Match supprimé avec succès:', matchId);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du match:', error);
            setError('Erreur serveur lors de la suppression du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeam = async (userId, teamId, matchId) => {
        if (!matchId || !selectedMatch?.id) {
            setError('Veuillez sélectionner un match valide.');
            return;
        }
        if (!userId) {
            setError('Utilisateur non sélectionné ou invalide.');
            return;
        }
        if (teamId && teamId !== selectedMatch?.redTeamId && teamId !== selectedMatch?.blueTeamId) {
            setError('Équipe invalide pour ce match.');
            return;
        }
        if (loading) return;

        console.log('Tentative d\'assignation:', { userId, teamId, matchId, selectedMatch });

        setLoading(true);
        setError(null);

        try {
            const requestBody = { userId, teamId, matchId };
            console.log('Assignation d\'équipe - requête:', requestBody);
            const token = Cookies.get('token');
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log('Réponse assign-team:', data);

            if (!data.success) {
                console.error('Erreur d\'assignation d\'équipe:', data.message);
                setError(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            } else {
                console.log('Utilisateur assigné avec succès:', { userId, teamId, matchId });
            }
        } catch (error) {
            console.error('Erreur lors de l\'assignation d\'équipe:', error);
            setError(`Erreur lors de l'assignation: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les utilisateurs pour n'afficher que :
    // - Les utilisateurs connectés (isConnected: true)
    // - Les utilisateurs déconnectés (isConnected: false) qui sont dans une équipe (teamId non null)
    const filteredUsers = users.filter(user => user.isConnected || (!user.isConnected && user.teamId));
    const admins = filteredUsers.filter(user => user.role === 'ADMIN');
    const nonAdmins = filteredUsers.filter(user => user.role !== 'ADMIN');

    console.log('État actuel:', {
        role,
        userId,
        username,
        totalUsers: users.length,
        filteredUsers: filteredUsers.length,
        adminsCount: admins.length,
        nonAdminsCount: nonAdmins.length,
        users: filteredUsers.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            isConnected: u.isConnected,
            teamId: u.teamId
        }))
    });

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
                {error && <div className="error-message">{error}</div>}
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
                                {selectedMatch ? `Match Sélectionné : ${selectedMatch?.id.slice(0, 8)} (${selectedMatch.status})` : 'Aucun match sélectionné'}
                            </h3>
                            <div className="admin-controls">
                                <button
                                    onClick={handleCreateMatch}
                                    disabled={loading}
                                    className="btn-modern btn-cyber"
                                >
                                    {loading ? 'Création...' : 'Créer un nouveau match'}
                                </button>
                                {selectedMatch && selectedMatch.status === 'waiting' && (
                                    <button
                                        onClick={() => handleStartMatch(selectedMatch.id)}
                                        disabled={loading || (teamMembersByMatch[selectedMatch.id]?.redTeam?.length !== 3 || teamMembersByMatch[selectedMatch.id]?.blueTeam?.length !== 3)}
                                        className="btn-modern btn-cyber btn-start"
                                    >
                                        {loading ? 'Démarrage...' : 'Démarrer le match'}
                                    </button>
                                )}
                                <select
                                    value={selectedMatch?.id || ''}
                                    onChange={(e) => {
                                        const match = matches.find((m) => m.id === e.target.value);
                                        setSelectedMatch(match || null);
                                    }}
                                    className="match-selector"
                                    disabled={loading}
                                >
                                    <option value="">Sélectionner un match</option>
                                    {matches.map((match) => (
                                        <option key={match.id} value={match.id}>
                                            Match {match.id.slice(0, 8)} ({match.status})
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
                                            }}
                                        >
                                            <div className="match-header">
                                                <h4>Match {match.id.slice(0, 8)} ({match.status})</h4>
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
                                        }}
                                    >
                                        <div className="match-header">
                                            <h4>Match {match.id.slice(0, 8)} ({match.status})</h4>
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