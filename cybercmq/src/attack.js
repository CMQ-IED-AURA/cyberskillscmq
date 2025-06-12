import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './CyberWarGame.css';

// Timer isolé avec état local
const TimerDisplay = memo(({ gameState, initialTime, onPhaseChange, onGameEnd, addLog }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [currentPhase, setCurrentPhase] = useState('site');

    useEffect(() => {
        if (gameState !== 'jeu' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (currentPhase === 'site') {
                        setCurrentPhase('serveur');
                        addLog('Phase site terminée. Passage au serveur.');
                        onPhaseChange('serveur');
                        return initialTime;
                    } else {
                        onGameEnd();
                        return 0;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, timeLeft, currentPhase, initialTime, addLog, onPhaseChange, onGameEnd]);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="timer">
            <span className="timer-label">Temps</span>
            <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
    );
});

const CyberWarGame = () => {
    const [gameState, setGameState] = useState('intro');
    const [currentPhase, setCurrentPhase] = useState('site');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attaquants: 0, défenseurs: 0 });
    const [gameLog, setGameLog] = useState([]);
    const [roleAssigned, setRoleAssigned] = useState(false);
    const [showRoleDetails, setShowRoleDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('site');
    const [threatLevel, setThreatLevel] = useState('low');
    const [teamActions, setTeamActions] = useState([]);

    const initialWebsiteState = {
        currentPage: 'accueil',
        vulnerabilities: {
            xss: { discovered: false, exploited: false, patched: false },
            sqli: { discovered: false, exploited: false, patched: false },
            weak_password: { discovered: false, exploited: false, patched: false },
            csrf: { discovered: false, exploited: false, patched: false },
            file_inclusion: { discovered: false, exploited: false, patched: false }
        },
        userAccounts: ['admin:admin123', 'utilisateur1:pass123', 'invité:guest'],
        database: ['utilisateurs', 'commandes', 'produits', 'secrets']
    };

    const initialServerState = {
        services: {
            ssh: { running: true, vulnerable: true, patched: false, credentials: 'admin:weakpass' },
            ftp: { running: true, vulnerable: true, patched: false },
            web: { running: true, vulnerable: false, patched: false },
            fake_db: { running: true, vulnerable: false, patched: true },
            rdp: { running: true, vulnerable: true, patched: false }
        },
        files: ['/etc/passwd', '/var/log/auth.log', '/home/user/.ssh/id_rsa', '/var/www/decoy.txt', '/root/secret.key'],
        processes: ['apache2', 'sshd', 'mysql', 'fake_service', 'rdp'],
        ports: [22, 80, 443, 21, 3306, 8080, 3389]
    };

    const [websiteState, setWebsiteState] = useState(initialWebsiteState);
    const [serverState, setServerState] = useState(initialServerState);
    const terminalInputRef = useRef(null);

    const roles = {
        attaquants: [
            {
                id: 'hacker-site',
                name: 'Web Infiltrator',
                icon: '🕷️',
                spécialité: 'Exploiter les failles web',
                description: 'Scanne les pages pour des vulnérabilités comme XSS, SQLi ou CSRF.',
                hints: [
                    'Teste <script>alert("test")</script> dans les commentaires pour XSS.',
                    'Utilise " OR 1=1 --" dans la connexion pour SQLi.',
                    'Essaie admin:admin123 pour les mots de passe faibles.',
                    'Teste un jeton CSRF invalide sur le formulaire de contact.'
                ]
            },
            {
                id: 'explorateur-réseau',
                name: 'Network Phantom',
                icon: '📡',
                spécialité: 'Piratage serveur',
                description: 'Utilise le terminal pour scanner les ports et exploiter les services.',
                hints: [
                    'Tape "nmap" pour voir les ports ouverts.',
                    'Essaie "cat passwords.bak" pour trouver un mot de passe.',
                    'Utilise "ssh admin@server weakpass" pour te connecter.',
                    'Teste "crack secret.key" pour un accès critique.'
                ]
            }
        ],
        défenseurs: [
            {
                id: 'protecteur-sécurité',
                name: 'Cyber Guardian',
                icon: '🛡️',
                spécialité: 'Surveillance active',
                description: 'Surveille les journaux et corrige les failles web.',
                hints: [
                    'Vérifie le journal pour des tentatives XSS ou SQLi.',
                    'Corrige XSS, SQLi ou CSRF via les boutons de défense.',
                    'Renforce les mots de passe faibles comme admin123.'
                ]
            },
            {
                id: 'renforceur-système',
                name: 'System Locksmith',
                icon: '🔒',
                spécialité: 'Sécurisation serveur',
                description: 'Ferme les ports et services vulnérables pour protéger le système.',
                hints: [
                    'Tape "netstat" pour voir les ports ouverts.',
                    'Utilise "stop-service ssh" pour sécuriser SSH.',
                    'Ignore "fake_db", c’est un piège.'
                ]
            }
        ]
    };

    // Attribution du rôle avec correction du bug de refresh
    useEffect(() => {
        if (gameState === 'intro' && !roleAssigned) {
            const teams = ['attaquants', 'défenseurs'];
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            const randomRole = roles[randomTeam][Math.floor(Math.random() * roles[randomTeam].length)];
            setSelectedTeam(randomTeam);
            setSelectedRole(randomRole.id);
            setGameLog([`[${new Date().toLocaleTimeString('fr-FR')}] Rôle assigné : ${randomRole.name} (${randomTeam === 'attaquants' ? '⚔️ Attaquants' : '🛡️ Défenseurs'})`]);
            setRoleAssigned(true);
        }
    }, [gameState, roleAssigned]);

    // Événements aléatoires pour l’engagement
    useEffect(() => {
        if (gameState !== 'jeu') return;
        const events = [
            { type: 'ddos', message: 'Alerte : Attaque DDoS détectée !', team: 'défenseurs', points: 10 },
            { type: 'breach', message: 'Tentative de violation du pare-feu !', team: 'attaquants', points: 5 },
            { type: 'patch', message: 'Mise à jour de sécurité disponible.', team: 'défenseurs', points: 5 }
        ];
        const interval = setInterval(() => {
            const event = events[Math.floor(Math.random() * events.length)];
            addLog(event.message);
            handleAction(event.team, event.message, event.points);
            setThreatLevel(event.type === 'ddos' ? 'high' : event.type === 'breach' ? 'medium' : 'low');
        }, 30000);
        return () => clearInterval(interval);
    }, [gameState]);

    const addLog = useCallback((message) => {
        setGameLog(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString('fr-FR')}] ${selectedTeam === 'attaquants' ? '⚔️' : '🛡️'} ${message}`]);
    }, [selectedTeam]);

    const handleAction = useCallback((team, message, points) => {
        addLog(message);
        setScores(prev => ({
            ...prev,
            [team]: prev[team] + points
        }));
        setTeamActions(prev => [...prev.slice(-10), `${team}: ${message}`]);
        setThreatLevel(points > 15 ? 'high' : points > 5 ? 'medium' : 'low');
    }, [addLog]);

    const handlePhaseChange = useCallback((newPhase) => {
        setCurrentPhase(newPhase);
        setActiveTab(newPhase);
    }, []);

    const handleGameEnd = useCallback(() => {
        setGameState('résultats');
    }, []);

    const handleRestartGame = useCallback(() => {
        setGameState('intro');
        setCurrentPhase('site');
        setActiveTab('site');
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attaquants: 0, défenseurs: 0 });
        setGameLog([]);
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        setRoleAssigned(false);
        setShowRoleDetails(false);
        setThreatLevel('low');
        setTeamActions([]);
    }, []);

    const IntroAnimation = () => {
        const [animationStep, setAnimationStep] = useState(0);
        const [displayText, setDisplayText] = useState('');

        useEffect(() => {
            if (animationStep === 0) {
                let text = 'INITIALISATION SYSTÈME...';
                let i = 0;
                const typeText = () => {
                    if (i <= text.length) {
                        setDisplayText(text.slice(0, i));
                        i++;
                        setTimeout(typeText, 80);
                    } else {
                        setTimeout(() => setAnimationStep(1), 1000);
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
                        setTimeout(() => setAnimationStep(2), 2500);
                    }
                };
                typeText();
            } else if (animationStep === 2) {
                setTimeout(() => setGameState('jeu'), 500);
            }
        }, [animationStep, selectedRole, selectedTeam]);

        return (
            <div className="game-container intro-container">
                <h1 className="header-title">CyberWar</h1>
                <div className="hacker-text text-3xl font-mono">{displayText}</div>
                {showRoleDetails && selectedRole && (
                    <RoleDetails role={roles[selectedTeam].find(r => r.id === selectedRole)} team={selectedTeam} />
                )}
            </div>
        );
    };

    const RoleDetails = ({ role, team }) => {
        return (
            <div className={`role-details ${team}`}>
                <h2 className="role-details-title text-2xl font-bold">{role.name}</h2>
                <p><strong>Rôle :</strong> {role.description}</p>
                <p><strong>Spécialité :</strong> {role.spécialité}</p>
                <p><strong>Conseils :</strong></p>
                <ul className="list-disc pl-5">
                    {role.hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                    ))}
                </ul>
                <p><strong>Objectifs :</strong></p>
                <ul className="list-disc pl-5">
                    {team === 'attaquants' ? (
                        <>
                            <li>Exploiter les failles pour marquer des points.</li>
                            <li>Collaborer avec ton équipe pour maximiser l’impact.</li>
                            <li>Évite les pièges tendus par les défenseurs.</li>
                        </>
                    ) : (
                        <>
                            <li>Protéger le système en corrigeant les failles.</li>
                            <li>Surveiller les actions des attaquants.</li>
                            <li>Réagir rapidement aux alertes.</li>
                        </>
                    )}
                </ul>
                <p><strong>Attention :</strong> Les pièges sont partout !</p>
            </div>
        );
    };

    const ChallengeBoard = () => {
        const challenges = [
            { id: 1, task: 'Exploiter une faille XSS en moins de 2 min', points: 20, team: 'attaquants' },
            { id: 2, task: 'Corriger une faille SQLi avant une attaque', points: 15, team: 'défenseurs' },
            { id: 3, task: 'Trouver un mot de passe faible', points: 10, team: 'attaquants' },
            { id: 4, task: 'Fermer un port vulnérable', points: 15, team: 'défenseurs' }
        ];

        return (
            <div className="challenge-board">
                <h3 className="panel-title">Tableau des Défis</h3>
                {challenges.map(challenge => (
                    <div key={challenge.id} className="challenge-item">
                        <p>{challenge.task}</p>
                        <p><strong>{challenge.points} points</strong> ({challenge.team})</p>
                        <button
                            className={`button ${selectedTeam}`}
                            onClick={() => handleAction(selectedTeam, `Défi complété : ${challenge.task}`, challenge.points)}
                        >
                            Compléter
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    const GameInterface = () => {
        const role = roles[selectedTeam]?.find(r => r.id === selectedRole);

        return (
            <div className="game-container">
                <header className="header">
                    <div className="header-content flex justify-between items-center">
                        <div className="header-left">
                            <h1 className="header-title">CyberWar</h1>
                            <div className="phase-info">
                                Phase : <span className="phase-name">{currentPhase === 'site' ? 'Site Web' : 'Serveur'}</span>
                            </div>
                        </div>
                        <div className="header-right flex gap-4">
                            <TimerDisplay
                                gameState={gameState}
                                initialTime={600}
                                onPhaseChange={handlePhaseChange}
                                onGameEnd={handleGameEnd}
                                addLog={addLog}
                            />
                            <div className="scores">
                                <span className="score-label">Score</span>
                                <span className="score-value">
                                    <span className="attaquants">{scores.attaquants}</span> - <span className="défenseurs">{scores.défenseurs}</span>
                                </span>
                            </div>
                            <button
                                onClick={() => setShowRoleDetails(true)}
                                className="button role-details-btn flex items-center gap-2"
                            >
                                <Info size={18} /> Voir mon rôle
                            </button>
                        </div>
                    </div>
                </header>
                <main className="main-content flex gap-6">
                    <aside className="sidebar">
                        {role && (
                            <div className={`panel role-panel ${selectedTeam}`}>
                                <div className="role-icon">{role.icon}</div>
                                <div className="role-name">{role.name}</div>
                                <div className="speciality">{role.spécialité}</div>
                            </div>
                        )}
                        <div className="panel">
                            <h3 className="panel-title">Niveau de Menace</h3>
                            <div className={`threat-level ${threatLevel}`}>
                                Menace : {threatLevel.toUpperCase()}
                            </div>
                        </div>
                        <ChallengeBoard />
                        <div className="panel activity">
                            <h3 className="panel-title">Journal d’Activité</h3>
                            <div className="activity-log">
                                {gameLog.map((log, i) => (
                                    <div key={i} className="log-entry">{log}</div>
                                ))}
                            </div>
                        </div>
                        <div className="panel">
                            <h3 className="panel-title">Actions d’Équipe</h3>
                            <div className="activity-log">
                                {teamActions.map((action, i) => (
                                    <div key={i} className="log-entry">{action}</div>
                                ))}
                            </div>
                        </div>
                    </aside>
                    <div className="content-wrapper flex-1">
                        <div className="tabs flex gap-4 mb-4">
                            <button
                                onClick={() => setActiveTab('site')}
                                className={`tab ${activeTab === 'site' ? 'active' : ''} ${selectedTeam}`}
                            >
                                🌐 Site Web
                            </button>
                            <button
                                onClick={() => setActiveTab('serveur')}
                                className={`tab ${activeTab === 'serveur' ? 'active' : ''} ${selectedTeam}`}
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
        const [formData, setFormData] = useState({ username: '', password: '', comment: '', newsletter: '', csrfToken: '' });
        const [feedback, setFeedback] = useState('');

        const pages = [
            { id: 'accueil', name: 'Accueil' },
            { id: 'produits', name: 'Produits' },
            { id: 'à-propos', name: 'À propos' },
            { id: 'connexion', name: 'Connexion' },
            { id: 'contact', name: 'Contact' }
        ];

        const testXSS = useCallback((input) => {
            if (input.includes('<script>') || input.toLowerCase().includes('alert(')) {
                if (!websiteState.vulnerabilities.xss.exploited && selectedTeam === 'attaquants') {
                    setWebsiteState(prev => ({
                        ...prev,
                        vulnerabilities: { ...prev.vulnerabilities, xss: { ...prev.vulnerabilities.xss, exploited: true } }
                    }));
                    handleAction('attaquants', 'XSS réussi ! Script malveillant inséré.', 20);
                }
                return true;
            }
            return false;
        }, [websiteState.vulnerabilities.xss.exploited, selectedTeam, handleAction]);

        const testSQLi = useCallback((input) => {
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
        }, [websiteState.vulnerabilities.sqli.exploited, selectedTeam, handleAction]);

        const testWeakPassword = useCallback((username, password) => {
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
        }, [websiteState.userAccounts, websiteState.vulnerabilities.weak_password.exploited, selectedTeam, handleAction]);

        const testCSRF = useCallback((token) => {
            if (token !== 'valid_token' && !websiteState.vulnerabilities.csrf.exploited && selectedTeam === 'attaquants') {
                setWebsiteState(prev => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, csrf: { ...prev.vulnerabilities.csrf, exploited: true } }
                }));
                handleAction('attaquants', 'Attaque CSRF réussie !', 20);
                return true;
            }
            return false;
        }, [websiteState.vulnerabilities.csrf.exploited, selectedTeam, handleAction]);

        const testFileInclusion = useCallback((input) => {
            if (input.includes('/etc/passwd') && !websiteState.vulnerabilities.file_inclusion.exploited && selectedTeam === 'attaquants') {
                setWebsiteState(prev => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, file_inclusion: { ...prev.vulnerabilities.file_inclusion, exploited: true } }
                }));
                handleAction('attaquants', 'Inclusion de fichier réussie ! Accès à /etc/passwd.', 25);
                return true;
            }
            return false;
        }, [websiteState.vulnerabilities.file_inclusion.exploited, selectedTeam, handleAction]);

        const patchVulnerability = useCallback((vuln) => {
            if (!websiteState.vulnerabilities[vuln].patched && selectedTeam === 'défenseurs') {
                setWebsiteState(prev => ({
                    ...prev,
                    vulnerabilities: { ...prev.vulnerabilities, [vuln]: { ...prev.vulnerabilities[vuln], patched: true } }
                }));
                handleAction('défenseurs', `Faille ${vuln.toUpperCase()} corrigée !`, 15);
            }
        }, [websiteState.vulnerabilities, selectedTeam, handleAction]);

        return (
            <div className="panel">
                <h2 className="panel-title">Site Web TechCorp</h2>
                <div className="sub-tabs flex gap-2 mb-4">
                    {pages.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setCurrentPage(p.id)}
                            className={`sub-tab ${currentPage === p.id ? 'active' : ''} ${selectedTeam}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <div className="interface-content">
                    {feedback && <div className={`feedback ${feedback.includes('Succès') ? 'data-status-success' : 'data-status-failure'}`}>{feedback}</div>}
                    {currentPage === 'accueil' && (
                        <div>
                            <h3 className="interface-title text-xl font-bold">Bienvenue chez TechCorp</h3>
                            <p className="lead">TechCorp : Solutions sécurisées du futur.</p>
                            <div className="hero flex flex-col items-center">
                                <Globe size={60} className="text-blue-400" />
                                <p>Explorez le site pour attaquer ou défendre !</p>
                            </div>
                        </div>
                    )}
                    {currentPage === 'produits' && (
                        <div>
                            <h3 className="interface-title text-xl font-bold">Nos produits</h3>
                            <div className="product-grid grid grid-cols-3 gap-4">
                                <div className="product-card p-4 border border-gray-700 rounded-lg">
                                    <Server size={40} className="text-blue-400" />
                                    <h4>CloudSync</h4>
                                    <p>Partage sécurisé.</p>
                                </div>
                                <div className="product-card p-4 border border-gray-700 rounded-lg">
                                    <Shield size={40} className="text-blue-400" />
                                    <h4>AIShield</h4>
                                    <p>Protection IA.</p>
                                </div>
                                <div className="product-card p-4 border border-gray-700 rounded-lg">
                                    <Lock size={40} className="text-blue-400" />
                                    <h4>DataVault</h4>
                                    <p>Stockage sécurisé.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentPage === 'à-propos' && (
                        <div>
                            <h3 className="interface-title text-xl font-bold">À propos de TechCorp</h3>
                            <p>Depuis 2010, TechCorp protège vos données.</p>
                            <p>Mission : un internet sûr pour tous.</p>
                        </div>
                    )}
                    {currentPage === 'connexion' && (
                        <div>
                            <h3 className="interface-title text-xl font-bold">Connexion</h3>
                            <p className="hint">Indice : Essaie admin:admin123 ou une injection comme " OR 1=1 --</p>
                            <div className="form flex flex-col gap-4">
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
                                            setFeedback('Succès : Connexion avec mot de passe faible !');
                                        } else {
                                            setFeedback('Échec : Identifiants incorrects.');
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
                            <h3 className="interface-title text-xl font-bold">Contactez-nous</h3>
                            <p className="hint">Indice : Teste <script>alert("test")</script> ou un jeton CSRF invalide.</p>
                            <div className="form flex flex-col gap-4">
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    className="input textarea"
                                    placeholder="Votre message..."
                                />
                                <input
                                    type="text"
                                    value={formData.csrfToken}
                                    onChange={(e) => setFormData({ ...formData, csrfToken: e.target.value })}
                                    className="input"
                                    placeholder="Jeton CSRF"
                                />
                                <button
                                    onClick={() => {
                                        if (testXSS(formData.comment)) {
                                            setFeedback('Succès : Script XSS exécuté !');
                                        } else if (testCSRF(formData.csrfToken)) {
                                            setFeedback('Succès : Attaque CSRF détectée !');
                                        } else {
                                            setFeedback('Échec : Aucun script ou CSRF détecté.');
                                        }
                                    }}
                                    className="button attaquants"
                                >
                                    Tester
                                </button>
                                {selectedTeam === 'défenseurs' && (
                                    <>
                                        <button
                                            onClick={() => patchVulnerability('xss')}
                                            className="button défenseurs"
                                        >
                                            Corriger XSS
                                        </button>
                                        <button
                                            onClick={() => patchVulnerability('csrf')}
                                            className="button défenseurs"
                                        >
                                            Corriger CSRF
                                        </button>
                                    </>
                                )}
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

        const executeCommand = useCallback((command) => {
            let output = '';
            const cmdParts = command.toLowerCase().split(' ');
            addLog(`Commande : ${command}`);

            switch (cmdParts[0]) {
                case 'help':
                    output = 'Commandes : ls, ps, netstat, cat, nmap, ssh, whoami, stop-service, close-port, crack';
                    break;
                case 'ls':
                    output = 'config.txt  logs/  passwords.bak  run.sh  decoy.txt  secret.key';
                    break;
                case 'ps':
                    output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n4567\tmysql\n9999\tfake_service\n1111\trdp';
                    break;
                case 'netstat':
                    output = 'TCP\t0.0.0.0:22\tLISTEN\nTCP\t0.0.0.0:80\tLISTEN\nTCP\t0.0.0.0:21\tLISTEN\nTCP\t0.0.0.0:3389\tLISTEN';
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
                    output = 'Scan... Ports : 22 (SSH), 80 (HTTP), 21 (FTP), 3389 (RDP), 8080 (Inactif)';
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
                case 'crack':
                    if (cmdParts[1] === 'secret.key' && !serverState.services.rdp.patched && selectedTeam === 'attaquants') {
                        output = 'Clé secrète décryptée ! Accès critique obtenu.';
                        handleAction('attaquants', 'Clé secrète décryptée.', 30);
                    } else {
                        output = 'Erreur : fichier non décryptable.';
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
                    } else if (cmdParts[1] === 'rdp' && selectedTeam === 'défenseurs' && !serverState.services.rdp.patched) {
                        setServerState(prev => ({
                            ...prev,
                            services: { ...prev.services, rdp: { ...prev.services.rdp, patched: true } }
                        }));
                        output = 'Service RDP arrêté.';
                        handleAction('défenseurs', 'Service RDP sécurisé.', 15);
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
        }, [addLog, handleAction, selectedTeam, serverState.services.ssh.patched, serverState.services.ftp.patched, serverState.services.rdp.patched]);

        return (
            <div className="panel">
                <h2 className="panel-title">Serveur TechCorp</h2>
                <p className="hint">Indice : Utilise "nmap" pour voir les ports, ou "cat passwords.bak" pour un mot de passe.</p>
                <div className="status-grid grid grid-cols-3 gap-4">
                    <div className="status-card p-4 border border-gray-700 rounded-lg">
                        <h3 className="status-title text-lg font-bold">Services</h3>
                        <div className="status-content">SSH, HTTP, FTP, MySQL, RDP, FakeDB (inactif)</div>
                    </div>
                    <div className="status-card p-4 border border-gray-700 rounded-lg">
                        <h3 className="status-title text-lg font-bold">Failles</h3>
                        <div className="status-content">{serverState.services.ssh.patched ? 'Aucune' : 'SSH (mot de passe faible), RDP'}</div>
                    </div>
                    <div className="status-card p-4 border border-gray-700 rounded-lg">
                        <h3 className="status-title text-lg font-bold">Alertes</h3>
                        <div className="status-content">{gameLog.length > 0 ? 'Activité détectée' : 'Aucune'}</div>
                    </div>
                </div>
                <div
                    className="terminal mt-4"
                    onClick={() => terminalInputRef.current.focus()}
                >
                    <div className="terminal-list">
                        {terminalHistory.map((line, i) => (
                            <div key={i} className="terminal-line">{line}</div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                    <div className="terminal-prompt flex items-center">
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
                    <h1 className="header-title">Fin de Partie</h1>
                    {isTie ? (
                        <h2 className="results-title">Égalité !</h2>
                    ) : (
                        <h2 className={`results-title ${winner.toLowerCase()}`}>
                            Les {winner} gagnent !
                        </h2>
                    )}
                    <div className="score-grid grid grid-cols-2 gap-4">
                        <div className="score-card attaquants">
                            <div className="score-label">Attaquants</div>
                            <div className="score-value">{scores.attaquants}</div>
                        </div>
                        <div className="score-card défenseurs">
                            <div className="score-label">Défenseurs</div>
                            <div className="score-value">{scores.défenseurs}</div>
                        </div>
                    </div>
                    <button onClick={handleRestartGame} className="button restart mt-4">
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