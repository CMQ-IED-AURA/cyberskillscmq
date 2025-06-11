import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './CyberWarGame.css';

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro'); // intro, jeu, résultats
    const [currentPhase, setCurrentPhase] = useState('site'); // site, serveur
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attaquants: 0, défenseurs: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);
    const [showRoleDetails, setShowRoleDetails] = useState(false); // Pour la fiche descriptive
    const [activeTab, setActiveTab] = useState('site'); // Onglet actif, indépendant de currentPhase

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
        files: ['/etc/passwd', '/var/log/auth.log', '/home/user/.ssh/id_rsa', '/var/www/decoy.txt'],
        processes: ['apache2', 'sshd', 'mysql', 'fake_service'],
        ports: [22, 80, 443, 21, 3306, 8080]
    };

    const [websiteState, setWebsiteState] = useState(initialWebsiteState);
    const [serverState, setServerState] = useState(initialServerState);

    const terminalInputRef = useRef(null);

    const roles = {
        attaquants: [
            { id: 'pirate-web', name: 'Pirate Web', icon: '🕷️', spécialité: 'XSS, Injection SQL', actions: ['Scanner XSS', 'Injection SQL', 'Tester CSRF', 'Analyser Faux Formulaire'], description: 'Spécialiste des attaques web, capable d’exploiter des failles XSS et SQLi pour compromettre des sites.' },
            { id: 'ingénieur-social', name: 'Ingénieur Social', icon: '👤', spécialité: 'Hameçonnage, OSINT', actions: ['Hameçonner', 'Collecter OSINT', 'Usurper Email', 'Simuler Appel'], description: 'Manipule les utilisateurs via des techniques d’ingénierie sociale pour obtenir des accès.' },
            { id: 'scanner-réseau', name: 'Scanner Réseau', icon: '📡', spécialité: 'Scan de Ports, Reconnaissance', actions: ['Scanner Ports', 'Reconnaissance Réseau', 'Ping Sweep', 'Tester Port Inutilisé'], description: 'Explore les réseaux pour identifier les services vulnérables et les points d’entrée.' },
            { id: 'développeur-exploits', name: 'Développeur d’Exploits', icon: '⚡', spécialité: 'Débordement de Tampon, RCE', actions: ['Exploiter RCE', 'Débordement Tampon', 'Injecter Shellcode', 'Analyser Faux Service'], description: 'Crée des exploits pour prendre le contrôle des systèmes via des failles critiques.' },
            { id: 'casseur-crypto', name: 'Casseur Crypto', icon: '🔓', spécialité: 'Craquage de Hash, Chiffrement', actions: ['Craquer Hash', 'Déchiffrer Fichier', 'Keylogger', 'Tester Faux Hash'], description: 'Brise les protections cryptographiques pour accéder aux données sensibles.' }
        ],
        défenseurs: [
            { id: 'analyste-sécurité', name: 'Analyste Sécurité', icon: '🛡️', spécialité: 'Surveillance, Détection', actions: ['Surveiller Logs', 'Détecter Intrusion', 'Analyser Trafic', 'Vérifier Faux Log'], description: 'Surveille les systèmes pour détecter et signaler les activités malveillantes.' },
            { id: 'répondeur-incidents', name: 'Répondeur Incidents', icon: '🚨', spécialité: 'Forensique, Mitigation', actions: ['Analyser Forensique', 'Mitiger Attaque', 'Isoler Hôte', 'Examiner Faux Fichier'], description: 'Réagit rapidement pour limiter l’impact des attaques et enquêter.' },
            { id: 'admin-réseau', name: 'Admin Réseau', icon: '🌐', spécialité: 'Pare-feu, IDS/IPS', actions: ['Configurer Pare-feu', 'Activer IDS', 'Bloquer IP', 'Bloquer Faux Port'], description: 'Sécurise les réseaux en bloquant les accès non autorisés.' },
            { id: 'durcisseur-système', name: 'Durcisseur Système', icon: '🔒', spécialité: 'Correctifs, Configuration', actions: ['Appliquer Correctif', 'Durcir Config', 'Désactiver Service', 'Désactiver Faux Service'], description: 'Renforce les systèmes en appliquant des correctifs et configurations sécurisées.' },
            { id: 'chasseur-menaces', name: 'Chasseur de Menaces', icon: '🎯', spécialité: 'Détection IOC, Analyse', actions: ['Chasser IOCs', 'Analyser Malware', 'Tracer Attaquant', 'Analyser Fausse Alerte'], description: 'Traque les menaces avancées en analysant les indicateurs de compromission.' }
        ]
    };

    // Attribution aléatoire du rôle
    useEffect(() => {
        if (!roleAssigned && gameState === 'intro') {
            const teams = ['attaquants', 'défenseurs'];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const randomRole = roles[randomTeam][Math.floor(Math.random() * roles[randomTeam].length)];
            setSelectedTeam(randomTeam);
            setSelectedRole(randomRole.id);
            setGameLog([`[${new Date().toLocaleTimeString('fr-FR')}] Rôle assigné : ${randomRole.name} (${randomTeam === 'attaquants' ? '⚔️ Attaquants' : '🛡️ Défenseurs'})`]);
            setRoleAssigned(true);
        }
    }, [roleAssigned, gameState]);

    // Timer
    useEffect(() => {
        let timer;
        if (gameState === 'jeu' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (currentPhase === 'site') {
                setCurrentPhase('serveur');
                setActiveTab('serveur'); // Synchroniser onglet
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
        setGameLog(prev => [...prev.slice(-15), newLog]);
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
        setActiveTab('site');
        setTimeLeft(600);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attaquants: 0, défenseurs: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        setRoleAssigned(false);
        setShowRoleDetails(false);
    };

    const IntroAnimation = () => {
        const [animationStep, setAnimationStep] = useState(0); // 0: chargement, 1: rôle assigné, 2: transition jeu
        const [displayText, setDisplayText] = useState('');

        useEffect(() => {
            if (animationStep === 0) {
                let text = 'INITIALISATION...';
                let i = 0;
                const typeText = () => {
                    if (i <= text.length) {
                        setDisplayText(text.slice(0, i));
                        i++;
                        setTimeout(typeText, 100);
                    } else {
                        setTimeout(() => setAnimationStep(1), 1000);
                    }
                };
                typeText();
            } else if (animationStep === 1 && selectedRole) {
                const role = roles[selectedTeam].find(r => r.id === selectedRole);
                let text = `RÔLE ASSIGNÉ : ${role.name.toUpperCase()} [${selectedTeam === 'attaquants' ? 'ATTAQUANTS' : 'DÉFENSEURS'}]`;
                let i = 0;
                const typeText = () => {
                    if (i <= text.length) {
                        setDisplayText(text.slice(0, i));
                        i++;
                        setTimeout(typeText, 50);
                    } else {
                        setShowRoleDetails(true);
                        setTimeout(() => setAnimationStep(2), 3000);
                    }
                };
                typeText();
            } else if (animationStep === 2) {
                setTimeout(() => setGameState('jeu'), 1000);
            }
        }, [animationStep, selectedRole, selectedTeam]);

        return (
            <div className="game-container intro-container">
                <h1 className="intro-title">CyberWar</h1>
                <div className="hacker-text">{displayText}</div>
                {showRoleDetails && selectedRole && (
                    <RoleDetails role={roles[selectedTeam].find(r => r.id === selectedRole)} team={selectedTeam} />
                )}
            </div>
        );
    };

    const RoleDetails = ({ role, team }) => {
        return (
            <div className={`role-details ${team}`}>
                <h2 className="role-details-title">{role.name}</h2>
                <p><strong>Spécialité :</strong> {role.spécialité}</p>
                <p><strong>Description :</strong> {role.description}</p>
                <p><strong>Actions :</strong></p>
                <ul>
                    {role.actions.map((action, i) => (
                        <li key={i}>{action}</li>
                    ))}
                </ul>
                <p><strong>Objectifs :</strong></p>
                <ul>
                    {team === 'attaquants' ? (
                        <>
                            <li>Trouver des vulnérabilités</li>
                            <li>Exploiter les failles</li>
                            <li>Obtenir l’accès admin</li>
                        </>
                    ) : (
                        <>
                            <li>Détecter les attaques</li>
                            <li>Corriger les failles</li>
                            <li>Bloquer les attaquants</li>
                        </>
                    )}
                </ul>
            </div>
        );
    };

    const GameInterface = () => {
        const role = roles[selectedTeam]?.find(r => r.id === selectedRole);

        const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

        return (
            <div className="game-container">
                <header className="header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="header-title">CyberWar</h1>
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
                            <button
                                onClick={() => setShowRoleDetails(true)}
                                className="button role-details-btn"
                            >
                                <Info size={16} /> Fiche Rôle
                            </button>
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
                        <div className="panel objectives">
                            <h3 className="panel-title">Objectifs</h3>
                            <div className="objective-list">
                                {selectedTeam === 'attaquants' ? (
                                    <>
                                        <div><CheckCircle className="icon" size={16} /> Trouver des vulnérabilités</div>
                                        <div><AlertTriangle className="icon" size={16} /> Exploiter les vulnérabilités</div>
                                        <div><Target className="icon" size={16} /> Obtenir l’accès admin</div>
                                    </>
                                ) : (
                                    <>
                                        <div><Shield className="icon" size={16} /> Détecter les attaques</div>
                                        <div><Lock className="icon" size={16} /> Corriger les failles</div>
                                        <div><Zap className="icon" size={16} /> Bloquer les attaquants</div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="panel activity">
                            <h3 className="panel-title">Activité</h3>
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
                                🖥️ Serveur
                            </button>
                        </div>
                        <div className="interface">
                            {activeTab === 'site' ? <WebsiteInterface role={role} /> : <ServerInterface role={role} />}
                        </div>
                    </div>
                    {showRoleDetails && role && (
                        <div className="role-details-overlay">
                            <div className="role-details-container">
                                <button
                                    onClick={() => setShowRoleDetails(false)}
                                    className="button close-btn"
                                >
                                    Fermer
                                </button>
                                <RoleDetails role={role} team={selectedTeam} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    };

    const WebsiteInterface = ({ role }) => {
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
            <div className="panel">
                <h2 className="panel-title">Site Web TechCorp</h2>
                <div className="sub-tabs">
                    {pages.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setCurrentPage(p.id)}
                            className={`sub-tab ${currentPage === p.id ? 'active' : ''}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <div className="interface-content">
                    {currentPage === 'accueil' && (
                        <div>
                            <h3 className="interface-title">Bienvenue chez TechCorp</h3>
                            <p className="lead">Leader mondial des solutions technologiques.</p>
                            <div className="hero">
                                <div className="hero-placeholder">
                                    <Globe size={48} />
                                    <span>Technologie Innovante</span>
                                </div>
                                <p>Découvrez nos solutions pour un avenir sécurisé.</p>
                            </div>
                        </div>
                    )}
                    {currentPage === 'produits' && (
                        <div>
                            <h3 className="interface-title">Nos Produits</h3>
                            <div className="product-grid">
                                <div className="product-card">
                                    <div className="product-placeholder"><Server size={32} /></div>
                                    <h4>CloudSync</h4>
                                    <p>Synchronisation sécurisée.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Shield size={32} /></div>
                                    <h4>AIShield</h4>
                                    <p>Protection par IA.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Lock size={32} /></div>
                                    <h4>DataVault</h4>
                                    <p>Stockage sécurisé.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentPage === 'à-propos' && (
                        <div>
                            <h3 className="interface-title">À Propos de TechCorp</h3>
                            <p>Fondée en 2010, TechCorp innove dans la cybersécurité.</p>
                            <p>Notre mission : protéger le monde numérique.</p>
                        </div>
                    )}
                    {currentPage === 'connexion' && (
                        <div>
                            <h3 className="interface-title">Connexion</h3>
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
                            <h3 className="interface-title">Contactez-nous</h3>
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
                    <h3 className="panel-title">{selectedTeam === 'attaquants' ? 'Outils d’Attaque' : 'Outils de Défense'}</h3>
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

    const ServerInterface = ({ role }) => {
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
                    output = 'Commandes : ls, ps, netstat, cat, to, nmap, ssh, whoami';
                    break;
                case 'ls':
                    ls => output = 'config.txt  logs/  passwords.bak  run.sh  decoy.txt';
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
            <div className="panel">
                <h2 className="panel-title">Serveur TechCorp</h2>
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
                    <h3 className="panel-title">{selectedTeam === 'attaquants' ? 'Actions Serveur' : 'Contre-mesures'}</h3>
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
                    <h1 className="intro-title">Fin de Partie</h1>
                    {isTie ? (
                        <h2 className="results-title">Égalité !</h2>
                    ) : (
                        <h2 className={`results-title ${winner.toLowerCase()}`}>
                            Les {winner} gagnent !
                        </h2>
                    )}
                    <div className="score-grid">
                        <div className="score-card attackers">
                            <div className="score-label">Attaquants</div>
                            <div className="score-value">{scores.attaquants}</div>
                        </div>
                        <div className="score-card defenders">
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
    return <div className="game-container">Chargement...</div>;
};

export default CyberWarGame;