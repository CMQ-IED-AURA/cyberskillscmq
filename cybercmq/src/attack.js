import { useState, useEffect } from 'react';

// Expanded vulnerabilities and defenses with cyberpunk lore
const vulnerabilities = [
    { id: 1, name: "SQL Injection", points: 100, description: "Inject malicious SQL queries to breach the corporate database, exposing sensitive user data. Example: ' OR '1'='1' in login fields.", difficulty: 2, category: "Database" },
    { id: 2, name: "Cross-Site Scripting (XSS)", points: 80, description: "Embed rogue scripts in the NeonCorp website to hijack user sessions or deface the interface. Example: <script>stealCookies()</script>.", difficulty: 1, category: "Web" },
    { id: 3, name: "Brute Force Attack", points: 60, description: "Hammer the authentication servers with automated password guesses to crack admin access.", difficulty: 1, category: "Authentication" },
    { id: 4, name: "CSRF Exploit", points: 90, description: "Forge requests to trick authenticated users into executing unauthorized transactions on NeonCorp's platform.", difficulty: 2, category: "Web" },
    { id: 5, name: "File Inclusion", points: 120, description: "Exploit server misconfigurations to inject and execute malicious scripts from NeonCorp's file system.", difficulty: 3, category: "Server" },
    { id: 6, name: "Zero-Day Exploit", points: 150, description: "Leverage an undiscovered flaw in NeonCorp’s quantum firewall to gain root access.", difficulty: 4, category: "System" },
    { id: 7, name: "Phishing Payload", points: 70, description: "Deploy a social engineering attack to trick employees into revealing credentials.", difficulty: 1, category: "Human" }
];

const defenses = [
    { id: 1, name: "Web Application Firewall (WAF)", blocks: [1, 2, 4], description: "Deploys an AI-driven firewall to filter out malicious SQL and XSS payloads in real-time.", cost: 50 },
    { id: 2, name: "Input Sanitization", blocks: [1, 2, 4], description: "Cleanses all user inputs to prevent injection attacks across NeonCorp’s web interfaces.", cost: 40 },
    { id: 3, name: "Rate Limiting", blocks: [3], description: "Caps login attempts to thwart brute force attacks on authentication servers.", cost: 30 },
    { id: 4, name: "CSRF Token System", blocks: [4], description: "Implements unique tokens to validate all user requests, blocking forged actions.", cost: 45 },
    { id: 5, name: "File Access Lockdown", blocks: [5], description: "Restricts server file access to prevent unauthorized script execution.", cost: 60 },
    { id: 6, name: "Intrusion Detection System (IDS)", blocks: [6], description: "Monitors system logs for zero-day exploit patterns, alerting admins to anomalies.", cost: 80 },
    { id: 7, name: "Employee Training", blocks: [7], description: "Educates staff to recognize and resist phishing attempts, reducing human error.", cost: 35 }
];

