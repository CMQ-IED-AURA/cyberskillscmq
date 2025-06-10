import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simulated Systems
const systems = [
    {
        id: 1,
        name: 'NeonCorp Web',
        description: 'Public web portal for NeonCorp users.',
        interface: 'web',
        vulnerabilities: [
            { id: 1, name: 'XSS', points: 80, role: 'Web Exploiter', exploit: '<script>alert("Hacked!")</script>', fix: 'Enable CSP', log: 'Script injection detected' },
            { id: 2, name: 'CSRF', points: 90, role: 'Web Exploiter', exploit: '<form action="/update" method="POST"><input name="email" value="hacker@evil.com"></form>', fix: 'Add CSRF tokens', log: 'Unauthorized update' },
            { id: 3, name: 'SQL Injection', points: 100, role: 'SQL Injector', exploit: "' OR '1'='1", fix: 'Parameterized queries', log: 'SQL error' },
        ],
        pages: ['home', 'login', 'profile', 'comments'],
    },
    {
        id: 2,
        name: 'File Server',
        description: 'Internal file storage server.',
        interface: 'terminal',
        vulnerabilities: [
            { id: 4, name: 'Path Traversal', points: 110, role: 'File Hacker', exploit: 'curl http://server/file?path=../../etc/passwd', fix: 'Restrict open_basedir', log: 'Path traversal attempt' },
            { id: 5, name: 'Privilege Escalation', points: 120, role: 'Privilege Escalator', exploit: 'sudo /bin/sh', fix: 'Tighten sudoers', log: 'Unauthorized sudo' },
        ],
        files: ['index.php', '.env', 'config.yaml'],
        commands: ['ls', 'cat .env', 'whoami'],
    },
    {
        id: 3,
        name: 'Database',
        description: 'NeonCorp’s user database.',
        interface: 'database',
        vulnerabilities: [
            { id: 6, name: 'Weak Credentials', points: 90, role: 'SQL Injector', exploit: 'mysql -u root -proot', fix: 'Strong passwords', log: 'Weak login' },
            { id: 7, name: 'Unfiltered Query', points: 110, role: 'SQL Injector', exploit: 'DROP TABLE users;', fix: 'Limit permissions', log: 'Dangerous query' },
        ],
        tables: ['users', 'orders'],
    },
    {
        id: 4,
        name: 'Network',
        description: 'NeonCorp’s network infrastructure.',
        interface: 'network',
        vulnerabilities: [
            { id: 8, name: 'Open Port', points: 100, role: 'Network Scanner', exploit: 'nmap -sV 192.168.1.1', fix: 'Block port 8080', log: 'Port scan' },
            { id: 9, name: 'Weak SSH', points: 95, role: 'Network Scanner', exploit: 'ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 user@server', fix: 'Update SSH config', log: 'Weak SSH' },
        ],
        services: ['http:80', 'ssh:22', 'tomcat:8080'],
    },
];

// Recon Outputs
const reconOutputs = {
    web: {
        'curl http://portal': 'Forms: login, profile, comments',
        'dirb http://portal': 'Hidden: /admin (401)',
    },
    terminal: {
        ls: 'index.php .env config.yaml',
        whoami: 'www-data',
    },
    database: {
        'SHOW TABLES': 'users, orders',
        'SELECT * FROM users LIMIT 1': 'id: 1, name: admin',
    },
    network: {
        'nmap -sV 192.168.1.1': '80/http, 22/ssh, 8080/tomcat',
        'netstat -tuln': 'tcp 0.0.0.0:80, 0.0.0.0:8080',
    },
};

// Roles
const attackerRoles = ['Web Exploiter', 'SQL Injector', 'File Hacker', 'Network Scanner', 'Privilege Escalator'];
const defenderRoles = ['Web Sanitizer', 'DB Hardener', 'File Securer', 'Network Firewall', 'System Monitor'];

