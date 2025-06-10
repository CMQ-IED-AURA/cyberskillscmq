import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Données simulées des systèmes
const systems = [
    {
        id: 1,
        name: 'NeonCorp Web',
        description: 'Portail web public de NeonCorp.',
        interface: 'web',
        vulnerabilities: [
            { id: 1, name: 'XSS', points: 80, role: 'Web Exploiter', exploit: '<script>alert("Hacked!")</script>', fix: 'Enable CSP', log: 'Injection détectée' },
            { id: 2, name: 'CSRF', points: 90, role: 'Web Exploiter', exploit: '<form action="/update" method="POST"><input name="email" value="hacker@evil.com"></form>', fix: 'Add CSRF tokens', log: 'Mise à jour non autorisée' },
            { id: 3, name: 'SQL Injection', points: 100, role: 'SQL Injector', exploit: "' OR '1'='1", fix: 'Requêtes paramétrées', log: 'Erreur SQL' },
        ],
        pages: ['home', 'login', 'profile', 'comments'],
    },
    {
        id: 2,
        name: 'File Server',
        description: 'Serveur de stockage interne.',
        interface: 'terminal',
        vulnerabilities: [
            { id: 4, name: 'Path Traversal', points: 110, role: 'File Hacker', exploit: 'curl http://server/file?path=../../etc/passwd', fix: 'Restreindre open_basedir', log: 'Tentative de traversée' },
            { id: 5, name: 'Privilege Escalation', points: 120, role: 'Privilege Escalator', exploit: 'sudo /bin/sh', fix: 'Renforcer sudoers', log: 'Sudo non autorisé' },
        ],
        files: ['index.php', '.env', 'config.yaml'],
        commands: ['ls', 'cat .env', 'whoami'],
    },
    {
        id: 3,
        name: 'Database',
        description: 'Base de données utilisateurs de NeonCorp.',
        interface: 'database',
        vulnerabilities: [
            { id: 6, name: 'Weak Credentials', points: 90, role: 'SQL Injector', exploit: 'mysql -u root -proot', fix: 'Mots de passe forts', log: 'Connexion faible' },
            { id: 7, name: 'Unfiltered Query', points: 110, role: 'SQL Injector', exploit: 'DROP TABLE users;', fix: 'Limiter permissions', log: 'Requête dangereuse' },
        ],
        tables: ['users', 'orders'],
    },
    {
        id: 4,
        name: 'Network',
        description: 'Infrastructure réseau de NeonCorp.',
        interface: 'network',
        vulnerabilities: [
            { id: 8, name: 'Open Port', points: 100, role: 'Network Scanner', exploit: 'nmap -sV 192.168.1.1', fix: 'Bloquer port 8080', log: 'Scan de port' },
            { id: 9, name: 'Weak SSH', points: 95, role: 'Network Scanner', exploit: 'ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 user@server', fix: 'Mettre à jour SSH', log: 'SSH faible' },
        ],
        services: ['http:80', 'ssh:22', 'tomcat:8080'],
    },
];

// Données de reconnaissance
const reconOutputs = {
    web: { 'curl http://portal': 'Formulaires: login, profile, comments', 'dirb http://portal': 'Caché: /admin (401)' },
    terminal: { ls: 'index.php .env config.yaml', whoami: 'www-data' },
    database: { 'SHOW TABLES': 'users, orders', 'SELECT * FROM users LIMIT 1': 'id: 1, name: admin' },
    network: { 'nmap -sV 192.168.1.1': '80/http, 22/ssh, 8080/tomcat', 'netstat -tuln': 'tcp 0.0.0.0:80, 0.0.0.0:8080' },
};

// Rôles
const attackerRoles = ['Web Exploiter', 'SQL Injector', 'File Hacker', 'Network Scanner', 'Privilege Escalator'];
const defenderRoles = ['Web Sanitizer', 'DB Hardener', 'File Securer', 'Network Firewall', 'System Monitor'];

