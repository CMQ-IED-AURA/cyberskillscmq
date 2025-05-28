import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import { FaUser, FaStar, FaSignOutAlt } from 'react-icons/fa';
import './styles.css';

const socket = io('https://cyberskills.onrender.com', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
    withCredentials: true,
});

function Game() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [redTeamMembers, setRedTeamMembers] = useState([]);
    const [blueTeamMembers, setBlueTeamMembers] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [role, setRole] = useState(null);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            setRole(decoded.role);
            socket.emit('authenticate', token);
            if (decoded.role === 'ADMIN') {
                socket.emit('join-admin', token);
            }
            fetchMatches();
        } catch (err) {
            console.error('Erreur décodage token:', err);
            setError('Session invalide');
            Cookies.remove('token');
            navigate('/login');
        }

        socket.on('connect', () => {
            console.log('Connecté à Socket.IO');
        });

        socket.on('connect_error', (err) => {
            console.error('Erreur connexion Socket.IO:', err.message);
            setError('Erreur de connexion au serveur');
        });

        socket.on('match-created', (match) => {
            console.log('Match créé:', match.id);
            setMatches((prev) => [...prev, match]);
            if (!selectedMatchId) {
                setSelectedMatchId(match.id);
                setSelectedMatch(match);
                fetchTeamMembers(match.id);
            }
        });

        socket.on('match-deleted', (matchId) => {
            console.log('Match supprimé:', matchId);
            setMatches((prev) => prev.filter((m) => m.id !== matchId));
            if (selectedMatch?.id === matchId) {
                setSelectedMatch(null);
                setRedTeamMembers([]);
                setBlueTeamMembers([]);
                setSelectedMatchId('');
            }
        });

        socket.on('match-updated', (updatedMatch) => {
            console.log('Match mis à jour:', updatedMatch?.id);
            setMatches((prev) =>
                prev.map((m) => (m.id === updatedMatch?.id ? updatedMatch : m))
            );
            if (selectedMatch?.id === updatedMatch?.id) {
                setSelectedMatch(updatedMatch);
                setRedTeamMembers(updatedMatch.redTeam?.users || []);
                setBlueTeamMembers(updatedMatch.blueTeam?.users || []);
            }
        });

        socket.on('connected-users', (users) => {
            console.log('Utilisateurs connectés:', users);
            setConnectedUsers(users);
        });

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('match-created');
            socket.off('match-deleted');
            socket.off('match-updated');
            socket.off('connected-users');
        };
    }, [navigate, selectedMatch, selectedMatchId]);

    const fetchMatches = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/list', {
                headers: { Authorization: `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                setMatches(data.matches);
                if (data.matches.length > 0 && !selectedMatch) {
                    setSelectedMatch(data.matches[0]);
                    setSelectedMatchId(data.matches[0].id);
                    fetchTeamMembers(data.matches[0].id);
                }
            } else {
                setError(data.error || 'Erreur récupération matchs');
            }
        } catch (err) {
            console.error('Erreur fetchMatches:', err);
            setError('Erreur réseau');
        }
    };

    const fetchTeamMembers = async (matchId) => {
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}/teams`, {
                headers: { Authorization: `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                setRedTeamMembers(data.redTeam?.users || []);
                setBlueTeamMembers(data.blueTeam?.users || []);
            } else {
                setError(data.error || 'Erreur récupération équipes');
            }
        } catch (err) {
            console.error('Erreur fetchTeamMembers:', err);
            setError('Erreur réseau');
        }
    };

    const handleCreateMatch = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Cookies.get('token')}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Erreur création match');
            }
        } catch (err) {
            console.error('Erreur handleCreateMatch:', err);
            setError('Erreur réseau');
        }
    };

    const handleDeleteMatch = async (matchId, e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Erreur suppression match');
            }
        } catch (err) {
            console.error('Erreur handleDeleteMatch:', err);
            setError('Erreur réseau');
        }
    };

    const handleAssignTeam = async (userId, teamId) => {
        if (!selectedMatchId) {
            setError('Veuillez sélectionner un match');
            return;
        }
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify({ userId, teamId }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Erreur assignation équipe');
            }
        } catch (err) {
            console.error('Erreur handleAssignTeam:', err);
            setError('Erreur réseau');
        }
    };

    return (
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
                <nav className="nav">
                    <button
                        onClick={() => {
                            Cookies.remove('token');
                            navigate('/login');
                        }}
                        className="btn-modern"
                    >
                        <FaSignOutAlt /> Déconnexion
                    </button>
                </nav>
            </header>
            {error && <div className="error-message">{error}</div>}
            <div className="main-container">
                {role === 'ADMIN' && (
                    <aside className="sidebar">
                        <h2>Utilisateurs Connectés</h2>
                        <div className="match-selector">
                            <label htmlFor="match-select">Sélectionner un match :</label>
                            <select
                                id="match-select"
                                value={selectedMatchId}
                                onChange={(e) => {
                                    setSelectedMatchId(e.target.value);
                                    const match = matches.find((m) => m.id === e.target.value);
                                    if (match) {
                                        setSelectedMatch(match);
                                        fetchTeamMembers(match.id);
                                    } else {
                                        setSelectedMatch(null);
                                        setRedTeamMembers([]);
                                        setBlueTeamMembers([]);
                                    }
                                }}
                            >
                                <option value="">Choisir un match</option>
                                {matches.map((match) => (
                                    <option key={match.id} value={match.id}>
                                        Match {match.id.slice(0, 8)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="connected-users">
                            {connectedUsers.length > 0 ? (
                                connectedUsers.map((user) => (
                                    <div
                                        key={user.userId}
                                        className={`connected-user-card ${user.role === 'ADMIN' ? 'admin-user' : ''}`}
                                    >
                                        <div className="user-info">
                                            <span className="user-icon">
                                                {user.role === 'ADMIN' ? <FaStar /> : <FaUser />}
                                            </span>
                                            <span className="user-name">{user.username}</span>
                                        </div>
                                        {selectedMatchId && (
                                            <div className="user-actions">
                                                <button
                                                    onClick={() => {
                                                        const match = matches.find((m) => m.id === selectedMatchId);
                                                        handleAssignTeam(user.userId, match?.redTeamId);
                                                    }}
                                                    className="btn-modern btn-accent btn-small"
                                                >
                                                    Rouge
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const match = matches.find((m) => m.id === selectedMatchId);
                                                        handleAssignTeam(user.userId, match?.blueTeamId);
                                                    }}
                                                    className="btn-modern btn-accent btn-small"
                                                >
                                                    Bleue
                                                </button>
                                                <button
                                                    onClick={() => handleAssignTeam(user.userId, null)}
                                                    className="btn-modern btn-delete btn-small"
                                                >
                                                    Retirer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>Aucun utilisateur connecté</p>
                            )}
                        </div>
                        <button onClick={handleCreateMatch} className="btn-modern">
                            Créer un match
                        </button>
                    </aside>
                )}
                <main className="container">
                    <h2>{role === 'ADMIN' ? 'Administration' : 'Vos matchs'}</h2>
                    <div className="matches-container">
                        {matches.length > 0 ? (
                            matches.map((match) => (
                                <div
                                    key={match.id}
                                    className={`match-card ${selectedMatch?.id === match.id ? 'matched' : ''}`}
                                    onClick={() => {
                                        setSelectedMatch(match);
                                        setSelectedMatchId(match.id);
                                        fetchTeamMembers(match.id);
                                    }}
                                >
                                    <div className="match-header">
                                        <h3>Match {match.id.slice(0, 8)}</h3>
                                        {role === 'ADMIN' && (
                                            <button
                                                onClick={(e) => handleDeleteMatch(match.id, e)}
                                                className="btn-modern btn-delete"
                                            >
                                                Supprimer
                                            </button>
                                        )}
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
                            <p>Aucun match disponible</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Game;