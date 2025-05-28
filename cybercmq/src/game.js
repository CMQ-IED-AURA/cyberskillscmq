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

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Décoder le token pour obtenir le rôle
        try {
            const payload = token.split('.')[1];
            if (!payload) throw new Error('Payload du token manquant');
            const decoded = JSON.parse(atob(payload));
            setRole(decoded.role);

            // Initialize Socket.IO with error handling
            const newSocket = io('https://cyberskills.onrender.com', {
                auth: { token },
                transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
            });
            setSocket(newSocket);

            // Fetch initial data
            fetchMatches();
            if (decoded.role === 'ADMIN') {
                fetchUsers();
            }

            // Socket.IO event listeners
            newSocket.on('connect', () => {
                console.log('Connected to WebSocket:', newSocket.id);
                newSocket.emit('authenticate', token);
            });

            newSocket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error.message);
            });

            newSocket.on('connectedUsers', (connectedUsers) => {
                console.log('Received connected users:', connectedUsers);
                if (decoded.role === 'ADMIN') {
                    setUsers(connectedUsers);
                }
            });

            newSocket.on('matchCreated', (newMatch) => {
                console.log('New match created:', newMatch);
                setMatches((prev) => [...prev, newMatch]);
            });

            newSocket.on('matchDeleted', (matchId) => {
                console.log('Match deleted:', matchId);
                setMatches((prev) => prev.filter((match) => match.id !== matchId));
                if (selectedMatch?.id === matchId) {
                    setSelectedMatch(null);
                    setRedTeamMembers([]);
                    setBlueTeamMembers([]);
                }
            });

            newSocket.on('teamAssigned', ({ matchId, userId, teamId }) => {
                console.log('Team assigned:', { matchId, userId, teamId });
                if (selectedMatch?.id === matchId) {
                    fetchTeamMembers(matchId);
                }
                if (decoded.role === 'ADMIN') {
                    fetchUsers();
                }
            });

            return () => {
                console.log('Disconnecting WebSocket');
                newSocket.disconnect();
            };
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            Cookies.remove('token');
            navigate('/login');
        }
    }, [navigate]);

    const fetchMatches = async () => {
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
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des matchs:', error);
        }
    };

    const fetchTeamMembers = async (matchId) => {
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
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des membres:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/users', {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            } else {
                console.error('Erreur serveur:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
        }
    };

    const handleCreateMatch = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Erreur lors de la création du match');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la création du match');
        }
    };

    const handleDeleteMatch = async (matchId) => {
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Erreur serveur:', data.message, data.error);
                alert(data.message || 'Erreur lors de la suppression du match');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du match:', error);
            alert('Erreur lors de la suppression du match');
        }
    };

    const handleAssignTeam = async (userId, teamId) => {
        if (!selectedMatch) {
            alert('Veuillez sélectionner un match.');
            return;
        }
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}` },
                body: JSON.stringify({ userId, teamId, matchId: selectedMatch.id }),
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Erreur lors de l\'assignation de l\'équipe');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'assignation de l\'équipe');
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
                {role === 'ADMIN' ? (
                    <div className="admin-panel">
                        <div className="sidebar">
                            <h3>Utilisateurs Connectés</h3>
                            <div className="users-list">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <div key={user.id} className="user-item">
                                            <span className="user-status"></span>
                                            <span>{user.username}</span>
                                            <div className="user-actions">
                                                <select
                                                    onChange={(e) => {
                                                        const teamId = e.target.value ? e.target.value : null;
                                                        handleAssignTeam(user.id, teamId);
                                                    }}
                                                    defaultValue=""
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
                                    ))
                                ) : (
                                    <p>Aucun utilisateur connecté.</p>
                                )}
                            </div>
                        </div>
                        <div className="main-content">
                            <h2>Administration</h2>
                            <div className="admin-controls">
                                <button onClick={handleCreateMatch} className="btn-modern">
                                    Créer un nouveau match
                                </button>
                                <select
                                    value={selectedMatch?.id || ''}
                                    onChange={(e) => {
                                        const match = matches.find((m) => m.id === e.target.value);
                                        setSelectedMatch(match || null);
                                        if (match) fetchTeamMembers(match.id);
                                    }}
                                    className="match-selector"
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
                                                        {selectedMatch?.id === match.id &&
                                                        redTeamMembers.length > 0 ? (
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
                                                        {selectedMatch?.id === match.id &&
                                                        blueTeamMembers.length > 0 ? (
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
                                                    {selectedMatch?.id === match.id &&
                                                    redTeamMembers.length > 0 ? (
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
                                                    {selectedMatch?.id === match.id &&
                                                    blueTeamMembers.length > 0 ? (
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