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
});

function Game() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [redTeamMembers, setRedTeamMembers] = useState([]);
    const [blueTeamMembers, setBlueTeamMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [role, setRole] = useState(null);
    const [selectedMatchId, setSelectedMatchId] = useState('');

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
            socket.emit('authenticate', token);
            if (decoded.role === 'ADMIN') {
                socket.emit('join-admin', token);
                fetchUsers();
            }
            fetchMatches();
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            Cookies.remove('token');
            navigate('/login');
        }

        // Écouter les mises à jour en temps réel
        socket.on('match-created', (match) => {
            setMatches((prev) => [...prev, match]);
            if (!selectedMatchId) setSelectedMatchId(match.id);
        });

        socket.on('match-deleted', (matchId) => {
            setMatches((prev) => prev.filter((m) => m.id !== matchId));
            if (selectedMatch?.id === matchId) {
                setSelectedMatch(null);
                setRedTeamMembers([]);
                setBlueTeamMembers([]);
            }
            if (selectedMatchId === matchId) setSelectedMatchId('');
        });

        socket.on('match-updated', (updatedMatch) => {
            setMatches((prev) =>
                prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
            );
            if (selectedMatch?.id === updatedMatch.id) {
                setSelectedMatch(updatedMatch);
                setRedTeamMembers(updatedMatch.redTeam.users || []);
                setBlueTeamMembers(updatedMatch.blueTeam.users || []);
            }
        });

        socket.on('connected-users', (users) => {
            setConnectedUsers(users);
        });

        return () => {
            socket.off('match-created');
            socket.off('match-deleted');
            socket.off('match-updated');
            socket.off('connected-users');
        };
    }, [navigate, selectedMatch, selectedMatchId]);

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
                    setSelectedMatchId(data.matches[0].id);
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
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
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
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
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
        if (!selectedMatchId) {
            alert('Veuillez sélectionner un match');
            return;
        }
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify({ userId, teamId }),
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
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
                <nav className="nav">
                    <button
                        onClick={() => {
                            Cookies.remove('token');
                            navigate('/');
                        }}
                        className="btn-modern"
                    >
                        <FaSignOutAlt /> Déconnexion
                    </button>
                </nav>
            </header>
            <div className="main-container">
                {role === 'ADMIN' && (
                    <aside className="sidebar">
                        <h2>Utilisateurs Connectés</h2>
                        <div className="match-selector">
                            <label htmlFor="match-select">Sélectionner un match :</label>
                            <select
                                id="match-select"
                                value={selectedMatchId}
                                onChange={(e) => setSelectedMatchId(e.target.value)}
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
                                        <span className="user-icon">
                                            {user.role === 'ADMIN' ? <FaStar /> : <FaUser />}
                                        </span>
                                        <span className="user-name">{user.username}</span>
                                        {selectedMatchId && (
                                            <div className="user-actions">
                                                <button
                                                    onClick={() => {
                                                        const match = matches.find((m) => m.id === selectedMatchId);
                                                        handleAssignTeam(user.userId, match.redTeamId);
                                                    }}
                                                    className="btn-modern btn-accent btn-small"
                                                >
                                                    Rouge
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const match = matches.find((m) => m.id === selectedMatchId);
                                                        handleAssignTeam(user.userId, match.blueTeamId);
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
                                <p>Aucun utilisateur connecté.</p>
                            )}
                        </div>
                        <button onClick={handleCreateMatch} className="btn-modern" style={{ marginTop: '1rem' }}>
                            Créer un nouveau match
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
                                        fetchTeamMembers(match.id);
                                    }}
                                >
                                    <div className="match-header">
                                        <h3>Match {match.id.slice(0, 8)}</h3>
                                        {role === 'ADMIN' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMatch(match.id);
                                                }}
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
                                                    redTeamMembers.map((user) => (
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
                </main>
            </div>
        </div>
    );
}

export default Game;