import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Sword, Clock, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import Cookies from 'js-cookie';

const initialGameState = {
    state: 'intro',
    selectedTeam: null,
    selectedRole: null,
    scores: { attackers: 0, defenders: 0 },
    logs: [],
    roleAssigned: false,
    activeTab: 'website',
    submittedFlags: [],
    matchId: null,
};

const websiteInitialState = {
    currentPage: 'home',
    vulnerabilities: {
        xss: { exploited: false, fixed: false },
        weak_password: { exploited: false, fixed: false },
    },
    users: [
        { username: 'user1', password: 'password123', hint: 'Mot de passe basé sur un mot commun.' },
        { username: 'admin', password: 'admin2025', hint: 'Mot de passe inclut l’année actuelle.' },
    ],
    osint: [
        { source: 'Site Web', info: 'Technetron Bank, fondée en 2025.' },
        { source: 'Forum', info: 'Un utilisateur mentionne un compte admin par défaut.' },
    ],
};

const serverInitialState = {
    services: {
        ssh: { active: true, vulnerable: true, fixed: false, version: 'OpenSSH_7.2p2' },
    },
    ports: [22],
    accessLevel: 'none',
};

const roles = {
    attackers: [
        {
            id: 'web_hacker',
            name: 'Hacker Web',
            icon: '🕸️',
            specialty: 'Attaques web',
            description: 'Trouve des failles dans les sites web.',
            tasks: ['Teste XSS sur la page Contact.', 'Tente SQLi sur la page Connexion.'],
        },
        {
            id: 'network_intruder',
            name: 'Intrus Réseau',
            icon: '📡',
            specialty: 'Piratage réseau',
            description: 'Attaque les services réseau.',
            tasks: ['Scanne les ports.', 'Tente un accès SSH.'],
        },
        {
            id: 'social_engineer',
            name: 'Ingénieur Social',
            icon: '🗣️',
            specialty: 'Manipulation sociale',
            description: 'Récupère des infos via OSINT.',
            tasks: ['Analyse OSINT.', 'Teste des mots de passe faibles.'],
        },
    ],
    defenders: [
        {
            id: 'web_protector',
            name: 'Protecteur Web',
            icon: '🛡️',
            specialty: 'Sécurisation web',
            description: 'Protège le site contre les attaques.',
            tasks: ['Bloque XSS.', 'Surveille les attaques.'],
        },
        {
            id: 'network_guard',
            name: 'Gardien Réseau',
            icon: '🔒',
            specialty: 'Sécurisation réseau',
            description: 'Verrouille les services réseau.',
            tasks: ['Configure le pare-feu.', 'Surveille SSH.'],
        },
        {
            id: 'security_analyst',
            name: 'Analyste Sécurité',
            icon: '🔍',
            specialty: 'Surveillance',
            description: 'Renforce les mots de passe.',
            tasks: ['Applique une politique de mots de passe.', 'Vérifie les logs.'],
        },
    ],
};

const gameReducer = (state, action) => {
    switch (action.type) {
        case 'SET_STATE': return { ...state, state: action.payload };
        case 'SET_TEAM': return { ...state, selectedTeam: action.payload };
        case 'SET_ROLE': return { ...state, selectedRole: action.payload };
        case 'UPDATE_SCORES': return { ...state, scores: { ...state.scores, ...action.payload } };
        case 'ADD_LOG': return { ...state, logs: [...state.logs.slice(-50), action.payload] };
        case 'SET_ROLE_ASSIGNED': return { ...state, roleAssigned: true };
        case 'SET_ACTIVE_TAB': return { ...state, activeTab: action.payload };
        case 'SUBMIT_FLAG': return { ...state, submittedFlags: [...state.submittedFlags, action.payload] };
        case 'SET_MATCH_ID': return { ...state, matchId: action.payload };
        case 'UPDATE_WEBSITE_STATE': return { ...state, website: action.payload };
        case 'UPDATE_SERVER_STATE': return { ...state, server: action.payload };
        case 'RESET': return { ...initialGameState, matchId: state.matchId };
        default: return state;
    }
};

