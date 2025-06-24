import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Shield, Sword, Clock, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

// Singleton WebSocket instance
let socketInstance = null;

function getSocket() {
    if (!socketInstance || socketInstance.disconnected) {
        socketInstance = io('https://cyberskills.onrender.com', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
        });
    }
    return socketInstance;
}

const initialGameState = {
    state: 'waiting',
    selectedTeam: null,
    selectedRole: null,
    scores: { attackers: 0, defenders: 0 },
    logs: [],
    roleAssigned: false,
    activeTab: 'website',
    submittedFlags: [],
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
        { id: 'web_hacker', name: 'Hacker Web', icon: '🕸️', specialty: 'Attaques web', description: 'Trouve des failles dans les sites web.', tasks: ['Teste XSS sur la page Contact.', 'Tente SQLi sur la page Connexion.'] },
        { id: 'network_intruder', name: 'Intrus Réseau', icon: '📡', specialty: 'Piratage réseau', description: 'Attaque les services réseau.', tasks: ['Scanne les ports.', 'Tente un accès SSH.'] },
        { id: 'social_engineer', name: 'Ingénieur Social', icon: '🗣️', specialty: 'Manipulation sociale', description: 'Récupère des infos via OSINT.', tasks: ['Analyse OSINT.', 'Teste des mots de passe faibles.'] },
    ],
    defenders: [
        { id: 'web_protector', name: 'Protecteur Web', icon: '🛡️', specialty: 'Sécurisation web', description: 'Protège le site contre les attaques.', tasks: ['Bloque XSS.', 'Surveille les attaques.'] },
        { id: 'network_guard', name: 'Gardien Réseau', icon: '🔒', specialty: 'Sécurisation réseau', description: 'Verrouille les services réseau.', tasks: ['Configure le pare-feu.', 'Surveille SSH.'] },
        { id: 'security_analyst', name: 'Analyste Sécurité', icon: '🔍', specialty: 'Surveillance', description: 'Renforce les mots de passe.', tasks: ['Applique une politique de mots de passe.', 'Vérifie les logs.'] },
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
        case 'RESET': return initialGameState;
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
            className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-mono text-center"
        >
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className={`text-4xl ${team === 'attackers' ? 'text-red-500' : 'text-green-500'}`}
            >
                Mission : Technetron Bank
            </motion.h1>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-2xl mt-5"
            >
                Équipe : {team === 'attackers' ? 'Attaquants' : 'Défenseurs'} | Rôle : {role?.name} {role?.icon}
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
        <div className="flex items-center text-lg">
            <Clock className="mr-2" /> Temps : <span className="text-blue-500 ml-1">{formatTime(timeLeft)}</span>
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
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <h3 className="text-blue-500 mb-2">Soumettre un Flag</h3>
            <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="Ex: FLAG-XSS-123"
                className="w-full p-2 bg-gray-700 text-white border-none rounded mb-2"
            />
            <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Valider
            </button>
            {feedback && (
                <p className={`mt-2 ${feedback.includes('validé') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
            )}
        </div>
    );
};

const TerminalInterface = ({ role, team, serverState, setServerState, handleAction, addLog }) => {
    const [cmd, setCmd] = useState('');
    const [output, setOutput] = useState(['Terminal de Technetron Bank.']);

    const execute = () => {
        const cmdTrim = cmd.trim();
        let result = '';
        if (team === 'attackers') {
            if (cmdTrim === 'nmap -sV 10.0.0.1') {
                result = `Port: 22\nSSH: ${serverState.services.ssh.version}`;
                addLog('Scan nmap effectué.');
            } else if (cmdTrim === 'ssh admin@10.0.0.1 admin2025' && serverState.services.ssh.vulnerable && !serverState.services.ssh.fixed) {
                result = 'Accès SSH obtenu ! Flag: FLAG-SSH-101';
                setServerState((prev) => ({ ...prev, accessLevel: 'team' }));
                addLog('Accès SSH réussi. Soumettez FLAG-SSH-101.');
            } else {
                result = 'Commande invalide.';
            }
        } else {
            result = 'Terminal en lecture seule. Utilisez l’interface web.';
        }
        setOutput([...output.slice(-10), `> ${cmd}\n${result}`]);
        setCmd('');
    };

    return (
        <div className="bg-gray-900 p-4 rounded-lg font-mono text-white">
            <h2 className="text-blue-500 mb-2">Terminal</h2>
            <div className="bg-black p-3 h-48 overflow-y-auto mb-2 text-sm">
                {output.map((line, idx) => (
                    <div key={idx} className="text-green-500">{line}</div>
                ))}
            </div>
            <input
                type="text"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && execute()}
                placeholder="Ex: nmap -sV 10.0.0.1"
                className="w-full p-2 bg-gray-700 text-white border-none rounded"
            />
            <p className="mt-2 text-gray-400 text-sm">Tâches : {role.tasks.join(' | ')}</p>
        </div>
    );
};

const XssGame = ({ onComplete }) => {
    const [rule, setRule] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (rule === 'Block scripts') {
            onComplete();
            setFeedback('XSS bloqué ! +50 points');
        } else {
            setFeedback('Règle incorrecte.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-700 p-4 rounded-lg text-white"
        >
            <h3 className="text-green-500 mb-2">Protéger contre XSS</h3>
            <p className="mb-2">Choisis la règle pour bloquer les scripts.</p>
            <select
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                className="w-full p-2 bg-gray-800 text-white border-none rounded mb-2"
            >
                <option value="">Choisir...</option>
                <option>Block scripts</option>
                <option>Allow all</option>
                <option>Log scripts</option>
            </select>
            <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded"
            >
                Valider
            </button>
            {feedback && (
                <p className={`mt-2 ${feedback.includes('bloqué') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
            )}
        </motion.div>
    );
};

const PasswordGame = ({ onComplete }) => {
    const [length, setLength] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (length >= 8) {
            onComplete();
            setFeedback('Mots de passe sécurisés ! +50 points');
        } else {
            setFeedback('Longueur minimale : 8 caractères.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-700 p-4 rounded-lg text-white"
        >
            <h3 className="text-green-500 mb-2">Renforcer les Mots de Passe</h3>
            <p className="mb-2">Choisis une longueur minimale.</p>
            <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full p-2 bg-gray-800 text-white border-none rounded mb-2"
            />
            <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded"
            >
                Valider
            </button>
            {feedback && (
                <p className={`mt-2 ${feedback.includes('sécurisés') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
            )}
        </motion.div>
    );
};

const FirewallGame = ({ onComplete }) => {
    const [port, setPort] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (port === '22') {
            onComplete();
            setFeedback('Port SSH bloqué ! +50 points');
        } else {
            setFeedback('Port incorrect. Bloque le port SSH.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-700 p-4 rounded-lg text-white"
        >
            <h3 className="text-green-500 mb-2">Configurer le Pare-feu</h3>
            <p className="mb-2">Entre le port à bloquer.</p>
            <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="Ex: 22"
                className="w-full p-2 bg-gray-800 text-white border-none rounded mb-2"
            />
            <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded"
            >
                Valider
            </button>
            {feedback && (
                <p className={`mt-2 ${feedback.includes('bloqué') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
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
    const [gameId] = useState(localStorage.getItem('selectedGameId') || 'default-game');
    const [playerId, setPlayerId] = useState(null);
    const [connectedPlayers, setConnectedPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('waiting');
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [assignedRoles, setAssignedRoles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const addLog = useCallback(
        (msg) => {
            dispatch({
                type: 'ADD_LOG',
                payload: `[${new Date().toLocaleTimeString('fr-FR')}] ${game.selectedTeam === 'attackers' ? '💥' : '🛡️'} ${msg}`,
            });
        },
        [game.selectedTeam]
    );

    const handleReconnect = useCallback(() => {
        if (reconnectAttempts >= 10) {
            setErrorMessage('Impossible de reconnecter après 10 tentatives.');
            return;
        }
        socketInstance = null;
        const newSocket = getSocket();
        setSocket(newSocket);
        setReconnectAttempts((prev) => prev + 1);
        if (playerId && gameId) {
            newSocket.emit('rejoin-game', { gameId, playerId });
        }
    }, [reconnectAttempts, playerId, gameId]);

    useEffect(() => {
        const newSocket = getSocket();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnectionStatus('connected');
            setReconnectAttempts(0);
            setErrorMessage('');
            const playerName = `Player_${Math.random().toString(36).substr(2, 9)}`;
            newSocket.emit('join-game', { gameId, playerName });
            addLog(`Connecté au serveur en tant que ${playerName}.`);
        });

        newSocket.on('connect_error', (error) => {
            setConnectionStatus('error');
            setErrorMessage('Erreur de connexion au serveur. Retentez ou vérifiez votre réseau.');
            addLog('Erreur de connexion au serveur.');
        });

        newSocket.on('role-assigned', (data) => {
            dispatch({ type: 'SET_TEAM', payload: data.team });
            dispatch({ type: 'SET_ROLE', payload: data.roleId });
            dispatch({ type: 'SET_ROLE_ASSIGNED' });
            setPlayerId(data.playerId);
            setAssignedRoles((prev) => [...new Set([...prev, data.roleId])]);
            addLog(`Rôle assigné : ${data.roleName} (${data.team}).`);
        });

        newSocket.on('game-state-update', (gameState) => {
            setConnectedPlayers(gameState.players || []);
            setGameStatus(gameState.status);
            const rolesAssigned = gameState.players.map((p) => p.roleId);
            setAssignedRoles([...new Set(rolesAssigned)]);
            if (gameState.status === 'playing' && game.state !== 'game') {
                dispatch({ type: 'SET_STATE', payload: 'intro' });
            }
        });

        newSocket.on('player-action', (actionData) => {
            addLog(`${actionData.playerName}: ${actionData.message}`);
            if (actionData.type === 'vulnerability-exploited') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: {
                        ...prev.vulnerabilities,
                        [actionData.data.vulnerability]: { ...prev.vulnerabilities[actionData.data.vulnerability], exploited: true },
                    },
                }));
            } else if (actionData.type === 'vulnerability-fixed') {
                setWebsite((prev) => ({
                    ...prev,
                    vulnerabilities: {
                        ...prev.vulnerabilities,
                        [actionData.data.vulnerability]: { ...prev.vulnerabilities[actionData.data.vulnerability], fixed: true },
                    },
                }));
            }
        });

        newSocket.on('score-update', (scores) => {
            dispatch({ type: 'UPDATE_SCORES', payload: scores });
        });

        newSocket.on('game-ended', (data) => {
            dispatch({ type: 'SET_STATE', payload: 'results' });
            addLog(`Partie terminée. Gagnant: ${data.winner}`);
        });

        newSocket.on('rejoin-success', (data) => {
            dispatch({ type: 'SET_TEAM', payload: data.team });
            dispatch({ type: 'SET_ROLE', payload: data.roleId });
            dispatch({ type: 'SET_ROLE_ASSIGNED' });
            setPlayerId(data.playerId);
            addLog(`Reconnexion réussie : ${data.roleName} (${data.team}).`);
        });

        return () => {
            newSocket.close();
            setConnectionStatus('disconnected');
        };
    }, [addLog, gameId, game.state]);

    const sendAction = useCallback(
        (actionType, actionData) => {
            if (socket && socket.connected) {
                socket.emit('player-action', {
                    playerId,
                    gameId,
                    type: actionType,
                    data: actionData,
                    playerName: connectedPlayers.find((p) => p.id === playerId)?.name || 'Unknown',
                    timestamp: Date.now(),
                });
            } else {
                addLog('Impossible d’envoyer l’action: non connecté.');
            }
        },
        [socket, playerId, gameId, connectedPlayers, addLog]
    );

    const handleAction = useCallback(
        (event) => {
            sendAction('score-update', {
                team: event.team,
                points: event.points,
                message: event.message,
            });
        },
        [sendAction]
    );

    const handleSubmitFlag = useCallback(
        (flag, points) => {
            dispatch({ type: 'SUBMIT_FLAG', payload: flag });
            sendAction('score-update', {
                team: 'attackers',
                points,
                message: `Flag ${flag} validé.`,
            });
        },
        [sendAction]
    );

    const handleReset = useCallback(() => {
        dispatch({ type: 'RESET' });
        setWebsite(websiteInitialState);
        setServer(serverInitialState);
        setMiniGame(null);
        setGameStatus('waiting');
        setAssignedRoles([]);
        socket.emit('join-game', {
            gameId,
            playerName: `Player_${Math.random().toString(36).substr(2, 9)}`,
        });
    }, [socket, gameId]);

    const startGame = useCallback(() => {
        if (socket && socket.connected) {
            const attackerRoles = roles.attackers.map((r) => r.id);
            const defenderRoles = roles.defenders.map((r) => r.id);
            const requiredRoles = [...attackerRoles, ...defenderRoles];
            const uniqueRoles = [...new Set(assignedRoles)];
            if (uniqueRoles.length === 6 && requiredRoles.every((r) => uniqueRoles.includes(r))) {
                socket.emit('start-game', { gameId });
            } else {
                addLog('Impossible de démarrer : tous les rôles uniques ne sont pas assignés.');
            }
        }
    }, [socket, gameId, assignedRoles, addLog]);

    const updateVuln = (vuln, updates) => {
        setWebsite((prev) => ({
            ...prev,
            vulnerabilities: { ...prev.vulnerabilities, [vuln]: { ...prev.vulnerabilities[vuln], ...updates } },
        }));
        sendAction(updates.exploited ? 'vulnerability-exploited' : 'vulnerability-fixed', {
            vulnerability: vuln,
            message: updates.exploited ? `Vulnérabilité ${vuln} exploitée.` : `Vulnérabilité ${vuln} corrigée.`,
        });
    };

    const WebsiteInterface = () => {
        const [page, setPage] = useState('home');
        const [form, setForm] = useState({ user: '', pass: '', comment: '' });
        const [feedback, setFeedback] = useState('');

        const testXSS = (input) => {
            if (input === '<script>alert(1)</script>' && !website.vulnerabilities.xss?.exploited && !website.vulnerabilities.xss?.fixed && game.selectedTeam === 'attackers') {
                updateVuln('xss', { exploited: true });
                addLog('XSS exploité.');
                setFeedback('Flag: FLAG-XSS-123');
                return true;
            }
            return false;
        };

        const testWeakPass = (user, pass) => {
            const account = website.users.find((acc) => acc.username === user && acc.password === pass);
            if (account && !website.vulnerabilities.weak_password?.exploited && !website.vulnerabilities.weak_password?.fixed && game.selectedTeam === 'attackers') {
                updateVuln('weak_password', { exploited: true });
                addLog(`Mot de passe faible exploité : ${user}`);
                setFeedback('Flag: FLAG-PASS-789');
                return true;
            }
            return false;
        };

        return (
            <div className="bg-white p-5 rounded-lg shadow-md">
                <h2 className="text-blue-800 mb-4">Technetron Bank</h2>
                <nav className="flex gap-3 mb-4">
                    {['home', 'osint', 'login', 'contact'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-4 py-2 rounded ${page === p ? 'bg-blue-800 text-white' : 'bg-gray-100 text-blue-800'}`}
                        >
                            {p === 'home' ? 'Accueil' : p === 'osint' ? 'OSINT' : p === 'login' ? 'Connexion' : 'Contact'}
                        </button>
                    ))}
                </nav>
                {miniGame && (
                    <div className="mb-4">
                        {miniGame === 'xss' && <XssGame onComplete={() => { updateVuln('xss', { fixed: true }); handleAction({ team: 'defenders', message: 'XSS corrigé.', points: 50 }); setMiniGame(null); }} />}
                        {miniGame === 'weak_password' && <PasswordGame onComplete={() => { updateVuln('weak_password', { fixed: true }); handleAction({ team: 'defenders', message: 'Mots de passe sécurisés.', points: 50 }); setMiniGame(null); }} />}
                        {miniGame === 'ssh' && <FirewallGame onComplete={() => { setServer((prev) => ({ ...prev, services: { ...prev.services, ssh: { ...prev.services.ssh, fixed: true } } })); handleAction({ team: 'defenders', message: 'SSH sécurisé.', points: 50 }); setMiniGame(null); }} />}
                    </div>
                )}
                {feedback && (
                    <p className={`mb-4 ${feedback.includes('Flag') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>
                )}
                {page === 'home' && (
                    <div>
                        <h3 className="text-blue-800 mb-2">Bienvenue</h3>
                        <p>Technetron Bank, votre banque sécurisée depuis 2025.</p>
                        <Globe className="mt-4 text-blue-800 w-10 h-10" />
                    </div>
                )}
                {page === 'osint' && (
                    <div>
                        <h3 className="text-blue-600 mb-2">OSINT</h3>
                        {website.osint.map((item, idx) => (
                            <div key={idx} className="p-3 bg-gray-100 rounded mb-2">
                                <p><strong>{item.source} :</strong> {item.info}</p>
                                {game.selectedTeam === 'attackers' && (
                                    <button
                                        onClick={() => addLog(`OSINT analysé : ${item.source}.`)}
                                        className="px-4 py-2 bg-red-500 text-white rounded mt-2"
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
                        <h3 className="text-blue-600 mb-2">Connexion</h3>
                        <input
                            type="text"
                            value={form.user}
                            onChange={(e) => setForm({ ...form, user: e.target.value })}
                            placeholder="Utilisateur"
                            className="w-full p-2 border border-gray-300 rounded mb-2"
                        />
                        <input
                            type="text"
                            value={form.pass}
                            onChange={(e) => setForm({ ...form, pass: e.target.value })}
                            placeholder="Mot de passe"
                            className="w-full p-2 border border-gray-300 rounded mb-2"
                        />
                        <button
                            onClick={() => {
                                const passFlag = testWeakPass(form.user, form.pass);
                                setFeedback(passFlag ? 'Flag: FLAG-PASS-789' : 'Identifiants incorrects.');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Connexion
                        </button>
                        {game.selectedTeam === 'defenders' && !website.vulnerabilities.weak_password?.fixed && (
                            <button
                                onClick={() => setMiniGame('weak_password')}
                                className="px-4 py-2 bg-green-500 text-white rounded ml-2"
                            >
                                Sécuriser Mots de Passe
                            </button>
                        )}
                    </div>
                )}
                {page === 'contact' && (
                    <div>
                        <h3 className="text-blue-600 mb-2">Contact</h3>
                        <textarea
                            value={form.comment}
                            onChange={(e) => setForm({ ...form, comment: e.target.value })}
                            placeholder="Message..."
                            className="w-full p-2 border border-gray-300 rounded mb-2 h-24"
                        />
                        <button
                            onClick={() => {
                                const xssFlag = testXSS(form.comment);
                                setFeedback(xssFlag ? 'Flag: FLAG-XSS-123' : 'Message envoyé.');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            Envoyer
                        </button>
                        {game.selectedTeam === 'defenders' && !website.vulnerabilities.xss?.fixed && (
                            <button
                                onClick={() => setMiniGame('xss')}
                                className="px-4 py-2 bg-green-500 text-white rounded ml-2"
                            >
                                Corriger XSS
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const WaitingRoomScreen = () => {
        const isReadyToStart =
            connectedPlayers.length >= 6 &&
            assignedRoles.length >= 6 &&
            [...new Set(assignedRoles)].length === 6 &&
            roles.attackers.every((r) => assignedRoles.includes(r.id)) &&
            roles.defenders.every((r) => assignedRoles.includes(r.id));

        return (
            <div className="bg-gray-900 min-h-screen p-8 text-white text-center">
                {errorMessage && (
                    <div className="bg-red-500 p-4 rounded-lg mb-5">
                        <p>{errorMessage}</p>
                        <button
                            onClick={handleReconnect}
                            disabled={reconnectAttempts >= 10}
                            className="px-5 py-2 bg-blue-600 text-white rounded mt-3"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
                <h1 className="text-3xl text-blue-500 mb-5">Salle d'Attente - Technetron Bank CyberWar</h1>
                <p className={`text-lg mb-5 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                    Statut : {connectionStatus === 'connected' ? 'Connecté au serveur' : 'En attente de connexion...'}
                </p>
                <div className="bg-gray-800 p-5 rounded-lg mb-5 max-w-2xl mx-auto">
                    <h3 className="text-blue-500 mb-4">Joueurs connectés ({connectedPlayers.length}/6)</h3>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <h4 className="text-red-500 mb-3">🔥 Attaquants</h4>
                            {connectedPlayers
                                .filter((p) => p.team === 'attackers')
                                .map((player) => (
                                    <div key={player.id} className="bg-red-500 p-2 rounded mb-2 text-white">
                                        {player.name} - {player.roleName} {player.roleIcon}
                                    </div>
                                ))}
                        </div>
                        <div>
                            <h4 className="text-green-500 mb-3">🛡️ Défenseurs</h4>
                            {connectedPlayers
                                .filter((p) => p.team === 'defenders')
                                .map((player) => (
                                    <div key={player.id} className="bg-green-500 p-2 rounded mb-2 text-black">
                                        {player.name} - {player.roleName} {player.roleIcon}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
                {isReadyToStart && gameStatus === 'waiting' && (
                    <button
                        onClick={startGame}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg"
                    >
                        🚀 Démarrer la partie
                    </button>
                )}
                {!isReadyToStart && (
                    <p className="text-gray-400 text-lg">
                        En attente de {6 - connectedPlayers.length} joueurs ou rôles non uniques...
                    </p>
                )}
            </div>
        );
    };

    const GameInterfaceScreen = () => {
        const role = roles[game.selectedTeam]?.find((r) => r.id === game.selectedRole);

        return (
            <div className="bg-gray-900 min-h-screen p-5 text-white font-sans">
                {connectionStatus === 'disconnected' && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-5 rounded-lg text-center">
                            <h3 className="text-red-500">Connexion perdue</h3>
                            <p>Tentative de reconnexion ({10 - reconnectAttempts} restantes)</p>
                            <button
                                onClick={handleReconnect}
                                disabled={reconnectAttempts >= 10}
                                className="px-5 py-2 bg-blue-600 text-white rounded mt-3"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}
                <header className="flex justify-between items-center bg-gray-800 p-4 rounded-lg mb-5">
                    <h1 className="text-2xl text-blue-500">Technetron Bank - CyberWar</h1>
                    <div className="flex gap-5 items-center">
                        <GameTimer onTimeUp={() => dispatch({ type: 'SET_STATE', payload: 'results' })} />
                        <div className="text-lg">
                            Score : <span className="text-red-500">{game.scores.attackers}</span> - <span className="text-green-500">{game.scores.defenders}</span>
                        </div>
                        <button
                            onClick={() => dispatch({ type: 'SET_STATE', payload: 'role-details' })}
                            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
                        >
                            <Info className="mr-2" /> Mission
                        </button>
                    </div>
                </header>
                <main className="flex gap-5">
                    <aside className="w-80 flex flex-col gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg mb-1">{role?.name} {role?.icon}</h3>
                            <p className="text-gray-400">{role?.specialty}</p>
                        </div>
                        {game.selectedTeam === 'attackers' && (
                            <FlagSubmission onSubmitFlag={handleSubmitFlag} submittedFlags={game.submittedFlags} />
                        )}
                        <div className="bg-gray-800 p-4 rounded-lg max-h-80 overflow-y-auto">
                            <h3 className="text-lg mb-2">Logs</h3>
                            {game.logs.map((log, idx) => (
                                <p key={idx} className="text-sm text-gray-300 mb-1">{log}</p>
                            ))}
                        </div>
                    </aside>
                    <div className="flex-1">
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'website' })}
                                className={`px-4 py-2 rounded ${game.activeTab === 'website' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
                            >
                                Site Web
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'network' })}
                                className={`px-4 py-2 rounded ${game.activeTab === 'network' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}
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
            <div className="bg-gray-900 min-h-screen p-8 text-white text-center">
                <h1 className="text-3xl text-blue-500 mb-5">Détails de la Mission</h1>
                <div className={`p-5 rounded-lg max-w-2xl mx-auto ${game.selectedTeam === 'attackers' ? 'bg-red-500' : 'bg-green-500'}`}>
                    <h2 className="text-2xl mb-3">{role?.name} {role?.icon}</h2>
                    <p className="text-lg mb-3"><strong>Équipe :</strong> {game.selectedTeam === 'attackers' ? 'Attaquants' : 'Défenseurs'}</p>
                    <p className="text-lg mb-3"><strong>Spécialité :</strong> {role?.specialty}</p>
                    <p className="text-base mb-4"><strong>Description :</strong> {role?.description}</p>
                    <h3 className="text-lg mb-3">Tâches :</h3>
                    <ul className="list-disc text-left mx-auto mb-5 pl-5">
                        {role?.tasks.map((task, idx) => (
                            <li key={idx} className="mb-2">{task}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-base"
                    >
                        Retour à la partie
                    </button>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => {
        const winner = game.scores.attackers > game.scores.defenders ? 'Attaquants' : game.scores.defenders > game.scores.attackers ? 'Défenseurs' : 'Égalité';

        return (
            <div className="bg-gray-900 min-h-screen p-8 text-white text-center">
                <h1 className="text-3xl text-blue-500 mb-5">Partie Terminée</h1>
                <div className="bg-gray-800 p-5 rounded-lg max-w-2xl mx-auto">
                    <h2 className="text-2xl mb-4">Résultats</h2>
                    <p className="text-lg mb-3"><strong>Gagnant :</strong> {winner}</p>
                    <p className="text-lg mb-3"><strong>Scores :</strong> Attaquants : {game.scores.attackers} | Défenseurs : {game.scores.defenders}</p>
                    <button
                        onClick={handleReset}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-base"
                    >
                        Nouvelle Partie
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {game.state === 'waiting' && <WaitingRoomScreen key="waiting" />}
            {game.state === 'intro' && game.selectedRole && (
                <IntroAnimation
                    key="intro"
                    role={roles[game.selectedTeam]?.find((r) => r.id === game.selectedRole)}
                    team={game.selectedTeam}
                    onComplete={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                />
            )}
            {game.state === 'game' && <GameInterfaceScreen key="game" />}
            {game.state === 'role-details' && <RoleDetailsScreen key="role-details" />}
            {game.state === 'results' && <ResultsScreen key="results" />}
            {!['waiting', 'intro', 'game', 'role-details', 'results'].includes(game.state) && (
                <div key="error" className="text-red-500 text-center p-24">
                    <h2>État non reconnu : {game.state}</h2>
                    <button
                        onClick={() => dispatch({ type: 'SET_STATE', payload: 'waiting' })}
                        className="px-5 py-2 bg-blue-600 text-white rounded mt-3"
                    >
                        Retour à la salle d'attente
                    </button>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CyberWarGame;