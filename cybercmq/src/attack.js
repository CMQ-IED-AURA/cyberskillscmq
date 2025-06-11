import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Unlock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './CyberWarGame.css';

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('lobby'); // lobby, intro, game, results
    const [currentPhase, setCurrentPhase] = useState('website'); // website, server
    const [timeLeft, setTimeLeft] = useState(420); // 7 minutes en secondes
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attackers: 0, defenders: 0 });
    const [gameLog, setGameLog] = useState([]);

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
            { id: 'web-hacker', name: 'Web Hacker', icon: '🕷️', speciality: 'XSS, SQL Injection' },
            { id: 'social-engineer', name: 'Social Engineer', icon: '👤', speciality: 'Phishing, OSINT' },
            { id: 'network-scanner', name: 'Network Scanner', icon: '📡', speciality: 'Port Scan, Reconnaissance' },
            { id: 'exploit-dev', name: 'Exploit Developer', icon: '⚡', speciality: 'Buffer Overflow, RCE' },
            { id: 'crypto-breaker', name: 'Crypto Breaker', icon: '🔓', speciality: 'Hash Cracking, Encryption' }
        ],
        defenders: [
            { id: 'security-analyst', name: 'Security Analyst', icon: '🛡️', speciality: 'Monitoring, Detection' },
            { id: 'incident-responder', name: 'Incident Responder', icon: '🚨', speciality: 'Forensics, Mitigation' },
            { id: 'network-admin', name: 'Network Admin', icon: '🌐', speciality: 'Firewall, IDS/IPS' },
            { id: 'sys-hardener', name: 'System Hardener', icon: '🔒', speciality: 'Patches, Configuration' },
            { id: 'threat-hunter', name: 'Threat Hunter', icon: '🎯', speciality: 'IOC Detection, Analysis' }
        ]
    };

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
        setGameState('lobby');
        setCurrentPhase('website');
        setTimeLeft(420);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attackers: 0, defenders: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
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
            <div className="intro-container">
                <div className="text-center">
                    <h1 className="intro-title">🚀 CYBER WAR 5v5 🚀</h1>
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
                                <h3 className="team-title attackers">🔴 ATTACKERS</h3>
                                {roles.attackers.map((role, i) => (
                                    <div
                                        key={role.id}
                                        className="role-item attackers"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    >
                                        <span className="role-icon">{role.icon}</span> {role.name}
                                    </div>
                                ))}
                            </div>
                            <div className="role-panel">
                                <h3 className="team-title defenders">🔵 DEFENDERS</h3>
                                {roles.defenders.map((role, i) => (
                                    <div
                                        key={role.id}
                                        className="role-item defenders"
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

    const RoleSelection = () => (
        <div className="lobby-screen">
            <h1 className="lobby-title">🏴‍☠️ CYBER WAR ARENA 🏴‍☠️</h1>
            <div className="team-container">
                <div className="team-panel attackers">
                    <h2 className="team-title attackers">⚔️ ATTACKERS ⚔️</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {roles.attackers.map(role => (
                            <button
                                key={role.id}
                                onClick={() => {
                                    setSelectedTeam('attackers');
                                    setSelectedRole(role.id);
                                }}
                                className={`role-button attackers ${
                                    selectedTeam === 'attackers' && selectedRole === role.id ? 'selected' : ''
                                }`}
                            >
                                <span className="role-icon">{role.icon}</span>
                                <div className="text-left">
                                    <div className="role-name">{role.name}</div>
                                    <div className="role-speciality">{role.speciality}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="team-panel defenders">
                    <h2 className="team-title defenders">🛡️ DEFENDERS 🛡️</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {roles.defenders.map(role => (
                            <button
                                key={role.id}
                                onClick={() => {
                                    setSelectedTeam('defenders');
                                    setSelectedRole(role.id);
                                }}
                                className={`role-button defenders ${
                                    selectedTeam === 'defenders' && selectedRole === role.id ? 'selected' : ''
                                }`}
                            >
                                <span className="role-icon">{role.icon}</span>
                                <div className="text-left">
                                    <div className="role-name">{role.name}</div>
                                    <div className="role-speciality">{role.speciality}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {selectedTeam && selectedRole && (
                <div className="text-center mt-8">
                    <button onClick={() => setGameState('intro')} className="start-battle-btn">
                        🚀 COMMENCER LA BATAILLE 🚀
                    </button>
                </div>
            )}
        </div>
    );

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

        if (gameState === 'lobby') {
            return <RoleSelection />;
        }

        return (
            <div className="cyber-game-container">
                <header className="bg-gray-900 border-b-2 border-cyan-400 p-4">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <h1 className="neon-text-cyan text-2xl font-bold">CYBER WAR</h1>
                            <div className="text-lg">
                                Phase: <span className="neon-text-yellow">{currentPhase.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                                <div className="text-sm text-gray-400">TEMPS</div>
                                <div className="text-2xl font-mono neon-text-yellow">{formatTime(timeLeft)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-400">SCORE</div>
                                <div className="text-lg">
                                    <span className="neon-text-red">{scores.attackers}</span> -{' '}
                                    <span className="neon-text-blue">{scores.defenders}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 overflow-hidden">
                    <aside className="w-80 bg-gray-900 border-r-2 border-gray-700 p-4 flex flex-col">
                        {role && (
                            <div
                                className={`p-3 rounded-lg mb-6 ${
                                    selectedTeam === 'attackers' ? 'bg-red-900/50' : 'bg-blue-900/50'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="role-icon text-3xl mb-2">{role.icon}</div>
                                    <div className="role-name font-bold text-lg">{role.name}</div>
                                    <div className="role-speciality text-sm text-gray-400">{role.speciality}</div>
                                </div>
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="neon-text-cyan text-lg font-bold mb-3">🎯 OBJECTIFS</h3>
                            <div className="space-y-2 text-sm">
                                {selectedTeam === 'attackers' ? (
                                    <>
                                        <div>
                                            <CheckCircle className="inline mr-2 text-green-500" size={16} /> Découvrir des failles
                                        </div>
                                        <div>
                                            <AlertTriangle className="inline mr-2 text-yellow-500" size={16} /> Exploiter les failles
                                        </div>
                                        <div>
                                            <Target className="inline mr-2 text-red-500" size={16} /> Accès Admin
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <Shield className="inline mr-2 text-blue-500" size={16} /> Détecter les attaques
                                        </div>
                                        <div>
                                            <Lock className="inline mr-2 text-green-500" size={16} /> Corriger les failles
                                        </div>
                                        <div>
                                            <Zap className="inline mr-2 text-red-500" size={16} /> Bloquer l'IP
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="neon-text-cyan text-lg font-bold mb-3">📋 ACTIVITÉ</h3>
                            <div className="bg-black rounded p-3 flex-1 overflow-y-auto text-xs font-mono">
                                {gameLog.map((log, i) => (
                                    <div key={i} className="mb-1 text-green-400">{log}</div>
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
                        <div className="flex-1 overflow-y-auto">{activeTab === 'website' ? <WebsiteInterface /> : <ServerInterface />}</div>
                    </div>
                </main>
            </div>
        );
    };

    const WebsiteInterface = () => {
        const [currentPage, setCurrentPage] = useState('home');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '' });

        return (
            <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                <h2 className="neon-text-cyan text-2xl font-bold mb-4">🌐 TechCorp Website</h2>
                <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-4">
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
                <div className="bg-white text-black rounded-lg p-6 flex-1">
                    {currentPage === 'home' && (
                        <div>
                            <h1 className="text-3xl font-bold text-blue-600 mb-4">Bienvenue chez TechCorp</h1>
                            <p>Votre partenaire de confiance en solutions technologiques.</p>
                        </div>
                    )}
                    {currentPage === 'login' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Connexion</h2>
                            <form className="space-y-4">
                                <input
                                    type="text"
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Utilisateur"
                                />
                                <input
                                    type="password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAction(selectedTeam, `Tentative SQLi avec user: ${formData.username}`, 15)}
                                    className="action-btn attack-btn"
                                >
                                    Se connecter
                                </button>
                            </form>
                        </div>
                    )}
                    {currentPage === 'contact' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Contact</h2>
                            <form className="space-y-4">
                                <textarea
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    className="w-full p-2 border rounded h-24"
                                    placeholder="Votre message..."
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAction(selectedTeam, `Tentative XSS: ${formData.comment.substring(0, 20)}...`, 10)}
                                    className="action-btn defend-btn"
                                >
                                    Envoyer
                                </button>
                            </form>
                        </div>
                    )}
                </div>
                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                    <h3 className="neon-text-cyan text-lg font-bold mb-3">
                        {selectedTeam === 'attackers' ? '⚔️ Outils d\'Attaque' : '🛡️ Outils de Défense'}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {selectedTeam === 'attackers' ? (
                            <>
                                <button
                                    onClick={() => handleAction('attackers', 'Scan XSS lancé', 5)}
                                    className="action-btn attack-btn"
                                >
                                    🕷️ Scan XSS
                                </button>
                                <button
                                    onClick={() => handleAction('attackers', 'Injection SQL tentée', 10)}
                                    className="action-btn attack-btn"
                                >
                                    💉 SQL Injection
                                </button>
                                <button
                                    onClick={() => handleAction('attackers', 'Scan CSRF lancé', 5)}
                                    className="action-btn attack-btn"
                                >
                                    🔄 CSRF Test
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleAction('defenders', 'WAF activé', 10)}
                                    className="action-btn defend-btn"
                                >
                                    🛡️ Activer WAF
                                </button>
                                <button
                                    onClick={() => handleAction('defenders', 'Monitoring renforcé', 5)}
                                    className="action-btn defend-btn"
                                >
                                    📊 Monitor
                                </button>
                                <button
                                    onClick={() => handleAction('defenders', 'Inputs nettoyés', 15)}
                                    className="action-btn defend-btn"
                                >
                                    🧹 Sanitize
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ServerInterface = () => {
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
            <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                <h2 className="neon-text-cyan text-2xl font-bold mb-4">🖥️ Accès Serveur TechCorp</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="font-bold neon-text-green mb-2">🟢 Services Actifs</h3>
                        <div className="text-sm">SSH, HTTP, FTP, MySQL</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="font-bold neon-text-yellow mb-2">⚠️ Vulnérabilités</h3>
                        <div className="text-sm">SSH (Weak Auth), FTP (Anonymous)</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="font-bold neon-text-red mb-2">🚨 Alertes Récentes</h3>
                        <div className="text-sm">0 nouvelles alertes</div>
                    </div>
                </div>
                <div
                    className="bg-black font-mono text-sm text-green-400 p-4 rounded-lg flex-1 flex flex-col"
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
                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                    <h3 className="neon-text-cyan text-lg font-bold mb-3">
                        {selectedTeam === 'attackers' ? '⚔️ Actions Serveur' : '🛡️ Contre-mesures'}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {selectedTeam === 'attackers' ? (
                            <>
                                <button
                                    onClick={() => handleAction('attackers', 'Scan de ports (Nmap)', 10)}
                                    className="action-btn attack-btn"
                                >
                                    📡 Scan Nmap
                                </button>
                                <button
                                    onClick={() => handleAction('attackers', 'Bruteforce SSH lancé', 20)}
                                    className="action-btn attack-btn"
                                >
                                    🔑 Bruteforce SSH
                                </button>
                                <button
                                    onClick={() => handleAction('attackers', 'Exfiltration de logs', 15)}
                                    className="action-btn attack-btn"
                                >
                                    💾 Exfiltrer Logs
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleAction('defenders', 'Firewall reconfiguré', 15)}
                                    className="action-btn defend-btn"
                                >
                                    🧱 Firewall
                                </button>
                                <button
                                    onClick={() => handleAction('defenders', 'Patch SSH appliqué', 20)}
                                    className="action-btn defend-btn"
                                >
                                    🔒 Patch SSH
                                </button>
                                <button
                                    onClick={() => handleAction('defenders', 'Analyse des logs en cours', 10)}
                                    className="action-btn defend-btn"
                                >
                                    🔍 Forensics
                                </button>
                            </>
                        )}
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
                <div className="text-center bg-gray-800/50 p-10 rounded-lg backdrop-blur-sm">
                    <h1 className="lobby-title">FIN DE LA PARTIE</h1>
                    {isTie ? (
                        <h2 className="neon-text-yellow text-4xl mb-8">ÉGALITÉ !</h2>
                    ) : (
                        <h2
                            className={`neon-text-${
                                winner === 'Attaquants' ? 'red' : 'blue'
                            } text-4xl mb-8`}
                        >
                            🏆 LES {winner.toUpperCase()} ONT GAGNÉ ! 🏆
                        </h2>
                    )}
                    <div className="flex justify-center items-center space-x-8 text-2xl mb-8">
                        <div className="p-4 rounded-lg bg-red-900/50">
                            <div className="neon-text-red">ATTAQUANTS</div>
                            <div className="font-bold text-4xl">{scores.attackers}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-900/50">
                            <div className="neon-text-blue">DÉFENSEURS</div>
                            <div className="font-bold text-4xl">{scores.defenders}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleRestartGame}
                        className="start-battle-btn"
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
    if (gameState === 'game' || gameState === 'lobby') {
        return <GameInterface />;
    }
    if (gameState === 'results') {
        return <ResultsScreen />;
    }

    return <div className="cyber-game-container">Chargement...</div>;
};

export default CyberWarGame;