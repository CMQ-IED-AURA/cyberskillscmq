import React, { useState, useEffect } from 'react';

// Simulated Systems
const systems = [
    {
        id: 1,
        name: 'Web Portal',
        description: 'NeonCorp’s public web portal with user authentication and content.',
        interface: 'web',
        vulnerabilities: [
            { id: 1, name: 'XSS', points: 80, role: 'Web Exploiter', exploit: '<script>alert("XSS")</script>', fix: 'Add Content-Security-Policy', log: 'Script injection detected' },
            { id: 2, name: 'CSRF', points: 90, role: 'Web Exploiter', exploit: '<form action="/update" method="POST"><input name="email" value="hacker@evil.com"></form>', fix: 'Implement CSRF tokens', log: 'Unauthorized update attempt' },
            { id: 3, name: 'SQL Injection', points: 100, role: 'SQL Injector', exploit: "' OR '1'='1", fix: 'Use parameterized queries', log: 'SQL error on login' },
        ],
        pages: ['home', 'login', 'profile', 'comments'],
    },
    {
        id: 2,
        name: 'File Server',
        description: 'Internal file server with restricted directories.',
        interface: 'terminal',
        vulnerabilities: [
            { id: 4, name: 'Path Traversal', points: 110, role: 'File Hacker', exploit: 'curl http://server/file?path=../../etc/passwd', fix: 'Set open_basedir in PHP', log: 'Path traversal attempt' },
            { id: 5, name: 'Privilege Escalation', points: 120, role: 'Privilege Escalator', exploit: 'sudo /bin/sh', fix: 'Restrict sudoers', log: 'Unauthorized sudo attempt' },
        ],
        commands: ['ls', 'cat .env', 'whoami', 'sudo -l'],
    },
    {
        id: 3,
        name: 'Database',
        description: 'MySQL database with user and transaction data.',
        interface: 'database',
        vulnerabilities: [
            { id: 6, name: 'Weak Credentials', points: 90, role: 'SQL Injector', exploit: 'mysql -u root -proot', fix: 'Enforce strong passwords', log: 'Weak login attempt' },
            { id: 7, name: 'Unfiltered Query', points: 110, role: 'SQL Injector', exploit: 'DROP TABLE users;', fix: 'Limit query permissions', log: 'Dangerous query detected' },
        ],
        queries: ['SHOW TABLES', 'SELECT * FROM users LIMIT 1'],
    },
    {
        id: 4,
        name: 'Network',
        description: 'Network infrastructure with exposed services.',
        interface: 'network',
        vulnerabilities: [
            { id: 8, name: 'Open Port', points: 100, role: 'Network Scanner', exploit: 'nmap -sV 192.168.1.1', fix: 'Block port 8080', log: 'Port scan detected' },
            { id: 9, name: 'Weak SSH', points: 95, role: 'Network Scanner', exploit: 'ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 user@server', fix: 'Update SSH config', log: 'Weak SSH attempt' },
        ],
        commands: ['nmap -sV 192.168.1.1', 'netstat -tuln'],
    },
];

