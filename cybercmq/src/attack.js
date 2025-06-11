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
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-6xl font-bold mb-8 animate-pulse">🚀 CYBER WAR 5v5 🚀</h1>
                    <div className="grid grid-cols-5 gap-4 mb-8">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${ i < currentPlayer ? (i < 5 ? 'bg-red-500 animate-bounce' : 'bg-blue-500 animate-bounce') : 'bg-gray-700' }`}>
                                {i < currentPlayer && (i < 5 ? '⚔️' : '🛡️')}
                            </div>
                        ))}
                    </div>
                    {showRoles && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                                <div className="bg-red-900/50 p-6 rounded-lg">
                                    <h3 className="text-2xl text-red-300 mb-4">🔴 ATTACKERS</h3>
                                    {roles.attackers.map((role, i) => (<div key={role.id} className="text-white mb-2 animate-slide-in" style={{animationDelay: `${i * 0.2}s`}}>{role.icon} {role.name}</div>))}
                                </div>
                                <div className="bg-blue-900/50 p-6 rounded-lg">
                                    <h3 className="text-2xl text-blue-300 mb-4">🔵 DEFENDERS</h3>
                                    {roles.defenders.map((role, i) => (<div key={role.id} className="text-white mb-2 animate-slide-in" style={{animationDelay: `${i * 0.2}s`}}>{role.icon} {role.name}</div>))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-8 text-xl animate-pulse">Préparez-vous au combat cyber...</div>
                </div>
            </div>
        );
    };

    const LobbyScreen = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8 text-white">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">🏴‍☠️ CYBER WAR ARENA 🏴‍☠️</h1>
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
                        <h2 className="text-3xl text-red-400 mb-6 text-center">⚔️ ATTACKERS ⚔️</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {roles.attackers.map(role => (
                                <button key={role.id} onClick={() => { setSelectedTeam('attackers'); setSelectedRole(role.id); }} className={`p-4 rounded-lg border-2 transition-all duration-300 ${ selectedTeam === 'attackers' && selectedRole === role.id ? 'border-red-400 bg-red-800/50' : 'border-red-700 bg-red-900/30 hover:bg-red-800/40'}`}>
                                    <div className="flex items-center space-x-3"><span className="text-2xl">{role.icon}</span><div className="text-left"><div className="font-bold">{role.name}</div><div className="text-red-300 text-sm">{role.speciality}</div></div></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
                        <h2 className="text-3xl text-blue-400 mb-6 text-center">🛡️ DEFENDERS 🛡️</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {roles.defenders.map(role => (
                                <button key={role.id} onClick={() => { setSelectedTeam('defenders'); setSelectedRole(role.id); }} className={`p-4 rounded-lg border-2 transition-all duration-300 ${ selectedTeam === 'defenders' && selectedRole === role.id ? 'border-blue-400 bg-blue-800/50' : 'border-blue-700 bg-blue-900/30 hover:bg-blue-800/40'}`}>
                                    <div className="flex items-center space-x-3"><span className="text-2xl">{role.icon}</span><div className="text-left"><div className="font-bold">{role.name}</div><div className="text-blue-300 text-sm">{role.speciality}</div></div></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {selectedTeam && selectedRole && (<div className="text-center mt-8"><button onClick={() => setGameState('intro')} className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-lg text-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">🚀 COMMENCER LA BATAILLE 🚀</button></div>)}
            </div>
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

        const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
        const role = roles[selectedTeam]?.find(r => r.id === selectedRole);

        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <header className="bg-gray-900 border-b-2 border-cyan-400 p-4">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4"><h1 className="text-2xl font-bold text-cyan-400">CYBER WAR</h1><div className="text-lg">Phase: <span className="text-yellow-400">{currentPhase.toUpperCase()}</span></div></div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center"><div className="text-sm text-gray-400">TEMPS</div><div className="text-2xl font-mono text-yellow-400">{formatTime(timeLeft)}</div></div>
                            <div className="text-center"><div className="text-sm text-gray-400">SCORE</div><div className="text-lg"><span className="text-red-400">{scores.attackers}</span> - <span className="text-blue-400">{scores.defenders}</span></div></div>
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 overflow-hidden">
                    <aside className="w-80 bg-gray-900 border-r-2 border-gray-700 p-4 flex flex-col">
                        {role && <div className={`p-3 rounded-lg mb-6 ${selectedTeam === 'attackers' ? 'bg-red-900/50' : 'bg-blue-900/50'}`}><div className="text-center"><div className="text-3xl mb-2">{role.icon}</div><div className="font-bold text-lg">{role.name}</div><div className="text-sm text-gray-400">{role.speciality}</div></div></div>}
                        <div className="mb-6"><h3 className="text-lg font-bold mb-3 text-cyan-400">🎯 OBJECTIFS</h3><div className="space-y-2 text-sm">{selectedTeam === 'attackers' ? (<><div><CheckCircle className="inline mr-2 text-green-500" size={16}/> Découvrir des failles</div><div><AlertTriangle className="inline mr-2 text-yellow-500" size={16}/> Exploiter les failles</div><div><Target className="inline mr-2 text-red-500" size={16}/> Accès Admin</div></>) : (<><div><Shield className="inline mr-2 text-blue-500" size={16}/> Détecter les attaques</div><div><Lock className="inline mr-2 text-green-500" size={16}/> Corriger les failles</div><div><Zap className="inline mr-2 text-red-500" size={16}/> Bloquer l'IP</div></>)}</div></div>
                        <div className="flex-1 flex flex-col min-h-0"><h3 className="text-lg font-bold mb-3 text-cyan-400">📋 ACTIVITÉ</h3><div className="bg-black rounded p-3 flex-1 overflow-y-auto text-xs font-mono">{gameLog.map((log, i) => (<div key={i} className="mb-1 text-green-400">{log}</div>))}</div></div>
                    </aside>
                    <div className="flex-1 p-6 flex flex-col"><div className="mb-6"><div className="flex space-x-4"><button onClick={() => setActiveTab('website')} className={`px-4 py-2 rounded-lg font-bold ${activeTab==='website'?'bg-cyan-600 text-white':'bg-gray-700 text-gray-300 h:bg-gray-600'}`}>🌐 Site Web</button><button onClick={() => setActiveTab('server')} className={`px-4 py-2 rounded-lg font-bold ${activeTab==='server'?'bg-cyan-600 text-white':'bg-gray-700 text-gray-300 h:bg-gray-600'}`}>🖥️ Serveur</button></div></div><div className="flex-1 overflow-y-auto">{activeTab === 'website' ? <WebsiteInterface /> : <ServerInterface />}</div></div>
                </main>
            </div>
        );
    };

    const WebsiteInterface = () => {
        const [currentPage, setCurrentPage] = useState('home');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '' });

        return (
            <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">🌐 TechCorp Website</h2>
                <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-4">
                    {['home', 'login', 'contact'].map(p => <button key={p} onClick={()=>setCurrentPage(p)} className={`px-3 py-1 rounded text-sm ${currentPage===p?'bg-blue-600':'bg-gray-700'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>)}
                </div>
                <div className="bg-white text-black rounded-lg p-6 flex-1">
                    {currentPage === 'home' && (<div><h1 className="text-3xl font-bold text-blue-600 mb-4">Bienvenue chez TechCorp</h1><p>Votre partenaire de confiance en solutions technologiques.</p></div>)}
                    {currentPage === 'login' && (<div><h2 className="text-2xl font-bold mb-4">Connexion</h2><form className="space-y-4"><input type="text" onChange={(e)=>setFormData({...formData, username: e.target.value})} className="w-full p-2 border rounded" placeholder="Utilisateur"/><input type="password" onChange={(e)=>setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded" placeholder="Mot de passe"/><button type="button" onClick={() => handleAction(selectedTeam, `Tentative SQLi avec user: ${formData.username}`, 15)} className="bg-blue-600 text-white px-4 py-2 rounded h:bg-blue-700">Se connecter</button></form></div>)}
                    {currentPage === 'contact' && (<div><h2 className="text-2xl font-bold mb-4">Contact</h2><form className="space-y-4"><textarea onChange={(e)=>setFormData({...formData, comment: e.target.value})} className="w-full p-2 border rounded h-24" placeholder="Votre message..."/><button type="button" onClick={() => handleAction(selectedTeam, `Tentative XSS: ${formData.comment.substring(0, 20)}...`, 10)} className="bg-green-600 text-white px-4 py-2 rounded h:bg-green-700">Envoyer</button></form></div>)}
                </div>
                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">{selectedTeam === 'attackers' ? '⚔️ Outils d\'Attaque' : '🛡️ Outils de Défense'}</h3>
                    <div className="grid grid-cols-3 gap-3">{selectedTeam === 'attackers' ? (<><button onClick={() => handleAction('attackers', 'Scan XSS lancé', 5)} className="bg-red-600 p-2 rounded h:bg-red-700">🕷️ Scan XSS</button><button onClick={() => handleAction('attackers', 'Injection SQL tentée', 10)} className="bg-red-600 p-2 rounded h:bg-red-700">💉 SQL Injection</button><button onClick={() => handleAction('attackers', 'Scan CSRF lancé', 5)} className="bg-red-600 p-2 rounded h:bg-red-700">🔄 CSRF Test</button></>) : (<><button onClick={() => handleAction('defenders', 'WAF activé', 10)} className="bg-blue-600 p-2 rounded h:bg-blue-700">🛡️ Activer WAF</button><button onClick={() => handleAction('defenders', 'Monitoring renforcé', 5)} className="bg-blue-600 p-2 rounded h:bg-blue-700">📊 Monitor</button><button onClick={() => handleAction('defenders', 'Inputs nettoyés', 15)} className="bg-blue-600 p-2 rounded h:bg-blue-700">🧹 Sanitize</button></>)}</div>
                </div>
            </div>
        );
    };

    const ServerInterface = () => {
        const [terminalInput, setTerminalInput] = useState('');
        const [terminalHistory, setTerminalHistory] = useState([ 'Bienvenue sur le serveur TechCorp (Linux v5.4)', 'Tapez "help" pour les commandes.' ]);
        const terminalEndRef = useRef(null);

        useEffect(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, [terminalHistory]);

        const executeCommand = (command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Commande exécutée: ${command}`);

            switch(cmdParts[0]) {
                case 'help': output = 'Commandes: ls, ps, netstat, cat, nmap, ssh, whoami'; break;
                case 'ls': output = 'config.txt  logs/  passwords.bak  run.sh'; break;
                case 'ps': output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n9012\tmysql'; break;
                case 'netstat': output = 'TCP\t0.0.0.0:22\tLISTENING\nTCP\t0.0.0.0:80\tLISTENING'; break;
                case 'cat': output = cmdParts[1] === 'passwords.bak' ? 'root:a_sUp3r_S3cr3t_P4ssW0rd' : 'Erreur: Fichier non trouvé ou non lisible.'; break;
                case 'nmap': output = 'Scan Nmap... Ports ouverts: 22 (SSH), 80 (HTTP)'; break;
                case 'ssh': output = 'Tentative de connexion SSH...'; break;
                case 'whoami': output = 'root'; break;
                default: output = `bash: ${command}: commande introuvable`;
            }
            setTerminalHistory(prev => [...prev, `root@techcorp:~# ${command}`, output]);
            setTerminalInput('');
        };

        return (
            <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">🖥️ Accès Serveur TechCorp</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-800 p-3 rounded"><h3 className="font-bold text-green-400 mb-2">🟢 Services Actifs</h3><div className="text-sm">SSH, HTTP, FTP, MySQL</div></div>
                    <div className="bg-gray-800 p-3 rounded"><h3 className="font-bold text-yellow-400 mb-2">⚠️ Vulnérabilités</h3><div className="text-sm">SSH (Weak Auth), FTP (Anonymous)</div></div>
                    <div className="bg-gray-800 p-3 rounded"><h3 className="font-bold text-red-400 mb-2">🚨 Alertes Récentes</h3><div className="text-sm">0 nouvelles alertes</div></div>
                </div>

                {/* --- DÉBUT DE LA PARTIE AJOUTÉE --- */}
                <div className="bg-black font-mono text-sm text-green-400 p-4 rounded-lg flex-1 flex flex-col" onClick={() => terminalInputRef.current.focus()}>
                    <div className="overflow-y-auto flex-1">
                        {terminalHistory.map((line, i) => (
                            <div key={i} className={line.startsWith('root@techcorp') ? 'text-yellow-400' : 'text-green-400'}>{line}</div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                    <div className="flex">
                        <span className="text-yellow-400">root@techcorp:~#&nbsp;</span>
                        <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') executeCommand(terminalInput); }}
                            className="bg-transparent border-none outline-none text-green-400 flex-1"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">{selectedTeam === 'attackers' ? '⚔️ Actions Serveur' : '🛡️ Contre-mesures'}</h3>
                    <div className="grid grid-cols-3 gap-3">{selectedTeam === 'attackers' ? (<><button onClick={() => handleAction('attackers', 'Scan de ports (Nmap)', 10)} className="bg-red-600 p-2 rounded h:bg-red-700">📡 Scan Nmap</button><button onClick={() => handleAction('attackers', 'Bruteforce SSH lancé', 20)} className="bg-red-600 p-2 rounded h:bg-red-700">🔑 Bruteforce SSH</button><button onClick={() => handleAction('attackers', 'Exfiltration de logs', 15)} className="bg-red-600 p-2 rounded h:bg-red-700">💾 Exfiltrer Logs</button></>) : (<><button onClick={() => handleAction('defenders', 'Firewall reconfiguré', 15)} className="bg-blue-600 p-2 rounded h:bg-blue-700">🧱 Firewall</button><button onClick={() => handleAction('defenders', 'Patch SSH appliqué', 20)} className="bg-blue-600 p-2 rounded h:bg-blue-700">🔒 Patch SSH</button><button onClick={() => handleAction('defenders', 'Analyse des logs en cours', 10)} className="bg-blue-600 p-2 rounded h:bg-blue-700"> forensics</button></>)}</div>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => {
        const winner = scores.attackers > scores.defenders ? 'Attaquants' : 'Défenseurs';
        const isTie = scores.attackers === scores.defenders;

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white">
                <div className="text-center bg-gray-800/50 p-10 rounded-lg backdrop-blur-sm">
                    <h1 className="text-5xl font-bold mb-4">FIN DE LA PARTIE</h1>
                    {isTie ? (
                        <h2 className="text-4xl text-yellow-400 mb-8 animate-pulse">ÉGALITÉ !</h2>
                    ) : (
                        <h2 className={`text-4xl mb-8 animate-pulse ${winner === 'Attaquants' ? 'text-red-500' : 'text-blue-500'}`}>
                            🏆 LES {winner.toUpperCase()} ONT GAGNÉ ! 🏆
                        </h2>
                    )}

                    <div className="flex justify-center items-center space-x-8 text-2xl mb-8">
                        <div className="p-4 rounded-lg bg-red-900/50">
                            <div className="text-red-400">ATTAQUANTS</div>
                            <div className="font-bold text-4xl">{scores.attackers}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-900/50">
                            <div className="text-blue-400">DÉFENSEURS</div>
                            <div className="font-bold text-4xl">{scores.defenders}</div>
                        </div>
                    </div>

                    <button
                        onClick={handleRestartGame}
                        className="bg-gradient-to-r from-green-500 to-cyan-500 px-8 py-4 rounded-lg text-xl font-bold hover:from-green-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
                    >
                        🕹️ REJOUER 🕹️
                    </button>
                </div>
            </div>
        );
    };

    if (gameState === 'lobby') {
        return <LobbyScreen />;
    }
    if (gameState === 'intro') {
        return <IntroAnimation />;
    }
    if (gameState === 'game') {
        return <GameInterface />;
    }
    if (gameState === 'results') {
        return <ResultsScreen />;
    }

    return <div>Chargement...</div>;
};

export default CyberWarGame;