import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Données simulées des systèmes
const systems = [
    {
        id: 1,
        name: 'NeonCorp Web',
        description: 'Portail web public de NeonCorp, vulnérable aux attaques XSS et SQL.',
        interface: 'web',
        vulnerabilities: [
            { id: 1, name: 'XSS', points: 80, role: 'Web Exploiter', exploit: '<script>alert("Hacked!")</script>', fix: 'Enable CSP', log: 'Injection détectée', hint: 'Essaie d’injecter du code JavaScript dans un champ de commentaire.' },
            { id: 2, name: 'CSRF', points: 90, role: 'Web Exploiter', exploit: '<form action="/update" method="POST"><input name="email" value="hacker@evil.com"></form>', fix: 'Add CSRF tokens', log: 'Mise à jour non autorisée', hint: 'Utilise un formulaire malveillant pour modifier un profil.' },
            { id: 3, name: 'SQL Injection', points: 100, role: 'SQL Injector', exploit: "' OR '1'='1", fix: 'Requêtes paramétrées', log: 'Erreur SQL', hint: 'Injecte du code SQL dans le champ de connexion pour bypasser l’authentification.' },
        ],
        pages: ['home', 'login', 'profile', 'comments'],
    },
    {
        id: 2,
        name: 'File Server',
        description: 'Serveur de fichiers interne, sensible aux attaques de traversée de chemin.',
        interface: 'terminal',
        vulnerabilities: [
            { id: 4, name: 'Path Traversal', points: 110, role: 'File Hacker', exploit: 'curl http://server/file?path=../../etc/passwd', fix: 'Restreindre open_basedir', log: 'Tentative de traversée', hint: 'Utilise ".." pour accéder à des fichiers sensibles.' },
            { id: 5, name: 'Privilege Escalation', points: 120, role: 'Privilege Escalator', exploit: 'sudo /bin/sh', fix: 'Renforcer sudoers', log: 'Sudo non autorisé', hint: 'Tente d’exécuter une commande avec des privilèges élevés.' },
        ],
        files: ['index.php', '.env', 'config.yaml'],
        commands: ['ls', 'cat .env', 'whoami'],
    },
    {
        id: 3,
        name: 'Database',
        description: 'Base de données utilisateurs, avec des failles d’accès non sécurisées.',
        interface: 'database',
        vulnerabilities: [
            { id: 6, name: 'Weak Credentials', points: 90, role: 'SQL Injector', exploit: 'mysql -u root -proot', fix: 'Mots de passe forts', log: 'Connexion faible', hint: 'Essaie des identifiants par défaut comme root/root.' },
            { id: 7, name: 'Unfiltered Query', points: 110, role: 'SQL Injector', exploit: 'DROP TABLE users;', fix: 'Limiter permissions', log: 'Requête dangereuse', hint: 'Exécute une requête SQL destructrice pour tester les permissions.' },
        ],
        tables: ['users', 'orders'],
    },
    {
        id: 4,
        name: 'Network',
        description: 'Réseau NeonCorp, avec des ports ouverts et des services vulnérables.',
        interface: 'network',
        vulnerabilities: [
            { id: 8, name: 'Open Port', points: 100, role: 'Network Scanner', exploit: 'nmap -sV 192.168.1.1', fix: 'Bloquer port 8080', log: 'Scan de port', hint: 'Scanne les ports avec nmap pour trouver des services exposés.' },
            { id: 9, name: 'Weak SSH', points: 95, role: 'Network Scanner', exploit: 'ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 user@server', fix: 'Mettre à jour SSH', log: 'SSH faible', hint: 'Tente une connexion SSH avec un algorithme obsolète.' },
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
        contextMessage: '',
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
                        avatar: `attacker-${i + 1}`,
                    })),
                    defenders: [...defenderRoles].sort(() => Math.random() - 0.5).slice(0, 5).map((role, i) => ({
                        id: i + 1,
                        role,
                        avatar: `defender-${i + 6}`,
                    })),
                },
                contextMessage: `Bienvenue dans NeonCorp: CyberWar ! Tu vas participer à une bataille de cybersécurité. Les attaquants tentent de pirater ${system.name}, tandis que les défenseurs protègent le système. Tape 'help' pour voir les commandes disponibles.`,
            }));

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
                    return { ...prev, phase: 'ended', contextMessage: 'Temps écoulé ! Voyons qui a gagné...' };
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
        let contextMessage = '';
        const { interface: systemInterface } = gameState.selectedSystem;

        if (command === 'help') {
            output = team === 'attackers'
                ? `Recon: ${Object.keys(reconOutputs[systemInterface]).join(', ')}\nExploits: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`
                : `Monitor: tail /var/log/syslog\nFixes: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`;
            terminalOutput[team].push(`> ${command}`, output);
            contextMessage = team === 'attackers'
                ? 'Utilise une commande de reconnaissance (ex: curl) ou tente un exploit (ex: XSS). Chaque rôle a des compétences spécifiques.'
                : 'Vérifie les logs avec "tail /var/log/syslog" ou applique un correctif (ex: Enable CSP). Protège le système !';
            setGameState(prev => ({ ...prev, [team === 'attackers' ? 'attackerInput' : 'defenderInput']: '', terminalOutput, contextMessage }));
            return;
        }

        if (systemInterface === 'web' && inputType === 'form' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === input);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${input}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                contextMessage = `Succès ! ${vuln.name} a été exploité, causant des dégâts au système. Continue à chercher d’autres failles !`;
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    webForm: { login: '', comment: '', profile: '' },
                    attackerInput: '',
                    terminalOutput,
                    contextMessage,
                }));
            } else {
                terminalOutput.attackers.push(`> ${input}`, output);
                contextMessage = 'Échec de l’exploit. Vérifie que ton rôle correspond à la vulnérabilité ou tape "help" pour voir les options.';
                setGameState(prev => ({ ...prev, webForm: { login: '', comment: '', profile: '' }, attackerInput: '', terminalOutput, contextMessage }));
            }
            return;
        }

        if (systemInterface === 'database' && inputType === 'query' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                contextMessage = `Bien joué ! ${vuln.name} a compromis la base de données. Essaie une autre attaque pour maximiser les dégâts.`;
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                    contextMessage,
                }));
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                contextMessage = 'La requête a échoué. Assure-toi d’utiliser le bon exploit pour ton rôle ou consulte "help".';
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput, contextMessage }));
            }
            return;
        }

        if (team === 'attackers') {
            const recon = reconOutputs[systemInterface][command];
            if (recon) {
                output = `Recon: ${recon}`;
                terminalOutput.attackers.push(`> ${command}`, output);
                contextMessage = `Reconnaissance réussie ! Tu as obtenu des infos sur ${gameState.selectedSystem.name}. Utilise ces données pour planifier ton attaque.`;
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput, contextMessage }));
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploite ${vuln.name} !`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                contextMessage = `Succès ! ${vuln.name} a été utilisé pour attaquer le système. Continue à exploiter des failles pour gagner des points !`;
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                    contextMessage,
                }));
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                contextMessage = 'Commande non reconnue. Vérifie ton exploit ou tape "help" pour voir les commandes disponibles.';
                setGameState(prev => ({ ...prev, attackerInput: '', terminalOutput, contextMessage }));
            }
        } else {
            if (command === 'tail /var/log/syslog') {
                output = gameState.actionLog.filter(l => l.includes('💥')).slice(-5).join('\n') || 'Aucun alerte.';
                terminalOutput.defenders.push(`> ${command}`, output);
                contextMessage = 'Tu as vérifié les logs. Recherche les attaques récentes et applique les correctifs correspondants pour protéger le système.';
                setGameState(prev => ({ ...prev, defenderInput: '', terminalOutput, contextMessage }));
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
                contextMessage = `Excellent ! ${vuln.name} est corrigé, renforçant la sécurité du système. Continue à bloquer les attaquants !`;
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, defenders: { ...prev.actions.defenders, [player.id]: vuln.id } },
                    actionLog,
                    defenderInput: '',
                    terminalOutput,
                    contextMessage,
                }));
            } else {
                terminalOutput.defenders.push(`> ${command}`, output);
                contextMessage = 'Correctif invalide. Vérifie que ton rôle peut appliquer ce correctif ou tape "help" pour voir les options.';
                setGameState(prev => ({ ...prev, defenderInput: '', terminalOutput, contextMessage }));
            }
        }
    };

    // Navigation Web
    const navigateWeb = page => {
        setGameState(prev => ({
            ...prev,
            webPage: page,
            terminalOutput: { ...prev.terminalOutput, attackers: [...prev.terminalOutput.attackers, `Navigué vers ${page}`] },
            contextMessage: `Tu es sur la page ${page}. Explore les champs pour trouver des failles ou tape "help" pour des indices.`,
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
        let contextMessage = '';

        gameState.actions.attackers.forEach(action => {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.id === action.vulnId);
            const blocked = Object.values(gameState.actions.defenders).includes(vuln.id);
            if (!blocked && vuln) {
                attackerScore += vuln.points;
                systemHealth = Math.max(0, systemHealth - vuln.points / 10);
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${vuln.name}: ${vuln.points} pts, santé -${(vuln.points / 10).toFixed(1)}%`);
                contextMessage = `Les attaquants ont infligé des dégâts avec ${vuln.name} ! La santé du système est à ${systemHealth.toFixed(1)}%.`;
            } else if (vuln) {
                defenderScore += vuln.points;
                actionLog.push(`[${new Date().toLocaleTimeString()}] 🛡️ ${vuln.name} bloqué: ${vuln.points} pts`);
                contextMessage = `Les défenseurs ont bloqué ${vuln.name}, gagnant ${vuln.points} points ! Continuez à protéger le système.`;
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
            contextMessage,
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
                    className="bg-gradient-to-br from-gray-900 to-cyan-950 p-6 rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-black bg-opacity-60 p-4 rounded-xl mb-4 border border-cyan-500">
                        <div className="flex space-x-4">
                            {gameState.selectedSystem.pages.map(page => (
                                <motion.button
                                    key={page}
                                    onClick={() => navigateWeb(page)}
                                    className="text-cyan-300 hover:text-cyan-100 font-bold tracking-wide px-4 py-2 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,255,255,0.2)', textShadow: '0 0 10px rgba(0,255,255,0.8)' }}
                                    title={`Navigue vers la page ${page}`}
                                >
                                    {page}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    {gameState.webPage === 'home' && (
                        <motion.div
                            className="text-gray-100"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Portail NeonCorp</h3>
                            <p className="text-gray-300">Bienvenue sur le portail public de NeonCorp. Explore les pages pour trouver des failles exploitables.</p>
                        </motion.div>
                    )}
                    {gameState.webPage === 'login' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Connexion</h3>
                            <input
                                type="text"
                                value={gameState.webForm.login}
                                onChange={e => handleWebForm('login', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                placeholder="Utilisateur ou injection SQL"
                                title={gameState.selectedSystem.vulnerabilities.find(v => v.name === 'SQL Injection')?.hint}
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.login)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 w-full"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                                title="Tente une attaque SQL pour bypasser la connexion"
                            >
                                Soumettre
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'profile' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Profil</h3>
                            <input
                                type="text"
                                value={gameState.webForm.profile}
                                onChange={e => handleWebForm('profile', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                placeholder="Email ou payload CSRF"
                                title={gameState.selectedSystem.vulnerabilities.find(v => v.name === 'CSRF')?.hint}
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.profile)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 w-full"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                                title="Tente une attaque CSRF pour modifier un profil"
                            >
                                Mettre à jour
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'comments' && (
                        <div>
                            <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Commentaires</h3>
                            <textarea
                                value={gameState.webForm.comment}
                                onChange={e => handleWebForm('comment', e.target.value)}
                                className="w-full p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                placeholder="Commentaire ou payload XSS"
                                title={gameState.selectedSystem.vulnerabilities.find(v => v.name === 'XSS')?.hint}
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.comment)}
                                className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 w-full"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                                title="Tente une attaque XSS pour exécuter du code malveillant"
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
                    className="bg-gradient-to-br from-gray-900 to-cyan-950 p-6 rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Serveur de Fichiers</h3>
                    <motion.div
                        className="bg-black bg-opacity-60 p-4 rounded-xl mb-4 border border-cyan-500"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-gray-100 mb-2 font-bold">Fichiers :</p>
                        {gameState.selectedSystem.files.map(file => (
                            <motion.p
                                key={file}
                                className="text-gray-300"
                                whileHover={{ color: '#0ff', x: 5 }}
                            >
                                📄 {file}
                            </motion.p>
                        ))}
                    </motion.div>
                    <div className="bg-black bg-opacity-60 p-4 rounded-xl h-28 overflow-y-auto mb-4 font-mono text-sm text-green-400 border border-cyan-500">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {line}
                            </motion.p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            placeholder="Commande (ex: ls, curl)"
                            title="Entre une commande pour explorer ou attaquer le serveur"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                            title="Exécute la commande pour tenter une attaque"
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
                    className="bg-gradient-to-br from-gray-900 to-cyan-950 p-6 rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Base de Données</h3>
                    <motion.div
                        className="bg-black bg-opacity-60 p-4 rounded-xl mb-4 border border-cyan-500"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-gray-100 mb-2 font-bold">Tables :</p>
                        {gameState.selectedSystem.tables.map(table => (
                            <motion.p
                                key={table}
                                className="text-gray-300"
                                whileHover={{ color: '#0ff', x: 5 }}
                            >
                                📊 {table}
                            </motion.p>
                        ))}
                    </motion.div>
                    <textarea
                        value={gameState.attackerInput}
                        onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                        className="w-full h-28 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="Requête SQL ou identifiants"
                        title="Entre une requête SQL pour attaquer la base de données"
                    />
                    <motion.button
                        onClick={() => handleInput('attackers', 'query', gameState.attackerInput)}
                        className="mt-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700 w-full"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                        title="Exécute la requête pour tenter une attaque"
                    >
                        Exécuter
                    </motion.button>
                </motion.div>
            );
        }
        if (systemInterface === 'network' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gradient-to-br from-gray-900 to-cyan-950 p-6 rounded-2xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">Réseau</h3>
                    <motion.div
                        className="bg-black bg-opacity-60 p-4 rounded-xl mb-4 border border-cyan-500"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-gray-100 mb-2 font-bold">Services :</p>
                        {gameState.selectedSystem.services.map(service => (
                            <motion.p
                                key={service}
                                className="text-gray-300"
                                whileHover={{ color: '#0ff', x: 5 }}
                            >
                                🌐 {service}
                            </motion.p>
                        ))}
                    </motion.div>
                    <div className="bg-black bg-opacity-60 p-4 rounded-xl h-28 overflow-y-auto mb-4 font-mono text-sm text-green-400 border border-cyan-500">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {line}
                            </motion.p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            placeholder="Commande (ex: nmap)"
                            title="Entre une commande pour scanner ou attaquer le réseau"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-3 bg-red-600 text-white p-3 rounded-lg font-bold hover:bg-red-700"
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,0.7)' }}
                            title="Exécute la commande pour tenter une attaque"
                        >
                            Scanner
                        </motion.button>
                    </div>
                </motion.div>
            );
        }
        return (
            <motion.div
                className={`bg-gradient-to-br from-gray-900 to-${team === 'attackers' ? 'red-950' : 'blue-950'} p-6 rounded-2xl border-2 ${team === 'attackers' ? 'border-red-400' : 'border-blue-400'} shadow-[0_0_25px_rgba(0,255,255,0.6)]`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl text-cyan-300 mb-3 font-bold tracking-wide">{team === 'attackers' ? 'Console Hacker' : 'Console Défenseur'}</h3>
                <div className="bg-black bg-opacity-60 p-4 rounded-xl h-28 overflow-y-auto mb-4 font-mono text-sm text-green-400 border border-cyan-500">
                    {gameState.terminalOutput[team].map((line, index) => (
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {line}
                        </motion.p>
                    ))}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        value={team === 'attackers' ? gameState.attackerInput : gameState.defenderInput}
                        onChange={e => setGameState(prev => ({ ...prev, [team === 'attackers' ? 'attackerInput' : 'defenderInput']: e.target.value }))}
                        onKeyPress={e => e.key === 'Enter' && handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className="flex-1 p-3 bg-black bg-opacity-70 text-white rounded-lg border border-cyan-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="Commande (ex: help)"
                        title={team === 'attackers' ? 'Entre une commande pour attaquer' : 'Entre une commande pour protéger'}
                    />
                    <motion.button
                        onClick={() => handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className={`ml-3 bg-${team === 'attackers' ? 'red-600' : 'blue-600'} text-white p-3 rounded-lg font-bold hover:bg-${team === 'attackers' ? 'red-700' : 'blue-700'}`}
                        whileHover={{ scale: 1.05, boxShadow: `0 0 15px rgba(${team === 'attackers' ? '255,0,0' : '0,0,255'},0.7)` }}
                        title="Exécute la commande"
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
                    className="text-7xl font-bold text-cyan-400 mb-8 tracking-widest"
                    animate={{ scale: [1, 1.1, 1], textShadow: '0 0 30px rgba(0,255,255,0.9)' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    NeonCorp: CyberWar
                </motion.h1>
                <div className="w-96 h-8 bg-gray-800 rounded-full mb-6 border-2 border-cyan-400 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                        style={{ width: `${introProgress}%` }}
                        transition={{ duration: 0.3 }}
                        initial={{ x: -100 }}
                        animate={{ x: 0 }}
                    />
                </div>
                <p className="text-gray-300 mb-10 text-lg font-bold">Initialisation du pentest... {introProgress}%</p>
                <AnimatePresence>
                    {introProgress >= 50 && (
                        <motion.div
                            className="grid grid-cols-2 gap-12"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div>
                                <h2 className="text-4xl text-red-500 mb-6 font-bold tracking-wide">Attaquants</h2>
                                {gameState.players.attackers.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-4"
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2, type: 'spring', stiffness: 100 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 bg-red-600 rounded-full mr-4 flex items-center justify-center text-2xl"
                                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ background: `url(https://api.dicebear.com/9.x/pixel-art/svg?seed=${player.avatar}&scale=80)` }}
                                        />
                                        <span className="text-gray-100 text-lg font-bold">{player.role}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-4xl text-blue-500 mb-6 font-bold tracking-wide">Défenseurs</h2>
                                {gameState.players.defenders.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-4"
                                        initial={{ x: 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2, type: 'spring', stiffness: 100 }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 bg-blue-600 rounded-full mr-4 flex items-center justify-center text-2xl"
                                            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ background: `url(https://api.dicebear.com/9.x/pixel-art/svg?seed=${player.avatar}&scale=80)` }}
                                        />
                                        <span className="text-gray-100 text-lg font-bold">{player.role}</span>
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
                className="text-6xl font-bold text-center text-cyan-400 mb-8 tracking-widest"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0, textShadow: '0 0 30px rgba(0,255,255,0.9)' }}
                transition={{ duration: 0.8 }}
            >
                NeonCorp: CyberWar
            </motion.h1>
            <motion.p
                className="text-center text-gray-300 mb-8 text-lg font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                5v5 Pentest | {gameState.selectedSystem.name} | Temps: {Math.floor(gameState.timeLeft / 60)}:
                {(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </motion.p>

            <motion.div
                className="flex justify-between items-center mb-8 bg-gradient-to-r from-gray-900 to-cyan-950 p-6 rounded-2xl shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="text-lg font-bold">Tour {gameState.turn}/{gameState.maxTurns}</p>
                <p className="text-lg font-bold">
                    Santé: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-400'}>{gameState.systemHealth.toFixed(1)}%</span>
                </p>
                <p className="text-lg font-bold">Attaquants: {gameState.attackerScore}</p>
                <p className="text-lg font-bold">Défenseurs: {gameState.defenderScore}</p>
            </motion.div>

            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-full bg-gray-800 rounded-full h-8 border-2 border-cyan-400 overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full"
                        style={{ width: `${gameState.systemHealth}%` }}
                        transition={{ duration: 0.5 }}
                        animate={{ scaleX: [1, 1.02, 1], opacity: [1, 0.8, 1] }}
                    />
                </div>
            </motion.div>

            {gameState.contextMessage && (
                <motion.div
                    className="mb-8 bg-gradient-to-r from-cyan-900 to-black p-4 rounded-xl border border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <p className="text-gray-100 text-lg">{gameState.contextMessage}</p>
                </motion.div>
            )}

            {gameState.phase === 'ended' ? (
                <motion.div
                    className="text-center text-5xl text-cyan-400 font-bold tracking-widest"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, textShadow: '0 0 30px rgba(0,255,255,0.9)' }}
                    transition={{ duration: 0.8 }}
                >
                    {getWinner()}
                    <motion.button
                        onClick={() => window.location.reload()}
                        className="mt-8 bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-4 rounded-xl font-bold text-lg hover:bg-cyan-600"
                        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0,255,255,0.7)' }}
                        whileTap={{ scale: 0.95 }}
                        title="Recommence une nouvelle partie"
                    >
                        Recommencer
                    </motion.button>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        className="mb-8 bg-gradient-to-r from-gray-900 to-cyan-950 p-6 rounded-2xl shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-4xl text-cyan-400 mb-4 font-bold tracking-wide">{gameState.selectedSystem.name}</h2>
                        <p className="text-gray-300 text-lg">{gameState.selectedSystem.description}</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-12">
                        <motion.div
                            className="bg-gradient-to-br from-gray-900 to-red-950 p-8 rounded-2xl shadow-[0_0_25px_rgba(255,0,0,0.5)]"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-5xl text-red-500 mb-6 font-bold tracking-wide">Attaquants</h2>
                            {gameState.players.attackers.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: player.id * 0.1 }}
                                >
                                    <div className="flex items-center">
                                        <motion.div
                                            className="w-12 h-12 rounded-full mr-4 flex items-center justify-center"
                                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ background: `url(https://api.dicebear.com/9.x/pixel-art/svg?seed=${player.avatar}&scale=80)` }}
                                        />
                                        <span className="text-gray-100 text-lg font-bold">{player.role}</span>
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
                            className="bg-gradient-to-br from-gray-900 to-blue-950 p-8 rounded-2xl shadow-[0_0_25px_rgba(0,0,255,0.5)]"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-5xl text-blue-500 mb-6 font-bold tracking-wide">Défenseurs</h2>
                            {gameState.players.defenders.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: player.id * 0.1 }}
                                >
                                    <div className="flex items-center">
                                        <motion.div
                                            className="w-12 h-12 rounded-full mr-4 flex items-center justify-center"
                                            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ background: `url(https://api.dicebear.com/9.x/pixel-art/svg?seed=${player.avatar}&scale=80)` }}
                                        />
                                        <span className="text-gray-100 text-lg font-bold">{player.role}</span>
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
                        className="mt-8 bg-gradient-to-r from-gray-900 to-cyan-950 p-8 rounded-2xl shadow-[0_0_25px_rgba(0,255,255,0.6)]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-4xl text-cyan-600 mb-6 font-bold tracking-wide">Journaux du Système</h2>
                        <div className="h-80 overflow-y-auto font-mono">
                            {gameState.actionLog.map((log, index) => (
                                <motion.p
                                    key={index}
                                    className="text-gray-300 mb-2 text-sm"
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