// Recon Outputs
const reconOutputs = {
    web: {
        'curl http://portal': 'Forms: login, profile, comments',
        'dirb http://portal': 'Hidden: /admin (401)',
    },
    terminal: {
        ls: 'index.php .env',
        whoami: 'www-data',
    },
    database: {
        'SHOW TABLES': 'users, transactions',
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
    const [gameState, setGameState] = useState(() => {
        const system = systems[Math.floor(Math.random() * systems.length)];
        const shuffledAttackers = [...attackerRoles].sort(() => Math.random() - 0.5).slice(0, 5);
        const shuffledDefenders = [...defenderRoles].sort(() => Math.random() - 0.5).slice(0, 5);
        return {
            turn: 1,
            maxTurns: 5,
            timeLeft: 90,
            systemHealth: 100,
            attackerScore: 0,
            defenderScore: 0,
            actionLog: [`[15:00 CEST, June 10, 2025] ${system.name} targeted!`],
            gameOver: false,
            selectedSystem: system,
            attackerInput: '',
            defenderInput: '',
            terminalOutput: { attackers: [], defenders: [] },
            webForm: { login: '', comment: '', profile: '' },
            webPage: 'home',
            players: {
                attackers: shuffledAttackers.map((role, i) => ({ id: i + 1, role, action: null })),
                defenders: shuffledDefenders.map((role, i) => ({ id: i + 1, role, action: null })),
            },
            actions: { attackers: [], defenders: [] },
        };
    });

    // Timer
    useEffect(() => {
        if (gameState.timeLeft <= 0 && gameState.turn < gameState.maxTurns) {
            endTurn();
        } else if (gameState.timeLeft <= 0) {
            setGameState(prev => ({ ...prev, gameOver: true }));
        } else {
            const timer = setInterval(() => {
                setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState.timeLeft]);

    // Handle Input
    const handleInput = (team, inputType) => {
        const input = team === 'attackers' ? gameState.attackerInput : gameState.defenderInput;
        const command = input.trim();
        if (!command) return;

        const terminalOutput = { ...gameState.terminalOutput };
        let output = 'Invalid command.';
        let actionLog = [...gameState.actionLog];
        const { interface: systemInterface } = gameState.selectedSystem;

        if (command === 'help') {
            output = team === 'attackers'
                ? `Recon: ${Object.keys(reconOutputs[systemInterface]).join(', ')}. Exploits: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`
                : `Monitor: tail /var/log/syslog. Fixes: ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`;
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
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !p.action);
            if (vuln && player) {
                actionLog.push(`[15:00 CEST, June 10, 2025] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${input}`, `Exploit: ${vuln.name}`);
                const newPlayers = {
                    ...gameState.players,
                    attackers: gameState.players.attackers.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    ),
                };
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    webForm: { login: '', comment: '', profile: '' },
                    attackerInput: '',
                    terminalOutput,
                    players: newPlayers,
                }));
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
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !p.action);
            if (vuln && player) {
                actionLog.push(`[15:00 CEST, June 10, 2025] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name}`);
                const newPlayers = {
                    ...gameState.players,
                    attackers: gameState.players.attackers.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    ),
                };
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                    players: newPlayers,
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
                setGameState(prev => ({
                    ...prev,
                    attackerInput: '',
                    terminalOutput,
                }));
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.players.attackers.find(p => p.role === vuln?.role && !p.action);
            if (vuln && player) {
                actionLog.push(`[15:00 CEST, June 10, 2025] 💥 ${player.role} exploits ${vuln.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit: ${vuln.name}`);
                const newPlayers = {
                    ...gameState.players,
                    attackers: gameState.players.attackers.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    ),
                };
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, attackers: [...prev.actions.attackers, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    attackerInput: '',
                    terminalOutput,
                    players: newPlayers,
                }));
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
                const expectedRole = vuln?.role.replace('Exploiter', 'Sanitizer').replace('Injector', 'Hardener').replace('Hacker', 'Securer').replace('Scanner', 'Firewall').replace('Escalator', 'Monitor');
                return p.role === expectedRole && !p.action;
            });
            if (vuln && player) {
                actionLog.push(`[15:00 CEST, June 10, 2025] 🛡️ ${player.role} patches ${vuln.name}!`);
                terminalOutput.defenders.push(`> ${command}`, `Fix: ${vuln.name}`);
                const newPlayers = {
                    ...gameState.players,
                    defenders: gameState.players.defenders.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    ),
                };
                setGameState(prev => ({
                    ...prev,
                    actions: { ...prev.actions, defenders: [...prev.actions.defenders, { vulnId: vuln.id, playerId: player.id }] },
                    actionLog,
                    defenderInput: '',
                    terminalOutput,
                    players: newPlayers,
                }));
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
            const blocked = gameState.actions.defenders.some(d => d.vulnId === action.vulnId);
            if (!blocked && vuln) {
                attackerScore += vuln.points;
                systemHealth = Math.max(0, systemHealth - vuln.points / 10);
                actionLog.push(`[15:00 CEST, June 10, 2025] 💥 ${vuln.name}: ${vuln.points} points, health -${(vuln.points / 10).toFixed(1)}%`);
            } else if (vuln) {
                defenderScore += vuln.points;
                actionLog.push(`[15:00 CEST, June 10, 2025] 🛡️ ${vuln.name} blocked: ${vuln.points} points`);
            }
        });

        setGameState(prev => ({
            ...prev,
            turn: prev.turn + 1,
            timeLeft: 90,
            systemHealth,
            attackerScore,
            defenderScore,
            actionLog,
            actions: { attackers: [], defenders: [] },
            players: {
                attackers: prev.players.attackers.map(p => ({ ...p, action: null })),
                defenders: prev.players.defenders.map(p => ({ ...p, action: null })),
            },
            attackerInput: '',
            defenderInput: '',
            terminalOutput: { attackers: [], defenders: [] },
            webForm: { login: '', comment: '', profile: '' },
            webPage: 'home',
            gameOver: prev.turn + 1 > prev.maxTurns || systemHealth <= 0,
        }));
    };

    // Winner
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return 'Attackers Win! System Compromised!';
        if (gameState.defenderScore > gameState.attackerScore) return 'Defenders Win! System Secured!';
        if (gameState.attackerScore > gameState.defenderScore) return 'Attackers Win! Score Victory!';
        return 'Draw! System in Stasis!';
    };

    // Render Interface
    const renderInterface = team => {
        const { interface: systemInterface } = gameState.selectedSystem;
        if (systemInterface === 'web' && team === 'attackers') {
            return (
                <div className="bg-gray-900 p-6 rounded-lg border-2 border-red-600">
                    <div className="flex space-x-4 mb-4">
                        {gameState.selectedSystem.pages.map(page => (
                            <button
                                key={page}
                                onClick={() => navigateWeb(page)}
                                className="text-cyan-400 hover:underline capitalize"
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    {gameState.webPage === 'home' && <p className="text-gray-300">Welcome to NeonCorp’s web portal.</p>}
                    {gameState.webPage === 'login' && (
                        <div>
                            <input
                                type="text"
                                value={gameState.webForm.login}
                                onChange={e => handleWebForm('login', e.target.value)}
                                className="w-full p-2 mb-2 bg-gray-800 text-white rounded-md"
                                placeholder="Username or SQL injection"
                            />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
                            >
                                Login
                            </button>
                        </div>
                    )}
                    {gameState.webPage === 'profile' && (
                        <div>
                            <input
                                type="text"
                                value={gameState.webForm.profile}
                                onChange={e => handleWebForm('profile', e.target.value)}
                                className="w-full p-2 mb-2 bg-gray-800 text-white rounded-md"
                                placeholder="Email or CSRF payload"
                            />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
                            >
                                Update
                            </button>
                        </div>
                    )}
                    {gameState.webPage === 'comments' && (
                        <div>
              <textarea
                  value={gameState.webForm.comment}
                  onChange={e => handleWebForm('comment', e.target.value)}
                  className="w-full p-2 mb-2 bg-gray-800 text-white rounded-md"
                  placeholder="Comment or XSS payload"
              />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
                            >
                                Post
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        if (systemInterface === 'database' && team === 'attackers') {
            return (
                <div className="bg-gray-900 p-6 rounded-lg border-2 border-red-600">
          <textarea
              value={gameState.attackerInput}
              onChange={e => setGameState(prev => ({ ...prev, attackerInput: e.target.value }))}
              className="w-full h-24 p-2 bg-gray-800 text-white rounded-md mb-2"
              placeholder="SQL query or credentials"
          />
                    <button
                        onClick={() => handleInput('attackers', 'query')}
                        className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
                    >
                        Execute
                    </button>
                </div>
            );
        }
        return (
            <div className={`bg-gray-900 p-6 rounded-lg border-2 ${team === 'attackers' ? 'border-red-600' : 'border-blue-600'}`}>
                <div className="bg-gray-800 p-4 rounded-lg h-24 overflow-y-auto mb-4">
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
                        onKeyPress={e => e.key === 'Enter' && handleInput(team, 'terminal')}
                        className="flex-1 p-2 bg-gray-800 text-white rounded-md"
                        placeholder="Enter command (e.g., 'help')"
                    />
                    <button
                        onClick={() => handleInput(team, 'terminal')}
                        className={`ml-2 bg-${team === 'attackers' ? 'red-600' : 'blue-600'} text-white p-2 rounded hover:bg-${team === 'attackers' ? 'red-700' : 'blue-700'}`}
                    >
                        Run
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
            <h1 className="text-4xl font-bold text-center text-cyan-400 mb-4">NeonCorp: CyberWar</h1>
            <p className="text-center text-gray-300 mb-6">
                5v5 Cyber Battle | System: {gameState.selectedSystem.name} | Time: {Math.floor(gameState.timeLeft / 60)}:
                {(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </p>

            <div className="flex justify-between mb-6 bg-gray-800 p-4 rounded-lg">
                <p>Turn {gameState.turn}/{gameState.maxTurns}</p>
                <p>
                    Health: <span className={gameState.systemHealth < 30 ? 'text-red-600' : 'text-green-600'}>{gameState.systemHealth.toFixed(1)}%</span>
                </p>
                <p>Attackers: {gameState.attackerScore}</p>
                <p>Defenders: {gameState.defenderScore}</p>
            </div>

            <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-6">
                    <div
                        className="bg-green-600 h-6 rounded-full transition-all duration-300"
                        style={{ width: `${gameState.systemHealth}%` }}
                    />
                </div>
            </div>

            {gameState.gameOver ? (
                <div className="text-center text-3xl text-cyan-400">
                    {getWinner()}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700"
                    >
                        Restart
                    </button>
                </div>
            ) : (
                <>
                    <div className="mb-6 bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-2xl text-cyan-400 mb-2">{gameState.selectedSystem.name}</h2>
                        <p className="text-gray-300">{gameState.selectedSystem.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl text-red-600 mb-4">Attackers</h2>
                            {gameState.players.attackers.map(player => (
                                <div key={player.id} className="flex justify-between mb-2">
                                    <span>{player.role}</span>
                                    <span className="text-gray-300">
                    {player.action ? `Used ${gameState.selectedSystem.vulnerabilities.find(v => v.id === player.action)?.name || 'Unknown'}` : 'Ready'}
                  </span>
                                </div>
                            ))}
                            {renderInterface('attackers')}
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl text-blue-600 mb-4">Defenders</h2>
                            {gameState.players.defenders.map(player => (
                                <div key={player.id} className="flex justify-between mb-2">
                                    <span>{player.role}</span>
                                    <span className="text-gray-300">
                    {player.action ? `Fixed ${gameState.selectedSystem.vulnerabilities.find(v => v.id === player.action)?.name || 'Unknown'}` : 'Ready'}
                  </span>
                                </div>
                            ))}
                            {renderInterface('defenders')}
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-lg text-cyan-400 mb-2">System Logs</h2>
                        <div className="h-40 overflow-y-auto">
                            {gameState.actionLog.map((log, index) => (
                                <p key={index} className="text-gray-300">{log}</p>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CyberWar;