import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './CyberWarGame.css';

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro'); // intro, game, results
    const [currentPhase, setCurrentPhase] = useState('website'); // website, server
    const [timeLeft, setTimeLeft] = useState(420); // 7 minutes
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attackers: 0, defenders: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);

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

    const roles = {
        attackers: [
            { id: 'web-hacker', name: 'Web Hacker', icon: '🕷️', speciality: 'XSS, SQL Injection', actions: ['Scan XSS', 'SQL Injection', 'CSRF Test'] },
            { id: 'social-engineer', name: 'Social Engineer', icon: '👤', speciality: 'Phishing, OSINT', actions: ['Phish User', 'Gather OSINT', 'Spoof Email'] },
            { id: 'network-scanner', name: 'Network Scanner', icon: '📡', speciality: 'Port Scan, Recon', actions: ['Port Scan', 'Network Recon', 'Ping Sweep'] },
            { id: 'exploit-dev', name: 'Exploit Developer', icon: '⚡', speciality: 'Buffer Overflow, RCE', actions: ['Exploit RCE', 'Buffer Overflow', 'Shellcode Inject'] },
            { id: 'crypto-breaker', name: 'Crypto Breaker', icon: '🔓', speciality: 'Hash Cracking', actions: ['Crack Hash', 'Decrypt File', 'Keylog'] }
        ],
        defenders: [
            { id: 'security-analyst', name: 'Security Analyst', icon: '🛡️', speciality: 'Monitoring, Detection', actions: ['Monitor Logs', 'Detect Intrusion', 'Analyze Traffic'] },
            { id: 'incident-responder', name: 'Incident Responder', icon: '🚨', speciality: 'Forensics, Mitigation', actions: ['Run Forensics', 'Mitigate Attack', 'Isolate Host'] },
            { id: 'network-admin', name: 'Network Admin', icon: '🌐', speciality: 'Firewall, IDS/IPS', actions: ['Configure Firewall', 'Enable IDS', 'Block IP'] },
            { id: 'sys-hardener', name: 'System Hardener', icon: '🔒', speciality: 'Patches, Config', actions: ['Apply Patch', 'Harden Config', 'Disable Service'] },
            { id: 'threat-hunter', name: 'Threat Hunter', icon: '🎯', speciality: 'IOC Detection', actions: ['Hunt IOCs', 'Analyze Malware', 'Trace Attacker'] }
        ]
    };

    // Random role assignment
    useEffect(() => {
        if (!roleAssigned) {
            const teams = ['attackers', 'defenders'];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const randomRole = roles[randomTeam][Math.floor(Math.random() * roles[randomTeam].length)];
            setSelectedTeam(randomTeam);
            setSelectedRole(randomRole.id);
            setGameLog([`[${new Date().toLocaleTimeString()}] Assigned: ${randomRole.name} (${randomTeam === 'attackers' ? '⚔️ Attackers' : '🛡️ Defenders'})`]);
            setRoleAssigned(true);
        }
    }, [roleAssigned]);

    // Timer management
    useEffect(() => {
        let timer;
        if (gameState === 'game' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (currentPhase === 'website') {
                setCurrentPhase('server');
                setTimeLeft(420);
                addLog('Phase ended. Switching to server attack.');
            } else {
                setGameState('results');
            }
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, currentPhase]);

    const addLog = (message) => {
        const newLog = `[${new Date().toLocaleTimeString()}] ${selectedTeam === 'attackers' ? '⚔️' : '🛡️'} ${message}`;
        setGameLog(prev => [...prev.slice(-9), newLog]);
    };

    const handleAction = (team, message, points) => {
        addLog(message);
        setScores(prev => ({
            ...prev,
            [team]: prev[team] + points
        }));
    };

    const handleRestartGame = () => {
        setGameState('intro');
        setCurrentPhase('website');
        setTimeLeft(420);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attackers: 0, defenders: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        setRoleAssigned(false);
    };

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
            const gameTimer = setTimeout(() => setGameState('game'), 6000);
            return () => {
                clearInterval(timer);
                clearTimeout(gameTimer);
            };
        }, []);

        return (
            <div className="game-container intro-container">
                <h1 className="intro-title">Cyber War 5v5</h1>
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
                        <div className="panel">
                            <h3 className="panel-title attackers">Attackers</h3>
                            {roles.attackers.map((role, i) => (
                                <div key={role.id} className="role-item attackers" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <span className="role-icon">{role.icon}</span> {role.name}
                                </div>
                            ))}
                        </div>
                        <div className="panel">
                            <h3 className="panel-title defenders">Defenders</h3>
                            {roles.defenders.map((role, i) => (
                                <div key={role.id} className="role-item defenders" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <span className="role-icon">{role.icon}</span> {role.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="intro-text">Initializing cyber battlefield...</div>
            </div>
        );
    };

    const GameInterface = () => {
        const [activeTab, setActiveTab] = useState(currentPhase);
        const role = roles[selectedTeam]?.find(r => r.id === selectedRole);

        const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

        return (
            <div className="game-container">
                <header className="header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="header-title">Cyber War</h1>
                            <div className="phase-info">
                                Phase: <span className="phase-name">{currentPhase.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="header-right">
                            <div className="timer">
                                <span className="timer-label">Time</span>
                                <span className="timer-value">{formatTime(timeLeft)}</span>
                            </div>
                            <div className="scores">
                                <span className="score-label">Score</span>
                                <span className="score-value">
                                    <span className="attackers">{scores.attackers}</span> - <span className="defenders">{scores.defenders}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="main-content">
                    <aside className="sidebar">
                        {role && (
                            <div className={`panel role-panel ${selectedTeam}`}>
                                <div className="role-icon">{role.icon}</div>
                                <div className="role-name">{role.name}</div>
                                <div className="role-speciality">{role.speciality}</div>
                            </div>
                        )}
                        <div className="panel objectives">
                            <h3 className="panel-title">Objectives</h3>
                            <div className="objective-list">
                                {selectedTeam === 'attackers' ? (
                                    <>
                                        <div><CheckCircle className="icon" size={16} /> Find vulnerabilities</div>
                                        <div><AlertTriangle className="icon" size={16} /> Exploit vulnerabilities</div>
                                        <div><Target className="icon" size={16} /> Gain admin access</div>
                                    </>
                                ) : (
                                    <>
                                        <div><Shield className="icon" size={16} /> Detect attacks</div>
                                        <div><Lock className="icon" size={16} /> Patch vulnerabilities</div>
                                        <div><Zap className="icon" size={16} /> Block attacker IPs</div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="panel activity">
                            <h3 className="panel-title">Activity</h3>
                            <div className="activity-log">
                                {gameLog.map((log, i) => (
                                    <div key={i} className="log-entry">{log}</div>
                                ))}
                            </div>
                        </div>
                    </aside>
                    <div className="content">
                        <div className="tabs">
                            <button
                                onClick={() => setActiveTab('website')}
                                className={`tab ${activeTab === 'website' ? 'active attackers' : ''}`}
                            >
                                🌐 Website
                            </button>
                            <button
                                onClick={() => setActiveTab('server')}
                                className={`tab ${activeTab === 'server' ? 'active defenders' : ''}`}
                            >
                                🖥️ Server
                            </button>
                        </div>
                        <div className="interface">
                            {activeTab === 'website' ? <WebsiteInterface role={role} /> : <ServerInterface role={role} />}
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    const WebsiteInterface = ({ role }) => {
        const [currentPage, setCurrentPage] = useState('home');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '' });

        return (
            <div className="panel">
                <h2 className="panel-title">TechCorp Website</h2>
                <div className="sub-tabs">
                    {['home', 'login', 'contact'].map(p => (
                        <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`sub-tab ${currentPage === p ? 'active' : ''}`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="interface-content">
                    {currentPage === 'home' && (
                        <div>
                            <h3 className="interface-title">Welcome to TechCorp</h3>
                            <p>Your trusted partner in technology solutions.</p>
                        </div>
                    )}
                    {currentPage === 'login' && (
                        <div>
                            <h3 className="interface-title">Login</h3>
                            <div className="form">
                                <input
                                    type="text"
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input"
                                    placeholder="Username"
                                />
                                <input
                                    type="password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    placeholder="Password"
                                />
                                <button
                                    onClick={() => handleAction(selectedTeam, `SQLi attempt with user: ${formData.username}`, 15)}
                                    className="button attackers"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    )}
                    {currentPage === 'contact' && (
                        <div>
                            <h3 className="interface-title">Contact</h3>
                            <div className="form">
                                <textarea
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    className="input textarea"
                                    placeholder="Your message..."
                                />
                                <button
                                    onClick={() => handleAction(selectedTeam, `XSS attempt: ${formData.comment.substring(0, 20)}...`, 10)}
                                    className="button defenders"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="actions">
                    <h3 className="panel-title">{selectedTeam === 'attackers' ? 'Attack Tools' : 'Defense Tools'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(selectedTeam, `${action} executed`, 10)}
                                className={`button ${selectedTeam}`}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ServerInterface = ({ role }) => {
        const [terminalInput, setTerminalInput] = useState('');
        const [terminalHistory, setTerminalHistory] = useState([
            'Welcome to TechCorp server (Linux v5.4)',
            'Type "help" for commands.'
        ]);
        const terminalEndRef = useRef(null);

        useEffect(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [terminalHistory]);

        const executeCommand = (command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Command executed: ${command}`);

            switch (cmdParts[0]) {
                case 'help':
                    output = 'Commands: ls, ps, netstat, cat, nmap, ssh, whoami';
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
                    output = cmdParts[1] === 'passwords.bak' ? 'root:a_sUp3r_S3cr3t_P4ssW0rd' : 'Error: File not found or unreadable.';
                    break;
                case 'nmap':
                    output = 'Nmap scan... Open ports: 22 (SSH), 80 (HTTP)';
                    break;
                case 'ssh':
                    output = 'Attempting SSH connection...';
                    break;
                case 'whoami':
                    output = 'root';
                    break;
                default:
                    output = `bash: ${command}: command not found`;
            }
            setTerminalHistory(prev => [...prev, `root@techcorp:~# ${command}`, output]);
            setTerminalInput('');
        };

        return (
            <div className="panel">
                <h2 className="panel-title">TechCorp Server</h2>
                <div className="status-grid">
                    <div className="status-card">
                        <h3 className="status-title">Active Services</h3>
                        <div className="status-content">SSH, HTTP, FTP, MySQL</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Vulnerabilities</h3>
                        <div className="status-content">SSH (Weak Auth), FTP (Anonymous)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Recent Alerts</h3>
                        <div className="status-content">0 new alerts</div>
                    </div>
                </div>
                <div
                    className="terminal"
                    onClick={() => terminalInputRef.current.focus()}
                >
                    <div className="terminal-output">
                        {terminalHistory.map((line, i) => (
                            <div key={i} className="terminal-line">{line}</div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                    <div className="terminal-prompt">
                        <span>root@techcorp:~# </span>
                        <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeCommand(terminalInput)}
                            className="terminal-input"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="actions">
                    <h3 className="panel-title">{selectedTeam === 'attackers' ? 'Server Actions' : 'Countermeasures'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleAction(selectedTeam, `${action} executed`, 15)}
                                className={`button ${selectedTeam}`}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const ResultsScreen = () => {
        const winner = scores.attackers > scores.defenders ? 'Attackers' : 'Defenders';
        const isTie = scores.attackers === scores.defenders;

        return (
            <div className="game-container">
                <div className="results-panel">
                    <h1 className="intro-title">Game Over</h1>
                    {isTie ? (
                        <h2 className="results-title">Tie!</h2>
                    ) : (
                        <h2 className={`results-title ${winner.toLowerCase()}`}>
                            {winner} Win!
                        </h2>
                    )}
                    <div className="score-grid">
                        <div className="score-card attackers">
                            <div className="score-label">Attackers</div>
                            <div className="score-value">{scores.attackers}</div>
                        </div>
                        <div className="score-card defenders">
                            <div className="score-label">Defenders</div>
                            <div className="score-value">{scores.defenders}</div>
                        </div>
                    </div>
                    <button onClick={handleRestartGame} className="button replay">
                        Replay
                    </button>
                </div>
            </div>
        );
    };

    if (gameState === 'intro') return <IntroAnimation />;
    if (gameState === 'game') return <GameInterface />;
    if (gameState === 'results') return <ResultsScreen />;
    return <div className="game-container">Loading...</div>;
};

export default CyberWarGame;