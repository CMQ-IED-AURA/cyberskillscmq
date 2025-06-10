import React, { useState, useEffect } from 'react';

// Vulnerabilities with pentesting challenges
const vulnerabilities = [
    {
        id: 1,
        name: "SQL Injection",
        points: 100,
        description: "Craft a malicious SQL query to bypass NeonCorp’s login system and extract user data.",
        category: "Database",
        difficulty: 2,
        challenge: {
            type: "input",
            prompt: "Enter a SQL query to bypass authentication (hint: use ' OR '1'='1'--):",
            correctAnswer: "' OR '1'='1'--"
        }
    },
    {
        id: 2,
        name: "XSS Attack",
        points: 80,
        description: "Inject a JavaScript payload to steal cookies from NeonCorp’s web portal.",
        category: "Web",
        difficulty: 1,
        challenge: {
            type: "input",
            prompt: "Enter an XSS payload to execute JavaScript (hint: use <script>):",
            correctAnswer: "<script>document.cookie</script>"
        }
    },
    {
        id: 3,
        name: "Brute Force",
        points: 60,
        description: "Crack an admin password by analyzing a weak hash.",
        category: "Authentication",
        difficulty: 1,
        challenge: {
            type: "input",
            prompt: "Crack the MD5 hash '5f4dcc3b5aa765d61d8327deb882cf99' (hint: common password):",
            correctAnswer: "password"
        }
    },
    {
        id: 4,
        name: "CSRF Exploit",
        points: 90,
        description: "Forge an HTML form to trigger unauthorized actions on NeonCorp’s platform.",
        category: "Web",
        difficulty: 2,
        challenge: {
            type: "code",
            prompt: "Craft an HTML form for a CSRF attack (hint: POST to /change-email):",
            correctAnswer: /<form.*method=["']POST["'].*action=["']\/change-email["'].*>.*<\/form>/i
        }
    },
    {
        id: 5,
        name: "File Inclusion",
        points: 120,
        description: "Exploit a server flaw to access restricted system files.",
        category: "Server",
        difficulty: 3,
        challenge: {
            type: "input",
            prompt: "Enter a path to access a sensitive file (hint: traverse to /etc/passwd):",
            correctAnswer: "../../etc/passwd"
        }
    }
];

// Defenses with realistic countermeasures
const defenses = [
    {
        id: 1,
        name: "Web Application Firewall",
        blocks: [1, 2, 4],
        description: "Configure WAF rules to block malicious SQL and XSS payloads.",
        cost: 50,
        challenge: {
            type: "code",
            prompt: "Write a regex to block <script> tags in a WAF rule:",
            correctAnswer: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i
        }
    },
    {
        id: 2,
        name: "Input Sanitization",
        blocks: [1, 2, 4],
        description: "Sanitize user inputs to prevent injection attacks.",
        cost: 40,
        challenge: {
            type: "input",
            prompt: "Enter a regex to strip HTML tags (hint: match <tag>):",
            correctAnswer: "<[^>]+>"
        }
    },
    {
        id: 3,
        name: "Rate Limiting",
        blocks: [3],
        description: "Limit login attempts to block brute force attacks.",
        cost: 30,
        challenge: {
            type: "input",
            prompt: "Set a rate limit for logins (e.g., attempts per minute):",
            correctAnswer: "5"
        }
    },
    {
        id: 4,
        name: "CSRF Tokens",
        blocks: [4],
        description: "Implement tokens to validate user requests.",
        cost: 45,
        challenge: {
            type: "code",
            prompt: "Enter a CSRF token format (hint: UUID):",
            correctAnswer: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        }
    },
    {
        id: 5,
        name: "File Access Lockdown",
        blocks: [5],
        description: "Secure file permissions to prevent unauthorized access.",
        cost: 60,
        challenge: {
            type: "input",
            prompt: "Set chmod permissions for owner-only read/write (hint: numeric):",
            correctAnswer: "600"
        }
    }
];

// Player roles
const attackerRoles = ["SQL Specialist", "Web Exploiter", "Password Cracker", "Social Engineer", "File Hacker"];
const defenderRoles = ["Firewall Engineer", "Code Sanitizer", "Security Monitor", "Token Master", "Sysadmin"];

const AttackSimulator = () => {
    const [gameState, setGameState] = useState({
        turn: 1,
        maxTurns: 7,
        timeLeft: 120, // 2 minutes per turn
        systemHealth: 100,
        attackersScore: 0,
        defendersScore: 0,
        attackerActions: [],
        defenderActions: [],
        actionLog: ["NeonCorp’s quantum servers online. Penetration test begins!"],
        gameOver: false,
        activeChallenge: null, // { team, actionId, playerId }
        challengeInput: "",
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
        sounds[type]?.play().catch(() => {}); // Handle potential audio errors
    };

    // Start a challenge
    const startChallenge = (team, actionId, playerId) => {
        if (gameState.timeLeft <= 0 || gameState.gameOver || gameState.activeChallenge) return;
        const teamActions = team === 'attackers' ? gameState.attackerActions : gameState.defenderActions;
        const players = team === 'attackers' ? gameState.playerAssignments.attackers : gameState.playerAssignments.defenders;
        if (teamActions.length >= 5 || players.find(p => p.id === playerId).action) return;

        setGameState({
            ...gameState,
            activeChallenge: { team, actionId, playerId },
            challengeInput: ""
        });
    };

    // Submit challenge answer
    const submitChallenge = () => {
        const { team, actionId, playerId } = gameState.activeChallenge;
        const data = team === 'attackers' ? vulnerabilities : defenses;
        const action = data.find(d => d.id === actionId);
        const player = gameState.playerAssignments[team].find(p => p.id === playerId);
        let isCorrect = false;

        if (action.challenge.type === "input" || action.challenge.type === "code") {
            if (action.challenge.correctAnswer instanceof RegExp) {
                isCorrect = action.challenge.correctAnswer.test(gameState.challengeInput);
            } else {
                isCorrect = gameState.challengeInput.toLowerCase() === action.challenge.correctAnswer.toLowerCase();
            }
        }

        const newPlayerAssignments = { ...gameState.playerAssignments };
        newPlayerAssignments[team] = newPlayerAssignments[team].map(p =>
            p.id === playerId ? { ...p, action: isCorrect ? actionId : null } : p
        );

        setGameState({
            ...gameState,
            [team === 'attackers' ? 'attackerActions' : 'defenderActions']: isCorrect
                ? [...gameState[team === 'attackers' ? 'attackerActions' : 'defenderActions'], actionId]
                : gameState[team === 'attackers' ? 'attackerActions' : 'defenderActions'],
            actionLog: [
                ...gameState.actionLog,
                `${team === 'attackers' ? '💥' : '🛡️'} ${player.role} ${isCorrect ? 'succeeds' : 'fails'} ${action.name}!`
            ],
            activeChallenge: null,
            challengeInput: "",
            playerAssignments: newPlayerAssignments
        });

        if (isCorrect) playSound('warning');
    };

    // End turn
    const endTurn = () => {
        let newAttackersScore = gameState.attackersScore;
        let newDefendersScore = gameState.defendersScore;
        let newSystemHealth = gameState.systemHealth;
        let newActionLog = [...gameState.actionLog];

        gameState.attackerActions.forEach(action => {
            const vuln = vulnerabilities.find(v => v.id === action);
            const isBlocked = gameState.defenderActions.some(d =>
                defenses.find(def => def.id === d).blocks.includes(action)
            );
            if (!isBlocked) {
                newAttackersScore += vuln.points;
                newSystemHealth = Math.max(0, newSystemHealth - vuln.points / 10);
                newActionLog.push(`💥 ${vuln.name} deals ${vuln.points} points, health -${(vuln.points / 10).toFixed(1)}%`);
            } else {
                const defense = defenses.find(d => d.blocks.includes(action));
                newDefendersScore += vuln.points;
                newActionLog.push(`🛡️ ${defense.name} blocks ${vuln.name}: ${vuln.points} points`);
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
            playerAssignments: newPlayerAssignments,
            gameOver: gameState.turn + 1 > gameState.maxTurns || newSystemHealth <= 0,
            activeChallenge: null
        });
    };

    // Winner determination
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return "Hackers Win! NeonCorp is Compromised!";
        if (gameState.defendersScore > gameState.attackersScore) return "Defenders Win! NeonCorp is Secure!";
        if (gameState.attackersScore > gameState.defendersScore) return "Hackers Win! Score Domination!";
        return "Stalemate! NeonCorp Hangs in the Balance!";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-mono p-8">
            {/* Header */}
            <h1 className="text-5xl text-center text-cyan-400 mb-8 font-bold tracking-wider animate-pulse">
                NeonCorp: CyberWar
            </h1>
            <p className="text-center text-lg text-gray-300 mb-6">
                5v5 Penetration Test: Hackers vs. Defenders. Breach or secure NeonCorp’s servers in 7 turns!
            </p>

            {/* Game Status */}
            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-cyan-500 mb-8">
                <div className="text-xl">Turn {gameState.turn}/{gameState.maxTurns}</div>
                <div className="text-xl text-yellow-400">
                    Time: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xl">
                    Server Health: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-500'}>
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
                        NeonCorp Server Network
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
                    {/* Challenge Modal */}
                    {gameState.activeChallenge && (
                        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                            <div className="bg-gray-900 p-8 rounded-lg shadow-2xl border-2 border-cyan-500 max-w-lg w-full">
                                <h3 className="text-2xl text-cyan-400 mb-4">
                                    {gameState.activeChallenge.team === 'attackers' ? 'Hacker Challenge' : 'Defense Challenge'}
                                </h3>
                                <p className="text-gray-300 mb-4">
                                    {(gameState.activeChallenge.team === 'attackers'
                                            ? vulnerabilities.find(v => v.id === gameState.activeChallenge.actionId)
                                            : defenses.find(d => d.id === gameState.activeChallenge.actionId)
                                    ).challenge.prompt}
                                </p>
                                <textarea
                                    value={gameState.challengeInput}
                                    onChange={(e) => setGameState({ ...gameState, challengeInput: e.target.value })}
                                    className="w-full h-24 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
                                    placeholder="Enter your answer"
                                />
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setGameState({ ...gameState, activeChallenge: null, challengeInput: "" })}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitChallenge}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md transition"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            {player.action ? `Locked: ${vulnerabilities.find(v => v.id === player.action).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-4 text-gray-300">Execute up to 5 attacks:</div>
                            <div className="grid grid-cols-1 gap-4">
                                {vulnerabilities.map(vuln => {
                                    const playerWithAction = gameState.playerAssignments.attackers.find(p => p.action === vuln.id);
                                    const availablePlayer = gameState.playerAssignments.attackers.find(p => !p.action);
                                    return (
                                        <div key={vuln.id} className="flex items-start bg-gray-900 p-4 rounded-md hover:bg-gray-700 transition">
                                            <button
                                                onClick={() => startChallenge('attackers', vuln.id, availablePlayer?.id)}
                                                className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mr-4 transition-transform hover:scale-105 ${!availablePlayer || gameState.activeChallenge ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={!availablePlayer || gameState.activeChallenge}
                                            >
                                                {vuln.name} ({vuln.points} pts)
                                            </button>
                                            <div>
                                                <p className="text-sm text-gray-300">{vuln.description}</p>
                                                <p className="text-xs text-gray-500">Difficulty: {vuln.difficulty} | {vuln.category}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Defenders */}
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-blue-500">
                            <h2 className="text-3xl text-blue-400 mb-6 font-bold">Defenders (5 Players)</h2>
                            <div className="mb-6">
                                {gameState.playerAssignments.defenders.map(player => (
                                    <div key={player.id} className="flex items-center justify-between mb-2 bg-gray-900 p-3 rounded-md">
                                        <span className="text-gray-300">{player.role} (#{player.id})</span>
                                        <span className="text-sm text-gray-400">
                                            {player.action ? `Locked: ${defenses.find(d => d.id === player.action).name}` : 'Awaiting Action'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-4 text-gray-300">Deploy up to 5 defenses:</div>
                            <div className="grid grid-cols-1 gap-4">
                                {defenses.map(def => {
                                    const playerWithAction = gameState.playerAssignments.defenders.find(p => p.action === def.id);
                                    const availablePlayer = gameState.playerAssignments.defenders.find(p => !p.action);
                                    return (
                                        <div key={def.id} className="flex items-start bg-gray-900 p-4 rounded-md hover:bg-gray-700 transition">
                                            <button
                                                onClick={() => startChallenge('defenders', def.id, availablePlayer?.id)}
                                                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mr-4 transition-transform hover:scale-105 ${!availablePlayer || gameState.activeChallenge ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={!availablePlayer || gameState.activeChallenge}
                                            >
                                                {def.name} (Cost: {def.cost})
                                            </button>
                                            <div>
                                                <p className="text-sm text-gray-300">{def.description}</p>
                                                <p className="text-xs text-gray-500">Blocks: {def.blocks.map(id => vulnerabilities.find(v => v.id === id).name).join(', ')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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