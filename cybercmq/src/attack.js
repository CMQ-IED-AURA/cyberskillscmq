import React, { useState, useEffect } from 'react';

// Simulated systems
const systems = [
    {
        id: 1,
        name: "Web Application",
        description: "NeonCorp’s public-facing web portal with login, profile, and comment features.",
        vulnerabilities: [
            { id: 1, name: "XSS", points: 80, role: "Web Exploiter", exploit: "<script>alert(document.cookie)</script>", fix: "Enable Content-Security-Policy: script-src 'self'", log: "Malicious script detected in comment form" },
            { id: 2, name: "CSRF", points: 90, role: "Web Exploiter", exploit: "<form action='/profile' method='POST'><input name='email' value='hacker@evil.com'><input type='submit'></form>", fix: "Add CSRF token validation", log: "Unauthorized POST to /profile" },
            { id: 3, name: "SQL Injection", points: 120, role: "SQL Injector", exploit: "' OR '1'='1'--", fix: "Use prepared statements", log: "SQL error: unexpected input on /login" }
        ],
        interface: "web"
    },
    {
        id: 2,
        name: "File Server",
        description: "NeonCorp’s internal file server with directory access.",
        vulnerabilities: [
            { id: 4, name: "File Inclusion", points: 110, role: "File Hacker", exploit: "curl http://192.168.1.30/file?path=../../etc/passwd", fix: "echo 'open_basedir=/var/www' >> /etc/php.ini", log: "Path traversal attempt on /file" },
            { id: 5, name: "Privilege Escalation", points: 130, role: "Privilege Escalator", exploit: "sudo -u root /bin/sh", fix: "chmod 750 /bin/sh; echo 'root ALL=(ALL) NOPASSWD: NONE' >> /etc/sudoers", log: "Unauthorized sudo attempt" }
        ],
        interface: "terminal"
    },
    {
        id: 3,
        name: "Database",
        description: "NeonCorp’s MySQL database with user and order tables.",
        vulnerabilities: [
            { id: 6, name: "Weak Credentials", points: 100, role: "SQL Injector", exploit: "mysql -u admin -ppassword123", fix: "ALTER USER 'admin'@'localhost' IDENTIFIED BY 'Str0ngP@ssw0rd!'", log: "Login attempt with weak password" },
            { id: 7, name: "Unfiltered Query", points: 120, role: "SQL Injector", exploit: "SELECT * FROM users WHERE id=1; DROP TABLE users;--", fix: "Grant SELECT only to app user", log: "DROP TABLE attempt detected" }
        ],
        interface: "database"
    },
    {
        id: 4,
        name: "Network",
        description: "NeonCorp’s network infrastructure with open ports.",
        vulnerabilities: [
            { id: 8, name: "Open Port Exploit", points: 90, role: "Network Scanner", exploit: "nmap -sV 192.168.1.10; msfconsole -q -x 'use exploit/multi/http/tomcat_mgr_upload; set RHOSTS 192.168.1.10; run'", fix: "iptables -A INPUT -p tcp --dport 8080 -j DROP", log: "Port 8080 exploit attempt" },
            { id: 9, name: "Weak SSH Config", points: 100, role: "Network Scanner", exploit: "ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 admin@192.168.1.10", fix: "echo 'KexAlgorithms curve25519-sha256' >> /etc/ssh/sshd_config", log: "Weak SSH key exchange detected" }
        ],
        interface: "network"
    }
];

// Reconnaissance commands (for terminal and network interfaces)
const reconCommands = {
    web: [
        { command: "curl http://192.168.1.10", output: "Forms: /login, /profile, /comments" },
        { command: "dirb http://192.168.1.10", output: "Hidden: /admin (401), /.git (403)" }
    ],
    terminal: [
        { command: "ls -la /var/www", output: "index.php, file.php, .env (rw-r--r--)" },
        { command: "whoami", output: "www-data" }
    ],
    database: [
        { command: "SHOW TABLES;", output: "users, orders" },
        { command: "SELECT * FROM users LIMIT 1;", output: "admin, password123" }
    ],
    network: [
        { command: "nmap -sV 192.168.1.10", output: "80/tcp open http Apache 2.4.41, 22/tcp open ssh OpenSSH 7.9, 8080/tcp open http Tomcat 9.0" },
        { command: "netstat -tuln", output: "tcp 0 0 0.0.0.0:80, tcp 0 0 0.0.0.0:22, tcp 0 0 0.0.0.0:8080" }
    ]
};

