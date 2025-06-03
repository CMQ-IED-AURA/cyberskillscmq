import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import './game.css';

function Game() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [redTeamMembers, setRedTeamMembers] = useState([]);
    const [blueTeamMembers, setBlueTeamMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState(null);
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = token.split('.')[1];
            if (!payload) throw new Error('Payload du token manquant');
            const decoded = JSON.parse(atob(payload));
            const exp = decoded.exp * 1000; // Convertir en millisecondes
            if (Date.now() >= exp) {
                console.error('Token expiré');
                Cookies.remove('token');
                navigate('/login');
                return;
            }
            setRole(decoded.role);

            const newSocket = io('https://cyberskills.onrender.com', {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            setSocket(newSocket);

            fetchMatches();
            if (decoded.role === 'ADMIN') {
                fetchUsers();
            }

            newSocket.on('connect', () => {
                console.log('Connecté au WebSocket:', newSocket.id);
                newSocket.emit('authenticate', token);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Erreur de connexion WebSocket:', error.message);
                setError('Erreur de connexion au serveur.');
            });

            newSocket.on('connectedUsers', (connectedUsers) => {
                console.log('Utilisateurs connectés:', connectedUsers);
                if (decoded.role === 'ADMIN') {
                    const validUsers = connectedUsers.filter(user => user.id && user.username);
                    setUsers(validUsers);
                }
            });

            newSocket.on('matchCreated', (newMatch) => {
                console.log('Nouveau match:', newMatch);
                setMatches((prev) => [...prev, newMatch]);
            });

            newSocket.on('matchDeleted', (matchId) => {
                console.log('Match supprimé:', matchId);
                setMatches((prev) => prev.filter((match) => match.id !== matchId));
                if (selectedMatch?.id === matchId) {
                    setSelectedMatch(null);
                    setRedTeamMembers([]);
                    setBlueTeamMembers([]);
                }
            });

            newSocket.on('teamAssigned', ({ matchId, userId, teamId, username }) => {
                console.log('Équipe assignée:', { matchId, userId, teamId, username });
                if (selectedMatch?.id === matchId) {
                    fetchTeamMembers(matchId);
                }
                if (decoded.role === 'ADMIN') {
                    fetchUsers();
                }
            });

            return () => {
                console.log('Déconnexion du WebSocket');
                newSocket.disconnect();
            };
        } catch (error) {
            console.error('Erreur de décodage du token:', error);
            Cookies.remove('token');
            navigate('/login');
        }
    }, [navigate]);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/list', {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                setMatches(data.matches);
                if (data.matches.length > 0 && !selectedMatch) {
                    setSelectedMatch(data.matches[0]);
                    fetchTeamMembers(data.matches[0].id);
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

    const fetchTeamMembers = async (matchId) => {
        if (!matchId) {
            setError('Match non sélectionné ou invalide.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}/teams`, {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                setRedTeamMembers(data.redTeam.users || []);
                setBlueTeamMembers(data.blueTeam.users || []);
            } else {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la récupération des membres');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des membres:', error);
            setError('Erreur serveur lors de la récupération des membres.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/users', {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                const validUsers = data.users.filter(user => user.id && user.username);
                setUsers(validUsers);
                console.log('Utilisateurs récupérés:', validUsers);
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
        setLoading(true);
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la création du match');
            } else {
                setError(null);
            }
        } catch (error) {
            console.error('Erreur lors de la création du match:', error);
            setError('Erreur serveur lors de la création du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMatch = async (matchId) => {
        if (!matchId) {
            setError('Match non sélectionné ou invalide.');
            return;
        }
        setLoading(true);
        try {
            console.log('Suppression du match:', matchId);
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur:', data.message);
                setError(data.message || 'Erreur lors de la suppression du match');
            } else {
                setError(null);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du match:', error);
            setError('Erreur serveur lors de la suppression du match.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeam = async (userId, teamId) => {
        if (!selectedMatch) {
            setError('Veuillez sélectionner un match.');
            return;
        }
        if (!userId) {
            setError('Utilisateur non sélectionné ou invalide.');
            return;
        }
        setLoading(true);
        try {
            const requestBody = { userId, teamId, matchId: selectedMatch.id };
            console.log('Assignation d\'équipe:', requestBody);
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify(requestBody),
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur d\'assignation d\'équipe:', data.message);
                setError(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            } else {
                setError(null);
            }
        } catch (error) {
            console.error('Erreur lors de l\'assignation d\'équipe:', error);
            setError('Erreur serveur lors de l\'assignation de l\'équipe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="game-page">
            <header className="game-header">
                <h1>CyberSkills</h1>
                <nav>
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
                            <h3>Utilisateurs Connectés</h3>
                            <div className="users-list">
                                {users.length > 0 ? (
                                    users.map((user) => {
                                        console.log('Rendu utilisateur:', user);
                                        return (
                                            <div key={user.id} className="user-item">
                                                <span className="user-status"></span>
                                                <span className="user-username">{user.username || 'Inconnu'}</span>
                                                <div className="user-actions">
                                                    <select
                                                        onChange={(e) => {
                                                            const teamId = e.target.value || null;
                                                            handleAssignTeam(user.id, teamId);
                                                        }}
                                                        value=""
                                                        disabled={!selectedMatch || loading}
                                                    >
                                                        <option value="">Retirer de l'équipe</option>
                                                        {selectedMatch && (
                                                            <>
                                                                <option value={selectedMatch.redTeamId}>Équipe Rouge</option>
                                                                <option value={selectedMatch.blueTeamId}>Équipe Bleue</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })
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
                                <button onClick={handleCreateMatch} disabled={loading} className="btn-modern">
                                    Créer un nouveau match
                                </button>
                                <select
                                    value={selectedMatch?.id || ''}
                                    onChange={(e) => {
                                        const match = matches.find((m) => m.id === e.target.value);
                                        setSelectedMatch(match || null);
                                        setRedTeamMembers([]);
                                        setBlueTeamMembers([]);
                                        if (match) fetchTeamMembers(match.id);
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
                            <h3>Liste des matchs</h3>
                            <div className="matches-grid">
                                {matches.length > 0 ? (
                                    matches.map((match) => (
                                        <div
                                            key={match.id}
                                            className={`match-card ${selectedMatch?.id === match.id ? 'matched' : ''}`}
                                            onClick={() => {
                                                setSelectedMatch(match);
                                                setRedTeamMembers([]);
                                                setBlueTeamMembers([]);
                                                fetchTeamMembers(match.id);
                                            }}
                                        >
                                            <div className="match-header">
                                                <h3>Match {match.id.slice(0, 8)}</h3>
                                            </div>
                                            <div className="teams">
                                                <div className="team-card red-team">
                                                    <h4>Équipe Rouge</h4>
                                                    <ul>
                                                        {selectedMatch?.id === match.id && redTeamMembers.length > 0 ? (
                                                            redTeamMembers.map((user) => (
                                                                <li key={user.id}>{user.username}</li>
                                                            ))
                                                        ) : (
                                                            <li>Aucun joueur</li>
                                                        )}
                                                    </ul>
                                                </div>
                                                <div className="team-card blue-team">
                                                    <h4>Équipe Bleue</h4>
                                                    <ul>
                                                        {selectedMatch?.id === match.id && blueTeamMembers.length > 0 ? (
                                                            blueTeamMembers.map((user) => (
                                                                <li key={user.id}>{user.username}</li>
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
                                                    Supprimer
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
                                            fetchTeamMembers(match.id);
                                        }}
                                    >
                                        <div className="match-header">
                                            <h3>Match {match.id.slice(0, 8)}</h3>
                                        </div>
                                        <div className="teams">
                                            <div className="team-card red-team">
                                                <h4>Équipe Rouge</h4>
                                                <ul>
                                                    {selectedMatch?.id === match.id && redTeamMembers.length > 0 ? (
                                                        redTeamMembers.map((user) => (
                                                            <li key={user.id}>{user.username}</li>
                                                        ))
                                                    ) : (
                                                        <li>Aucun joueur</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <div className="team-card blue-team">
                                                <h4>Équipe Bleue</h4>
                                                <ul>
                                                    {selectedMatch?.id === match.id && blueTeamMembers.length > 0 ? (
                                                        blueTeamMembers.map((user) => (
                                                            <li key={user.id}>{user.username}</li>
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