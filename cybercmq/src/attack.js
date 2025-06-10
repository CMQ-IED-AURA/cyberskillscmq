import React, { useState, useEffect } from 'react';

// Simulated network servers
const servers = [
    {
        id: 1,
        name: "Web Server",
        ip: "192.168.1.10",
        services: ["HTTP:80", "SSH:22"],
        vulnerabilities: [
            { id: 1, name: "XSS", points: 80, exploit: "curl -X POST http://192.168.1.10/login -d 'input=<script>alert(document.cookie)</script>'", fix: "iptables -A INPUT -p tcp --dport 80 -m string --string '<script>' --algo bm -j DROP", log: "POST /login with <script> detected" },
            { id: 2, name: "CSRF", points: 90, exploit: "curl -X POST http://192.168.1.10/change-email -d 'email=hacker@evil.com'", fix: "echo 'CSRF_TOKEN=$(uuidgen)' >> /etc/nginx.conf", log: "Unauthorized POST to /change-email" }
        ],
        status: "online",
        logs: []
    },
    {
        id: 2,
        name: "API Server",
        ip: "192.168.1.15",
        services: ["HTTP:8080"],
        vulnerabilities: [
            { id: 3, name: "API Key Leak", points: 100, exploit: "curl http://192.168.1.15/.env", fix: "chmod 600 /var/www/.env", log: "GET /.env accessed" }
        ],
        status: "online",
        logs: []
    },
    {
        id: 3,
        name: "Database Server",
        ip: "192.168.1.20",
        services: ["MySQL:3306"],
        vulnerabilities: [
            { id: 4, name: "SQL Injection", points: 120, exploit: "sqlmap -u http://192.168.1.20/login --data 'user=admin&pass=1' --level 2", fix: "mysql -e 'SET GLOBAL sql_mode=\"STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION\"'", log: "SQL error: unexpected input on /login" }
        ],
        status: "online",
        logs: []
    },
    {
        id: 4,
        name: "File Server",
        ip: "192.168.1.30",
        services: ["FTP:21"],
        vulnerabilities: [
            { id: 5, name: "File Inclusion", points: 110, exploit: "curl http://192.168.1.30/file?path=../../etc/passwd", fix: "echo 'open_basedir=/var/www' >> /etc/php.ini", log: "GET /file with path traversal attempt" }
        ],
        status: "online",
        logs: []
    }
];

// Reconnaissance commands
const reconCommands = [
    { command: "nmap -sV 192.168.1.10", output: "80/tcp open http Apache 2.4.41\n22/tcp open ssh OpenSSH 7.9", serverId: 1 },
    { command: "nmap -sV 192.168.1.15", output: "8080/tcp open http Node.js 14.17", serverId: 2 },
    { command: "nmap -sV 192.168.1.20", output: "3306/tcp open mysql MySQL 8.0.22", serverId: 3 },
    { command: "nmap -sV 192.168.1.30", output: "21/tcp open ftp vsftpd 3.0.3", serverId: 4 },
    { command: "hydra -l admin -P /wordlist.txt 192.168.1.10 ssh", output: "Found: admin:password123", serverId: 1 }
];

// Player roles
const attackerRoles = ["Recon Specialist", "Web Exploiter", "API Hacker", "Database Cracker", "File Intruder"];
const defenderRoles = ["Firewall Admin", "Log Analyst", "Config Hardener", "Database Securer", "File Protector"];