// Roles
const attackerRoles = ["Web Exploiter", "SQL Injector", "File Hacker", "Network Scanner", "Privilege Escalator"];
const defenderRoles = ["Web Sanitizer", "Database Hardener", "File Securer", "Firewall Admin", "System Monitor"];

const AttackSimulator = () => {
    const [gameState, setGameState] = useState(() => {
        const selectedSystem = systems[Math.floor(Math.random() * systems.length)];
        return {
            turn: 1,
            maxTurns: 7,
            timeLeft: 120, // 2 minutes per turn
            systemHealth: 100,
            attackersScore: 0,
            defendersScore: 0,
            attackerActions: [], // { vulnId, playerId }
            defenderActions: [], // { vulnId, playerId }
            actionLog: [`NeonCorp’s ${selectedSystem.name} targeted. Pentest begins! 11:50 AM CEST, June 10, 2025`],
            gameOver: false,
            attackerInput: "",
            defenderInput: "",
            terminalOutput: { attackers: [], defenders: [] },
            selectedSystem,
            webForm: { login: "", comment: "", profileEmail: "" },
            webPage: "home", // home, login, profile, comments
            playerAssignments: {
                attackers: attackerRoles.map((role, i) => ({ id: i + 1, role, action: null })),
                defenders: defenderRoles.map((role, i) => ({ id: i + 1, role, action: null }))
            }
        };
    });

    // Timer and sound effects
    useEffect(() => {
        if (gameState.timeLeft <= 0 && gameState.turn < gameState.maxTurns) {
            endTurn();
            playSound('turn-end');
        } else if (gameState.timeLeft <= 0 && gameState.turn === gameState.maxTurns) {
            setGameState(prev => ({ ...prev, gameOver: true }));
            playSound('game-over');
        } else {
            const timer = setInterval(() => {
                setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
                if (prev.timeLeft === 10) playSound('warning');
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState.timeLeft]);

    // Sound effect handler
    const playSound = (type) => {
        const sounds = {
            'turn-end': new Audio('https://freesound.org/data/previews/171/171671_2437358-lq.mp3'),
            'warning': new Audio('https://freesound.org/data/previews/316/316847_4939433-lq.mp3'),
            'game-over': new Audio('https://freesound.org/data/previews/387/387739_1385886-lq.mp3')
        };
        sounds[type]?.play().catch(() => {});
    };

    // Handle terminal or query input
    const handleInput = (team, inputType) => {
        const input = team === 'attackers' ? gameState.attackerInput : gameState.defenderInput;
        const command = input.trim();
        const terminalOutput = { ...gameState.terminalOutput };
        let output = "Invalid input.";
        let newActionLog = [...gameState.actionLog];
        const systemInterface = gameState.selectedSystem.interface;

        if (command === "help") {
            output = team === 'attackers'
                ? `Commands: ${reconCommands[systemInterface].map(c => c.command).join(', ')}, exploits for ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`
                : `Commands: tail -n 10 /var/log/syslog, fixes for ${gameState.selectedSystem.vulnerabilities.map(v => v.name).join(', ')}`;
            terminalOutput[team].push(`> ${command}`, output);
            setGameState({
                ...prev => ({
                    ...prev,
                    [team === 'attackers' ? 'attackerInput' : 'defenderInput']: "",
                    terminalOutput
                })
            });
            return;
        }

        if (systemInterface === 'web' && inputType === 'form') {
            if (team === 'attackers') {
                const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === input && v.role === gameState.playerAssignments.attackers.find(p => !p.action)?.role);
                const player = gameState.playerAssignments.attackers.find(p => !p.action && p.role === vuln?.role);
                if (vuln && player && gameState.attackerActions.length < 5) {
                    newActionLog.push(`💥 ${player.role} exploits ${vuln.name} on ${gameState.selectedSystem.name}!`);
                    terminalOutput.attackers.push(`Form input: ${input}`, `Exploit successful: ${vuln.name}.`);
                    const newPlayerAssignments = {
                        ...gameState.playerAssignments,
                        attackers: gameState.playerAssignments.attackers.map(p =>
                            p.id === player.id ? { ...p, action: vuln.id } : p
                        )
                    };
                    setGameState({
                        ...prev => ({
                            ...prev,
                            attackerActions: [...prev.attackerActions, { vulnId: vuln.id, playerId: player.id }],
                            actionLog: newActionLog,
                            webForm: { login: "", comment: "", profileEmail: "" },
                            attackerInput: "",
                            terminalOutput,
                            playerAssignments: newPlayerAssignments
                        })
                    });
                    playSound('warning');
                } else {
                    terminalOutput.attackers.push(`Form input: ${input}`, output);
                    setGameState({
                        ...prev => ({
                            ...prev,
                            webForm: { login: "", comment: "", profileEmail: "" },
                            attackerInput: "",
                            terminalOutput
                        })
                    });
                }
            }
            return;
        }

        if (systemInterface === 'database' && inputType === 'query' && team === 'attackers') {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command && v.role === gameState.playerAssignments.attackers.find(p => !p.action)?.role);
            const player = gameState.playerAssignments.attackers.find(p => !p.action && p.role === vuln?.role);
            if (vuln && player && gameState.attackerActions.length < 5) {
                newActionLog.push(`💥 ${player.role} exploits ${vuln.name} on ${gameState.selectedSystem.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit successful: ${vuln.name}.`);
                const newPlayerAssignments = {
                    ...gameState.playerAssignments,
                    attackers: gameState.playerAssignments.attackers.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    )
                };
                setGameState({
                    ...prev => ({
                        ...prev,
                        attackerActions: [...prev.attackerActions, { vulnId: vuln.id, playerId: player.id }],
                        actionLog: newActionLog,
                        attackerInput: "",
                        terminalOutput,
                        playerAssignments: newPlayerAssignments
                    })
                });
                playSound('warning');
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState({
                    ...prev => ({
                        ...prev,
                        attackerInput: "",
                        terminalOutput
                    })
                });
            }
            return;
        }

        if (team === 'attackers') {
            const recon = reconCommands[systemInterface].find(rc => rc.command === command);
            if (recon) {
                output = `Recon: ${recon.output}`;
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState({
                    ...prev => ({
                        ...prev,
                        attackerInput: "",
                        terminalOutput
                    })
                });
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.exploit === command && v.role === gameState.playerAssignments.attackers.find(p => !p.action)?.role);
            const player = gameState.playerAssignments.attackers.find(p => !p.action && p.role === vuln?.role);
            if (vuln && player && gameState.attackerActions.length < 5) {
                newActionLog.push(`💥 ${player.role} exploits ${vuln.name} on ${gameState.selectedSystem.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit successful: ${vuln.name}.`);
                const newPlayerAssignments = {
                    ...gameState.playerAssignments,
                    attackers: gameState.playerAssignments.attackers.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    )
                };
                setGameState({
                    ...prev => ({
                        ...prev,
                        attackerActions: [...prev.attackerActions, { vulnId: vuln.id, playerId: player.id }],
                        actionLog: newActionLog,
                        attackerInput: "",
                        terminalOutput,
                        playerAssignments: newPlayerAssignments
                    })
                });
                playSound('warning');
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState({
                    ...prev => ({
                        ...prev,
                        attackerInput: "",
                        terminalOutput
                    })
                });
            }
        } else {
            if (command === "tail -n 10 /var/log/syslog") {
                output = gameState.actionLog
                    .filter(log => log.includes('💥'))
                    .slice(-10)
                    .map(log => log.replace('💥', 'ALERT:'))
                    .join('\n') || "No recent attack logs.";
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState({
                    ...prev => ({
                        ...prev,
                        defenderInput: "",
                        terminalOutput
                    })
                });
                return;
            }

            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.fix === command && v.role.replace('Attacker', 'Defender') === gameState.playerAssignments.defenders.find(p => !p.action)?.role);
            const player = gameState.playerAssignments.defenders.find(p => !p.action && p.role === vuln?.role.replace('Attacker', 'Defender'));
            if (vuln && player && gameState.defenderActions.length < 5) {
                newActionLog.push(`🛡️ ${player.role} patches ${vuln.name} on ${gameState.selectedSystem.name}!`);
                terminalOutput.defenders.push(`> ${command}`, `Patch successful: ${vuln.name} secured.`);
                const newPlayerAssignments = {
                    ...gameState.playerAssignments,
                    defenders: gameState.playerAssignments.defenders.map(p =>
                        p.id === player.id ? { ...p, action: vuln.id } : p
                    )
                };
                setGameState({
                    ...prev => ({
                        ...prev,
                        defenderActions: [...prev.defenderActions, { vulnId: vuln.id, playerId: player.id }],
                        actionLog: newActionLog,
                        defenderInput: "",
                        terminalOutput,
                        playerAssignments: newPlayerAssignments
                    })
                });
                playSound('warning');
            } else {
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState({
                    ...prev => ({
                        ...prev,
                        defenderInput: "",
                        terminalOutput
                    })
                });
            }
        }
    };

    // Navigate web app
    const navigateWeb = (page) => {
        setGameState(prev => ({
            ...prev,
            webPage: page,
            attackerInput: "",
            terminalOutput: {
                ...prev.terminalOutput,
                attackers: [...prev.terminalOutput.attackers, `Navigated to ${page}`]
            }
        }));
    };

    // Handle web form input
    const handleWebForm = (field, value) => {
        setGameState(prev => ({
            ...prev,
            webForm: { ...prev.webForm, [field]: value },
            attackerInput: value
        }));
    };

    // End turn
    const endTurn = () => {
        let newAttackersScore = gameState.attackersScore;
        let newDefendersScore = gameState.defendersScore;
        let newSystemHealth = gameState.systemHealth;
        let newActionLog = [...gameState.actionLog];

        gameState.attackerActions.forEach(action => {
            const vuln = gameState.selectedSystem.vulnerabilities.find(v => v.id === action.vulnId);
            const isBlocked = gameState.defenderActions.some(d => d.vulnId === action.vulnId);
            if (!isBlocked) {
                newAttackersScore += vuln.points;
                newSystemHealth = Math.max(0, newSystemHealth - vuln.points / 10);
                newActionLog.push(`💥 ${vuln.name} deals ${vuln.points} points, health -${(vuln.points / 10).toFixed(1)}%`);
            } else {
                newDefendersScore += vuln.points;
                newActionLog.push(`🛡️ ${vuln.name} blocked: ${vuln.points} points`);
            }
        });

        const newPlayerAssignments = {
            attackers: gameState.playerAssignments.attackers.map(p => ({ ...p, action: null })),
            defenders: gameState.playerAssignments.defenders.map(p => ({ ...p, action: null }))
        };

        setGameState({
            ...prev => ({
                ...prev,
                turn: prev.turn + 1,
                timeLeft: 120,
                systemHealth: newSystemHealth,
                attackersScore: newAttackersScore,
                defendersScore: newDefendersScore,
                attackerActions: [],
                defenderActions: [],
                actionLog: newActionLog,
                playerAssignments: newPlayerAssignments,
                gameOver: prev.turn + 1 > prev.maxTurns || newSystemHealth <= 0,
                attackerInput: "",
                defenderInput: "",
                terminalOutput: { attackers: [], defenders: [] },
                webForm: { login: "", comment: "", profileEmail: "" },
                webPage: "home"
            })
        });
    };

    // Winner determination
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return `Hackers Win! ${gameState.selectedSystem.name} Compromised!`;
        if (gameState.defendersScore > gameState.attackersScore) return `Defenders Win! ${gameState.selectedSystem.name} Secured!`;
        if (gameState.attackersScore > gameState.defendersScore) return `Hackers Win! Score Domination!`;
        return `Stalemate! ${gameState.selectedSystem.name} in Limbo!`;
    };

    // Render system interface
    const renderSystemInterface = (team) => {
        const { interface: systemInterface } = gameState.selectedSystem;
        if (systemInterface === 'web' && team === 'attackers') {
            return (
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg border-2 border-red-500">
                    <div className="mb-4">
                        <button onClick={() => navigateWeb('home')} className="mr-2 text-cyan-400 hover:underline">Home</button>
                        <button onClick={() => navigateWeb('login')} className="mr-2 text-cyan-400 hover:underline">Login</button>
                        <button onClick={() => navigateWeb('profile')} className="mr-2 text-cyan-400 hover:underline">Profile</button>
                        <button onClick={() => navigateWeb('comments')} className="text-cyan-400 hover:underline">Comments</button>
                    </div>
                    {gameState.webPage === 'home' && <p className="text-gray-300">Welcome to NeonCorp’s portal. Navigate to exploit vulnerabilities.</p>}
                    {gameState.webPage === 'login' && (
                        <div>
                            <p className="text-gray-300 mb-2">Login Form</p>
                            <input
                                type="text"
                                value={gameState.webForm.login}
                                onChange={(e) => handleWebForm('login', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md mb-2"
                                placeholder="Username or SQL injection"
                            />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                            >
                                Submit
                            </button>
                        </div>
                    )}
                    {gameState.webPage === 'profile' && (
                        <div>
                            <p className="text-gray-300 mb-2">Update Profile</p>
                            <input
                                type="text"
                                value={gameState.webForm.profileEmail}
                                onChange={(e) => handleWebForm('profileEmail', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md mb-2"
                                placeholder="Email or CSRF payload"
                            />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                            >
                                Update
                            </button>
                        </div>
                    )}
                    {gameState.webPage === 'comments' && (
                        <div>
                            <p className="text-gray-300 mb-2">Comment Section</p>
                            <textarea
                                value={gameState.webForm.comment}
                                onChange={(e) => handleWebForm('comment', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md mb-2"
                                placeholder="Comment or XSS payload"
                            />
                            <button
                                onClick={() => handleInput('attackers', 'form')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
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
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg border-2 border-red-500">
                    <p className="text-gray-300 mb-2">MySQL Query Interface</p>
                    <textarea
                        value={gameState.attackerInput}
                        onChange={(e) => setGameState({ ...prev => ({ ...prev, attackerInput: e.target.value }) })}
                        className="w-full h-24 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md mb-2"
                        placeholder="Enter SQL query or credentials"
                    />
                    <button
                        onClick={() => handleInput('attackers', 'query')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                    >
                        Execute
                    </button>
                </div>
            );
        }
        return (
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border-2 border-{team === 'attackers' ? 'red' : 'blue'}-500">
                <p className="text-gray-300 mb-2">{team === 'attackers' ? 'Hacker' : 'Defender'} Terminal (type 'help' for commands):</p>
                <div className="bg-black p-4 rounded-md h-48 overflow-y-auto mb-4">
                    {gameState.terminalOutput[team].map((line, index) => (
                        <p key={index} className="text-sm text-green-400">{line}</p>
                    ))}
                </div>
                <div className="flex items-center">
                    <input
                        type="text"
                        value={team === 'attackers' ? gameState.attackerInput : gameState.defenderInput}
                        onChange={(e) => setGameState({ ...prev => ({ ...prev, [team === 'attackers' ? 'attackerInput' : 'defenderInput']: e.target.value }) })}
                        onKeyPress={(e) => e.key === 'Enter' && handleInput(team)}
                        className="flex-1 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-{team === 'attackers' ? 'red' : 'blue'}-500"
                        placeholder={`Command for ${gameState.selectedSystem.name}`}
                    />
                    <button
                        onClick={() => handleInput(team)}
                        className={`ml-2 bg-${team === 'attackers' ? 'red' : 'blue'}-600 hover:bg-${team === 'attackers' ? 'red' : 'blue'}-700 text-white px-4 py-2 rounded-md`}
                    >
                        Run
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-mono p-8">
            {/* Header */}
            <h1 className="text-5xl text-center text-cyan-400 mb-8 font-bold tracking-wider animate-pulse">
                NeonCorp: CyberWar
            </h1>
            <p className="text-center text-lg text-gray-300 mb-6">
                5v5 Pentest: Hackers vs. Defenders. Target: {gameState.selectedSystem.name} (11:50 AM CEST, June 10, 2025)
            </p>

            {/* Game Status */}
            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-cyan-500 mb-8">
                <div className="text-xl">Turn {gameState.turn}/{gameState.maxTurns}</div>
                <div className="text-xl text-yellow-400">
                    Time: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xl">
                    System Health: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-500'}>
                        {gameState.systemHealth.toFixed(1)}%
                    </span>
                </div>
                <div className="text-xl">Hackers: {gameState.attackersScore}</div>
                <div className="text-xl">Defenders: {gameState.defendersScore}</div>
            </div>

            {/* System Health Bar */}
            <div className="mb-8">
                <div className="relative w-full bg-gray-700 rounded-full h-8 border-2 border-cyan-500 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-full transition-all duration-500"
                        style={{ width: `${gameState.systemHealth}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                        {gameState.selectedSystem.name}
                    </div>
                </div>
            </div>

            {gameState.gameOver ? (
                <div className="text-center text-4xl text-yellow-400 mb-8 animate-bounce">
                    {getWinner()}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-transform hover:scale-105"
                    >
                        Replay
                    </button>
                </div>
            ) : (
                <>
                    {/* System Info */}
                    <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-cyan-500">
                        <h2 className="text-2xl text-cyan-400 mb-4 font-bold">Target System: {gameState.selectedSystem.name}</h2>
                        <p className="text-gray-300">{gameState.selectedSystem.description}</p>
                    </div>

                    {/* Teams */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Attackers */}
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-red-500">
                            <h2 className="text-3xl text-red-400 mb-6 font-bold">Hackers (5 Players)</h2>
                            <div className="mb-6">
                                {gameState.playerAssignments.attackers.map(player => (
                                    <div key={player.id} className="flex items-center justify-between mb-2 bg-gray-900 p-3 rounded-md">
                                        <span className="text-gray-300">{player.role} (#{player.id})</span>
                                        <span className="text-sm text-gray-400">
                                            {player.action ? `Exploited ${gameState.selectedSystem.vulnerabilities.find(v => v.id === player.action).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {renderSystemInterface('attackers')}
                        </div>

                        {/* Defenders */}
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-500">
                            <h2 className="text-3xl text-blue-400 mb-6 font-bold">Defenders (5 Players)</h2>
                            <div className="mb-6">
                                {gameState.playerAssignments.defenders.map(player => (
                                    <div key={player.id} className="flex items-center justify-between mb-2 bg-gray-900 p-3 rounded-md">
                                        <span className="text-gray-300">{player.role} (#{player.id})</span>
                                        <span className="text-sm text-gray-400">
                                            {player.action ? `Patched ${gameState.selectedSystem.vulnerabilities.find(v => v.id === player.action).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {renderSystemInterface('defenders')}
                        </div>
                    </div>

                    {/* Action Log */}
                    <div className="mt-8 bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-cyan-500">
                        <h2 className="text-3xl text-cyan-400 mb-6 font-bold">System Logs</h2>
                        <div className="max-h-64 overflow-y-auto">
                            {gameState.actionLog.map((log, index) => (
                                <p key={index} className="text-sm text-gray-300 mb-2 animate-fade-in">{log}</p>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-pulse {
                    animation: pulse 2s infinite;
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-in;
                }
                .animate-bounce {
                    animation: bounce 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default AttackSimulator;