const IntroAnimation = ({ role, team, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 4000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
                color: '#fff',
                fontFamily: 'monospace',
                textAlign: 'center',
            }}
        >
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ fontSize: '2rem', color: team === 'attackers' ? '#ff5555' : '#55ff55' }}
            >
                Mission : Technetron Bank
            </motion.h1>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                style={{ fontSize: '1.5rem', marginTop: '20px' }}
            >
                Équipe : {team === 'attackers' ? 'Attaquants (Rouge)' : 'Défenseurs (Bleue)'} | Rôle : {role?.name} {role?.icon}
            </motion.p>
        </motion.div>
    );
};

const GameTimer = ({ onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
            <Clock style={{ marginRight: '8px' }} /> Temps : <span style={{ color: '#007bff', marginLeft: '4px' }}>{formatTime(timeLeft)}</span>
        </div>
    );
};

const FlagSubmission = ({ onSubmitFlag, submittedFlags }) => {
    const [flagInput, setFlagInput] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (submittedFlags.includes(flagInput)) {
            setFeedback('Flag déjà soumis !');
            return;
        }
        const validFlags = ['FLAG-XSS-123', 'FLAG-PASS-789', 'FLAG-SSH-101'];
        if (validFlags.includes(flagInput)) {
            onSubmitFlag(flagInput, 50);
            setFeedback('Flag validé ! +50 points');
        } else {
            setFeedback('Flag invalide.');
        }
        setFlagInput('');
    };

    return (
        <div style={{ background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Soumettre un Flag</h3>
            <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="Ex: FLAG-XSS-123"
                style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', marginBottom: '8px' }}
            />
            <button
                onClick={handleSubmit}
                style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
                Valider
            </button>
            {feedback && (
                <p style={{ marginTop: '8px', color: feedback.includes('validé') ? '#55ff55' : '#ff5555' }}>{feedback}</p>
            )}
        </div>
    );
};

const TerminalInterface = ({ role, team, serverState, setServerState, handleAction, addLog, socket, matchId }) => {
    const [cmd, setCmd] = useState('');
    const [output, setOutput] = useState(['Terminal de Technetron Bank.']);

    const execute = () => {
        const cmdTrim = cmd.trim();
        let result = '';
        if (team === 'attackers') {
            if (cmdTrim === 'nmap -sV 10.0.0.1') {
                result = `Port: 22\nSSH: ${serverState.services.ssh.version}`;
                addLog('Scan nmap effectué.');
                socket.emit('gameAction', { matchId, action: 'nmap_scan', result });
            } else if (cmdTrim === 'ssh admin@10.0.0.1 admin2025' && serverState.services.ssh.vulnerable && !serverState.services.ssh.fixed) {
                result = 'Accès SSH obtenu ! Flag: FLAG-SSH-101';
                setServerState((prev) => ({ ...prev, accessLevel: 'user' }));
                addLog('Accès SSH réussi. Soumettez FLAG-SSH-101.');
                socket.emit('gameAction', { matchId, action: 'ssh_access', result: { accessLevel: 'user', flag: 'FLAG-SSH-101' } });
            } else {
                result = 'Commande invalide.';
                addLog('Commande invalide exécutée.');
            }
        } else {
            result = 'Terminal en lecture seule. Utilisez l’interface web.';
        }
        setOutput([...output.slice(-10), `> ${cmd}\n${result}`]);
        setCmd('');
    };

    return (
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', color: '#fff' }}>
            <h2 style={{ color: '#007bff', marginBottom: '10px' }}>Terminal</h2>
            <div style={{ background: '#000', padding: '10px', height: '200px', overflowY: 'auto', marginBottom: '10px', fontSize: '0.9rem' }}>
                {output.map((line, idx) => (
                    <div key={idx} style={{ color: '#55ff55' }}>{line}</div>
                ))}
            </div>
            <input
                type="text"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && execute()}
                placeholder="Ex: nmap -sV 10.0.0.1"
                style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
            />
            <p style={{ marginTop: '10px', color: '#aaa', fontSize: '0.9rem' }}>Tâches : {role.tasks.join(' | ')}</p>
        </div>
    );
};

