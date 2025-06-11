import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import './CyberWarGame.css';

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro'); // intro, jeu, résultats
    const [currentPhase, setCurrentPhase] = useState('site'); // site, serveur
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes par phase
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attaquants: 0, défenseurs: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);

    const initialWebsiteState = {
        currentPage: 'accueil',
        vulnerabilities: {
            xss: { discovered: false, exploited: false, patched: false },
            sqli: { discovered: false, exploited: false, patched: false },
            csrf: { discovered: false, exploited: false, patched: false },
            fake_form: { discovered: false, exploited: false, patched: false } // Fausse piste
        },
        userAccounts: ['admin', 'utilisateur1', 'invité'],
        database: ['utilisateurs', 'commandes', 'produits']
    };

    const initialServerState = {
        services: {
            ssh: { running: true, vulnerable: true, patched: false },
            ftp: { running: true, vulnerable: true, patched: false },
            web: { running: true, vulnerable: false, patched: false },
            fake_db: { running: true, vulnerable: false, patched: true } // Fausse piste
        },
        files: ['/etc/passwd', '/var/log/auth.log', '/home/user/.ssh/id_rsa', '/var/www/decoy.txt'], // Fausse piste
        processes: ['apache2', 'sshd', 'mysql', 'fake_service'], // Fausse piste
        ports: [22, 80, 443, 21, 3306, 8080] // Port 8080 non utilisé
    };

    const [websiteState, setWebsiteState] = useState(initialWebsiteState);
    const [serverState, setServerState] = useState(initialServerState);

    const terminalInputRef = useRef(null);

    const roles = {
        attaquants: [
            { id: 'pirate-web', name: 'Pirate Web', icon: '🕷️', spécialité: 'XSS, Injection SQL', actions: ['Scanner XSS', 'Injection SQL', 'Tester CSRF', 'Analyser Faux Formulaire'] },
            { id: 'ingénieur-social', name: 'Ingénieur Social', icon: '👤', spécialité: 'Hameçonnage, OSINT', actions: ['Hameçonner', 'Collecter OSINT', 'Usurper Email', 'Simuler Appel'] },
            { id: 'scanner-réseau', name: 'Scanner Réseau', icon: '📡', spécialité: 'Scan de Ports, Reconnaissance', actions: ['Scanner Ports', 'Reconnaissance Réseau', 'Ping Sweep', 'Tester Port Inutilisé'] },
            { id: 'développeur-exploits', name: 'Développeur d’Exploits', icon: '⚡', spécialité: 'Débordement de Tampon, RCE', actions: ['Exploiter RCE', 'Débordement Tampon', 'Injecter Shellcode', 'Analyser Faux Service'] },
            { id: 'casseur-crypto', name: 'Casseur Crypto', icon: '🔓', spécialité: 'Craquage de Hash, Chiffrement', actions: ['Craquer Hash', 'Déchiffrer Fichier', 'Keylogger', 'Tester Faux Hash'] }
        ],
        défenseurs: [
            { id: 'analyste-sécurité', name: 'Analyste Sécurité', icon: '🛡️', spécialité: 'Surveillance, Détection', actions: ['Surveiller Logs', 'Détecter Intrusion', 'Analyser Trafic', 'Vérifier Faux Log'] },
            { id: 'répondeur-incidents', name: 'Répondeur Incidents', icon: '🚨', spécialité: 'Forensique, Mitigation', actions: ['Analyser Forensique', 'Mitiger Attaque', 'Isoler Hôte', 'Examiner Faux Fichier'] },
            { id: 'admin-réseau', name: 'Admin Réseau', icon: '🌐', spécialité: 'Pare-feu, IDS/IPS', actions: ['Configurer Pare-feu', 'Activer IDS', 'Bloquer IP', 'Bloquer Faux Port'] },
            { id: 'durcisseur-système', name: 'Durcisseur Système', icon: '🔒', spécialité: 'Correctifs, Configuration', actions: ['Appliquer Correctif', 'Durcir Config', 'Désactiver Service', 'Désactiver Faux Service'] },
            { id: 'chasseur-menaces', name: 'Chasseur de Menaces', icon: '🎯', spécialité: 'Détection IOC, Analyse', actions: ['Chasser IOCs', 'Analyser Malware', 'Tracer Attaquant', 'Analyser Fausse Alerte'] }
        ]
    };

    // Attribution aléatoire du rôle
    useEffect(() => {
        if (!roleAssigned) {
            const teams = ['attaquants', 'défenseurs'];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const randomRole = roles[randomTeam][Math.floor(Math.random() * roles[randomTeam].length)];
            setSelectedTeam(randomTeam);
            setSelectedRole(randomRole.id);
            setGameLog([`[${new Date().toLocaleTimeString('fr-FR')}] Rôle assigné : ${randomRole.name} (${randomTeam === 'attaquants' ? '⚔️ Attaquants' : '🛡️ Défenseurs'})`]);
            setRoleAssigned(true);
        }
    }, [roleAssigned]);

    // Gestion du timer
    useEffect(() => {
        let timer;
        if (gameState === 'jeu' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (currentPhase === 'site') {
                setCurrentPhase('serveur');
                setTimeLeft(600);
                addLog('Phase site terminée. Passage à l’attaque du serveur.');
            } else {
                setGameState('résultats');
            }
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, currentPhase]);

    const addLog = (message) => {
        const newLog = `[${new Date().toLocaleTimeString('fr-FR')}] ${selectedTeam === 'attaquants' ? '⚔️' : '🛡️'} ${message}`;
        setGameLog(prev => [...prev.slice(-15), newLog]); // Plus de logs visibles
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
        setCurrentPhase('site');
        setTimeLeft(600);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attaquants: 0, défenseurs: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        setRoleAssigned(false);
    };

    const IntroAnimation = () => {
        const [progress, setProgress] = useState(0);

        useEffect(() => {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev < 100) return prev + 10;
                    return prev;
                });
            }, 500);
            const gameTimer = setTimeout(() => setGameState('jeu'), 6000);
            return () => {
                clearInterval(timer);
                clearTimeout(gameTimer);
            };
        }, []);

        return (
            <div className="game-container intro-container">
                <h1 className="intro-title">Guerre Cybernétique</h1>
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="intro-text">Initialisation du champ de bataille cybernétique...</div>
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
                            <h1 className="header-title">Guerre Cybernétique</h1>
                            <div className="phase-info">
                                Phase : <span className="phase-name">{currentPhase === 'site' ? 'Site Web' : 'Serveur'}</span>
                            </div>
                        </div>
                        <div className="header-right">
                            <div className="timer">
                                <span className="timer-label">Temps</span>
                                <span className="timer-value">{formatTime(timeLeft)}</span>
                            </div>
                            <div className="scores">
                                <span className="score-label">Score</span>
                                <span className="score-value">
                                    <span className="attaquants">{scores.attaquants}</span> - <span className="défenseurs">{scores.défenseurs}</span>
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
                                <div className="speciality">{role.spécialité}</div>
                            </div>
                        )}
                        <div className="panel">
                            <h3 className="team-title">Objectifs</h3>
                            <div class="objective-list">
                                {selectedTeam === 'attaquants' ? (
                                    <>
                                        <div><CheckCircle className="item" size={16} /> Trouver des vulnérabilités</div>
                                        <div><AlertTriangle className="item" size={16} /> Exploiter les vulnérabilités</div>
                                        <div><Target className="item" size={16} /> Obtenir l’accès admin</div>
                                    </>
                                ) : (
                                    <>
                                        <div><Shield className="item" size={16} /> Détecter les attaques</div>
                                        <div><Lock className="item" size={16} /> Corriger les failles</div>
                                        <div><Zap className="item" size={16} /> Bloquer les attaquants</div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="panel activity">
                            <h3 className="team-title">Activité</h3>
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
                                onClick={() => setActiveTab('site')}
                                className={`tab ${activeTab === 'site' ? 'active attaquants' : ''}`}
                            >
                                🌐 Site Web
                            </button>
                            <button
                                onClick={() => setActiveTab('serveur')}
                                className={`tab ${activeTab === 'serveur' ? 'active défenseurs' : ''}`}
                            >
                                🛠️ Serveur
                            </button>
                        </div>
                        <div className="section">
                            {activeTab === 'site' ? <WebsiteSection role={role} /> : <ServerSection role={role} />}
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    const WebsiteSection = ({ role }) => {
        const [currentPage, setCurrentPage] = useState('accueil');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '', newsletter: '' });

        const pages = [
            { id: 'accueil', name: 'Accueil' },
            { id: 'produits', name: 'Produits' },
            { id: 'à-propos', name: 'À propos' },
            { id: 'connexion', name: 'Connexion' },
            { id: 'contact', name: 'Contact' }
        ];

        return (
            <div className="section">
                <h2 className="team-title">Site Web TechCorp</h2>
                <div className="sub-nav">
                    {pages.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setCurrentPage(p.id)}
                            className={`sub-nav-btn ${currentPage === p.id ? 'active' : ''}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <div className="section-content">
                    {currentPage === 'accueil' && (
                        <div>
                            <h3 className="section-title">Bienvenue chez TechCorp</h3>
                            <p className="lead">Leader mondial des solutions technologiques innovantes.</p>
                            <div className="hero">
                                <img src="https://via.placeholder.com/800x300.png?text=TechCorp+Innovation" alt="Innovation TechCorp" className="hero-img" />
                                <p>Découvrez nos produits révolutionnaires et rejoignez l’avenir.</p>
                            </div>
                        </div>
                    )}
                    {currentPage === 'produits' && (
                        <div>
                            <h3 className="section-title">Nos Produits</h3>
                            <div className="product-grid">
                                <div className="product-card">
                                    <img src="https://via.placeholder.com/200.png?text=Produit+1" alt="Produit 1" />
                                    <h4>CloudSync</h4>
                                    <p>Synchronisation sécurisée dans le cloud.</p>
                                </div>
                                <div className="product-card">
                                    <img src="https://via.placeholder.com/200.png?text=Produit+2" alt="Produit 2" />
                                    <h4>AIShield</h4>
                                    <p>Protection IA contre les cyberattaques.</p>
                                </div>
                                <div className="product-card">
                                    <img src="https://via.placeholder.com/200.png?text=Produit+3" alt="Produit 3" />
                                    <h4>DataVault</h4>
                                    <p>Stockage de données ultra-sécurisé.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentPage === 'à-propos' && (
                        <div>
                            <h3 className="section-title">À Propos de TechCorp</h3>
                            <p>Fondée en 2010, TechCorp est pionnière dans la cybersécurité et l’innovation.</p>
                            <p>Notre mission : protéger le monde numérique.</p>
                        </div>
                    )}
                    {currentPage === 'connexion' && (
                        <div>
                            <h3 className="section-title">Connexion</h3>
                            <div className="form">
                                <input
                                    type="text"
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input"
                                    placeholder="Nom d’utilisateur"
                                />
                                <input
                                    type="password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    placeholder="Mot de passe"
                                />
                                <button
                                    onClick={() => handleAction(selectedTeam, `Tentative d’injection SQL avec utilisateur : ${formData.username}`, 15)}
                                    className="button attaquants"
                                >
                                    Se connecter
                                </button>
                            </div>
                        </div>
                    )}
                    {currentPage === 'contact' && (
                        <div>
                            <h3 className="section-title">Contactez-nous</h3>
                            <div className="form">
                                <textarea
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    className="input textarea"
                                    placeholder="Votre message..."
                                />
                                <input
                                    type="email"
                                    onChange={(e) => setFormData({ ...formData, newsletter: e.target.value })}
                                    className="input"
                                    placeholder="Email (Newsletter)"
                                />
                                <button
                                    onClick={() => handleAction(selectedTeam, `Tentative XSS : ${formData.comment.substring(0, 20)}...`, formData.comment.includes('<script>') ? 10 : 0)}
                                    className="button défenseurs"
                                >
                                    Envoyer
                                </button>
                                <button
                                    onClick={() => handleAction(selectedTeam, `Tentative sur newsletter : ${formData.newsletter}`, 0)}
                                    className="button défenseurs"
                                >
                                    S’inscrire à la Newsletter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="actions">
                    <h3 className="team-title">{selectedTeam === 'attaquants' ? 'Outils d’Attaque' : 'Outils de Défense'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    const isFake = action.includes('Faux') || action.includes('Inutilisé');
                                    handleAction(selectedTeam, `${action} exécuté${isFake ? ' (aucun résultat)' : ''}`, isFake ? 0 : 10);
                                }}
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

    const ServerSection = ({ role }) => {
        const [terminalInput, setTerminalInput] = useState('');
        const [terminalHistory, setTerminalHistory] = useState([
            'Bienvenue sur le serveur TechCorp (Linux v5.4)',
            'Tapez "help" pour les commandes.'
        ]);
        const terminalEndRef = useRef(null);

        useEffect(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [terminalHistory]);

        const executeCommand = (command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Commande exécutée : ${command}`);

            switch (cmdParts[0]) {
                case 'help':
                    output = 'Commandes : ls, ps, netstat, cat, nmap, ssh, whoami';
                    break;
                case 'ls':
                    output = 'config.txt  logs/  passwords.bak  run.sh  decoy.txt';
                    break;
                case 'ps':
                    output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n9012\tmysql\n9999\tfake_service';
                    break;
                case 'netstat':
                    output = 'TCP\t0.0.0.0:22\tLISTEN\nTCP\t0.0.0.0:80\tLISTEN\nTCP\t0.0.0.0:8080\tCLOSED';
                    break;
                case 'cat':
                    if (cmdParts[1] === 'passwords.bak') {
                        output = 'root:Sup3rS3cr3tP4ss';
                    } else if (cmdParts[1] === 'decoy.txt') {
                        output = 'Rien d’utile ici, juste un leurre.';
                    } else {
                        output = 'Erreur : Fichier non trouvé ou non lisible.';
                    }
                    break;
                case 'nmap':
                    output = 'Scan Nmap... Ports ouverts : 22 (SSH), 80 (HTTP), 8080 (Inactif)';
                    break;
                case 'ssh':
                    output = 'Tentative de connexion SSH...';
                    break;
                case 'whoami':
                    output = 'root';
                    break;
                default:
                    output = `bash: ${command}: commande introuvable`;
            }
            setTerminalHistory(prev => [...prev, `root@techcorp:~# ${command}`, output]);
            setTerminalInput('');
        };

        return (
            <div className="section">
                <h2 className="team-title">Serveur TechCorp</h2>
                <div className="status-grid">
                    <div className="status-card">
                        <h3 className="status-title">Services Actifs</h3>
                        <div className="status-content">SSH, HTTP, FTP, MySQL, FakeDB (Inactif)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Vulnérabilités</h3>
                        <div className="status-content">SSH (Auth Faible), FTP (Anonyme)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Alertes Récentes</h3>
                        <div className="status-content">0 nouvelles alertes</div>
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
                    <h3 className="team-title">{selectedTeam === 'attaquants' ? 'Actions Serveur' : 'Contre-mesures'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    const isFake = action.includes('Faux') || action.includes('Inutilisé');
                                    handleAction(selectedTeam, `${action} exécuté${isFake ? ' (aucun résultat)' : ''}`, isFake ? 0 : 15);
                                }}
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
        const winner = scores.attaquants > scores.défenseurs ? 'Attaquants' : 'Défenseurs';
        const isTie = scores.attaquants === scores.défenseurs;

        return (
            <div className="game-container">
                <div className="results-panel">
                    <h1 className="intro-title">Fin de la Partie</h1>
                    {isTie ? (
                        <h2 className="results-title">Égalité !</h2>
                    ) : (
                        <h2 className={`results-title ${winner.toLowerCase()}`}>
                            Les {winner} gagnent !
                        </h2>
                    )}
                    <div className="score-grid">
                        <div className="score-card attaquants">
                            <div className="score-label">Attaquants</div>
                            <div className="score-value">{scores.attaquants}</div>
                        </div>
                        <div className="score-card défenseurs">
                            <div className="score-label">Défenseurs</div>
                            <div className="score-value">{scores.défenseurs}</div>
                        </div>
                    </div>
                    <button onClick={handleRestartGame} className="button replay">
                        Rejouer
                    </button>
                </div>
            </div>
        );
    };

    if (gameState === 'intro') return <IntroAnimation />;
    if (gameState === 'jeu') return <GameInterface />;
    if (gameState === 'résultats') return <ResultsScreen />;
    return <div className="game-container">Chargement...</div>;
};

export default CyberWarGame;