const CyberWar = () => {
    const [gameState, setGameState] = useState({
        phase: 'intro',
        turn: 1,
        maxTurns: 5,
        timeLeft: 60,
        systemHealth: 100,
        attackerScore: 0,
        defenderScore: 0,
        actionLog: [],
        selectedSystem: null,
        attackerInput: '',
        defenderInput: '',
        terminalOutput: { attackers: [], defenders: [] },
        webForm: { login: '', comment: '', profile: '' },
        webPage: 'home',
        players: { attackers: [], defenders: [] },
        actions: { attackers: [], defenders: {} },
    });
    const [introProgress, setIntroProgress] = useState(0);

    // Initialisation du jeu
    useEffect(() => {
        if (gameState.phase === 'intro') {
            const system = systems[Math.floor(Math.random() * systems.length)];
            setGameState(prev => ({
                ...prev,
                selectedSystem: system,
                actionLog: [`[${new Date().toLocaleTimeString()}] ${system.name} ciblé !`],
                players: {
                    attackers: [...attackerRoles].sort(() => Math.random() - 0.5).slice(0, 5).map((role, i) => ({
                        id: i + 1,
                        role,
                        avatar: `Hacker-${i + 1}`,
                    })),
                    defenders: [...defenderRoles].sort(() => Math.random() - 0.5).slice(0, 5).map((role, i) => ({
                        id: i + 1,
                        role,
                        avatar: `Defender-${i + 6}`,
                    })),
                },
            }));

            // Animation d'intro
            const introSteps = setInterval(() => {
                setIntroProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(introSteps);
                        setGameState(prev => ({ ...prev, phase: 'playing' }));
                        return 100;
                    }
                    return prev + 10;
                });
            }, 300);
            return () => clearInterval(introSteps);
        }
    }, [gameState.phase]);

    // Timer du jeu
    useEffect(() => {
        if (gameState.phase !== 'playing' || gameState.timeLeft <= 0) return;
        const timer = setInterval(() => {
            setGameState(prev => {
                const newTime = prev.timeLeft - 1;
                if (newTime <= 0 && prev.turn < prev.maxTurns) {
                    endTurn();
                    return { ...prev, timeLeft: 60, turn: prev.turn + 1 };
                } else if (newTime <= 0) {
                    return { ...prev, phase: 'ended' };
                }
                return { ...prev, timeLeft: newTime };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState.phase, gameState.timeLeft]);

    // Gestion des inputs
    const handleInput = (team, inputType, input) => {
        const command = input.trim();
        if (!command) return;

        const terminalOutput = { ...gameState.terminalOutput };
        let output = 'Commande invalide.';
        let actionLog = [...gameState.actionLog];
        const { interface: systemInterface } = gameState.selectedSystem;

        if (command === 'help') {
            output = team === 'attackers'
                ? `Recon: ${Object.keys(reconOutputs[systemInterface]).join(', ')}\nExploits: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`
                : `Monitor: tail /var/log/syslog\nFixes: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`;
            terminalOutput[team].push(`> ${command}`, output);
            setGameState(prev => ({ ...prev, [team === 'attackers' ? 'attackerInput' : 'defenderInput']: '', terminalOutput }));
            return;
        }

        if (systemInterface === 'web' && inputType === 'form' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === input);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${input}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    webForm: { login: '', comment: '', profile: '' },
                    attackerInput: '',
                    terminalOutput,
                }));
            } else {
                terminalOutput.attackers.push(`> ${input}`, output);
                setGameState(prev => ({ ...prev, webForm: { login: '', comment: '', profile: '' }, attackerInput: '', terminalOutput }));
            }
            return;
        }

        if (systemInterface === 'database' && inputType === 'query' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                }));
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput }));
            }
            return;
        }

        if (team === 'attackers') {
            const recon = reconOutputs[systemInterface][command];
            if (recon) {
                output = `Recon: ${recon}`;
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput }));
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                }));
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput }));
            }
        } else {
            if (command === 'tail /var/log/syslog') {
                output = gameState.actionLog.filter(l => l.includes('💥')).slice(-5).join('\n') || 'Aucun alerte.';
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState(prev => ({ ...prev, defenderInput: '', terminalOutput }));
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.fix === command);
            const player = gameState.players.defenders.find(p => {
                const expectedRole = vuln?.role
                    .replace('Exploiter', 'Sanitizer')
                    .replace('Injector', 'Hardener')
                    .replace('Hacker', 'Securer')
                    .replace('Scanner', 'Firewall')
                    .replace('Escalator', 'Monitor');
                return p.role === expectedRole && !gameState.actions.defenders[p.id];
            });
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 🛡️ ${player.role} corrige ${vuln.name} !`);
                terminalOutput.defenders.push(`> ${command}`, `Patch: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, defenders: { ...prev.actions.defenders, [player.id]: vuln.id } },
                    actionLog,
                    defenderInput: '',
                    terminalOutput,
                }));
            } else {
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState(prev => ({ ...prev, defenderInput: '', terminalOutput }));
            }
        }
    };

    // Navigation Web
    const navigateWeb = page => {
        setGameState(prev => ({
            ...prev,
            webPage: page,
            terminalOutput: { ...prev.terminalOutput, attackers: [...prev.terminalOutput.attackers, `Navigué vers ${page}`] },
        }));
    };

    // Gestion des formulaires Web
    const handleWebForm = (field, value) => {
        setGameState(prev => ({
            ...prev,
            webForm: { ...prev.webForm, [field]: value },
            attackerInput: value,
        }));
    };

    // Fin de tour
    const endTurn = () => {
        let attackerScore = gameState.attackerScore;
        let defenderScore = gameState.defenderScore;
        let systemHealth = gameState.systemHealth;
        let actionLog = [...gameState.actionLog];

        gameState.actions.attackers.forEach(action => {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.id === action.vulnId);
            const blocked = Object.values(gameState.actions.defenders).includes(vuln.id);
            if (!blocked && vuln) {
                attackerScore += vuln.points;
                systemHealth = Math.max(0, systemHealth - vuln.points / 10);
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${vuln.name}: ${vuln.points} pts, santé -${(vuln.points / 10).toFixed(1)}%`);
            } else if (vuln) {
                defenderScore += vuln.points;
                actionLog.push(`[${new Date().toLocaleTimeString()}] 🛡️ ${vuln.name} bloqué: ${vuln.points} pts`);
            }
        });

        setGameState(prev => ({
            ...prev,
            turn: prev.turn + 1,
            timeLeft: 60,
            systemHealth,
            attackerScore,
            defenderScore,
            actionLog,
            actions: { attackers: [], defenders: {} },
            attackerInput: '',
            defenderInput: '',
            terminalOutput: { attackers: [], defenders: [] },
            webForm: { login: '', comment: '', profile: '' },
            webPage: 'home',
            phase: prev.turn + 1 > prev.maxTurns || systemHealth <= 0 ? 'ended' : 'playing',
        }));
    };

    // Déterminer le vainqueur
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return 'Les attaquants gagnent ! Système compromis !';
        if (gameState.defenderScore > gameState.attackerScore) return 'Les défenseurs gagnent ! Système sécurisé !';
        if (gameState.attackerScore > gameState.defenderScore) return 'Les attaquants gagnent ! Domination par score !';
        return 'Égalité ! Le système reste en équilibre !';
    };

    // Rendu de l'interface
    const renderInterface = team => {
        const { interface: systemInterface } = gameState.selectedSystem;
        if (systemInterface === 'web' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gradient-to-br from-gray-900 to-cyan-900 p-6 rounded-xl border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
                        <div className="flex space-x-4">
                            {gameState.selectedSystem.pages.map(page => (
                                <motion.button
                                    key={page}
                                    onClick={() => navigateWeb(page)}
                                    className="text-cyan-300 hover:text-cyan-100 transition-colors capitalize font-bold tracking-wider"
                                    whileHover={{ scale: 1.1, textShadow: '0 0 10px rgba(0,255,255,0.8)' }}
                                >
                                    {page}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    {gameState.webPage === 'home' && (
                        <div className="text-gray-100">
                            <h3 className="text-2xl text-cyan-300 mb-2 font-bold tracking-wide">Portail NeonCorp</h3>
                            <p className="text-gray-300">Bienvenue sur le portail public de NeonCorp. Explorez pour trouver des failles.</p>
                        </div>
                    )}
                    {gameState.webPage === 'login' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-2 font-bold">Connexion</h3>
                            <input
                                type="text"
                                value={gameState.webForm.login}
                                onChange={e => handleWebForm('login', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Utilisateur ou injection SQL"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.login)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                            >
                                Soumettre
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'profile' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-2 font-bold">Profil</h3>
                            <input
                                type="text"
                                value={gameState.webForm.profile}
                                onChange={e => handleWebForm('profile', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Email ou payload CSRF"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.profile)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                            >
                                Mettre à jour
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'comments' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-2 font-bold">Commentaires</h3>
                            <textarea
                                value={gameState.webForm.comment}
                                onChange={e => handleWebForm('comment', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Commentaire ou payload XSS"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.comment)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                            >
                                Poster
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            );
        }
        if (systemInterface === 'terminal' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gradient-to-br from-gray-900 to-cyan-900 p-6 rounded-xl border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-2 font-bold tracking-wide">Serveur de Fichiers</h3>
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-100 mb-2 font-bold">Fichiers :</p>
                        {gameState.selectedSystem.files.map(file => (
                            <p key={file} className="text-gray-300">📄 {file}</p>
                        ))}
                    </div>
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg h-24 overflow-y-auto mb-4 font-mono text-sm text-green-400">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Commande (ex: ls, curl)"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                        >
                            Exécuter
                        </motion.button>
                    </div>
                </motion.div>
            );
        }
        if (systemInterface === 'database' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gradient-to-br from-gray-900 to-cyan-900 p-6 rounded-xl border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-2 font-bold tracking-wide">Base de Données</h3>
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-100 mb-2 font-bold">Tables :</p>
                        {gameState.selectedSystem.tables.map(table => (
                            <p key={table} className="text-gray-300">📊 {table}</p>
                        ))}
                    </div>
                    <textarea
                        value={gameState.attackerInput}
                        onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                        className="w-full h-24 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Requête SQL ou identifiants"
                    />
                    <motion.button
                        onClick={() => handleInput('attackers', 'query', gameState.attackerInput)}
                        className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                    >
                        Exécuter
                    </motion.button>
                </motion.div>
            );
        }
        if (systemInterface === 'network' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gradient-to-br from-gray-900 to-cyan-900 p-6 rounded-xl border-2 border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-2 font-bold tracking-wide">Réseau</h3>
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-100 mb-2 font-bold">Services :</p>
                        {gameState.selectedSystem.services.map(service => (
                            <p key={service} className="text-gray-300">🌐 {service}</p>
                        ))}
                    </div>
                    <div className="bg-black bg-opacity-50 p-4 rounded-lg h-24 overflow-y-auto mb-4 font-mono text-sm text-green-400">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Commande (ex: nmap)"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                        >
                            Scanner
                        </motion.button>
                    </div>
                </motion.div>
            );
        }
        return (
            <motion.div
                className={`bg-gradient-to-br from-gray-900 to-${team === 'attackers' ? 'red-900' : 'blue-900'} p-6 rounded-xl border-2 ${team === 'attackers' ? 'border-red-500' : 'border-blue-500'} shadow-[0_0_20px_rgba(0,255,255,0.5)]`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h3 className="text-2xl text-cyan-300 mb-2 font-bold tracking-wide">{team === 'attackers' ? 'Console Hacker' : 'Console Défenseur'}</h3>
                <div className="bg-black bg-opacity-50 p-4 rounded-lg h-24 overflow-y-auto mb-4 font-mono text-sm text-green-400">
                    {gameState.terminalOutput[team].map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        value={team === 'attackers' ? gameState.attackerInput : gameState.defenderInput}
                        onChange={e => setGameState(prev => ({ ...prev, [team === 'attackers' ? 'attackerInput' : 'defenderInput']: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Commande (ex: help)"
                    />
                    <motion.button
                        onClick={() => handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className={`ml-3 bg-${team === 'attackers' ? 'red-600' : 'blue-600'} text-white p-3 rounded-lg font-bold hover:bg-${team === 'attackers' ? 'red-700' : 'blue-700'}`}
                        whileHover={{ scale: 1.05, boxShadow: `0 0 15px rgba(${team === 'attackers' ? '255,0,0' : '0,0,255'},0.7)` }}
                    >
                        Exécuter
                    </motion.button>
                </div>
            </motion.div>
        );
    };

    // Écran d'intro
    if (gameState.phase === 'intro') {
        return (
            <motion.div
                className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col items-center justify-center text-white font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ background: 'radial-gradient(circle at center, #1a1a1a, #000)' }}
            >
                <motion.h1
                    className="text-6xl font-bold text-cyan-400 mb-8 tracking-wider"
                    animate={{ scale: [1, 1.1, 1], textShadow: '0 0 20px rgba(0,255,255,0.8)' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    NeonCorp: CyberWar
                </motion.h1>
                <div className="w-80 h-6 bg-gray-800 rounded-full mb-4 border-2 border-cyan-500">
                    <motion.div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${introProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <p className="text-gray-300 mb-8 font-bold">Chargement du pentest... {introProgress}%</p>
                <AnimatePresence>
                    {introProgress >= 50 && (
                        <motion.div
                            className="grid grid-cols-2 gap-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div>
                                <h2 className="text-3xl text-red-500 mb-4 font-bold tracking-wide">Attaquants</h2>
                                {gameState.players.attackers.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-3"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2 }}
                                    >
                                        <div className="w-10 h-10 bg-red-600 rounded-full mr-3 shadow-[0_0_10px_rgba(255,0,0,0.7)]" />
                                        <span className="text-gray-100 font-bold">{player.role}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-3xl text-blue-500 mb-4 font-bold tracking-wide">Défenseurs</h2>
                                {gameState.players.defenders.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-3"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2 }}
                                    >
                                        <div className="w-10 h-10 bg-blue-600 rounded-full mr-3 shadow-[0_0_10px_rgba(0,0,255,0.7)]" />
                                        <span className="text-gray-100 font-bold">{player.role}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white font-mono p-8">
            <motion.h1
                className="text-6xl font-bold text-center text-cyan-400 mb-6 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, textShadow: '0 0 20px rgba(0,255,255,0.8)' }}
            >
                NeonCorp: CyberWar
            </motion.h1>
            <p className="text-center text-gray-300 mb-6 font-bold">
                5v5 Pentest | {gameState.selectedSystem.name} | Temps: {Math.floor(gameState.timeLeft / 60)}:
                {(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </p>

            <motion.div
                className="flex justify-between mb-6 bg-gradient-to-r from-gray-900 to-cyan-900 p-4 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="font-bold">Tour {gameState.turn}/{gameState.maxTurns}</p>
                <p className="font-bold">
                    Santé: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-400'}>{gameState.systemHealth.toFixed(1)}%</span>
                </p>
                <p className="font-bold">Attaquants: {gameState.attackerScore}</p>
                <p className="font-bold">Défenseurs: {gameState.defenderScore}</p>
            </motion.div>

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="w-full bg-gray-800 rounded-full h-6 border-2 border-cyan-500">
                    <motion.div
                        className="bg-green-400 h-full rounded-full"
                        style={{ width: `${gameState.systemHealth}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </motion.div>

            {gameState.phase === 'ended' ? (
                <motion.div
                    className="text-center text-4xl text-cyan-400 font-bold tracking-wide"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, textShadow: '0 0 20px rgba(0,255,255,0.8)' }}
                >
                    {getWinner()}
                    <motion.button
                        onClick={() => window.location.reload()}
                        className="mt-6 bg-cyan-500 text-white p-4 rounded-xl font-bold hover:bg-cyan-600"
                        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0,255,255,0.7)' }}
                    >
                        Recommencer
                    </motion.button>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        className="mb-6 bg-gradient-to-r from-gray-900 to-cyan-900 p-4 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-3xl text-cyan-400 mb-2 font-bold tracking-wide">{gameState.selectedSystem.name}</h2>
                        <p className="text-gray-300">{gameState.selectedSystem.description}</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-8">
                        <motion.div
                            className="bg-gradient-to-br from-gray-900 to-red-900 p-6 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-4xl text-red-500 mb-4 font-bold tracking-wide">Attaquants</h2>
                            {gameState.players.attackers.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-red-600 rounded-full mr-3 shadow-[0_0_10px_rgba(255,0,0,0.7)]" />
                                        <span className="text-gray-100 font-bold">{player.role}</span>
                                    </div>
                                    <span className="text-gray-400 text-sm font-mono">
                    {gameState.actions.attackers.find(a => a.playerId === player.id)
                        ? `Exploité ${gameState.selectedSystem.vulnerabilities.find(v => v.id === gameState.actions.attackers.find(a => a.playerId === player.id).vulnId)?.name}`
                        : 'Prêt'}
                  </span>
                                </motion.div>
                            ))}
                            {renderInterface('attackers')}
                        </motion.div>
                        <motion.div
                            className="bg-gradient-to-br from-gray-900 to-blue-900 p-6 rounded-xl shadow-[0_0_20px_rgba(0,0,255,0.5)]"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-4xl text-blue-500 mb-4 font-bold tracking-wide">Défenseurs</h2>
                            {gameState.players.defenders.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-3"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full mr-3 shadow-[0_0_10px_rgba(0,0,255,0.7)]" />
                                        <span className="text-gray-100 font-bold">{player.role}</span>
                                    </div>
                                    <span className="text-gray-400 text-sm font-mono">
                    {gameState.actions.defenders[player.id]
                        ? `Corrigé ${gameState.selectedSystem.vulnerabilities.find(v => v.id === gameState.actions.defenders[player.id])?.name}`
                        : 'Prêt'}
                  </span>
                                </motion.div>
                            ))}
                            {renderInterface('defenders')}
                        </motion.div>
                    </div>

                    <motion.div
                        className="mt-6 bg-gradient-to-r from-gray-900 to-cyan-900 p-6 rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-3xl text-cyan-600 mb-4 font-bold tracking-wide">Journaux du Système</h2>
                        <div className="h-64 overflow-y-auto font-mono">
                            {gameState.actionLog.map((log, index) => (
                                <motion.p
                                    key={index}
                                    className="text-gray-300 mb-1"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    {log}
                                </motion.p>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default CyberWar;