const XssGame = ({ onComplete, socket, matchId }) => {
    const [rule, setRule] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (rule === 'Block scripts') {
            onComplete();
            setFeedback('XSS bloqué ! +50 points');
            socket.emit('gameAction', { matchId, action: 'xss_fixed', result: { fixed: true, points: 50 } });
        } else {
            setFeedback('Règle incorrecte.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: '#333', padding: '15px', borderRadius: '8px', color: '#fff' }}
        >
            <h3 style={{ color: '#55ff55', marginBottom: '10px' }}>Protéger contre XSS</h3>
            <p style={{ marginBottom: '10px' }}>Choisis la règle pour bloquer les scripts.</p>
            <select
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', marginBottom: '10px' }}
            >
                <option value="">Choisir...</option>
                <option>Block scripts</option>
                <option>Allow all</option>
                <option>Log scripts</option>
            </select>
            <button
                onClick={handleSubmit}
                style={{ padding: '8px 15px', background: '#55ff55', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
                Valider
            </button>
            {feedback && (
                <p style={{ marginTop: '10px', color: feedback.includes('bloqué') ? '#55ff55' : '#ff5555' }}>{feedback}</p>
            )}
        </motion.div>
    );
};

const PasswordGame = ({ onComplete, socket, matchId }) => {
    const [length, setLength] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (length >= 8) {
            onComplete();
            setFeedback('Mots de passe sécurisés ! +50 points');
            socket.emit('gameAction', { matchId, action: 'password_fixed', result: { fixed: true, points: 50 } });
        } else {
            setFeedback('Longueur minimale : 8 caractères.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: '#333', padding: '15px', borderRadius: '8px', color: '#fff' }}
        >
            <h3 style={{ color: '#55ff55', marginBottom: '10px' }}>Renforcer les Mots de Passe</h3>
            <p style={{ marginBottom: '10px' }}>Choisis une longueur minimale.</p>
            <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', marginBottom: '10px' }}
            />
            <button
                onClick={handleSubmit}
                style={{ padding: '8px 15px', background: '#55ff55', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
                Valider
            </button>
            {feedback && (
                <p style={{ marginTop: '10px', color: feedback.includes('sécurisés') ? '#55ff55' : '#ff5555' }}>{feedback}</p>
            )}
        </motion.div>
    );
};

const FirewallGame = ({ onComplete, socket, matchId }) => {
    const [port, setPort] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (port === '22') {
            onComplete();
            setFeedback('Port SSH bloqué ! +50 points');
            socket.emit('gameAction', { matchId, action: 'ssh_fixed', result: { fixed: true, points: 50 } });
        } else {
            setFeedback('Port incorrect. Bloque le port SSH.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: '#333', padding: '15px', borderRadius: '8px', color: '#fff' }}
        >
            <h3 style={{ color: '#55ff55', marginBottom: '10px' }}>Configurer le Pare-feu</h3>
            <p style={{ marginBottom: '10px' }}>Entre le port à bloquer.</p>
            <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="Ex: 22"
                style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', marginBottom: '10px' }}
            />
            <button
                onClick={handleSubmit}
                style={{ padding: '8px 15px', background: '#55ff55', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
                Valider
            </button>
            {feedback && (
                <p style={{ marginTop: '10px', color: feedback.includes('bloqué') ? '#55ff55' : '#ff5555' }}>{feedback}</p>
            )}
        </motion.div>
    );
};

const CyberWarGame = () => {
    const [game, dispatch] = useReducer(gameReducer, initialGameState);
    const [website, setWebsite] = useState(websiteInitialState);
    const [server, setServer] = useState(serverInitialState);
    const [miniGame, setMiniGame] = useState(null);
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const addLog = useCallback(
        (msg) => dispatch({
            type: 'ADD_LOG',
            payload: `[${new Date().toLocaleTimeString('fr-FR')}] ${game.selectedTeam === 'attackers' ? '💥' : '🛡️'} ${msg}`,
        }),
        [game.selectedTeam],
    );

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const matchId = searchParams.get('matchId');
        const role = searchParams.get('role'); // 'attack' or 'defense'

        if (!matchId || !role) {
            setError('Match ID ou rôle manquant.');
            navigate('/game');
            return;
        }

        dispatch({ type: 'SET_MATCH_ID', payload: matchId });

        const newSocket = io('https://cyberskills.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connecté au WebSocket:', newSocket.id);
            newSocket.emit('authenticate', token);
            newSocket.emit('joinMatch', { matchId });
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

        newSocket.on('gameStateUpdate', ({ scores, logs, websiteState, serverState }) => {
            dispatch({ type: 'UPDATE_SCORES', payload: scores });
            dispatch({ type: 'ADD_LOG', payload: logs.slice(-1)[0] || '' });
            setWebsite(websiteState || websiteInitialState);
            setServer(serverState || serverInitialState);
        });

        newSocket.on('gameAction', ({ action, result }) => {
            if (action === 'xss_fixed') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, xss: { ...prev.vulnerabilities.xss, fixed: result.fixed } },
                }));
                dispatch({ type: 'UPDATE_SCORES', payload: { defenders: game.scores.defenders + result.points } });
                addLog('XSS corrigé par un défenseur.');
            } else if (action === 'password_fixed') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, weak_password: { ...prev.vulnerabilities.weak_password, fixed: result.fixed } },
                }));
                dispatch({ type: 'UPDATE_SCORES', payload: { defenders: game.scores.defenders + result.points } });
                addLog('Mots de passe sécurisés par un défenseur.');
            } else if (action === 'ssh_fixed') {
                setServer((prev) => ({
                    ...prev,
                    services: { ...prev.services, ssh: { ...prev.services.ssh, fixed: result.fixed } },
                }));
                dispatch({ type: 'UPDATE_SCORES', payload: { defenders: game.scores.defenders + result.points } });
                addLog('SSH sécurisé par un défenseur.');
            } else if (action === 'xss_exploited') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, xss: { ...prev.vulnerabilities.xss, exploited: result.exploited } },
                }));
                dispatch({ type: 'UPDATE_SCORES', payload: { attackers: game.scores.attackers + result.points } });
                addLog('XSS exploité par un attaquant.');
            } else if (action === 'password_exploited') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, weak_password: { ...prev.vulnerabilities.weak_password, exploited: result.exploited } },
                }));
                dispatch({ type: 'UPDATE_SCORES', payload: { attackers: game.scores.attackers + result.points } });
                addLog('Mot de passe faible exploité par un attaquant.');
            } else if (action === 'ssh_access') {
                setServer((prev) => ({ ...prev, accessLevel: result.accessLevel }));
                dispatch({ type: 'UPDATE_SCORES', payload: { attackers: game.scores.attackers + result.points } });
                addLog('Accès SSH obtenu par un attaquant.');
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [navigate, location]);

    useEffect(() => {
        if (game.state === 'intro' && !game.roleAssigned) {
            const searchParams = new URLSearchParams(location.search);
            const role = searchParams.get('role'); // 'attack' or 'defense'
            const team = role === 'attack' ? 'attackers' : 'defenders';
            const roleList = roles[team];
            const selectedRole = roleList[Math.floor(Math.random() * roleList.length)];
            dispatch({ type: 'SET_TEAM', payload: team });
            dispatch({ type: 'SET_ROLE', payload: selectedRole.id });
            dispatch({ type: 'SET_ROLE_ASSIGNED' });
            addLog(`Rôle assigné : ${selectedRole.name} (${team}).`);
            socket?.emit('gameAction', { matchId: game.matchId, action: 'role_assigned', result: { team, role: selectedRole.id } });
        }
    }, [game.state, game.roleAssigned, game.matchId, addLog, socket, location]);

    const handleAction = useCallback(
        (event) => {
            dispatch({ type: 'UPDATE_SCORES', payload: { [event.team]: game.scores[event.team] + event.points } });
            addLog(`${event.team}: ${event.message}`);
            socket?.emit('gameAction', { matchId: game.matchId, action: event.action, result: event.result });
        },
        [game.scores, game.matchId, addLog, socket],
    );

    const handleSubmitFlag = useCallback(
        (flag, points) => {
            dispatch({ type: 'SUBMIT_FLAG', payload: flag });
            handleAction({ team: 'attackers', message: `Flag ${flag} validé.`, points, action: `flag_${flag}`, result: { flag, points } });
        },
        [handleAction],
    );

    const handleReset = useCallback(() => {
        dispatch({ type: 'RESET' });
        setWebsite(websiteInitialState);
        setServer(serverInitialState);
        setMiniGame(null);
        socket?.emit('gameAction', { matchId: game.matchId, action: 'reset', result: {} });
    }, [game.matchId, socket]);

    const updateVuln = (vuln, updates) => {
        setWebsite((prev) => {
            const newState = {
                ...prev,
                vulnerabilities: { ...prev.vulnerabilities, [vuln]: { ...prev.vulnerabilities[vuln], ...updates } },
            };
            socket?.emit('gameAction', { matchId: game.matchId, action: `${vuln}_exploited`, result: updates });
            return newState;
        });
    };

    const WebsiteInterface = () => {
        const [page, setPage] = useState('home');
        const [form, setForm] = useState({ user: '', pass: '', comment: '' });
        const [feedback, setFeedback] = useState('');

        const testXSS = (input) => {
            if (input === '<script>alert(1)</script>' && !website.vulnerabilities.xss.exploited && !website.vulnerabilities.xss.fixed && game.selectedTeam === 'attackers') {
                updateVuln('xss', { exploited: true });
                addLog('XSS exploité.');
                handleAction({ team: 'attackers', message: 'XSS exploité.', points: 50, action: 'xss_exploited', result: { exploited: true } });
                return 'Flag: FLAG-XSS-123';
            }
            return null;
        };

        const testWeakPass = (user, pass) => {
            const account = website.users.find((acc) => acc.username === user && acc.password === pass);
            if (account && !website.vulnerabilities.weak_password.exploited && !website.vulnerabilities.weak_password.fixed && game.selectedTeam === 'attackers') {
                updateVuln('weak_password', { exploited: true });
                addLog(`Mot de passe faible exploité : ${user}.`);
                handleAction({ team: 'attackers', message: `Mot de passe faible exploité : ${user}.`, points: 50, action: 'password_exploited', result: { exploited: true } });
                return 'Flag: FLAG-PASS-789';
            }
            return null;
        };

        return (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#003087', marginBottom: '15px' }}>Technetron Bank</h2>
                <nav style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    {['home', 'osint', 'login', 'contact'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                                padding: '8px 15px',
                                background: page === p ? '#003087' : '#f0f0f0',
                                color: page === p ? '#fff' : '#003087',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            {p === 'home' ? 'Accueil' : p === 'osint' ? 'OSINT' : p === 'login' ? 'Connexion' : 'Contact'}
                        </button>
                    ))}
                </nav>
                {miniGame && (
                    <div style={{ marginBottom: '15px' }}>
                        {miniGame === 'xss' && <XssGame onComplete={() => { updateVuln('xss', { fixed: true }); handleAction({ team: 'defenders', message: 'XSS corrigé.', points: 50, action: 'xss_fixed', result: { fixed: true } }); setMiniGame(null); }} socket={socket} matchId={game.matchId} />}
                        {miniGame === 'weak_password' && <PasswordGame onComplete={() => { updateVuln('weak_password', { fixed: true }); handleAction({ team: 'defenders', message: 'Mots de passe sécurisés.', points: 50, action: 'password_fixed', result: { fixed: true } }); setMiniGame(null); }} socket={socket} matchId={game.matchId} />}
                        {miniGame === 'ssh' && <FirewallGame onComplete={() => { setServer((prev) => ({ ...prev, services: { ...prev.services, ssh: { ...prev.services.ssh, fixed: true } } })); handleAction({ team: 'defenders', message: 'SSH sécurisé.', points: 50, action: 'ssh_fixed', result: { fixed: true } }); setMiniGame(null); }} socket={socket} matchId={game.matchId} />}
                    </div>
                )}
                {feedback && (
                    <p style={{ marginBottom: '15px', color: feedback.includes('Flag') ? '#55ff55' : '#ff5555' }}>{feedback}</p>
                )}
                {page === 'home' && (
                    <div>
                        <h3 style={{ color: '#003087', marginBottom: '10px' }}>Bienvenue</h3>
                        <p>Technetron Bank, votre banque sécurisée depuis 2025.</p>
                        <Globe style={{ marginTop: '15px', color: '#003087', width: '40px', height: '40px' }} />
                    </div>
                )}
                {page === 'osint' && (
                    <div>
                        <h3 style={{ color: '#003087', marginBottom: '10px' }}>OSINT</h3>
                        {website.osint.map((item, idx) => (
                            <div key={idx} style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '10px' }}>
                                <p><strong>{item.source} :</strong> {item.info}</p>
                                {game.selectedTeam === 'attackers' && (
                                    <button
                                        onClick={() => {
                                            addLog(`OSINT analysé : ${item.source}.`);
                                            socket?.emit('gameAction', { matchId: game.matchId, action: 'osint_analyzed', result: { source: item.source } });
                                        }}
                                        style={{ padding: '8px 15px', background: '#ff5555', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '5px' }}
                                    >
                                        Analyser
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {page === 'login' && (
                    <div>
                        <h3 style={{ color: '#003087', marginBottom: '10px' }}>Connexion</h3>
                        <input
                            type="text"
                            value={form.user}
                            onChange={(e) => setForm({ ...form, user: e.target.value })}
                            placeholder="Utilisateur"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}
                        />
                        <input
                            type="text"
                            value={form.pass}
                            onChange={(e) => setForm({ ...form, pass: e.target.value })}
                            placeholder="Mot de passe"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}
                        />
                        <button
                            onClick={() => {
                                const passFlag = testWeakPass(form.user, form.pass);
                                setFeedback(passFlag || 'Identifiants incorrects.');
                            }}
                            style={{ padding: '8px 15px', background: '#003087', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                            Connexion
                        </button>
                        {game.selectedTeam === 'defenders' && !website.vulnerabilities.weak_password.fixed && (
                            <button
                                onClick={() => setMiniGame('weak_password')}
                                style={{ padding: '8px 15px', background: '#55ff55', color: '#fff', border: 'none', borderRadius: '4px', marginLeft: '10px' }}
                            >
                                Sécuriser Mots de Passe
                            </button>
                        )}
                    </div>
                )}
                {page === 'contact' && (
                    <div>
                        <h3 style={{ color: '#003087', marginBottom: '10px' }}>Contact</h3>
                        <textarea
                            value={form.comment}
                            onChange={(e) => setForm({ ...form, comment: e.target.value })}
                            placeholder="Message..."
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', height: '100px' }}
                        />
                        <button
                            onClick={() => {
                                const xssFlag = testXSS(form.comment);
                                setFeedback(xssFlag || 'Message envoyé.');
                            }}
                            style={{ padding: '8px 15px', background: '#003087', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                            Envoyer
                        </button>
                        {game.selectedTeam === 'defenders' && !website.vulnerabilities.xss.fixed && (
                            <button
                                onClick={() => setMiniGame('xss')}
                                style={{ padding: '8px 15px', background: '#55ff55', color: '#fff', border: 'none', borderRadius: '4px', marginLeft: '10px' }}
                            >
                                Corriger XSS
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const GameInterface = () => {
        const role = roles[game.selectedTeam]?.find((r) => r.id === game.selectedRole);

        return (
            <div style={{ background: '#111', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
                {error && <div style={{ color: '#ff5555', marginBottom: '15px' }}>{error}</div>}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#007bff' }}>Technetron Bank - CyberWar (Match {game.matchId?.slice(0, 8)})</h1>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <GameTimer onTimeUp={() => dispatch({ type: 'SET_STATE', payload: 'results' })} />
                        <div style={{ fontSize: '1.2rem' }}>
                            Score : <span style={{ color: '#ff5555' }}>{game.scores.attackers}</span> - <span style={{ color: '#55ff55' }}>{game.scores.defenders}</span>
                        </div>
                        <button
                            onClick={() => dispatch({ type: 'SET_STATE', payload: 'role-details' })}
                            style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        >
                            <Info style={{ marginRight: '5px' }} /> Mission
                        </button>
                    </div>
                </header>
                <main style={{ display: 'flex', gap: '20px' }}>
                    <aside style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: '#222', padding: '15px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '5px' }}>{role.name} {role.icon}</h3>
                            <p style={{ color: '#aaa' }}>{role.specialty}</p>
                        </div>
                        {game.selectedTeam === 'attackers' && (
                            <FlagSubmission onSubmitFlag={handleSubmitFlag} submittedFlags={game.submittedFlags} />
                        )}
                        <div style={{ background: '#222', padding: '15px', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Logs</h3>
                            {game.logs.map((log, idx) => (
                                <p key={idx} style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '5px' }}>{log}</p>
                            ))}
                        </div>
                    </aside>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'website' })}
                                style={{
                                    padding: '8px 15px',
                                    background: game.activeTab === 'website' ? '#007bff' : '#444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                }}
                            >
                                Site Web
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'network' })}
                                style={{
                                    padding: '8px 15px',
                                    background: game.activeTab === 'network' ? '#007bff' : '#444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                }}
                            >
                                Réseau
                            </button>
                        </div>
                        {game.activeTab === 'website' ? (
                            <WebsiteInterface />
                        ) : (
                            <TerminalInterface
                                role={role}
                                team={game.selectedTeam}
                                serverState={server}
                                setServerState={setServer}
                                handleAction={handleAction}
                                addLog={addLog}
                                socket={socket}
                                matchId={game.matchId}
                            />
                        )}
                    </div>
                </main>
            </div>
        );
    };

    const RoleDetailsScreen = () => {
        const role = roles[game.selectedTeam]?.find((r) => r.id === game.selectedRole);
        return (
            <div style={{ background: '#111', minHeight: '100vh', padding: '30px', color: '#fff', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: '#007bff', marginBottom: '20px' }}>Mission</h1>
                <div style={{ background: game.selectedTeam === 'attackers' ? '#ff5555' : '#55ff55', padding: '20px', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{role.name} {role.icon}</h2>
                    <p><strong>Spécialité :</strong> {role.specialty}</p>
                    <p style={{ margin: '10px 0' }}><strong>Mission :</strong> {role.description}</p>
                    <h3 style={{ fontSize: '1.2rem', marginTop: '15px' }}>Tâches</h3>
                    <ul style={{ listStyle: 'disc', marginLeft: '20px', textAlign: 'left' }}>
                        {role.tasks.map((task, idx) => (
                            <li key={idx}>{task}</li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                    style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '20px' }}
                >
                    Retour
                </button>
            </div>
        );
    };

    const Results = () => (
        <div style={{ background: '#111', minHeight: '100vh', padding: '30px', color: '#fff', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', color: '#007bff', marginBottom: '20px' }}>Résultats</h1>
            <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Attaquants : {game.scores.attackers} points</p>
            <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Défenseurs : {game.scores.defenders} points</p>
            <button
                onClick={handleReset}
                style={{ padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
                Nouvelle Mission
            </button>
        </div>
    );

    return (
        <AnimatePresence>
            {game.state === 'intro' && (
                <IntroAnimation
                    role={roles[game.selectedTeam]?.find((r) => r.id === game.selectedRole)}
                    team={game.selectedTeam}
                    onComplete={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                />
            )}
            {game.state === 'game' && <GameInterface />}
            {game.state === 'role-details' && <RoleDetailsScreen />}
            {game.state === 'results' && <Results />}
        </AnimatePresence>
    );
};

export default CyberWarGame;