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
    const [showRoleDetails, setShowRoleDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('site');

    const initialWebsiteState = {
        currentPage: 'accueil',
        vulnerabilities: {
            xss: { discovered: false, exploited: false, patched: false },
            sqli: { discovered: false, exploited: false, patched: false },
            csrf: { discovered: false, exploited: false, patched: false },
            fake_form: { discovered: false, exploited: false, patched: false }
        },
        userAccounts: ['admin', 'utilisateur1', 'invité'],
        database: ['utilisateurs', 'commandes', 'produits']
    };

    const initialServerState = {
        services: {
            ssh: { running: true, vulnerable: true, patched: false },
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
                actions: [
                    { name: 'Scanner XSS', desc: 'Cherche des failles pour insérer du code malveillant' },
                    { name: 'Injection SQL', desc: 'Tente d’accéder à la base de données via un formulaire' },
                    { name: 'Tester CSRF', desc: 'Essaie de tromper le site pour faire des actions non autorisées' },
                    { name: 'Analyser Faux Formulaire', desc: 'Vérifie un formulaire qui semble suspect (leurre)' }
                ],
                description: 'Tu attaques des sites web en trouvant des failles simples, comme des formulaires non sécurisés.'
            },
            {
                id: 'pirate-social',
                name: 'Pirate Social',
                icon: '👤',
                spécialité: 'Tromper les utilisateurs',
                actions: [
                    { name: 'Hameçonner', desc: 'Envoie un faux email pour voler des mots de passe' },
                    { name: 'Collecter Infos', desc: 'Rassemble des informations sur les utilisateurs' },
                    { name: 'Usurper Email', desc: 'Fait semblant d’être quelqu’un d’autre par email' },
                    { name: 'Simuler Appel', desc: 'Tente une fausse piste par téléphone (leurre)' }
                ],
                description: 'Tu utilises des astuces pour piéger les gens et obtenir leurs informations.'
            },
            {
                id: 'explorateur-réseau',
                name: 'Explorateur Réseau',
                icon: '📡',
                spécialité: 'Cartographier les réseaux',
                actions: [
                    { name: 'Scanner Ports', desc: 'Découvre quels services sont actifs sur le serveur' },
                    { name: 'Reconnaissance', desc: 'Collecte des infos sur le réseau' },
                    { name: 'Ping Sweep', desc: 'Vérifie quels appareils sont connectés' },
                    { name: 'Tester Port Inutilisé', desc: 'Tente un port qui ne fonctionne pas (leurre)' }
                ],
                description: 'Tu explores les réseaux pour trouver des points faibles dans les serveurs.'
            },
            {
                id: 'codeur-attaquant',
                name: 'Codeur Attaquant',
                icon: '⚡',
                spécialité: 'Créer des programmes d’attaque',
                actions: [
                    { name: 'Exploiter Faille', desc: 'Utilise une faille pour prendre le contrôle' },
                    { name: 'Débordement', desc: 'Force un programme à exécuter ton code' },
                    { name: 'Injecter Code', desc: 'Ajoute un code malveillant dans le serveur' },
                    { name: 'Analyser Faux Service', desc: 'Vérifie un service qui semble suspect (leurre)' }
                ],
                description: 'Tu crées des outils pour exploiter les failles des programmes.'
            },
            {
                id: 'déchiffreur',
                name: 'Déchiffreur',
                icon: '🔓',
                spécialité: 'Casser les mots de passe',
                actions: [
                    { name: 'Craquer Mot de Passe', desc: 'Tente de deviner un mot de passe' },
                    { name: 'Déchiffrer Fichier', desc: 'Ouvre un fichier protégé' },
                    { name: 'Espionner Clavier', desc: 'Enregistre ce que l’utilisateur tape' },
                    { name: 'Tester Faux Code', desc: 'Tente un code inutile (leurre)' }
                ],
                description: 'Tu casses les protections pour accéder aux données secrètes.'
            }
        ],
        défenseurs: [
            {
                id: 'protecteur-sécurité',
                name: 'Protecteur Sécurité',
                icon: '🛡️',
                spécialité: 'Surveiller les systèmes',
                actions: [
                    { name: 'Surveiller Journaux', desc: 'Vérifie les activités suspectes' },
                    { name: 'Détecter Attaque', desc: 'Repère une tentative d’intrusion' },
                    { name: 'Analyser Trafic', desc: 'Examine les connexions réseau' },
                    { name: 'Vérifier Faux Journal', desc: 'Regarde un journal sans importance (leurre)' }
                ],
                description: 'Tu surveilles le système pour repérer les attaques.'
            },
            {
                id: 'réparateur-urgence',
                name: 'Réparateur Urgence',
                icon: '🚨',
                spécialité: 'Réagir aux attaques',
                actions: [
                    { name: 'Enquêter', desc: 'Analyse une attaque pour comprendre comment elle a eu lieu' },
                    { name: 'Stopper Attaque', desc: 'Bloque une attaque en cours' },
                    { name: 'Isoler Machine', desc: 'Déconnecte une machine compromise' },
                    { name: 'Examiner Faux Fichier', desc: 'Vérifie un fichier inutile (leurre)' }
                ],
                description: 'Tu interviens vite pour limiter les dégâts des attaques.'
            },
            {
                id: 'gestionnaire-réseau',
                name: 'Gestionnaire Réseau',
                icon: '🌐',
                spécialité: 'Protéger le réseau',
                actions: [
                    { name: 'Configurer Mur', desc: 'Met en place un pare-feu' },
                    { name: 'Activer Alarme', desc: 'Installe un détecteur d’intrusion' },
                    { name: 'Bloquer Adresse', desc: 'Empêche une machine d’accéder au réseau' },
                    { name: 'Bloquer Faux Port', desc: 'Tente de bloquer un port inutile (leurre)' }
                ],
                description: 'Tu sécurises le réseau pour bloquer les attaquants.'
            },
            {
                id: 'renforceur-système',
                name: 'Renforceur Système',
                icon: '🔒',
                spécialité: 'Renforcer les machines',
                actions: [
                    { name: 'Installer Correctif', desc: 'Met à jour pour corriger une faille' },
                    { name: 'Sécuriser Config', desc: 'Améliore les paramètres de sécurité' },
                    { name: 'Désactiver Service', desc: 'Arrête un service vulnérable' },
                    { name: 'Désactiver Faux Service', desc: 'Tente d’arrêter un service inutile (leurre)' }
                ],
                description: 'Tu rends les machines plus difficiles à attaquer.'
            },
            {
                id: 'traqueur-menaces',
                name: 'Traqueur Menaces',
                icon: '🎯',
                spécialité: 'Chasser les dangers',
                actions: [
                    { name: 'Repérer Danger', desc: 'Cherche des signes d’attaque' },
                    { name: 'Analyser Virus', desc: 'Étudie un programme malveillant' },
                    { name: 'Suivre Attaquant', desc: 'Tente de trouver qui attaque' },
                    { name: 'Analyser Fausse Alerte', desc: 'Vérifie une alerte sans importance (leurre)' }
                ],
                description: 'Tu traques les attaquants pour les neutraliser.'
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

    // Timer
    useEffect(() => {
        let timer;
        if (gameState === 'jeu' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (currentPhase === 'site') {
                setCurrentPhase('serveur');
                setActiveTab('serveur');
                setTimeLeft(600);
                addLog('Phase site terminée. Passage au serveur.');
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
        const [animationStep, setAnimationStep] = useState(0);
        const [displayText, setDisplayText] = useState('');

        useEffect(() => {
            if (animationStep === 0) {
                let text = 'DÉMARRAGE DU JEU...';
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
                let text = `RÔLE : ${role.name.toUpperCase()} [${selectedTeam === 'attaquants' ? 'ATTAQUANTS' : 'DÉFENSEURS'}]`;
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
                <p><strong>Actions possibles :</strong></p>
                <ul>
                    {role.actions.map((action, i) => (
                        <li key={i}>
                            <strong>{action.name}</strong>: {action.desc}
                            {action.name.includes('Faux') || action.name.includes('Inutilisé') ? ' (C’est une fausse piste, inutile d’essayer !)' : ''}
                        </li>
                    ))}
                </ul>
                <p><strong>Objectifs :</strong></p>
                <ul>
                    {team === 'attaquants' ? (
                        <>
                            <li>Repérer des failles dans le site ou le serveur.</li>
                            <li>Utiliser ces failles pour marquer des points.</li>
                            <li>Essayer d’obtenir un accès total (admin).</li>
                        </>
                    ) : (
                        <>
                            <li>Repérer les attaques des hackers.</li>
                            <li>Réparer les failles pour protéger le système.</li>
                            <li>Bloquer les attaquants pour marquer des points.</li>
                        </>
                    )}
                </ul>
                <p><strong>Astuce :</strong> Certaines actions sont des fausses pistes ! Lis bien les descriptions pour ne pas perdre de temps.</p>
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
                                        <div><AlertTriangle className="icon" size={18} /> Exploiter les failles</div>
                                        <div><Target className="icon" size={18} /> Accéder au contrôle</div>
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
                            <p className="lead">TechCorp crée des solutions technologiques pour un monde connecté.</p>
                            <div className="hero">
                                <div className="hero-placeholder">
                                    <Globe size={50} />
                                    <span>Solutions sécurisées</span>
                                </div>
                                <p>Explorez nos produits et découvrez comment nous protégeons vos données.</p>
                            </div>
                        </div>
                    )}
                    {currentPage === 'produits' && (
                        <div>
                            <h3 className="interface-title">Nos produits</h3>
                            <div className="product-grid">
                                <div className="product-card">
                                    <div className="product-placeholder"><Server size={40} /></div>
                                    <h6>CloudSync</h6>
                                    <p>Partagez vos données en toute sécurité.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Shield size={40} /></div>
                                    <h6>AIShield</h6>
                                    <p>Protection contre les cyberattaques.</p>
                                </div>
                                <div className="product-card">
                                    <div className="product-placeholder"><Lock size={40} /></div>
                                    <h6>DataVault</h6>
                                    <p>Stockage ultra-sécurisé.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentPage === 'à-propos' && (
                        <div>
                            <h3 className="interface-title">À propos de TechCorp</h3>
                            <p>Depuis 2010, TechCorp protège les entreprises avec des solutions innovantes.</p>
                            <p>Notre mission : un internet sûr pour tous.</p>
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
                                    onClick={() => handleAction(selectedTeam, `Tentative XSS avec : ${formData.comment.substring(0, 20)}...`, formData.comment.includes('<script>') ? 10 : 0)}
                                    className="button défenseurs"
                                >
                                    Envoyer
                                </button>
                                <button
                                    onClick={() => handleAction(selectedTeam, `Test newsletter avec : ${formData.newsletter}`, 0)}
                                    className="button défenseurs"
                                >
                                    S’inscrire
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="actions">
                    <h3 className="panel-title">{selectedTeam === 'attaquants' ? 'Outils d’attaque' : 'Outils de défense'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    const isFake = action.name.includes('Faux') || action.name.includes('Inutilisé');
                                    handleAction(selectedTeam, `${action.name} exécuté${isFake ? ' (aucun effet)' : ''}`, isFake ? 0 : 10);
                                }}
                                className={`button ${selectedTeam}`}
                                title={action.desc}
                            >
                                {action.name}
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
                    output = 'Commandes : ls, ps, netstat, cat, nmap, ssh, whoami';
                    break;
                case 'ls':
                    output = 'config.txt  logs/  passwords.bak  run.sh  decoy.txt';
                    break;
                case 'ps':
                    output = 'PID\tCOMMAND\n1234\tapache2\n5678\tsshd\n4567\tmysql\n9999\tfake_service';
                    break;
                case 'netstat':
                    output = 'TCP\t0.0.0.0:22\tLISTEN\nTCP\t0.0.0.0:80\tLISTEN\nTCP\t0.0.0.0:8080\tCLOSED';
                    break;
                case 'cat':
                    if (cmdParts[1] === 'passwords.bak') {
                        output = 'admin:MotDePasseSecret123';
                    } else if (cmdParts[1] === 'decoy.txt') {
                        output = 'Ce fichier est un leurre, rien d’utile ici.';
                    } else {
                        output = 'Erreur : fichier non trouvé.';
                    }
                    break;
                case 'nmap':
                    output = 'Scan... Ports : 22 (SSH), 80 (HTTP), 8080 (Inactif)';
                    break;
                case 'ssh':
                    output = 'Connexion SSH en cours...';
                    break;
                case 'whoami':
                    output = 'admin';
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
                <div className="status-grid">
                    <div className="status-card">
                        <h3 className="status-title">Services</h3>
                        <div className="status-content">SSH, HTTP, FTP, MySQL, FakeDB (inactif)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Failles</h3>
                        <div className="status-content">SSH (mot de passe faible)</div>
                    </div>
                    <div className="status-card">
                        <h3 className="status-title">Alertes</h3>
                        <div className="status-content">Aucune</div>
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
                <div className="actions">
                    <h3 className="panel-title">{selectedTeam === 'attaquants' ? 'Actions d’attaque' : 'Actions de défense'}</h3>
                    <div className="action-grid">
                        {role.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    const isFake = action.name.includes('Faux') || action.name.includes('Inutilisé');
                                    handleAction(selectedTeam, `${action.name} exécuté${isFake ? ' (aucun effet)' : ''}`, isFake ? 0 : 15);
                                }}
                                className="button ${selectedTeam}"
                                title="${action.desc}"
                            >
                                {action.name}
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
                    <h1 className="title">Fin de Partie</h1>
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