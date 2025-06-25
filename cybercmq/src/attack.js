import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Shield, Sword, Clock, Globe, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import './CyberWarGame.css';

// Singleton WebSocket instance
let socketInstance = null;

function getSocket(token) {
    if (!socketInstance || socketInstance.disconnected) {
        socketInstance = io('https://cyberskills.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 30000,
        });

        let reconnectFailureCount = 0;
        const maxReconnectFailures = 5;

        socketInstance.on('reconnect_error', (error) => {
            console.error('Erreur de reconnexion WebSocket:', error);
            reconnectFailureCount++;
            if (reconnectFailureCount >= maxReconnectFailures) {
                socketInstance.disconnect();
                reconnectFailureCount = 0;
            }
        });

        socketInstance.on('reconnect', (attempt) => {
            console.log(`Reconnexion réussie après ${attempt} tentatives`);
            reconnectFailureCount = 0;
            socketInstance.emit('authenticate', token);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Erreur de connexion WebSocket:', error);
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
            className="min-h-screen flex flex-col items-center justify-center"
        >
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className={`text-4xl ${team === 'attackers' ? 'text-attaquants' : 'text-défenseurs'}`}
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
    const [timeLeft, setTimeLeft] = useState(600);

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
            <Clock className="mr-2" /> Temps : <span className="timer-value">{formatTime(timeLeft)}</span>
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
        <div className="panel">
            <h3 className="panel-title">Soumettre un Flag</h3>
            <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="Ex: FLAG-XSS-123"
                className="input w-full"
            />
            <button
                onClick={handleSubmit}
                className="button défenseurs mt-2"
            >
                Valider
            </button>
            {feedback && (
                <p className={`feedback ${feedback.includes('validé') ? '[data-status-success]' : '[data-status-failure]'}`}>{feedback}</p>
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
        <div className="terminal">
            <h2 className="panel-title">Terminal</h2>
            <div className="terminal-list">
                {output.map((line, idx) => (
                    <div key={idx} className="log-entry">{line}</div>
                ))}
            </div>
            <div className="terminal-prompt">
                <span>$</span>
                <input
                    type="text"
                    value={cmd}
                    onChange={(e) => setCmd(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && execute()}
                    placeholder="Ex: nmap -sV 10.0.0.1"
                    className="terminal-input"
                />
            </div>
            <p className="text-gray-400 text-sm mt-2">Tâches : {role.tasks.join(' | ')}</p>
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
            className="challenge-board"
        >
            <h3 className="panel-title">Protéger contre XSS</h3>
            <p className="mb-2">Choisis la règle pour bloquer les scripts.</p>
            <select
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                className="input w-full"
            >
                <option value="">Choisir...</option>
                <option>Block scripts</option>
                <option>Allow all</option>
                <option>Log scripts</option>
            </select>
            <button
                onClick={handleSubmit}
                className="button défenseurs mt-2"
            >
                Valider
            </button>
            {feedback && (
                <p className={`feedback ${feedback.includes('bloqué') ? '[data-status-success]' : '[data-status-failure]'}`}>{feedback}</p>
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
            className="challenge-board"
        >
            <h3 className="panel-title">Renforcer les Mots de Passe</h3>
            <p className="mb-2">Choisis une longueur minimale.</p>
            <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                className="input w-full"
            />
            <button
                onClick={handleSubmit}
                className="button défenseurs mt-2"
            >
                Valider
            </button>
            {feedback && (
                <p className={`feedback ${feedback.includes('sécurisés') ? '[data-status-success]' : '[data-status-failure]'}`}>{feedback}</p>
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
            className="challenge-board"
        >
            <h3 className="panel-title">Configurer le Pare-feu</h3>
            <p className="mb-2">Entre le port à bloquer.</p>
            <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="Ex: 22"
                className="input w-full"
            />
            <button
                onClick={handleSubmit}
                className="button défenseurs mt-2"
            >
                Valider
            </button>
            {feedback && (
                <p className={`feedback ${feedback.includes('bloqué') ? '[data-status-success]' : '[data-status-failure]'}`}>{feedback}</p>
            )}
        </motion.div>
    );
};

const WaitingRoomScreen = ({
                               connectedPlayers,
                               currentPlayer,
                               connectionStatus,
                               errorMessage,
                               handleReconnect,
                               reconnectAttempts,
                               handleForceStart,
                               isAdmin
                           }) => {
    return (
        <div className="waiting-room">
            {errorMessage && (
                <div className="error-message">
                    <p>{errorMessage}</p>
                    <button
                        onClick={handleReconnect}
                        disabled={reconnectAttempts >= 15}
                        className="button"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            <h1 className="waiting-room-title">Salle d'Attente - Technetron Bank CyberWar</h1>

            <p className={`connection-status ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                Statut : {connectionStatus === 'connected'
                ? `Connecté en tant que ${currentPlayer.name}`
                : 'En attente de connexion...'}
            </p>

            <div className="players-panel">
                <h3 className="players-title">Joueurs connectés ({connectedPlayers.length})</h3>

                <div className="team-section">
                    <h4 className="team-title attaquants">🔥 Attaquants</h4>
                    <div className="player-list">
                        {connectedPlayers
                            .filter((p) => p.team === 'attackers')
                            .map((player) => (
                                <div
                                    key={player.id}
                                    className={`player-item attaquants ${player.userId === currentPlayer.userId ? 'current-player' : ''}`}
                                >
                                    {player.name} - {player.roleName} {player.roleIcon} {player.userId === currentPlayer.userId ? '(Vous)' : ''}
                                </div>
                            ))}
                    </div>
                </div>

                <div className="team-section">
                    <h4 className="team-title défenseurs">🛡️ Défenseurs</h4>
                    <div className="player-list">
                        {connectedPlayers
                            .filter((p) => p.team === 'defenders')
                            .map((player) => (
                                <div
                                    key={player.id}
                                    className={`player-item défenseurs ${player.userId === currentPlayer.userId ? 'current-player' : ''}`}
                                >
                                    {player.name} - {player.roleName} {player.roleIcon} {player.userId === currentPlayer.userId ? '(Vous)' : ''}
                                </div>
                            ))}
                    </div>
                </div>

                <p className="waiting-message">
                    La partie démarrera automatiquement lorsqu'il y aura au moins un joueur dans chaque équipe.
                </p>

                {isAdmin && (
                    <button
                        onClick={handleForceStart}
                        className="button défenseurs mt-4"
                    >
                        Forcer le démarrage (Debug)
                    </button>
                )}
            </div>
        </div>
    );
};


const GameInterfaceScreen = ({
                                 game,
                                 dispatch,
                                 team,
                                 role,
                                 connectionStatus,
                                 reconnectAttempts,
                                 handleReconnect,
                                 handleSubmitFlag,
                                 handleAction,
                                 addLog,
                                 server,
                                 setServer,
                                 website,
                                 updateVuln,
                                 setMiniGame
                             }) => {
    return (
        <div className="game-container">
            {connectionStatus === 'disconnected' && (
                <div className="role-details-overlay">
                    <div className="role-details-container">
                        <div className="error-message">
                            <h3>Connexion perdue</h3>
                            <p>Tentative de reconnexion ({15 - reconnectAttempts} restantes)</p>
                            <button
                                onClick={handleReconnect}
                                disabled={reconnectAttempts >= 15}
                                className="button"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="header">
                <div className="header-content">
                    <h1 className="header-title">Technetron Bank - CyberWar</h1>
                    <div className="flex gap-5 items-center">
                        <GameTimer onTimeUp={() => dispatch({ type: 'timer-up', payload: 'results' })} />
                        <div className="score-card">
                            Score : <span className="attaquants">{game.scores.attackers}</span> - <span className="défenseurs">{game.scores.defenders}</span>
                        </div>
                        <button
                            onClick={() => dispatch({ type: 'SET_STATE', payload: 'role-details' })}
                            className="button défenseurs"
                        >
                            <Info className="mr-2" /> Mission
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <aside className="sidebar">
                    <div className={`role-panel ${game.selectedTeam}`}>
                        <div className="team-icon">{role?.icon}</div>
                        <h3 className="role-name">{role?.roleName}</h3>
                        <p>{role?.specialty}</p>
                    </div>

                    {game.selectedTeam === 'attackers' && (
                        <FlagSubmission
                            onSubmitFlag={handleSubmitFlag}
                            submittedFlags={game.submittedFlags}
                        />
                    )}

                    <div className="activity-log">
                        <h3 className="panel-title">Logs</h3>
                        {game.logs.map((log, idx) => (
                            <p key={idx} className="log-entry">{log}</p>
                        ))}
                    </div>
                </aside>

                <div className="content-wrapper">
                    <div className="tabs">
                        <button
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'website' })}
                            className={`tab-item ${game.activeTab === 'website' ? 'active-tab' : ''} ${game.selectedTeam}`}
                        >
                            Site Web
                        </button>
                        <button
                            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'network' })}
                            className={`tab-item ${game.activeTab === 'network' ? 'active-tab' : ''} ${game.selectedTeam}`}
                        >
                            Réseau
                        </button>
                    </div>

                    {game.activeTab === 'website' ? (
                        <WebsiteInterface
                            game={game}
                            updateVuln={updateVuln}
                            addLog={addLog}
                            handleAction={handleAction}
                            setMiniGame={setMiniGame}
                            website={website}
                        />
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


const RoleDetailsScreen = ({ game, dispatch, role }) => {
    return (
        <div className="role-details-overlay">
            <div className="role-details-container">
                <div className={`role-details ${game.selectedTeam}`}>
                    <h1 className="panel-title">Détails de la Mission</h1>
                    <h2 className="role-name">{role?.name} {role?.icon}</h2>
                    <p><strong>Équipe :</strong> {game.selectedTeam === 'attackers' ? 'Attaquants' : 'Défenseurs'}</p>
                    <p><strong>Spécialité :</strong> {role?.specialty}</p>
                    <p><strong>Description :</strong> {role?.description}</p>
                    <h3>Tâches :</h3>
                    <ul className="list-disc pl-5">
                        {role?.tasks.map((task, idx) => (
                            <li key={idx}>{task}</li>
                        ))}
                    </ul>
                    <button
                        onClick={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                        className="button défenseurs mt-4"
                    >
                        Retour à la partie
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResultsScreen = ({ game, handleReset }) => {
    const winner = game.scores.attackers > game.scores.defenders ? 'Attaquants' : game.scores.defenders > game.scores.attackers ? 'Défenseurs' : 'Égalité';

    return (
        <div className="waiting-room">
            <div className="results-panel">
                <h1 className={`results-title ${winner === 'Attaquants' ? 'attaquants' : winner === 'Défenseurs' ? 'défenseurs' : ''}`}>Partie terminée</h1>
                <h2>Gagnant : {winner}</h2>
                <div className="score-card attaquants">
                    Attaquants : {game.scores.attackers}
                </div>
                <div className="score-card défenseurs">
                    Défenseurs : {game.scores.defenders}
                </div>
                <button
                    onClick={handleReset}
                    className="button défenseurs"
                >
                    Nouvelle Partie
                </button>
            </div>
        </div>
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
    const [user, setUser] = useState(() => {
        const token = Cookies.get('token');
        if (!token) {
            return { id: null, username: null, role: null };
        }
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return {
                id: decoded.userId,
                username: decoded.username || `Player_${Math.random().toString(36).substr(2, 9)}`,
                role: decoded.role || 'USER'
            };
        } catch {
            return { id: null, username: null, role: null };
        }
    });
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
                payload: `[${new Date().toLocaleTimeString('fr-FR')}] ${game.selectedTeam === 'attackers' ? '💥' : '🗡️'} ${msg}`,
            });
            console.log('Log:', msg);
        },
        [game.selectedTeam]
    );

    const handleForceStart = useCallback(() => {
        if (socket && socket.connected) {
            socket.emit('force-start-game', { gameId, userId: user.id });
            addLog('Tentative de démarrage forcé du match.');
            console.log('DEBUG: Force start game emitted', { gameId, userId: user.id });
        } else {
            setErrorMessage('Impossible de démarrer le jeu : non connecté au serveur.');
            addLog('Erreur : force start non connecté.');
            console.log('DEBUG: Force start failed - not connected');
        }
    }, [socket, gameId, user, addLog]);

    const handleReconnect = useCallback(() => {
        if (reconnectAttempts >= 15) {
            setErrorMessage('Impossible de reconnecter après 15 tentatives.');
            addLog('Échec de la reconnexion : limite d’essais atteinte.');
            console.log('DEBUG: Max reconnect attempts reached');
            return;
        }
        socketInstance = null;
        const token = Cookies.get('token');
        const newSocket = getSocket(token);
        setSocket(newSocket);
        setReconnectAttempts((prev) => prev + 1); // Fix: Changed setTimeoutReconnectAttempts to setReconnectAttempts
        if (playerId && gameId && user.id && user.username) {
            newSocket.emit('rejoin-game', {
                gameId: gameId,
                playerId,
                userId: user.id,
                playerName: user.username,
            });
            addLog('Tentative de reconnexion...');
            console.log('DEBUG: Reconnect emitted', { gameId, playerId, userId: user.id, playerName: user.username });
        } else {
            setErrorMessage('Erreur : informations utilisateur manquantes pour la reconnexion.');
            addLog('Erreur lors de la reconnexion : informations utilisateur manquantes.');
            console.log('DEBUG: Reconnect failed - missing user info');
        }
    }, [reconnectAttempts, playerId, gameId, user, addLog]);

    useEffect(() => {
        const token = Cookies.get('token');
        if (!token) {
            setErrorMessage('Erreur : Token d’authentification manquant.');
            addLog('Échec de la jointure : token manquant.');
            console.log('DEBUG: No token found');
            return;
        }

        console.log('DEBUG: Initializing WebSocket with user:', { userId: user.id, username: user.username, gameId });
        const newSocket = getSocket(token);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnectionStatus('connected');
            setReconnectAttempts(0); // Fix: Changed setTimeoutReconnectAttempts to setReconnectAttempts
            setErrorMessage('');
            console.log('DEBUG: WebSocket connected, ID:', newSocket.id);
            newSocket.emit('authenticate', token);
            if (user.id && user.username) {
                console.log('DEBUG: Emitting join-game', { gameId, userId: user.id, playerName: user.username });
                newSocket.emit('join-game', {
                    gameId,
                    userId: user.id,
                    playerName: user.username,
                });
                addLog(`Connecté au serveur en tant que ${user.username}.`);
            } else {
                setErrorMessage('Erreur : informations utilisateur manquantes.');
                addLog('Erreur lors de la jointure : informations utilisateur manquantes.');
                console.log('DEBUG: Join-game failed - missing user info');
            }
        });

        newSocket.on('connect_error', (error) => {
            setConnectionStatus('disconnected');
            setErrorMessage('Erreur de connexion au serveur. Retentez ou vérifiez votre réseau.');
            addLog('Erreur de connexion au serveur.');
            console.error('DEBUG: Connect error:', error);
        });

        newSocket.on('authenticated', (data) => {
            console.log('DEBUG: Authenticated', data);
            addLog('Authentification WebSocket réussie.');
        });

        newSocket.on('authError', (error) => {
            setErrorMessage('Erreur d’authentification : ' + error.message);
            addLog(`Erreur d’authentification : ${error.message}`);
            console.log('DEBUG: Auth error:', error);
            Cookies.remove('token');
        });

        newSocket.on('initial-players', (players) => {
            console.log('DEBUG: Received initial-players', { players });
            setConnectedPlayers(players.map((p) => ({
                id: p.id,
                userId: p.userId,
                name: p.playerName,
                team: p.team === 'attackers' ? 'attackers' : 'defenders',
                roleId: p.roleId,
                roleName: role[p.team === 'attackers' ? 'attackers' : 'defenders']?.find((r) => r.id === p.roleId)?.name || 'Unknown',
                roleIcon: role[p.team === 'attackers' ? 'p.teamers' : 'defenders']?.find((r) => r.id === p.roleId)?.icon || '',
            })));
            addLog(`Synchronisation initiale : ${players.length} joueurs connectés.`);
        });

        newSocket.on('player-joined', (player) => {
            console.log('DEBUG: Player joined', player);

            setConnectedPlayers((prevPlayers) => {
                const updated = prevPlayers.filter((p) => p.userId !== player.userId);
                const playerTeam = player.team === 'attackers' ? 'attackers' : 'defenders';
                const assignedRole = role[playerTeam]?.find((r) => r.id === player.roleId);

                const newPlayer = {
                    id: player.id,
                    userId: player.userId,
                    name: player.playerName || 'Unknown Player',
                    team: playerTeam,
                    roleId: player.roleId,
                    roleName: assignedRole?.name || 'Unknown',
                    roleIcon: assignedRole?.icon || '',
                };

                const newList = [...updated, newPlayer];
                console.log('DEBUG: Updated connectedPlayers', newList);
                return newList;
            });

            addLog(`Joueur ${player.playerName || 'Inconnu'} a rejoint (${player.team}).`);
        });

        newSocket.on('player-left', (player) => {
            console.log('DEBUG: Player left', player);

            setConnectedPlayers((prev) => {
                const updated = prev.filter((p) => p.userId !== player.userId);
                console.log('DEBUG: Updated connectedPlayers after leave', updated);
                return updated;
            });

            addLog(`Joueur ${player.playerName || 'Inconnu'} a quitté.`);
        });

        newSocket.on('role-assigned', (data) => {
            console.log('DEBUG: Role assigned', data);

            const playerTeam = data.team === 'attackers' ? 'attackers' : 'defenders';
            const assignedRole = roles[playerTeam]?.find((r) => r.id === data.roleId);

            dispatch({ type: 'SET_TEAM', payload: playerTeam });
            dispatch({ type: 'SET_ROLE', payload: assignedRole });
            setPlayerId(data.playerId);
            setUser((prev) => ({ ...prev, username: data.playerName }));

            setAssignedRoles((prev) => [...new Set([...prev, data.roleId])]);

            setConnectedPlayers((prev) => {
                const updatedPrev = prev.filter((p) => p.userId !== data.userId);
                const updatedPlayer = {
                    id: data.playerId,
                    userId: data.userId,
                    name: data.playerName,
                    team: playerTeam,
                    roleId: data.roleId,
                    roleName: assignedRole?.name || 'Unknown',
                    roleIcon: assignedRole?.icon || '',
                };

                const newList = [...updatedPrev, updatedPlayer];
                console.log('DEBUG: Updated connectedPlayers after role assign', newList);
                return newList;
            });

            addLog(`Rôle assigné : ${assignedRole?.name || 'Unknown'} (${playerTeam}).`);
        });


        newSocket.on('game-state-update', (gameState) => {
            console.log('DEBUG: Game state update', gameState);

            setConnectedPlayers(
                gameState.players.map((p) => {
                    const playerTeam = p.team === 'attackers' ? 'attackers' : 'defenders';
                    const assignedRole = roles[playerTeam]?.find((r) => r.id === p.roleId);

                    return {
                        id: p.id,
                        userId: p.userId,
                        name: p.playerName,
                        team: playerTeam,
                        roleId: p.roleId,
                        roleName: assignedRole?.name || 'Unknown',
                        roleIcon: assignedRole?.icon || '',
                    };
                })
            );

            setGameStatus(gameState.status);

            const rolesAssigned = gameState.players.map((p) => p.roleId);
            setAssignedRoles([...new Set(rolesAssigned)]);

            if (gameState.status === 'playing' && game.state !== 'game') {
                dispatch({ type: 'SET_STATE', payload: 'intro' });
            }
        });


        newSocket.on('player-action', (actionData) => {
                console.log('DEBUG: Player action', actionData);
                addLog(`${actionData.playerName || 'Unknown'}: ${actionData.message}`);
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
                console.log('DEBUG: Score update', scores);
                dispatch({ type: 'UPDATE_SCORES', payload: scores });
            });

            newSocket.on('game-started', (data) => {
                console.log('DEBUG: Game started', data);
                dispatch({ type: 'SET_STATE', payload: 'intro' });
                addLog('Partie démarrée.');
            });

            newSocket.on('game-ended', (data) => {
                console.log('DEBUG: Game ended', data);
                dispatch({ type: 'SET_STATE', payload: 'results' });
                addLog(`Partie terminée. Gagnant : ${data.winner || 'Unknown'}`);
            });

            newSocket.on('rejoin-success', (data) => {
                console.log('DEBUG: Rejoin success', data);
                dispatch({ type: 'SET_TEAM', payload: data.team === 'attackers' ? 'attackers' : 'defenders' });
                dispatch({ type: 'SET_ROLE', payload: roles[data.team === 'attackers' ? 'attackers' : 'defenders'].find((r) => r.id === data.roleId) });
                dispatch({ type: 'SET_ROLE_ASSIGNED' });
                setPlayerId(data.playerId);
                setUser((prev) => ({ ...prev, username: data.playerName }));
                setConnectedPlayers((prev) => {
                    const updatedPrev = prev.filter((p) => p.userId !== data.userId);
                    const updatedPlayer = {
                        id: data.playerId,
                        userId: data.userId,
                        name: data.playerName,
                        team: data.team === 'attackers' ? 'attackers' : 'defenders',
                        roleId: data.roleId,
                        roleName: roles[data.team === 'attackers' ? 'attackers' : 'defenders'].find((r) => r.id === data.roleId)?.name || '',
                        roleIcon: roles[data.team === 'attackers' ? 'attackers' : 'defenders'].find((r) => r.id === data.roleId)?.icon || '',
                    };
                    const newList = [...updatedPrev, updatedPlayer];
                    console.log('DEBUG: Updated connectedPlayers after rejoin', newList);
                    return newList;
                });
                addLog(`Reconnexion réussie : ${data.roleName || 'Unknown'} (${data.team}).`);
            });

            newSocket.on('error', (errorData) => {
                console.log('DEBUG: Server error', errorData);
                setErrorMessage(errorData.message || 'Erreur inconnue du serveur.');
                addLog(`Erreur serveur : ${errorData.message || 'Unknown'}`);
            });

            return () => {
                console.log('DEBUG: Déconnexion du socket');
                newSocket.disconnect();
                setConnectionStatus('disconnected');
            };
        }, [game.state, gameId, user, addLog]);

        const sendAction = useCallback(
            (actionType, actionData) => {
                if (socket && socket.connected) {
                    socket.emit('player-action', {
                        playerId,
                        userId: user.id,
                        gameId,
                        type: actionType,
                        data: actionData,
                        playerName: user.username,
                        timestamp: Date.now(),
                    });
                    console.log('DEBUG: Action sent', { actionType, data: actionData });
                } else {
                    addLog('Impossible d’enregistrer l’action : non connecté.');
                    setErrorMessage('Non connecté au serveur. Tentative de reconnexion...');
                    console.log('DEBUG: Action failed - not connected');
                    handleReconnect();
                }
            },
            [socket, playerId, gameId, user, addLog, handleReconnect]
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
            console.log('DEBUG: Resetting game');
            dispatch({ type: 'RESET' });
            setWebsite(websiteInitialState);
            setServer(serverInitialState);
            setMiniGame(null);
            setGameStatus('waiting');
            setAssignedRoles([]);
            socket.emit('join-game', {
                gameId,
                userId: user.id,
                playerName: user.username,
            });
            console.log('DEBUG: Re-emitted join-game after reset', { gameId, userId: user.id });
        }, [socket, gameId, user]);

        const updateVuln = (vuln, updates) => {
            setWebsite((prev) => ({
                ...prev,
                vulnerabilities: { ...prev.vulnerabilities, [vuln]: { ...prev.vulnerabilities[vuln], ...updates } },
            }));
            sendAction(updates.exploited ? 'vulnerability-exploited' : 'vulnerability-fixed', {
                vulnerability: vuln,
                message: updates.exploited ? `Vulnérabilité ${vuln} exploitée.` : `Vulnérabilité ${vuln} corrigée.`,
            });
            console.log('DEBUG: Vulnerability updated', { vuln: vuln, updates });
        };

        const WebsiteInterface = ({ game, updateVuln, addLog, handleAction, setMiniGame, website }) => {
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
                <div className="interface-content">
                    <h2 className="panel-title">Technetron Bank</h2>
                    <nav className="tabs">
                        {['home', 'osint', 'login', 'contact'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`tab ${page === p ? 'active' : ''} ${game.selectedTeam}`}
                            >
                                {p === 'home' ? 'Accueil' : p === 'osint' ? 'OSINT' : p === 'login' ? 'Connexion' : 'Contact'}
                            </button>
                        ))}
                    </nav>
                    {miniGame && (
                        <div className="mb-4">
                            {miniGame === 'xss' && (
                                <XssGame
                                    onComplete={() => {
                                        updateVuln('xss', { fixed: true });
                                        handleAction({ team: 'defenders', message: 'XSS corrigé', points: 50 });
                                        setMiniGame(null);
                                    }}
                                />
                            )}
                            {miniGame === 'weak-password' && (
                                <PasswordGame
                                    onComplete={() => {
                                        updateVuln('weak_password', { fixed: true });
                                        handleAction({ team: 'defenders', message: 'Mots de passe sécurisés', points: 50 });
                                        setMiniGame(null);
                                    }}
                                />
                            )}
                            {miniGame === 'ssh' && (
                                <FirewallGame
                                    onComplete={() => {
                                        setServer((prev) => ({
                                            ...prev,
                                            services: { ...prev.services, ssh: { ...prev.services.ssh, fixed: true } },
                                        }));
                                        handleAction({ team: 'defenders', message: 'SSH sécurisé', points: 50 });
                                        setMiniGame(null);
                                    }}
                                />
                            )}
                        </div>
                    )}
                    {feedback && (
                        <p className={`feedback ${feedback.includes('Flag') ? '[data-status-success]' : '[data-status-failure]'}`}>{feedback}</p>
                    )}
                    {page === 'home' && (
                        <div>
                            <h3 className="panel-title">Bienvenue</h3>
                            <p>Technetron Bank, votre banque sécurisée depuis 2025.</p>
                            <Globe className="mt-4" />
                        </div>
                    )}
                    {page === 'osint' && (
                        <div>
                            <h3 className="panel-title">OSINT</h3>
                            {website.osint.map((item, idx) => (
                                <div key={idx} className="challenge-item">
                                    <p><strong>{item.source} :</strong> {item.info}</p>
                                    {game.selectedTeam === 'attackers' && (
                                        <button
                                            onClick={() => addLog(`OSINT analysé : ${item.source}.`)}
                                            className="button attaquants mt-2"
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
                            <h3 className="panel-title">Connexion</h3>
                            <input
                                type="text"
                                value={form.user}
                                onChange={(e) => setForm({ ...form, user: e.target.value })}
                                placeholder="Utilisateur"
                                className="input w-full"
                            />
                            <input
                                type="text"
                                value={form.pass}
                                onChange={(e) => setForm({ ...form, pass: e.target.value })}
                                placeholder="Mot de passe"
                                className="input w-full"
                            />
                            <button
                                onClick={() => {
                                    const passFlag = testWeakPass(form.user, form.pass);
                                    setFeedback(passFlag ? 'Flag: FLAG-PASS-789' : 'Identifiants incorrects.');
                                }}
                                className="button défenseurs mt-2"
                            >
                                Connexion
                            </button>
                            {game.selectedTeam === 'defenders' && !website.vulnerabilities.weak_password?.fixed && (
                                <button
                                    onClick={() => setMiniGame('weak-password')}
                                    className="button défenseurs mt-2"
                                >
                                    Sécuriser les Mots de Passe
                                </button>
                            )}
                        </div>
                    )}
                    {page === 'contact' && (
                        <div>
                            <h3 className="panel-title">Contact</h3>
                            <textarea
                                value={form.comment}
                                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                placeholder="Message..."
                                className="textarea w-full h-24"
                            />
                            <button
                                onClick={() => {
                                    const xssFlag = testXSS(form.comment);
                                    setFeedback(xssFlag ? 'Flag: FLAG-XSS-123' : 'Message envoyé.');
                                }}
                                className="button défenseurs mt-2"
                            >
                                Envoyer
                            </button>
                            {game.selectedTeam === 'defenders' && !website.vulnerabilities.xss?.fixed && (
                                <button
                                    onClick={() => setMiniGame('xss')}
                                    className="button défenseurs mt-2"
                                >
                                    Corriger XSS
                                </button>
                            )}
                        </div>
                    )}
                </div>
            );
        };

        const currentPlayer = connectedPlayers.find((p) => p.userId === user.id) || {
            id: playerId,
            userId: user.id,
            name: user.username,
            team: game.selectedTeam || 'unknown',
            roleName: game.selectedRole?.name || 'Unknown',
            roleIcon: game.selectedRole?.icon || '',
        };

        return (
            <AnimatePresence>
                {game.state === 'waiting' && (
                    <WaitingRoomScreen
                        connectedPlayers={connectedPlayers}
                        currentPlayer={currentPlayer}
                        connectionStatus={connectionStatus}
                        errorMessage={errorMessage}
                        handleReconnect={handleReconnect}
                        reconnectAttempts={reconnectAttempts}
                        handleForceStart={handleForceStart}
                        isAdmin={user.role === 'ADMIN'}
                    />
                )}
                {game.state === 'intro' && game.selectedRole && (
                    <IntroAnimation
                        role={game.selectedRole}
                        team={game.selectedTeam}
                        onComplete={() => dispatch({ type: 'SET_STATE', payload: 'game' })}
                    />
                )}
                {game.state === 'game' && game.selectedRole && (
                    <GameInterfaceScreen
                        game={game}
                        dispatch={dispatch}
                        role={game.selectedRole}
                        connectionStatus={connectionStatus}
                        reconnectAttempts={reconnectAttempts}
                        handleReconnect={handleReconnect}
                        handleSubmitFlag={handleSubmitFlag}
                        handleAction={handleAction}
                        addLog={addLog}
                        server={server}
                        setServer={setServer}
                        website={website}
                        updateVuln={updateVuln}
                        setMiniGame={setMiniGame}
                    />
                )}
                {game.state === 'role-details' && game.selectedRole && (
                    <RoleDetailsScreen
                        game={game}
                        dispatch={dispatch}
                        role={game.selectedRole}
                    />
                )}
                {game.state === 'results' && (
                    <ResultsScreen
                        game={game}
                        handleReset={handleReset}
                    />
                )}
            </AnimatePresence>
        );
    };

    export default CyberWarGame;