const CyberWar = () => {
    const [gameState, setGameState] = useState({
        phase: 'intro', // intro, playing, ended
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

    // Initialize Game
    useEffect(() => {
        if (gameState.phase === 'intro') {
            const system = systems[Math.floor(Math.random() * systems.length)];
            setGameState(prev => ({
                    ...prev,
                    selectedSystem: system,
                    actionLog: [[`[${new Date().toLocaleTimeString()}] ${system.name} targeted!`],
                        players: [
                    attackers: [...attackerRoles].sort(() => Math.random() - 0.5).slice(0, 5).map((role, i) => ({
                    id: i + 1,
                    role,
                    avatar: `Crewmate-${i + 1}`,
                })),
                defenders: [...defendersRoles].sort(() => Math.random() - 0.5).slice(0, 5).map((role, i) => ({
                id: i + 1,
                role,
                avatar: `Crewmate-${i + 6}`,
            })),
        ],
        }));

            // Intro animation sequence
            const introSteps = setInterval(() => {
                setIntroProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(introSteps);
                        setGameState(prev => ({ ...prev, phase: 'playing' }));
                        playSound('game-start');
                        return 100;
                    }
                    return prev + 10;
                });
            }, 500);
            return () => clearInterval(introSteps);
        }
    }, [gameState.phase]);

    // Game Timer
    useEffect(() => {
        if (gameState.phase !== 'playing' || gameState.timeLeft <= 0) return;
        const timer = setInterval(() => {
            setGameState(prev => {
            ...prev,
                    timeLeft: prev.timeLeft - 1,
                if (prev.timeLeft <= 1 && prev.turn < prev.maxTurns) {
                    endTurn();
                } else if (prev.timeLeft <= 1) {
                    setGameState({ ...prev, phase: 'ended' });
                }
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState.timeLeft, gameState.phase]);

    // Sound Effects
    const playSound = type => {
        const sounds = {
            'game-start': 'https://freesound.org/data/previews/387/387739_1385886-lq.mp3',
            attack: 'https://freesound.org/data/previews/316/316847_4939433-lq.mp3',
            defend: 'https://freesound.org/data/previews/171/171671_2437358-lq.mp3',
        };
        new Audio(sounds[type]).play().catch(() => {});
    };

    // Handle Input
    const handleInput = (team, inputType, input) => {
        const command = input.trim();
        if (!command) return;

        const terminalOutput = { ...gameState.terminalOutput };
        let output = 'Invalid input.';
        let actionLog = [...gameState.actionLog];
        const { interface: systemInterface } = gameState.selectedSystem;

        if (command === 'help') {
            output = team === 'attackers'
                ? `Recon: ${Object.keys(reconOutputs[systemInterface]).join(', ')}\nExploits: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`
                : `Monitor: tail /var/log/syslog\nFixes: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`;
            terminalOutput[team].push(`> ${command}`, output);
            setGameState(prev => ({
                ...prev,
                [team === 'attackers' ? 'attackerInput' : 'defenderInput']: '',
                terminalOutput,
            }));
            return;
        }

        if (systemInterface === 'web' && inputType === 'form' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === input);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${input}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: {
                        ...prev.actions,
                        attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }],
                    },
                    actionLog,
                    webForm: { login: '', comment: '', profile: '' },
                    attackerInput: '',
                    terminalOutput,
                }));
                playSound('attack');
            } else {
                terminalOutput.attackers.push(`> ${input}`, output);
                setGameState(prev => ({
                    ...prev,
                    webForm: { login: '', comment: '', profile: '' },
                    attackerInput: '',
                    terminalOutput,
                }));
            }
            return;
        }

        if (systemInterface === 'database' && inputType === 'query' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: {
                        ...prev.actions,
                        attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }],
                    },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                }));
                playSound('attack');
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
                setGameState(prev => ({
                    ...prev,
                    attackerInput: '',
                    terminalOutput,
                }));
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !gameState.actions.attackers.some(a => a.playerId === p.id));
            if (vuln && player) {
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: {
                        ...prev.actions,
                        attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }],
                    },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                }));
                playSound('attack');
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState(prev => ({
                    ...prev,
                    attackerInput: '',
                    terminalOutput,
                }));
            }
        } else {
            if (command === 'tail /var/log/syslog') {
                output = gameState.actionLog.filter(l => l.includes('💥')).slice(-5).join('\n') || 'No alerts.';
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState(prev => ({
                    ...prev,
                    defenderInput: '',
                    terminalOutput,
                }));
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
                actionLog.push(`[${new Date().toLocaleTimeString()}] 🛡️ ${player.role} patches ${vuln.name}!`);
                terminalOutput.defenders.push(`> ${command}`, `Patch: ${vuln.name} (${vuln.points} pts)`);
                setGameState(prev => ({
                    ...prev,
                    actions: {
                        ...prev.actions,
                        defenders: { ...prev.actions.defenders, [player.id]: vuln.id },
                    },
                    actionLog,
                    defenderInput: '',
                    terminalOutput,
                }));
                playSound('defend');
            } else {
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState(prev => ({
                    ...prev,
                    defenderInput: '',
                    terminalOutput,
                }));
            }
        }
    };

    // Web Navigation
    const navigateWeb = page => {
        setGameState(prev => ({
            ...prev,
            webPage: page,
            terminalOutput: {
                ...prev.terminalOutput,
                attackers: [...prev.terminalOutput.attackers, `Navigated to ${page}`],
            },
        }));
    };

    // Web Form Handling
    const handleWebForm = (field, value) => {
        setGameState(prev => ({
            ...prev,
            webForm: { ...prev.webForm, [field]: value },
            attackerInput: value,
        }));
    };

    // End Turn
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
                actionLog.push(`[${new Date().toLocaleTimeString()}] 💥 ${vuln.name}: ${vuln.points} pts, health -${(vuln.points / 10).toFixed(1)}%`);
            } else if (vuln) {
                defenderScore += vuln.points;
                actionLog.push(`[${new Date().toLocaleTimeString()}] 🛡️ ${vuln.name} blocked: ${vuln.points} pts`);
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
            gameOver: prev.turn + 1 > prev.maxTurns || systemHealth <= 0,
            phase: prev.turn + 1 > prev.maxTurns || systemHealth <= 0 ? 'ended' : 'playing',
        }));
    };

    // Winner
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return 'Attackers Win! System Breached!';
        if (gameState.defenderScore > gameState.attackerScore) return 'Defenders Win! System Secured!';
        if (gameState.attackerScore > gameState.defenderScore) return 'Attackers Win! Score Domination!';
        return 'Stalemate! System Hangs in Balance!';
    };

    // Render Interface
    const renderInterface = team => {
        const { interface: systemInterface } = gameState.selectedSystem;
        if (systemInterface === 'web' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gray-800 p-6 rounded-xl border-2 border-red-500 shadow-neon"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <div className="flex space-x-4">
                            {gameState.selectedSystem.pages.map(page => (
                                <button
                                    key={page}
                                    onClick={() => navigateWeb(page)}
                                    className="text-cyan-400 hover:text-cyan-200 transition-colors capitalize"
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                    {gameState.webPage === 'home' && (
                        <div className="text-gray-200">
                            <h3 className="text-xl text-cyan-400 mb-2">NeonCorp Portal</h3>
                            <p>Welcome to NeonCorp’s public portal. Explore to find vulnerabilities.</p>
                        </div>
                    )}
                    {gameState.webPage === 'login' && (
                        <div>
                            <h3 className="text-xl text-cyan-400 mb-2">Login</h3>
                            <input
                                type="text"
                                value={gameState.webForm.login}
                                onChange={e => handleWebForm('login', e.target.value)}
                                className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                                placeholder="Username or SQL injection"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.login)}
                                className="mt-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                                whileHover={{ scale: 1.05 }}
                            >
                                Submit
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'profile' && (
                        <div>
                            <h3 className="text-xl text-cyan-400 mb-2">Profile</h3>
                            <input
                                type="text"
                                value={gameState.webForm.profile}
                                onChange={e => handleWebForm('profile', e.target.value)}
                                className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                                placeholder="Email or CSRF payload"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.profile)}
                                className="mt-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                                whileHover={{ scale: 1.05 }}
                            >
                                Update
                            </motion.button>
                        </div>
                    )}
                    {gameState.webPage === 'comments' && (
                        <div>
                            <h3 className="text-xl text-cyan-400 mb-2">Comments</h3>
                            <textarea
                                value={gameState.webForm.comment}
                                onChange={e => handleWebForm('comment', e.target.value)}
                                className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                                placeholder="Comment or XSS payload"
                            />
                            <motion.button
                                onClick={() => handleInput('attackers', 'form', gameState.webForm.comment)}
                                className="mt-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                                whileHover={{ scale: 1.05 }}
                            >
                                Post
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            );
        }
        if (systemInterface === 'terminal' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gray-800 p-6 rounded-xl border-2 border-red-500 shadow-neon"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-xl text-cyan-400 mb-2">File Server</h3>
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <p className="text-gray-200 mb-2">Files:</p>
                        {gameState.selectedSystem.files.map(file => (
                            <p key={file} className="text-gray-400">📄 {file}</p>
                        ))}
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg h-24 overflow-y-auto mb-4">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <p key={index} className="text-sm text-green-400">{line}</p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                            placeholder="Command (e.g., ls, curl)"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                            whileHover={{ scale: 1.05 }}
                        >
                            Run
                        </motion.button>
                    </div>
                </motion.div>
            );
        }
        if (systemInterface === 'database' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gray-800 p-6 rounded-xl border-2 border-red-500 shadow-neon"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-xl text-cyan-400 mb-2">Database</h3>
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <p className="text-gray-200 mb-2">Tables:</p>
                        {gameState.selectedSystem.tables.map(table => (
                            <p key={table} className="text-gray-400">📊 {table}</p>
                        ))}
                    </div>
                    <textarea
                        value={gameState.attackerInput}
                        onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                        className="w-full h-24 p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                        placeholder="SQL query or credentials"
                    />
                    <motion.button
                        onClick={() => handleInput('attackers', 'query', gameState.attackerInput)}
                        className="mt-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                        whileHover={{ scale: 1.05 }}
                    >
                        Execute
                    </motion.button>
                </motion.div>
            );
        }
        if (systemInterface === 'network' && team === 'attackers') {
            return (
                <motion.div
                    className="bg-gray-800 p-6 rounded-xl border-2 border-red-500 shadow-neon"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-xl text-cyan-400 mb-2">Network</h3>
                    <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <p className="text-gray-200 mb-2">Services:</p>
                        {gameState.selectedSystem.services.map(service => (
                            <p key={service} className="text-gray-400">🌐 {service}</p>
                        ))}
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg h-24 overflow-y-auto mb-4">
                        {gameState.terminalOutput.attackers.map((line, index) => (
                            <p key={index} className="text-sm text-green-400">{line}</p>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={gameState.attackerInput}
                            onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
                            onKeyPress={e => e.key === 'Enter' && handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="flex-1 p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                            placeholder="Command (e.g., nmap)"
                        />
                        <motion.button
                            onClick={() => handleInput('attackers', 'terminal', gameState.attackerInput)}
                            className="ml-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                            whileHover={{ scale: 1.05 }}
                        >
                            Scan
                        </motion.button>
                    </div>
                </motion.div>
            );
        }
        return (
            <motion.div
                className={`bg-gray-800 p-6 rounded-xl border-2 ${team === 'attackers' ? 'border-red-500' : 'border-blue-500'} shadow-neon`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h3 className="text-xl text-cyan-400 mb-2">{team === 'attackers' ? 'Hacker' : 'Defender'} Console</h3>
                <div className="bg-gray-900 p-4 rounded-lg h-24 overflow-y-auto mb-4">
                    {gameState.terminalOutput[team].map((line, index) => (
                        <p key={index} className="text-sm text-green-400">{line}</p>
                    ))}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        value={team === 'attackers' ? gameState.attackerInput : gameState.defenderInput}
                        onChange={e =>
                            setGameState(prev => ({
                                ...prev,
                                [team === 'attackers' ? 'attackerInput' : 'defenderInput']: e.target.value,
                            }))
                        }
                        onKeyPress={e => e.key === 'Enter' && handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className="flex-1 p-2 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-cyan-400"
                        placeholder="Command (e.g., help)"
                    />
                    <motion.button
                        onClick={() => handleInput(team, 'terminal', team === 'attackers' ? gameState.attackerInput : gameState.defenderInput)}
                        className={`ml-2 bg-${team === 'attackers' ? 'red-600' : 'blue-600'} text-white p-2 rounded-lg hover:bg-${team === 'attackers' ? 'red-700' : 'blue-700'}`}
                        whileHover={{ scale: 1.05 }}
                    >
                        Run
                    </motion.button>
                </div>
            </motion.div>
        );
    };

    // Intro Screen
    if (gameState.phase === 'intro') {
        return (
            <motion.div
                className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center text-white font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.h1
                    className="text-6xl font-bold text-cyan-400 mb-8"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    NeonCorp: CyberWar
                </motion.h1>
                <div className="w-64 h-4 bg-gray-700 rounded-full mb-4">
                    <motion.div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${introProgress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <p className="text-gray-300 mb-8">Initializing Pentest... {introProgress}%</p>
                <AnimatePresence>
                    {introProgress >= 50 && (
                        <motion.div
                            className="grid grid-cols-2 gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div>
                                <h2 className="text-2xl text-red-500 mb-2">Attackers</h2>
                                {gameState.players.attackers.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-2"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2 }}
                                    >
                                        <div className="w-8 h-8 bg-red-500 rounded-full mr-2" />
                                        <span>{player.role}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-2xl text-blue-500 mb-2">Defenders</h2>
                                {gameState.players.defenders.map(player => (
                                    <motion.div
                                        key={player.id}
                                        className="flex items-center mb-2"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: player.id * 0.2 }}
                                    >
                                        <div className="w-8 h-8 bg-blue-500 rounded-full mr-2" />
                                        <span>{player.role}</span>
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
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-mono p-8">
            <motion.h1
                className="text-5xl font-bold text-center text-cyan-400 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                NeonCorp: CyberWar
            </motion.h1>
            <p className="text-center text-gray-300 mb-4">
                5v5 Pentest | {gameState.selectedSystem.name} | Time: {Math.floor(gameState.timeLeft / 60)}:
                {(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </p>

            <motion.div
                className="flex justify-between mb-6 bg-gray-800 p-4 rounded-xl shadow-neon"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p>Turn {gameState.turn}/{gameState.maxTurns}</p>
                <p>
                    Health: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-400'}>{gameState.systemHealth.toFixed(1)}%</span>
                </p>
                <p>Attackers: {gameState.attackerScore}</p>
                <p>Defenders: {gameState.defenderScore}</p>
            </motion.div>

            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="w-full bg-gray-700 rounded-full h-6">
                    <motion.div
                        className="bg-green-400 h-6 rounded-full"
                        style={{ width: `${gameState.systemHealth}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </motion.div>

            {gameState.phase === 'ended' ? (
                <motion.div
                    className="text-center text-4xl text-cyan-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {getWinner()}
                    <motion.button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-cyan-500 text-white p-3 rounded-xl hover:bg-cyan-600"
                        whileHover={{ scale: 1.1 }}
                    >
                        Restart
                    </motion.button>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        className="mb-6 bg-gray-800 p-4 rounded-xl shadow-neon"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-2xl text-cyan-400 mb-2">{gameState.selectedSystem.name}</h2>
                        <p className="text-gray-300">{gameState.selectedSystem.description}</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-6">
                        <motion.div
                            className="bg-gray-800 p-6 rounded-xl shadow-neon"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-3xl text-red-500 mb-4">Attackers</h2>
                            {gameState.players.attackers.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 bg-red-500 rounded-full mr-2" />
                                        <span>{player.role}</span>
                                    </div>
                                    <span className="text-gray-400 text-sm">
                    {gameState.actions.attackers.find(a => a.playerId === player.id)
                        ? `Exploited ${gameState.selectedSystem.vulnerabilities.find(v => v.id === gameState.actions.attackers.find(a => a.playerId === player.id).vulnId)?.name}`
                        : 'Ready'}
                  </span>
                                </motion.div>
                            ))}
                            {renderInterface('attackers')}
                        </motion.div>
                        <motion.div
                            className="bg-gray-800 p-6 rounded-xl shadow-neon"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h2 className="text-3xl text-blue-500 mb-4">Defenders</h2>
                            {gameState.players.defenders.map(player => (
                                <motion.div
                                    key={player.id}
                                    className="flex items-center justify-between mb-2"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full mr-2" />
                                        <span>{player.role}</span>
                                    </div>
                                    <span className="text-gray-400 text-sm">
                    {gameState.actions.defenders[player.id]
                        ? `Patched ${gameState.selectedSystem.vulnerabilities.find(v => v.id === gameState.actions.defenders[player.id])?.name}`
                        : 'Ready'}
                  </span>
                                </motion.div>
                            ))}
                            {renderInterface('defenders')}
                        </motion.div>
                    </div>

                    <motion.div
                        className="mt-6 bg-gray-800 p-6 rounded-xl shadow-neon"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-2xl text-cyan-600 mb-4">System Logs</h2>
                        <div className="h-64 overflow-y-auto">
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

            {/* Global Styles */}
            <style jsx>{`
        .shadow-neon {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
      `}</style>
        </div>
    );
};

export default CyberWar;