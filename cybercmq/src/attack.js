import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './CyberWarGame.css';

const TimerComponent = ({ gameState, timeLeft, setTimeLeft, currentPhase, setCurrentPhase, setGameState, addLog }) => {
    useEffect(() => {
        let timer;
        if (gameState === 'jeu' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (currentPhase === 'site') {
                setCurrentPhase('serveur');
                setTimeLeft(600);
                addLog('Phase site terminée. Passage au serveur.');
            } else {
                setGameState('résultats');
            }
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, currentPhase, setTimeLeft, setCurrentPhase, setGameState, addLog]);

    return null;
};

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro');
    const [currentPhase, setCurrentPhase] = useState('site');
    const [timeLeft, setTimeLeft] = useState(600);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attaquants: 0, défenseurs: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);
    const [showRoleDetails, setShowRoleDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('site');

    const initialWebsiteState = {
        currentPage: 'accueil',
        vulnerabilities: {
            xss: { discovered: false, exploited: false, patched: false },
            sqli: { discovered: false, exploited: false, patched: false },
            weak_password: { discovered: false, exploited: false, patched: false },
            fake_form: { discovered: false, exploited: false, patched: false }
        },
        userAccounts: ['admin:admin123', 'utilisateur1:pass123', 'invité:guest'],
        database: ['utilisateurs', 'commandes', 'produits']
    };

    const initialServerState = {
        services: {
            ssh: { running: true, vulnerable: true, patched: false, credentials: 'admin:weakpass' },
            ftp: { running: true, vulnerable: true, patched: false },
            web: { running: true, vulnerable: false, patched: false },
            fake_db: { running: true, vulnerable: false, patched: true }
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
            {
                id: 'hacker-site',
                name: 'Hacker de Site Web',
                icon: '🕷️',
                spécialité: 'Trouver des failles dans les sites',
                description: 'Tu explores les sites web pour trouver des failles, comme des formulaires non sécurisés. Teste les champs avec du code ou des mots de passe simples !',
                hints: [
                    'Essaie d’entrer <script>alert("test")</script> dans les champs de texte pour tester XSS.',
                    'Utilise " OR 1=1 --" dans les formulaires de connexion pour tenter une injection SQL.',
                    'Teste des mots de passe simples comme "admin123" sur la page de connexion.'
                ]
            },
            {
                id: 'explorateur-réseau',
                name: 'Explorateur Réseau',
                icon: '📡',
                spécialité: 'Cartographier les serveurs',
                description: 'Tu examines les serveurs pour trouver des services vulnérables. Utilise le terminal pour scanner les ports et tester les connexions !',
                hints: [
                    'Tape "nmap" dans le terminal pour voir les ports ouverts.',
                    'Essaie "ssh admin@server" avec un mot de passe faible comme "weakpass".',
                    'Vérifie les fichiers comme "/var/www/decoy.txt" pour des indices (attention aux leurres !).'
                ]
            }
        ],
        défenseurs: [
            {
                id: 'protecteur-sécurité',
                name: 'Protecteur Sécurité',
                icon: '🛡️',
                spécialité: 'Surveiller les systèmes',
                description: 'Tu surveilles le site et le serveur pour repérer les attaques. Vérifie les journaux et bloque les failles !',
                hints: [
                    'Regarde le journal d’activité pour repérer des tentatives suspectes (XSS, SQLi).',
                    'Bloque les champs vulnérables en "patchant" XSS ou SQLi via les outils de défense.',
                    'Change les mots de passe faibles comme "admin123" pour sécuriser.'
                ]
            },
            {
                id: 'renforceur-système',
                name: 'Renforceur Système',
                icon: '🔒',
                spécialité: 'Sécuriser les serveurs',
                description: 'Tu renforces les serveurs en fermant les ports ou services vulnérables. Utilise le terminal pour appliquer des correctifs !',
                hints: [
                    'Tape "netstat" pour voir les ports ouverts et ferme ceux inutiles (e.g., port 21).',
                    'Désactive le service SSH s’il semble compromis.',
                    'Ignore les services comme "fake_db", c’est une fausse piste.'
                ]
            }
        ]
    };

    // Attribution du rôle
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

    const addLog = useCallback((message) => {
        setGameLog(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString('fr-FR')}] ${selectedTeam === 'attaquants' ? '⚔️' : '🛡️'} ${message}`]);
    }, [selectedTeam]);

    const handleAction = useCallback((team, message, points) => {
        addLog(message);
        setScores(prev => ({
            ...prev,
            [team]: prev[team] + points
        }));
    }, [addLog]);

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
        const [animationStep, setAnimationStep] = useState(0);
        const [displayText, setDisplayText] = useState('');

        useEffect(() => {
            if (animationStep === 0) {
                let text = 'DÉMARRAGE...';
                let i = 0;
                const typeText = () => {
                    if (i <= text.length) {
                        setDisplayText(text.slice(0, i));
                        i++;
                        setTimeout(typeText, 100);
                    } else {
                        setTimeout(() => setAnimationStep(1), 800);
                    }
                };
                typeText();
            } else if (animationStep === 1 && selectedRole) {
                const role = roles[selectedTeam].find(r => r.id === selectedRole);
                let text = `RÔLE : ${role.name.toUpperCase()}`;
                let i = 0;
                const typeText = () => {
                    if (i <= text.length) {
                        setDisplayText(text.slice(0, i));
                        i++;
                        setTimeout(typeText, 60);
                    } else {
                        setShowRoleDetails(true);
                        setTimeout(() => setAnimationStep(2), 2000);
                    }
                };
                typeText();
            } else if (animationStep === 2) {
                setTimeout(() => setGameState('jeu'), 500);
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
                <p><strong>Rôle :</strong> {role.description}</p>
                <p><strong>Spécialité :</strong> {role.spécialité}</p>
                <p><strong>Conseils pour réussir :</strong></p>
                <ul>
                    {role.hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                    ))}
                </ul>
                <p><strong>Objectifs :</strong></p>
                <ul>
                    {team === 'attaquants' ? (
                        <>
                            <li>Explore le site ou le serveur pour trouver des failles.</li>
                            <li>Teste des entrées (code, mots de passe) pour exploiter ces failles.</li>
                            <li>Marque des points en accédant à des données protégées.</li>
                        </>
                    ) : (
                        <>
                            <li>Surveille les attaques dans le journal d’activité.</li>
                            <li>Répare les failles en utilisant les outils de défense.</li>
                            <li>Bloque les attaquants pour gagner des points.</li>
                        </>
                    )}
                </ul>
                <p><strong>Attention :</strong> Certaines actions sont des pièges ! Lis bien les indices.</p>
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
                                <Info size={18} /> Voir mon rôle
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
                                        <div><CheckCircle className="icon" size={18} /> Trouver des failles</div>
                                        <div><AlertTriangle className="icon" size={18} /> Tester des exploits</div>
                                        <div><Target className="icon" size={18} /> Accéder aux données</div>
                                    </>
                                ) : (
                                    <>
                                        <div><Shield className="icon" size={18} /> Détecter les attaques</div>
                                        <div><Lock className="icon" size={18} /> Réparer les failles</div>
                                        <div><Zap className="icon" size={18} /> Bloquer les hackers</div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="panel activity">
                            <h3 className="panel-title">Journal d’activité</h3>
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
                <TimerComponent
                    gameState={gameState}
                    timeLeft={timeLeft}
                    setTimeLeft={setTimeLeft}
                    currentPhase={currentPhase}
                    setCurrentPhase={setCurrentPhase}
                    setGameState={setGameState}
                    addLog={addLog}
                />
            </div>
        );
    };

    const WebsiteInterface = ({ role }) => {
        const [currentPage, setCurrentPage] = useState('accueil');
        const [formData, setFormData] = useState({ username: '', password: '', comment: '', newsletter: '' });
        const [feedback, setFeedback] = useState('');

        const pages = [
            { id: 'accueil', name: 'Accueil' },
            { id: 'produits', name: 'Produits' },
            { id: 'à-propos', name: 'À propos' },
            { id: 'connexion', name: 'Connexion' },
            { id: 'contact', name: 'Contact' }
        ];

        const testXSS = (input) => {
            if (input.includes('<script>') || input.toLowerCase().includes('alert(')) {
                if (!websiteState.vulnerabilities.xss.exploited && selectedTeam === 'attaquants') {
                    setWebsiteState(prev => ({
                        ...prev,
                        vulnerabilities: { ...prev.vulnerabilities, xss: { ...prev.vulnerabilities.xss, exploited: true } }
                    }));
                    handleAction('attaquants', 'XSS réussi ! Tu as inséré un script malveillant.', 20);
                }
                return true;
            }
            return false;
        };

        const testSQLi = (input) => {
            if (input.includes('" OR 1=1 --') || input.includes('\' OR 1=1 --')) {
                if (!websiteState.vulnerabilities.sqli.exploited && selectedTeam === 'attaquants') {
                    setWebsiteState(prev => ({
                        ...prev,
                        vulnerabilities: { ...prev.vulnerabilities, sqli: { ...prev.vulnerabilities.sqli, exploited: true } }
                    }));
                    handleAction('attaquants', 'Injection SQL réussie ! Accès à la base de données.', 20);
                }
                return true;
            }
            return false;
        };

        const testWeakPassword = (username, password) => {
            const account = websiteState.userAccounts.find(acc => acc === `${username}:${password}`);
            if (account && !websiteState.vulnerabilities.weak_password.exploited && selectedTeam === 'attaquants') {
                setWebsiteState(prev => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, weak_password: { ...prev.vulnerabilities.weak_password, exploited: true } }
                }));
                handleAction('attaquants', `Connexion réussie avec ${username}:${password} ! Mot de passe faible détecté.`, 15);
                return true;
            }
            return false;
        };

        const patchVulnerability = (vuln) => {
            if (!websiteState.vulnerabilities[vuln].patched && selectedTeam === 'défenseurs') {
                setWebsiteState(prev => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, [vuln]: { ...prev.vulnerabilities[vuln], patched: true } }
                }));
                handleAction('défenseurs', `Faille ${vuln.toUpperCase()} corrigée !`, 15);
            }
        };

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
                    {feedback && <div className="feedback">{feedback}</div>}
                    {currentPage === 'accueil' && (
                        <div>
                            <h3 className="interface-title">Bienvenue chez TechCorp</h3>
                            <p className="lead">TechCorp crée des solutions sécurisées.</p>
                            <div className="hero">
                                <div className="hero-placeholder">
                                    <Globe size={50} />
                                    <span>Solutions sécurisées</span>
                                </div>
                                <p>Explorez le site pour trouver des failles ou sécuriser les pages.</p>
                            </div>
                        </div>
                    )}
                    {currentPage === 'produits' && (
                        <div>
                            <h3 className="interface-title">Nos produits</h3>
                            <div className="product-grid">
                                <div className="product-card">
                                    <div className="product-placeholder"><Server size={40} /></div>
                                    <h4>CloudSync</h4>
                                    <p>Partage sécurisé.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Shield size={40} /></div>
                                    <h4>AIShield</h4>
                                    <p>Protection IA.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Lock size={40} /></div>
                                    <h4>DataVault</h4>
                                    <p>Stockage sécurisé.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentPage === 'à-propos' && (
                        <div>
                            <h3 className="interface-title">À propos de TechCorp</h3>
                            <p>Depuis 2010, TechCorp protège vos données.</p>
                            <p>Mission : un internet sûr pour tous.</p>
                        </div>
                    )}
                    {currentPage === 'connexion' && (
                        <div>
                            <h3 className="interface-title">Connexion</h3>
                            <p className="hint">Indice : Essaie un mot de passe simple ou une injection SQL comme " OR 1=1 --</p>
                            <div className="form">
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input"
                                    placeholder="Nom d’utilisateur"
                                />
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input"
                                    placeholder="Mot de passe"
                                />
                                <button
                                    onClick={() => {
                                        if (testSQLi(formData.username) || testSQLi(formData.password)) {
                                            setFeedback('Succès : Injection SQL détectée !');
                                        } else if (testWeakPassword(formData.username, formData.password)) {
                                            setFeedback('Succès : Connexion avec un mot de passe faible !');
                                        } else {
                                            setFeedback('Échec : Identifiants incorrects ou attaque non détectée.');
                                        }
                                    }}
                                    className="button attaquants"
                                >
                                    Tester
                                </button>
                                {selectedTeam === 'défenseurs' && (
                                    <>
                                        <button
                                            onClick={() => patchVulnerability('sqli')}
                                            className="button défenseurs"
                                        >
                                            Corriger SQLi
                                        </button>
                                        <button
                                            onClick={() => patchVulnerability('weak_password')}
                                            className="button défenseurs"
                                        >
                                            Renforcer mots de passe
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {currentPage === 'contact' && (
                        <div>
                            <h3 className="interface-title">Contactez-nous</h3>
                            <p className="hint">Indice : Teste un script comme <script>alert("test")</script> dans le message.</p>
                            <div className="form">
                <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="input textarea"
                    placeholder="Votre message..."
                />
                                <input
                                    type="email"
                                    value={formData.newsletter}
                                    onChange={(e) => setFormData({ ...formData, newsletter: e.target.value })}
                                    className="input"
                                    placeholder="Email (Newsletter)"
                                />
                                <button
                                    onClick={() => {
                                        if (testXSS(formData.comment)) {
                                            setFeedback('Succès : Script XSS exécuté !');
                                        } else {
                                            setFeedback('Échec : Aucun script détecté.');
                                        }
                                    }}
                                    className="button attaquants"
                                >
                                    Tester
                                </button>
                                {selectedTeam === 'défenseurs' && (
                                    <button
                                        onClick={() => patchVulnerability('xss')}
                                        className="button défenseurs"
                                    >
                                        Corriger XSS
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setFeedback('Rien à trouver ici, c’est un leurre !');
                                        handleAction(selectedTeam, 'Tentative sur newsletter (leurre)', 0);
                                    }}
                                    className="button défenseurs"
                                >
                                    Tester Newsletter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ServerInterface = ({ role }) => {
        const [terminalInput, setTerminalInput] = useState('');
        const [terminalHistory, setTerminalHistory] = useState([
            'Bienvenue sur le serveur TechCorp.',
            'Tapez "help" pour voir les commandes.'
        ]);
        const terminalEndRef = useRef(null);

        useEffect(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [terminalHistory]);

        const executeCommand = (command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Commande : ${command}`);

            switch (cmdParts[0]) {
                case 'help':
                    output = 'Commandes : ls, ps, netstat, cat, nmap, ssh, whoami, stop-service, close-port';
                    break;
                case 'ls':
                    output = 'config.txt  logs/  passwords.bak  run.sh  decoy.txt';
                    break;
                case 'ps':
                    output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n4567\tmysql\n9999\tfake_service';
                    break;
                case 'netstat':
                    output = 'TCP\t0.0.0.0:22\tLISTEN\nTCP\t0.0.0.0:80\tLISTEN\nTCP\t0.0.0.0:21\tLISTEN\nTCP\t0.0.0.0:8080\tCLOSED';
                    break;
                case 'cat':
                    if (cmdParts[1] === 'passwords.bak') {
                        output = 'admin:weakpass';
                        if (selectedTeam === 'attaquants') {
                            handleAction('attaquants', 'Fichier passwords.bak trouvé !', 10);
                        }
                    } else if (cmdParts[1] === 'decoy.txt') {
                        output = 'Ce fichier est un leurre, rien d’utile ici.';
                        handleAction(selectedTeam, 'Fichier decoy.txt lu (leurre)', 0);
                    } else {
                        output = 'Erreur : fichier non trouvé.';
                    }
                    break;
                case 'nmap':
                    output = 'Scan... Ports : 22 (SSH), 80 (HTTP), 21 (FTP), 8080 (Inactif)';
                    if (selectedTeam === 'attaquants') {
                        handleAction('attaquants', 'Scan nmap effectué.', 5);
                    }
                    break;
                case 'ssh':
                    if (cmdParts[1] === 'admin@server' && cmdParts[2] === 'weakpass' && !serverState.services.ssh.patched && selectedTeam === 'attaquants') {
                        output = 'Connexion SSH réussie ! Accès admin obtenu.';
                        handleAction('attaquants', 'Accès SSH obtenu avec weakpass.', 25);
                    } else {
                        output = 'Connexion SSH échouée.';
                    }
                    break;
                case 'whoami':
                    output = 'admin';
                    break;
                case 'stop-service':
                    if (cmdParts[1] === 'ssh' && selectedTeam === 'défenseurs' && !serverState.services.ssh.patched) {
                        setServerState(prev => ({
                            ...prev,
                            services: { ...prev.services, ssh: { ...prev.services.ssh, patched: true } }
                        }));
                        output = 'Service SSH arrêté.';
                        handleAction('défenseurs', 'Service SSH sécurisé.', 15);
                    } else {
                        output = 'Erreur : service non trouvé ou déjà sécurisé.';
                    }
                    break;
                case 'close-port':
                    if (cmdParts[1] === '21' && selectedTeam === 'défenseurs' && !serverState.services.ftp.patched) {
                        setServerState(prev => ({
                            ...prev,
                            services: { ...prev.services, ftp: { ...prev.services.ftp, patched: true } }
                        }));
                        output = 'Port 21 fermé.';
                        handleAction('défenseurs', 'Port FTP fermé.', 15);
                    } else {
                        output = 'Erreur : port non trouvé ou déjà fermé.';
                    }
                    break;
                default:
                    output = `Commande inconnue : ${command}`;
            }
            setTerminalHistory(prev => [...prev, `> ${command}`, output]);
            setTerminalInput('');
        };

        return (
            <div className="panel">
                <h2 className="panel-title">Serveur TechCorp</h2>
                <p className="hint">Indice : Utilise "nmap" pour voir les ports, ou "cat passwords.bak" pour trouver des indices.</p>
                <div className="status-grid">
                    <div className="status-card">
                        <h3 className="status-title">Services</h3>
                        <div className="status-content">SSH, HTTP, FTP, MySQL, FakeDB (inactif)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Failles</h3>
                        <div className="status-content">{serverState.services.ssh.patched ? 'Aucune' : 'SSH (mot de passe faible)'}</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Alertes</h3>
                        <div className="status-content">{gameLog.length > 0 ? 'Activité détectée' : 'Aucune'}</div>
                    </div>
                </div>
                <div
                    className="terminal"
                    onClick={() => terminalInputRef.current.focus()}
                >
                    <div className="terminal-list">
                        {terminalHistory.map((line, i) => (
                            <div key={i} className="terminal-line">{line}</div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                    <div className="terminal-prompt">
                        <span>> </span>
                        <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeCommand(terminalInput)}
                            className="input terminal-input"
                            autoFocus
                        />
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
                        <div className="score-card attaquants">
                            <div className="score-label">Attaquants</div>
                            <div className="score-value">{scores.attaquants}</div>
                        </div>
                        <div className="score-card défenseurs">
                            <div className="score-label">Défenseurs</div>
                            <div className="score-value">{scores.défenseurs}</div>
                        </div>
                    </div>
                    <button onClick={handleRestartGame} className="button restart">
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