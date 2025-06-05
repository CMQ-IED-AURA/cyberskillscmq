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

            // Debug - Log tous les événements WebSocket
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
            });

            newSocket.on('connect_error', (error) => {
                console.error('Erreur de connexion WebSocket:', error.message);
                setError('Erreur de connexion au serveur WebSocket.');
            });

            newSocket.on('connectedUsers', (connectedUsers) => {
                console.log('Utilisateurs connectés reçus via WebSocket:', connectedUsers);
                if (decoded.role === 'ADMIN') {
                    setUsers(connectedUsers || []);
                }
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

            newSocket.on('teamAssigned', ({ matchId, userId, teamId, username, updatedMatch }) => {
                console.log('Équipe assignée:', { matchId, userId, teamId, username, updatedMatch });

                if (updatedMatch) {
                    setTeamMembersByMatch((prev) => ({
                        ...prev,
                        [matchId]: {
                            redTeam: updatedMatch.redTeam?.users || [],
                            blueTeam: updatedMatch.blueTeam?.users || [],
                        },
                    }));
                } else {
                    fetchTeamMembers(matchId, token);
                }

                if (decoded.role === 'ADMIN') {
                    fetchUsers(token);
                }
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
    }, [navigate]);

    const fetchMatches = async (token) => {
        setLoading(true);
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/list', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                console.log('Matchs récupérés:', data.matches);
                setMatches(data.matches || []);

                // Récupérer les membres des équipes pour chaque match
                for (const match of data.matches) {
                    await fetchTeamMembers(match.id, token);
                }

                // Sélectionner le premier match si aucun n'est sélectionné
                if (data.matches.length > 0 && !selectedMatch) {
                    setSelectedMatch(data.matches[0]);
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
            setError('Erreur serveur lors de la récupération des utilisateurs.');
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
                // Rafraîchir la liste des matchs
                await fetchMatches(token);
            }
        } catch (error) {
            console.error('Erreur lors de la création du match:', error);
            setError('Erreur serveur lors de la création du match.');
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
                // Rafraîchir la liste des matchs
                await fetchMatches(Cookies.get('token'));
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du match:', error);
            setError('Erreur serveur lors de la suppression du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeam = async (userId, teamColor, matchId) => {
        console.log('=== DEBUT handleAssignTeam ===');
        console.log('userId:', userId);
        console.log('teamColor:', teamColor);
        console.log('matchId:', matchId);
        console.log('selectedMatch:', selectedMatch);

        if (!matchId) {
            console.error('matchId manquant');
            setError('Veuillez sélectionner un match.');
            return;
        }
        if (!userId) {
            console.error('userId manquant');
            setError('Utilisateur non sélectionné ou invalide.');
            return;
        }
        if (loading) {
            console.log('Déjà en cours de chargement, abandon');
            return;
        }

        // Trouver le match complet pour obtenir les teamId
        const currentMatch = matches.find(m => m.id === matchId);
        if (!currentMatch) {
            console.error('Match non trouvé dans la liste');
            setError('Match non trouvé.');
            return;
        }

        let teamId = null;
        if (teamColor === 'RED') {
            teamId = currentMatch.redTeamId;
        } else if (teamColor === 'BLUE') {
            teamId = currentMatch.blueTeamId;
        }
        // Si teamColor est null, on laisse teamId à null pour retirer le joueur

        console.log('teamId calculé:', teamId);
        console.log('currentMatch:', currentMatch);

        setLoading(true);
        setError(null);

        try {
            const requestBody = { userId, teamId, matchId };
            console.log('=== REQUETE ENVOYEE ===');
            console.log('Body:', JSON.stringify(requestBody, null, 2));

            const token = Cookies.get('token');
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            console.log('Status de la réponse:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Erreur HTTP:', res.status, errorText);
                throw new Error(`HTTP ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            console.log('=== REPONSE RECUE ===');
            console.log('Réponse complète:', data);

            if (!data.success) {
                console.error('Erreur dans la réponse:', data.message);
                setError(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            } else {
                console.log('✅ Assignation réussie');
                // Rafraîchir les données des équipes
                await fetchTeamMembers(matchId, token);
                if (role === 'ADMIN') {
                    await fetchUsers(token);
                }
            }
        } catch (error) {
            console.error('=== ERREUR CATCH ===');
            console.error('Erreur complète:', error);
            setError(`Erreur lors de l'assignation: ${error.message}`);
        } finally {
            setLoading(false);
            console.log('=== FIN handleAssignTeam ===');
        }
    };

    // Fonction de débogage
    const debugMatchData = () => {
        console.log('=== DEBUG MATCH DATA ===');
        console.log('matches:', matches);
        console.log('selectedMatch:', selectedMatch);
        console.log('teamMembersByMatch:', teamMembersByMatch);

        if (selectedMatch) {
            console.log('selectedMatch détails:');
            console.log('- id:', selectedMatch.id);
            console.log('- redTeamId:', selectedMatch.redTeamId);
            console.log('- blueTeamId:', selectedMatch.blueTeamId);
        }
        console.log('=== FIN DEBUG ===');
    };

    // Filter users by role
    const admins = users.filter(user => user.role === 'ADMIN');
    const nonAdmins = users.filter(user => user.role !== 'ADMIN');

    console.log('État actuel:', {
        role,
        userId,
        username,
        usersCount: users.length,
        adminsCount: admins.length,
        nonAdminsCount: nonAdmins.length,
        selectedMatchId: selectedMatch?.id
    });

    return (
        <div className="game-page">
            <header className="game-header">
                <h1>CyberSkills</h1>
                <nav>
                    <span className="user-info">
                        Connecté en tant que: {username || 'Inconnu'} ({role || 'Rôle inconnu'})
                    </span>
                    {role === 'ADMIN' && (
                        <button onClick={debugMatchData} className="btn-modern" style={{marginRight: '10px'}}>
                            Debug
                        </button>
                    )}
                    <button
                        onClick={() => {
                            Cookies.remove('token');
                            navigate('/');
                        }}
                        className="btn-modern"
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
                            <h3>Utilisateurs Connectés ({users.length})</h3>
                            <div className="users-list">
                                {users.length > 0 ? (
                                    <>
                                        {admins.length > 0 && (
                                            <>
                                                <h4>Administrateurs ({admins.length})</h4>
                                                {admins.map((user) => (
                                                    <div key={user.id} className="user-item">
                                                        <span className="user-status"></span>
                                                        <span className="user-username">
                                                            {user.username || 'Inconnu'}
                                                            {user.id === userId && ' (vous)'}
                                                        </span>
                                                        <div className="user-actions cyber-buttons">
                                                            <button
                                                                onClick={() => {
                                                                    console.log('Clic équipe rouge - Admin');
                                                                    handleAssignTeam(user.id, 'RED', selectedMatch?.id);
                                                                }}
                                                                disabled={!selectedMatch || loading}
                                                                className="btn-cyber btn-red"
                                                            >
                                                                Équipe Rouge
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    console.log('Clic équipe bleue - Admin');
                                                                    handleAssignTeam(user.id, 'BLUE', selectedMatch?.id);
                                                                }}
                                                                disabled={!selectedMatch || loading}
                                                                className="btn-cyber btn-blue"
                                                            >
                                                                Équipe Bleue
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    console.log('Clic retirer - Admin');
                                                                    handleAssignTeam(user.id, null, selectedMatch?.id);
                                                                }}
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
                                                    <span className="user-status"></span>
                                                    <span className="user-username">
                                                        {user.username || 'Inconnu'}
                                                        {user.id === userId && ' (vous)'}
                                                    </span>
                                                    <div className="user-actions cyber-buttons">
                                                        <button
                                                            onClick={() => {
                                                                console.log('Clic équipe rouge - Joueur');
                                                                handleAssignTeam(user.id, 'RED', selectedMatch?.id);
                                                            }}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn-cyber btn-red"
                                                        >
                                                            Équipe Rouge
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                console.log('Clic équipe bleue - Joueur');
                                                                handleAssignTeam(user.id, 'BLUE', selectedMatch?.id);
                                                            }}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn-cyber btn-blue"
                                                        >
                                                            Équipe Bleue
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                console.log('Clic retirer - Joueur');
                                                                handleAssignTeam(user.id, null, selectedMatch?.id);
                                                            }}
                                                            disabled={!selectedMatch || loading}
                                                            className="btn-cyber btn-remove"
                                                        >
                                                            Retirer
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Aucun joueur connecté.</p>
                                        )}
                                    </>
                                ) : (
                                    <p>Aucun utilisateur connecté.</p>
                                )}
                            </div>
                        </div>
                        <div className="main-content">
                            <h2>Administration</h2>
                            <h3 className="selected-match">
                                {selectedMatch ? `Match Sélectionné : ${selectedMatch.id.slice(0, 8)}` : 'Aucun match sélectionné'}
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
                                        console.log('Match sélectionné:', match);
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
                                                console.log('Match sélectionné par clic:', match);
                                            }}
                                        >
                                            <div className="match-header">
                                                <h3>Match {match.id.slice(0, 8)}</h3>
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
                                                    className="btn-modern btn-delete"
                                                    disabled={loading}
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
                                            <h3>Match {match.id.slice(0, 8)}</h3>
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