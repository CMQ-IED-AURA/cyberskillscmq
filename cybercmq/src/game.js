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
            // Récupérer la liste des matchs
            fetchMatches();
        }
    }, [navigate]);

    const fetchMatches = async () => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/list', {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                setMatches(data.matches);
                if (data.matches.length > 0) {
                    setSelectedMatch(data.matches[0]);
                    fetchTeamMembers(data.matches[0].id);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des matchs:', error);
        }
    };

    const fetchTeamMembers = async (matchId) => {
        try {
            const res = await fetch(`https://cyberskills.onrender.com/match/${matchId}/teams`, {
                headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                setRedTeamMembers(data.redTeam.users);
                setBlueTeamMembers(data.blueTeam.users);
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
                    'Authorization': `Bearer ${Cookies.get('token')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                fetchMatches();
            } else {
                alert(data.message || 'Erreur lors de la création du match');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleJoinTeam = async (teamId, color) => {
        try {
            const res = await fetch('https://cyberskills.onrender.com/match/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`
                },
                body: JSON.stringify({ matchId: selectedMatch.id, teamId })
            });
            const data = await res.json();
            if (data.success) {
                fetchTeamMembers(selectedMatch.id);
            } else {
                alert(data.message || 'Erreur lors de la jointure de l\'équipe');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    return (
        <div className="page">
            <header className="header">
                <h1>CyberSkills</h1>
                <nav>
                    <button onClick={() => {
                        Cookies.remove('token');
                        navigate('/');
                    }} className="btn-modern">Déconnexion</button>
                </nav>
            </header>
            <main className="container">
                <h2>Choix des équipes</h2>
                <button onClick={handleCreateMatch} className="btn-modern" style={{ marginBottom: '1rem' }}>
                    Créer un nouveau match
                </button>
                {matches.length > 0 && (
                    <select
                        value={selectedMatch?.id}
                        onChange={(e) => {
                            const match = matches.find(m => m.id === e.target.value);
                            setSelectedMatch(match);
                            fetchTeamMembers(match.id);
                        }}
                    >
                        {matches.map(match => (
                            <option key={match.id} value={match.id}>
                                Match {match.id.slice(0, 8)}
                            </option>
                        ))}
                    </select>
                )}
                {selectedMatch && (
                    <div className="teams">
                        <div className="team-card red-team">
                            <h3>Équipe Rouge</h3>
                            <ul>
                                {redTeamMembers.map(user => (
                                    <li key={user.id}>{user.username}</li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleJoinTeam(selectedMatch.redTeamId, 'red')}
                                className="btn-modern"
                            >
                                Rejoindre
                            </button>
                        </div>
                        <div className="team-card blue-team">
                            <h3>Équipe Bleue</h3>
                            <ul>
                                {blueTeamMembers.map(user => (
                                    <li key={user.id}>{user.username}</li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleJoinTeam(selectedMatch.blueTeamId, 'blue')}
                                className="btn-modern"
                            >
                                Rejoindre
                            </button>
                        </div>
                    </div>
                )}
                <button className="launch-button" style={{ marginTop: '2rem' }}>Lancer</button>
            </main>
        </div>
    );
}

export default Game;