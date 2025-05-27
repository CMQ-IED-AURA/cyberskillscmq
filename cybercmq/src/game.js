import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './styles.css';

function Game() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [redTeamMembers, setRedTeamMembers] = useState([]);
    const [blueTeamMembers, setBlueTeamMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState(null);

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
            fetchMatches();
            if (decoded.role === 'ADMIN') {
                fetchUsers();
            }
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
            if (data.success) {
                fetchMatches();
            } else {
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
            if (data.success) {
                setSelectedMatch(null);
                setRedTeamMembers([]);
                setBlueTeamMembers([]);
                fetchMatches();
            } else {
                console.error('Erreur serveur:', data.message, data.error);
                alert(data.message || 'Erreur lors de la suppression du match');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du match:', error);
            alert('Erreur lors de la suppression du match');
        }
    };

    const handleAssignTeam = async (userId, teamId) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/assign-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}` },
                body: JSON.stringify({ userId, teamId }),
            });
            const data = await res.json();
            if (data.success) {
                fetchTeamMembers(selectedMatch.id);
                fetchUsers();
            } else {
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
            <main className="container">
                {role === 'ADMIN' ? (
                    <>
                        <h2>Administration</h2>
                        <button onClick={handleCreateMatch} className="btn-modern" style={{ marginBottom: '2rem' }}>
                            Créer un nouveau match
                        </button>
                        <h3>Liste des utilisateurs</h3>
                        <div className="users-container">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <div key={user.id} className="user-card">
                                        <p>{user.username} ({user.role})</p>
                                        <p>Équipe actuelle: {user.teamId ? `ID ${user.teamId.slice(0, 8)}` : 'Aucune'}</p>
                                        {selectedMatch && (
                                            <div>
                                                <button
                                                    onClick={() => handleAssignTeam(user.id, selectedMatch.redTeamId)}
                                                    className="btn-modern btn-accent"
                                                >
                                                    Placer dans Équipe Rouge
                                                </button>
                                                <button
                                                    onClick={() => handleAssignTeam(user.id, selectedMatch.blueTeamId)}
                                                    className="btn-modern btn-accent"
                                                >
                                                    Placer dans Équipe Bleue
                                                </button>
                                                <button
                                                    onClick={() => handleAssignTeam(user.id, null)}
                                                    className="btn-modern btn-delete"
                                                >
                                                    Retirer de l'équipe
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>Aucun utilisateur.</p>
                            )}
                        </div>
                        <h2>Liste des matchs</h2>
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
                    </>
                ) : (
                    <>
                        <h2>Vos matchs</h2>
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
                    </>
                )}
            </main>
        </div>
    );
}

export default Game;