const AttackSimulator = () => {
    const [gameState, setGameState] = useState({
        turn: 1,
        maxTurns: 7,
        timeLeft: 120, // 2 minutes per turn
        systemHealth: 100,
        attackersScore: 0,
        defendersScore: 0,
        attackerActions: [], // { serverId, vulnId, playerId }
        defenderActions: [], // { serverId, vulnId, playerId }
        actionLog: ["NeonCorp’s network online. Pentest begins! 10:13 AM CEST, June 10, 2025"],
        gameOver: false,
        attackerTerminalInput: "",
        defenderTerminalInput: "",
        terminalOutput: { attackers: [], defenders: [] },
        selectedServer: null, // { team, serverId }
        servers: servers.map(s => ({ ...s, logs: [] })),
        playerAssignments: {
            attackers: Array(5).fill(null).map((_, i) => ({ id: i + 1, role: attackerRoles[i], action: null })),
            defenders: Array(5).fill(null).map((_, i) => ({ id: i + 1, role: defenderRoles[i], action: null }))
        }
    });

    // Timer and sound effects
    useEffect(() => {
        if (gameState.timeLeft <= 0 && gameState.turn < gameState.maxTurns) {
            endTurn();
            playSound('turn-end');
        } else if (gameState.timeLeft <= 0 && gameState.turn === gameState.maxTurns) {
            setGameState({ ...gameState, gameOver: true });
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

    // Handle terminal command
    const handleTerminalCommand = (team) => {
        const input = team === 'attackers' ? gameState.attackerTerminalInput : gameState.defenderTerminalInput;
        const command = input.trim();
        const terminalOutput = { ...gameState.terminalOutput };
        let output = "Command not recognized.";
        let newServers = [...gameState.servers];
        let newActionLog = [...gameState.actionLog];

        if (command === "help") {
            output = team === 'attackers'
                ? "Commands: nmap -sV <ip>, hydra -l <user> -P <wordlist> <ip> <service>, curl, sqlmap"
                : "Commands: tail -n 10 /var/log/syslog, iptables, chmod, echo, mysql";
            terminalOutput[team].push(`> ${command}`, output);
            setGameState({
                ...gameState,
                [team === 'attackers' ? 'attackerTerminalInput' : 'defenderTerminalInput']: "",
                terminalOutput
            });
            return;
        }

        if (team === 'attackers') {
            const recon = reconCommands.find(rc => rc.command === command);
            if (recon) {
                output = `Recon: ${recon.output}`;
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState({
                    ...gameState,
                    attackerTerminalInput: "",
                    terminalOutput
                });
                return;
            }

            const server = newServers.find(s => s.vulnerabilities.some(v => v.exploit === command));
            const vuln = server?.vulnerabilities.find(v => v.exploit === command);
            const player = gameState.playerAssignments.attackers.find(p => !p.action);
            if (vuln && player && gameState.attackerActions.length < 5) {
                newServers = newServers.map(s =>
                    s.id === server.id ? { ...s, logs: [...s.logs, vuln.log] } : s
                );
                const newPlayerAssignments = {
                    ...gameState.playerAssignments,
                    attackers: gameState.playerAssignments.attackers.map(p =>
                        p.id === player.id ? { ...p, action: { serverId: server.id, vulnId: vuln.id } } : p
                    )
                };
                newActionLog.push(`💥 ${player.role} exploits ${vuln.name} on ${server.name}!`);
                terminalOutput.attackers.push(`> ${command}`, `Exploit successful: ${vuln.name} executed.`);
                setGameState({
                    ...gameState,
                    attackerActions: [...gameState.attackerActions, { serverId: server.id, vulnId: vuln.id, playerId: player.id }],
                    actionLog: newActionLog,
                    attackerTerminalInput: "",
                    terminalOutput,
                    servers: newServers,
                    playerAssignments: newPlayerAssignments
                });
                playSound('warning');
            } else {
                terminalOutput.attackers.push(`> ${command}`, output);
                setGameState({
                    ...gameState,
                    attackerTerminalInput: "",
                    terminalOutput
                });
            }
        } else {
            if (command === "tail -n 10 /var/log/syslog") {
                const server = newServers.find(s => s.id === gameState.selectedServer?.serverId);
                output = server?.logs.length ? server.logs.join('\n') : "No recent logs.";
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState({
                    ...gameState,
                    defenderTerminalInput: "",
                    terminalOutput
                });
                return;
            }

            const server = newServers.find(s => s.vulnerabilities.some(v => v.fix === command));
            const vuln = server?.vulnerabilities.find(v => v.fix === command);
            const player = gameState.playerAssignments.defenders.find(p => !p.action);
            if (vuln && player && gameState.defenderActions.length < 5) {
                const newPlayerAssignments = {
                    ...gameState.playerAssignments,
                    defenders: gameState.playerAssignments.defenders.map(p =>
                        p.id === player.id ? { ...p, action: { serverId: server.id, vulnId: vuln.id } } : p
                    )
                };
                newActionLog.push(`🛡️ ${player.role} patches ${vuln.name} on ${server.name}!`);
                terminalOutput.defenders.push(`> ${command}`, `Patch successful: ${vuln.name} secured.`);
                setGameState({
                    ...gameState,
                    defenderActions: [...gameState.defenderActions, { serverId: server.id, vulnId: vuln.id, playerId: player.id }],
                    actionLog: newActionLog,
                    defenderTerminalInput: "",
                    terminalOutput,
                    servers: newServers,
                    playerAssignments: newPlayerAssignments
                });
                playSound('warning');
            } else {
                terminalOutput.defenders.push(`> ${command}`, output);
                setGameState({
                    ...gameState,
                    defenderTerminalInput: "",
                    terminalOutput
                });
            }
        }
    };

    // Select server
    const selectServer = (team, serverId) => {
        setGameState({
            ...gameState,
            selectedServer: { team, serverId },
            terminalOutput: {
                ...gameState.terminalOutput,
                [team]: [...gameState.terminalOutput[team], `Selected ${servers.find(s => s.id === serverId).name} (${team})`]
            },
            [team === 'attackers' ? 'attackerTerminalInput' : 'defenderTerminalInput']: ""
        });
    };

    // End turn
    const endTurn = () => {
        let newAttackersScore = gameState.attackersScore;
        let newDefendersScore = gameState.defendersScore;
        let newSystemHealth = gameState.systemHealth;
        let newActionLog = [...gameState.actionLog];
        let newServers = [...gameState.servers];

        gameState.attackerActions.forEach(action => {
            const server = newServers.find(s => s.id === action.serverId);
            const vuln = server.vulnerabilities.find(v => v.id === action.vulnId);
            const isBlocked = gameState.defenderActions.some(d =>
                d.serverId === action.serverId && d.vulnId === action.vulnId
            );
            if (!isBlocked) {
                newAttackersScore += vuln.points;
                newSystemHealth = Math.max(0, newSystemHealth - vuln.points / 10);
                newActionLog.push(`💥 ${vuln.name} on ${server.name} deals ${vuln.points} points, health -${(vuln.points / 10).toFixed(1)}%`);
                newServers = newServers.map(s =>
                    s.id === server.id && newSystemHealth <= 0 ? { ...s, status: "compromised" } : s
                );
            } else {
                newDefendersScore += vuln.points;
                newActionLog.push(`🛡️ ${vuln.name} on ${server.name} blocked: ${vuln.points} points`);
            }
        });

        const newPlayerAssignments = {
            attackers: gameState.playerAssignments.attackers.map(p => ({ ...p, action: null })),
            defenders: gameState.playerAssignments.defenders.map(p => ({ ...p, action: null }))
        };

        setGameState({
            ...gameState,
            turn: gameState.turn + 1,
            timeLeft: 120,
            systemHealth: newSystemHealth,
            attackersScore: newAttackersScore,
            defendersScore: newDefendersScore,
            attackerActions: [],
            defenderActions: [],
            actionLog: newActionLog,
            servers: newServers,
            playerAssignments: newPlayerAssignments,
            gameOver: gameState.turn + 1 > gameState.maxTurns || newSystemHealth <= 0,
            selectedServer: null,
            terminalOutput: { attackers: [], defenders: [] },
            attackerTerminalInput: "",
            defenderTerminalInput: ""
        });
    };

    // Winner determination
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return "Hackers Win! NeonCorp Network Compromised!";
        if (gameState.defendersScore > gameState.attackersScore) return "Defenders Win! NeonCorp Network Secured!";
        if (gameState.attackersScore > gameState.defendersScore) return "Hackers Win! Score Domination!";
        return "Stalemate! NeonCorp Network in Limbo!";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-mono p-8">
            {/* Header */}
            <h1 className="text-5xl text-center text-cyan-400 mb-8 font-bold tracking-wider animate-pulse">
                NeonCorp: CyberWar
            </h1>
            <p className="text-center text-lg text-gray-300 mb-6">
                5v5 Pentest: Hackers vs. Defenders. Breach or secure NeonCorp’s network! (10:13 AM CEST, June 10, 2025)
            </p>

            {/* Game Status */}
            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-cyan-500 mb-8">
                <div className="text-xl">Turn {gameState.turn}/{gameState.maxTurns}</div>
                <div className="text-xl text-yellow-400">
                    Time: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xl">
                    Network Health: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-500'}>
                        {gameState.systemHealth.toFixed(1)}%
                    </span>
                </div>
                <div className="text-xl">Hackers: {gameState.attackersScore}</div>
                <div className="text-xl">Defenders: {gameState.defendersScore}</div>
            </div>

            {/* Network Health Bar */}
            <div className="mb-8">
                <div className="relative w-full bg-gray-700 rounded-full h-8 border-2 border-cyan-500 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-full transition-all duration-500"
                        style={{ width: `${gameState.systemHealth}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                        NeonCorp Network
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
                    {/* Network Map */}
                    <div className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-cyan-500">
                        <h2 className="text-2xl text-cyan-400 mb-4 font-bold">Network Map</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {gameState.servers.map(server => (
                                <div
                                    key={server.id}
                                    className={`p-4 rounded-md text-center transition-transform hover:scale-105 ${server.status === 'online' ? 'bg-green-900 border-2 border-green-500' : 'bg-red-900 border-2 border-red-500'}`}
                                >
                                    <p className="text-lg font-bold">{server.name}</p>
                                    <p className="text-sm text-gray-300">IP: {server.ip}</p>
                                    <p className="text-sm text-gray-300">Services: {server.services.join(', ')}</p>
                                    <button
                                        onClick={() => selectServer('attackers', server.id)}
                                        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md mr-2"
                                        disabled={gameState.selectedServer?.team === 'defenders'}
                                    >
                                        Attack
                                    </button>
                                    <button
                                        onClick={() => selectServer('defenders', server.id)}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                                        disabled={gameState.selectedServer?.team === 'attackers'}
                                    >
                                        Defend
                                    </button>
                                </div>
                            ))}
                        </div>
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
                                            {player.action ? `Exploiting ${gameState.servers.find(s => s.id === player.action.serverId).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-4 text-gray-300">Hacker Terminal (type 'help' for commands):</div>
                            <div className="bg-black p-4 rounded-md h-48 overflow-y-auto mb-4">
                                {gameState.terminalOutput.attackers.map((line, index) => (
                                    <p key={index} className="text-sm text-green-400">{line}</p>
                                ))}
                            </div>
                            {gameState.selectedServer?.team === 'attackers' && (
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={gameState.attackerTerminalInput}
                                        onChange={(e) => setGameState({ ...gameState, attackerTerminalInput: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTerminalCommand('attackers')}
                                        className="flex-1 px-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder={`Command for ${gameState.servers.find(s => s.id === gameState.selectedServer.serverId).name}`}
                                    />
                                    <button
                                        onClick={() => handleTerminalCommand('attackers')}
                                        className="ml-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                                    >
                                        Run
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Defenders */}
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-500">
                            <h2 className="text-3xl text-blue-400 mb-6 font-bold">Defenders (5 Players)</h2>
                            <div className="mb-6">
                                {gameState.playerAssignments.defenders.map(player => (
                                    <div key={player.id} className="flex items-center justify-between mb-2 bg-gray-900 p-3 rounded-md">
                                        <span className="text-gray-300">{player.role} (#{player.id})</span>
                                        <span className="text-sm text-gray-400">
                                            {player.action ? `Patching ${gameState.servers.find(s => s.id === player.action.serverId).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-4 text-gray-300">Defender Terminal (type 'help' for commands):</div>
                            <div className="bg-black p-4 rounded-md h-48 overflow-y-auto mb-4">
                                {gameState.terminalOutput.defenders.map((line, index) => (
                                    <p key={index} className="text-sm text-green-400">{line}</p>
                                ))}
                            </div>
                            {gameState.selectedServer?.team === 'defenders' && (
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        value={gameState.defenderTerminalInput}
                                        onChange={(e) => setGameState({ ...gameState, defenderTerminalInput: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTerminalCommand('defenders')}
                                        className="flex-1 px-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Command for ${gameState.servers.find(s => s.id === gameState.selectedServer.serverId).name}`}
                                    />
                                    <button
                                        onClick={() => handleTerminalCommand('defenders')}
                                        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                                    >
                                        Run
                                    </button>
                                </div>
                            )}
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