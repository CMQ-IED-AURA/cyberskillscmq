import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Unlock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './CyberWarGame.css';

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro'); // intro, game, results
    const [currentPhase, setCurrentPhase] = useState('website'); // website, server
    const [timeLeft, setTimeLeft] = useState(420); // 7 minutes en secondes
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attackers: 0, defenders: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);

    // États spécifiques au jeu
    const initialWebsiteState = {
        currentPage: 'home',
        vulnerabilities: {
            xss: { discovered: false, exploited: false, patched: false },
            sqli: { discovered: false, exploited: false, patched: false },
            csrf: { discovered: false, exploited: false, patched: false }
        },
        userAccounts: ['admin', 'user1', 'guest'],
        database: ['users', 'orders', 'products']
    };

    const initialServerState = {
        services: {
            ssh: { running: true, vulnerable: true, patched: false },
            ftp: { running: true, vulnerable: true, patched: false },
            web: { running: true, vulnerable: false, patched: false }
        },
        files: ['/etc/passwd', '/var/log/auth.log', '/home/user/.ssh/id_rsa'],
        processes: ['apache2', 'sshd', 'mysql'],
        ports: [22, 80, 443, 21, 3306]
    };

    const [websiteState, setWebsiteState] = useState(initialWebsiteState);
    const [serverState, setServerState] = useState(initialServerState);

    const terminalInputRef = useRef(null);

    // Rôles et leurs capacités
    const roles = {
        attackers: [
            { id: 'web-hacker', name: 'Web Hacker', icon: '🕷️', speciality: 'XSS, SQL Injection', actions: ['Scan XSS', 'SQL Injection', 'CSRF Test'] },
            { id: 'social-engineer', name: 'Social Engineer', icon: '👤', speciality: 'Phishing, OSINT', actions: ['Phish User', 'Gather OSINT', 'Spoof Email'] },
            { id: 'network-scanner', name: 'Network Scanner', icon: '📡', speciality: 'Port Scan, Reconnaissance', actions: ['Port Scan', 'Network Recon', 'Ping Sweep'] },
            { id: 'exploit-dev', name: 'Exploit Developer', icon: '⚡', speciality: 'Buffer Overflow, RCE', actions: ['Exploit RCE', 'Buffer Overflow', 'Shellcode Inject'] },
            { id: 'crypto-breaker', name: 'Crypto Breaker', icon: '🔓', speciality: 'Hash Cracking, Encryption', actions: ['Crack Hash', 'Decrypt File', 'Keylog'] }
        ],
        defenders: [
            { id: 'security-analyst', name: 'Security Analyst', icon: '🛡️', speciality: 'Monitoring, Detection', actions: ['Monitor Logs', 'Detect Intrusion', 'Analyze Traffic'] },
            { id: 'incident-responder', name: 'Incident Responder', icon: '🚨', speciality: 'Forensics, Mitigation', actions: ['Run Forensics', 'Mitigate Attack', 'Isolate Host'] },
            { id: 'network-admin', name: 'Network Admin', icon: '🌐', speciality: 'Firewall, IDS/IPS', actions: ['Configure Firewall', 'Enable IDS', 'Block IP'] },
            { id: 'sys-hardener', name: 'System Hardener', icon: '🔒', speciality: 'Patches, Configuration', actions: ['Apply Patch', 'Harden Config', 'Disable Service'] },
            { id: 'threat-hunter', name: 'Threat Hunter', icon: '🎯', speciality: 'IOC Detection, Analysis', actions: ['Hunt IOCs', 'Analyze Malware', 'Trace Attacker'] }
        ]
    };

    // Assign random role at game start
    useEffect(() => {
        if (!roleAssigned) {
            const teams = ['attackers', 'defenders'];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const randomRole = roles[randomTeam][Math.floor(Math.random() * roles[randomTeam].length)];
            setSelectedTeam(randomTeam);
            setSelectedRole(randomRole.id);
            setGameLog([`[${new Date().toLocaleTimeString()}] Vous êtes ${randomRole.name} (${randomTeam === 'attackers' ? '⚔️ Attaquants' : '🛡️ Défenseurs'})`]);
            setRoleAssigned(true);
        }
    }, [roleAssigned]);

    // --- Fonctions de base du jeu ---

    const addLog = (message) => {
        const newLog = `[${new Date().toLocaleTimeString()}] ${selectedTeam === 'attackers' ? '⚔️' : '🛡️'} ${message}`;
        setGameLog(prev => [...prev.slice(-9), newLog]);
    };

    const handleAction = (team, message, points) => {
        addLog(message);
        if (team === 'attackers') {
            setScores(prev => ({ ...prev, attackers: prev.attackers + points }));
        } else {
            setScores(prev => ({ ...prev, defenders: prev.defenders + points }));
        }
    };

    const handleRestartGame = () => {
        setGameState('intro');
        setCurrentPhase('website');
        setTimeLeft(420);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attackers: 0, defenders: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        setRoleAssigned(false);
    };

    // --- Composants d'UI ---

    const IntroAnimation = () => {
        const [currentPlayer, setCurrentPlayer] = useState(0);
        const [showRoles, setShowRoles] = useState(false);

        useEffect(() => {
            const timer = setInterval(() => {
                setCurrentPlayer(prev => {
                    if (prev < 9) return prev + 1;
                    setShowRoles(true);
                    return prev;
                });
            }, 500);

            const gameTimer = setTimeout(() => {
                setGameState('game');
            }, 8000);

            return () => {
                clearInterval(timer);
                clearTimeout(gameTimer);
            };
        }, []);

        return (
            <div className="cyber-game-container intro-container">
                <div className="text-center">
                    <h1 className="intro-title glitch" data-text="CYBER WAR 5v5">🚀 CYBER WAR 5v5 🚀</h1>
                    <div className="player-grid">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className={`player-icon ${i < currentPlayer ? (i < 5 ? 'attackers' : 'defenders') : ''}`}
                            >
                                {i < currentPlayer && (i < 5 ? '⚔️' : '🛡️')}
                            </div>
                        ))}
                    </div>
                    {showRoles && (
                        <div className="role-grid">
                            <div className="role-panel">
                                <h3 className="team-title attackers neon-text-red">🔴 ATTACKERS</h3>
                                {roles.attackers.map((role, i) => (
                                    <div
                                        key={role.id}
                                        className="role-item attackers neon-text-red"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    >
                                        <span className="role-icon">{role.icon}</span> {role.name}
                                    </div>
                                ))}
                            </div>
                            <div className="role-panel">
                                <h3 className="team-title defenders neon-text-blue">🔵 DEFENDERS</h3>
                                {roles.defenders.map((role, i) => (
                                    <div
                                        key={role.id}
                                        className="role-item defenders neon-text-blue"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    >
                                        <span className="role-icon">{role.icon}</span> {role.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="neon-text-cyan mt-8 text-xl">Préparez-vous au combat cyber...</div>
                </div>
            </div>
        );
    };

    const GameInterface = () => {
        const [activeTab, setActiveTab] = useState(currentPhase);

        useEffect(() => {
            if (gameState === 'game' && timeLeft > 0) {
                const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
                return () => clearTimeout(timer);
            } else if (timeLeft === 0) {
                if (currentPhase === 'website') {
                    setCurrentPhase('server');
                    setActiveTab('server');
                    setTimeLeft(420);
                    addLog("Phase terminée. Passage à l'attaque du serveur.");
                } else {
                    setGameState('results');
                }
            }
        }, [timeLeft, gameState]);

        const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
        const role = roles[selectedTeam]?.find(r => r.id === selectedRole);

        return (
            <div className="cyber-game-container">
                <header className="bg-panel border-b-2 border-cyber-blue p-4">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <h1 className="neon-text-cyan text-2xl font-bold">CYBER WAR</h1>
                            <div className="neon-text-blue text-lg">
                                Phase: <span className="neon-text-yellow">{currentPhase.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                                <div className="text-sm neon-text-green">TEMPS</div>
                                <div className="text-2xl font-mono neon-text-yellow">{formatTime(timeLeft)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm neon-text-green">SCORE</div>
                                <div className="text-lg">
                                    <span className="neon-text-red">{scores.attackers}</span> -{' '}
                                    <span className="neon-text-blue">{scores.defenders}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 overflow-hidden">
                    <aside className="w-80 bg-panel border-r-2 border-cyber-blue p-4 flex flex-col">
                        {role && (
                            <div className={`team-panel ${selectedTeam}`}>
                                <div className="text-center">
                                    <div className="role-icon text-3xl mb-2 neon-text-yellow">{role.icon}</div>
                                    <div className={`role-name font-bold text-lg neon-text-${selectedTeam === 'attackers' ? 'red' : 'blue'}`}>
                                        {role.name}
                                    </div>
                                    <div className="role-speciality text-sm neon-text-green">{role.speciality}</div>
                                </div>
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="neon-text-cyan text-lg font-bold mb-3">🎯 OBJECTIFS</h3>
                            <div className="space-y-2 text-sm">
                                {selectedTeam === 'attackers' ? (
                                    <>
                                        <div className="neon-text-green">
                                            <CheckCircle className="inline mr-2" size={16} /> Découvrir des failles
                                        </div>
                                        <div className="neon-text-yellow">
                                            <AlertTriangle className="inline mr-2" size={16} /> Exploiter les failles
                                        </div>
                                        <div className="neon-text-red">
                                            <Target className="inline mr-2" size={16} /> Accès Admin
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="neon-text-blue">
                                            <Shield className="inline mr-2" size={16} /> Détecter les attaques
                                        </div>
                                        <div className="neon-text-green">
                                            <Lock className="inline mr-2" size={16} /> Corriger les failles
                                        </div>
                                        <div className="neon-text-red">
                                            <Zap className="inline mr-2" size={16} /> Bloquer l'IP
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="neon-text-cyan text-lg font-bold mb-3">📋 ACTIVITÉ</h3>
                            <div className="bg-black rounded p-3 flex-1 overflow-y-auto text-xs font-mono">
                                {gameLog.map((log, i) => (
                                    <div key={i} className="mb-1 neon-text-green">{log}</div>
                                ))}
                            </div>
                        </div>
                    </aside>
                    <div className="flex-1 p-6 flex flex-col">
                        <div className="mb-6">
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => setActiveTab('website')}
                                    className={`action-btn ${activeTab === 'website' ? 'attack-btn' : ''}`}
                                >
                                    🌐 Site Web
                                </button>
                                <button
                                    onClick={() => setActiveTab('server')}
                                    className={`action-btn ${activeTab === 'server' ? 'defend-btn' : ''}`}
                                >
                                    🖥️ Serveur
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'website' ? <WebsiteInterface role={role} /> : <ServerInterface role={role} />}
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    const WebsiteInterface = ({ role }) => {
        const [currentPage, setCurrentPage] = useState('home');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '' });

        return (
            <div className="team-panel">
                <h2 className="team-title neon-text-cyan">🌐 TechCorp Website</h2>
                <div className="flex space-x-2 mb-4 border-b border-cyber-blue pb-4">
                    {['home', 'login', 'contact'].map(p => (
                        <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`action-btn ${currentPage === p ? 'attack-btn' : ''}`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="bg-panel text-white rounded-lg p-6 flex-1">
                    {currentPage === 'home' && (
                        <div>
                            <h1 className="neon-text-blue text-3xl font-bold mb-4">Bienvenue chez TechCorp</h1>
                            <p className="neon-text-green">Votre partenaire de confiance en solutions technologiques.</p>
                        </div>
                    )}
                    {currentPage === 'login' && (
                        <div>
                            <h2 className="neon-text-blue text-2xl font-bold mb-4">Connexion</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="terminal-input w-full p-2 rounded"
                                    placeholder="Utilisateur"
                                />
                                <input
                                    type="password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="terminal-input w-full p-2 rounded"
                                    placeholder="Mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAction(selectedTeam, `Tentative SQLi avec user: ${formData.username}`, 15)}
                                    className="action-btn attack-btn"
                                >
                                    Se connecter
                                </button>
                            </div>
                        </div>
                    )}
                    {currentPage === 'contact' && (
                        <div>
                            <h2 className="neon-text-blue text-2xl font-bold mb-4">Contact</h2>
                            <div className="space-y-4">
                                <textarea
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    className="terminal-input w-full p-2 rounded h-24"
                                    placeholder="Votre message..."
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAction(selectedTeam, `Tentative XSS: ${formData.comment.substring(0, 20)}...`, 10)}
                                    className="action-btn defend-btn"
                                >
                                    Envoyer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 bg-panel rounded-lg p-4">
                    <h3 className="team-title neon-text-cyan">
                        {selectedTeam === 'attackers' ? '⚔️ Outils d\'Attaque' : '🛡️ Outils de Défense'}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(selectedTeam, `${action} exécuté`, 10)}
                                className={`action-btn ${selectedTeam === 'attackers' ? 'attack-btn' : 'defend-btn'}`}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ServerInterface = ({ role }) => {
        const [terminalInput, setTerminalInput] = useState('');
        const [terminalHistory, setTerminalHistory] = useState([
            'Bienvenue sur le serveur TechCorp (Linux v5.4)',
            'Tapez "help" pour les commandes.'
        ]);
        const terminalEndRef = useRef(null);

        useEffect(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [terminalHistory]);

        const executeCommand = (command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Commande exécutée: ${command}`);

            switch (cmdParts[0]) {
                case 'help':
                    output = 'Commandes: ls, ps, netstat, cat, nmap, ssh, whoami';
                    break;
                case 'ls':
                    output = 'config.txt  logs/  passwords.bak  run.sh';
                    break;
                case 'ps':
                    output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n9012\tmysql';
                    break;
                case 'netstat':
                    output = 'TCP\t0.0.0.0:22\tLISTENING\nTCP\t0.0.0.0:80\tLISTENING';
                    break;
                case 'cat':
                    output = cmdParts[1] === 'passwords.bak' ? 'root:a_sUp3r_S3cr3t_P4ssW0rd' : 'Erreur: Fichier non trouvé ou non lisible.';
                    break;
                case 'nmap':
                    output = 'Scan Nmap... Ports ouverts: 22 (SSH), 80 (HTTP)';
                    break;
                case 'ssh':
                    output = 'Tentative de connexion SSH...';
                    break;
                case 'whoami':
                    output = 'root';
                    break;
                default:
                    output = `bash: ${command}: commande introuvable`;
            }
            setTerminalHistory(prev => [...prev, `root@techcorp:~# ${command}`, output]);
            setTerminalInput('');
        };

        return (
            <div className="team-panel">
                <h2 className="team-title neon-text-cyan">🖥️ Accès Serveur TechCorp</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-panel p-3 rounded">
                        <h3 className="font-bold neon-text-green mb-2">🟢 Services Actifs</h3>
                        <div className="text-sm neon-text-white">SSH, HTTP, FTP, MySQL</div>
                    </div>
                    <div className="bg-panel p-3 rounded">
                        <h3 className="font-bold neon-text-yellow mb-2">⚠️ Vulnérabilités</h3>
                        <div className="text-sm neon-text-white">SSH (Weak Auth), FTP (Anonymous)</div>
                    </div>
                    <div className="bg-panel p-3 rounded">
                        <h3 className="font-bold neon-text-red mb-2">🚨 Alertes Récentes</h3>
                        <div className="text-sm neon-text-white">0 nouvelles alertes</div>
                    </div>
                </div>
                <div
                    className="bg-black font-mono text-sm p-4 rounded-lg flex-1 flex flex-col"
                    onClick={() => terminalInputRef.current.focus()}
                >
                    <div className="overflow-y-auto flex-1">
                        {terminalHistory.map((line, i) => (
                            <div
                                key={i}
                                className={line.startsWith('root@techcorp') ? 'neon-text-yellow' : 'neon-text-green'}
                            >
                                {line}
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                    <div className="flex">
                        <span className="neon-text-yellow">root@techcorp:~# </span>
                        <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') executeCommand(terminalInput);
                            }}
                            className="terminal-input"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="mt-4 bg-panel rounded-lg p-4">
                    <h3 className="team-title neon-text-cyan">
                        {selectedTeam === 'attackers' ? '⚔️ Actions Serveur' : '🛡️ Contre-mesures'}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(selectedTeam, `${action} exécuté`, 15)}
                                className={`action-btn ${selectedTeam === 'attackers' ? 'attack-btn' : 'defend-btn'}`}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => {
        const winner = scores.attackers > scores.defenders ? 'Attaquants' : 'Défenseurs';
        const isTie = scores.attackers === scores.defenders;

        return (
            <div className="cyber-game-container">
                <div className="text-center bg-panel p-10 rounded-lg backdrop-blur-sm">
                    <h1 className="lobby-title glitch" data-text="FIN DE LA PARTIE">FIN DE LA PARTIE</h1>
                    {isTie ? (
                        <h2 className="neon-text-yellow text-4xl mb-8">ÉGALITÉ !</h2>
                    ) : (
                        <h2
                            className={`neon-text-${winner === 'Attaquants' ? 'red' : 'blue'} text-4xl mb-8`}
                        >
                            🏆 LES {winner.toUpperCase()} ONT GAGNÉ ! 🏆
                        </h2>
                    )}
                    <div className="flex justify-center items-center space-x-8 text-2xl mb-8">
                        <div className="team-panel attackers">
                            <div className="neon-text-red">ATTAQUANTS</div>
                            <div className="font-bold text-4xl">{scores.attackers}</div>
                        </div>
                        <div className="team-panel defenders">
                            <div className="neon-text-blue">DÉFENSEURS</div>
                            <div className="font-bold text-4xl">{scores.defenders}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleRestartGame}
                        className="start-battle-btn glitch"
                        data-text="REJOUER"
                    >
                        🕹️ REJOUER 🕹️
                    </button>
                </div>
            </div>
        );
    };

    if (gameState === 'intro') {
        return <IntroAnimation />;
    }
    if (gameState === 'game') {
        return <GameInterface />;
    }
    if (gameState === 'results') {
        return <ResultsScreen />;
    }

    return <div className="cyber-game-container neon-text-cyan">Chargement...</div>;
};

export default CyberWarGame;