const AttackSimulator = () => {
    const [gameState, setGameState] = useState({
        turn: 1,
        maxTurns: 7,
        timeLeft: 120, // 2 minutes per turn
        systemHealth: 100, // System health (0-100%)
        attackersScore: 0,
        defendersScore: 0,
        attackerActions: [],
        defenderActions: [],
        actionLog: ["NeonCorp's servers are online. Hackers prepare to strike!"],
        gameOver: false
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

    // Simple sound effect function
    const playSound = (type) => {
        const sounds = {
            'turn-end': new Audio('https://freesound.org/data/previews/171/171671_2437358-lq.mp3'), // Beep
            'warning': new Audio('https://freesound.org/data/previews/316/316847_4939433-lq.mp3'), // Alert
            'game-over': new Audio('https://freesound.org/data/previews/387/387739_1385886-lq.mp3') // Dramatic
        };
        sounds[type]?.play();
    };

    // End turn logic
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
                newActionLog.push(`💥 Attaquants exploitent ${vuln.name} : ${vuln.points} points, santé du système -${(vuln.points / 10).toFixed(1)}%`);
            } else {
                const defense = defenses.find(d => d.blocks.includes(action));
                newDefendersScore += vuln.points;
                newActionLog.push(`🛡️ Défenseurs bloquent ${vuln.name} avec ${defense.name} : ${vuln.points} points`);
            }
        });

        gameState.defenderActions.forEach(defAction => {
            const def = defenses.find(d => d.id === defAction);
            if (!gameState.attackerActions.some(a => def.blocks.includes(a))) {
                newActionLog.push(`🛡️ Défenseurs déploient ${def.name} (aucune attaque correspondante)`);
            }
        });

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
            gameOver: gameState.turn + 1 > gameState.maxTurns || newSystemHealth <= 0
        });
    };

    // Action selection (limit 5 actions per team per turn for 5 players)
    const selectAction = (team, actionId) => {
        if (gameState.timeLeft <= 0 || gameState.gameOver) return;
        if (team === 'attackers' && gameState.attackerActions.length < 5 && !gameState.attackerActions.includes(actionId)) {
            setGameState({
                ...gameState,
                attackerActions: [...gameState.attackerActions, actionId],
                actionLog: [...gameState.actionLog, `💥 Attaquants ciblent ${vulnerabilities.find(v => v.id === actionId).name}`]
            });
            playSound('warning');
        } else if (team === 'defenders' && gameState.defenderActions.length < 5 && !gameState.defenderActions.includes(actionId)) {
            setGameState({
                ...gameState,
                defenderActions: [...gameState.defenderActions, actionId],
                actionLog: [...gameState.actionLog, `🛡️ Défenseurs activent ${defenses.find(d => d.id === actionId).name}`]
            });
            playSound('warning');
        }
    };

    // Determine winner
    const getWinner = () => {
        if (gameState.systemHealth <= 0) return "Les attaquants gagnent ! NeonCorp est compromis !";
        if (gameState.defendersScore > gameState.attackersScore) return "Les défenseurs gagnent ! NeonCorp est sécurisé !";
        if (gameState.attackersScore > gameState.defendersScore) return "Les attaquants gagnent ! Domination des points !";
        return "Égalité ! NeonCorp résiste... pour l'instant.";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-mono p-6">
            {/* Header */}
            <h1 className="text-5xl text-center text-cyan-400 mb-8 animate-pulse font-bold tracking-wider">
                Cyber Escape: NeonCorp Breach
            </h1>
            <p className="text-center text-lg text-gray-300 mb-6">
                5v5 Cyberwar: Hackers vs. Defenders. Compromise or secure NeonCorp’s servers in 7 turns!
            </p>

            {/* Game Status */}
            <div className="flex justify-between mb-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-cyan-500">
                <div className="text-xl">Tour {gameState.turn}/{gameState.maxTurns}</div>
                <div className="text-xl">
                    Temps: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xl">
                    Santé du système: <span className={gameState.systemHealth < 30 ? 'text-red-500' : 'text-green-500'}>
                        {gameState.systemHealth}%
                    </span>
                </div>
                <div className="text-xl">Attaquants: {gameState.attackersScore} pts</div>
                <div className="text-xl">Défenseurs: {gameState.defendersScore} pts</div>
            </div>

            {/* System Health Bar */}
            <div className="mb-8">
                <div className="w-full bg-gray-700 rounded-full h-6 border border-cyan-500 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-full transition-all duration-500"
                        style={{ width: `${gameState.systemHealth}%` }}
                    ></div>
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">État du serveur NeonCorp</p>
            </div>

            {gameState.gameOver ? (
                <div className="text-center text-4xl text-yellow-400 mb-8 animate-bounce">
                    {getWinner()}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition"
                    >
                        Rejouer
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-8">
                    {/* Attackers Section */}
                    <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-red-500">
                        <h2 className="text-3xl text-red-400 mb-6 font-bold">Hackers (5 joueurs)</h2>
                        <p className="mb-4 text-gray-300">Exploitez jusqu'à 5 failles par tour :</p>
                        <div className="grid grid-cols-1 gap-4">
                            {vulnerabilities.map(vuln => (
                                <div key={vuln.id} className="flex items-start bg-gray-900 p-4 rounded-lg hover:bg-gray-700 transition">
                                    <button
                                        onClick={() => selectAction('attackers', vuln.id)}
                                        className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-4 transition transform hover:scale-105 ${gameState.attackerActions.includes(vuln.id) || gameState.attackerActions.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={gameState.attackerActions.includes(vuln.id) || gameState.attackerActions.length >= 5}
                                    >
                                        {vuln.name} ({vuln.points} pts, Diff. {vuln.difficulty})
                                    </button>
                                    <div>
                                        <p className="text-sm text-gray-300">{vuln.description}</p>
                                        <p className="text-xs text-gray-500">Catégorie: {vuln.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Defenders Section */}
                    <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-blue-500">
                        <h2 className="text-3xl text-blue-400 mb-6 font-bold">Défenseurs (5 joueurs)</h2>
                        <p className="mb-4 text-gray-300">Appliquez jusqu'à 5 défenses par tour :</p>
                        <div className="grid grid-cols-1 gap-4">
                            {defenses.map(def => (
                                <div key={def.id} className="flex items-start bg-gray-900 p-4 rounded-lg hover:bg-gray-700 transition">
                                    <button
                                        onClick={() => selectAction('defenders', def.id)}
                                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4 transition transform hover:scale-105 ${gameState.defenderActions.includes(def.id) || gameState.defenderActions.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={gameState.defenderActions.includes(def.id) || gameState.defenderActions.length >= 5}
                                    >
                                        {def.name} (Coût: {def.cost})
                                    </button>
                                    <div>
                                        <p className="text-sm text-gray-300">{def.description}</p>
                                        <p className="text-xs text-gray-500">Bloque: {def.blocks.map(id => vulnerabilities.find(v => v.id === id).name).join(', ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Log */}
            <div className="mt-8 bg-gray-800 p-8 rounded-lg shadow-lg border border-cyan-500">
                <h2 className="text-3xl text-cyan-400 mb-6 font-bold">Journal des actions</h2>
                <div className="max-h-64 overflow-y-auto">
                    {gameState.actionLog.map((log, index) => (
                        <p key={index} className="text-sm text-gray-300 mb-3 animate-fade-in">{log}</p>
                    ))}
                </div>
            </div>

            {/* Custom Styles for Animations */}
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
                .animate-pulse {
                    animation: pulse 2s infinite;
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-in;
                }
                .animate-bounce {
                    animation: bounce 1s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

export default AttackSimulator;