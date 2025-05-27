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

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchMatches();
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

    const handleJoinTeam = async (teamId, color) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}` },
                body: JSON.stringify({ matchId: selectedMatch.id, teamId }),
            });
            const data = await res.json();
            if (data.success) {
                fetchTeamMembers(selectedMatch.id);
            } else {
                alert(data.message || 'Erreur lors de la jointure de l\'équipe');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la jointure de l\'équipe');
        }
    };

    const handleLeaveTeam = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/leave-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}` },
            });
            const data = await res.json();
            if (data.success) {
                fetchTeamMembers(selectedMatch.id);
            } else {
                alert(data.message || 'Erreur lors de la sortie de l\'équipe');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la sortie de l\'équipe');
        }
    };

    const handleDeleteMatch = async (matchId) => {
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
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
                <h2>Liste des matchs</h2>
                <button onClick={handleCreateMatch} className="btn-modern" style={{ marginBottom: '2rem' }}>
                    Créer un nouveau match
                </button>
                <div className="matches-container">
                    {matches.length > 0 ? (
                        matches.map((match) => (
                            <div
                                key={match.id}
                                className={`match-card ${selectedMatch?.id === match.id ? 'selected' : ''}`}
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
                                                <li>Aucun membre</li>
                                            )}
                                        </ul>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJoinTeam(match.redTeamId, 'red');
                                            }}
                                            className="btn-modern"
                                        >
                                            Rejoindre
                                        </button>
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
                                                <li>Aucun membre</li>
                                            )}
                                        </ul>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJoinTeam(match.blueTeamId, 'blue');
                                            }}
                                            className="btn-modern"
                                        >
                                            Rejoindre
                                        </button>
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
                {selectedMatch && (
                    <button onClick={handleLeaveTeam} className="btn-modern" style={{ marginTop: '1rem' }}>
                        Quitter l'équipe
                    </button>
                )}
            </main>
        </div>
    );
}

export default Game;