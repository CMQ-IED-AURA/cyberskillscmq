import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Sword, Timer, Target, Server, Globe, Terminal, Lock, Unlock, Zap, AlertTriangle, CheckCircle, HelpCircle, Eye, EyeOff } from 'lucide-react';

// IMPORTANT : Importer le nouveau fichier CSS
import './CyberWarGame.css';

const CyberWarGame = () => {
    // --- ÉTAT DU JEU (State) ---
    const [gameState, setGameState] = useState('lobby'); // lobby, intro, game, results
    const [currentPhase, setCurrentPhase] = useState('website'); // website, server
    const [timeLeft, setTimeLeft] = useState(420);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [scores, setScores] = useState({ attackers: 0, defenders: 0 });
    const [gameLog, setGameLog] = useState([]);
    const terminalInputRef = useRef(null);

    // --- LOGIQUE DE JEU AMÉLIORÉE ---

    // États détaillés des cibles
    const initialWebsiteState = {
        xss: { name: 'Faille XSS (Contact)', discovered: false, exploited: false, patched: false },
        sqli: { name: 'Injection SQL (Login)', discovered: false, exploited: false, patched: false },
        csrf: { name: 'Faille CSRF (Admin)', discovered: false, exploited: false, patched: false }
    };

    const initialServerState = {
        ssh: { name: 'Accès SSH (mot de passe faible)', discovered: false, exploited: false, patched: false },
        ftp: { name: 'FTP Anonyme (données sensibles)', discovered: false, exploited: false, patched: false },
        rootkit: { name: 'Installation Rootkit', discovered: false, exploited: false, patched: false }
    };

    const [websiteState, setWebsiteState] = useState(initialWebsiteState);
    const [serverState, setServerState] = useState(initialServerState);

    // Rôles avec des capacités SPÉCIFIQUES
    const roles = {
        attackers: [
            { id: 'web-hacker', name: 'Web Hacker', icon: '🕷️', abilities: ['discover_xss', 'exploit_xss', 'discover_sqli', 'exploit_sqli'] },
            { id: 'network-scanner', name: 'Network Scanner', icon: '📡', abilities: ['discover_ftp', 'discover_ssh'] },
            { id: 'exploit-dev', name: 'Exploit Developer', icon: '⚡', abilities: ['exploit_ssh', 'exploit_ftp', 'install_rootkit'] }
        ],
        defenders: [
            { id: 'security-analyst', name: 'Security Analyst', icon: '🛡️', abilities: ['patch_xss', 'patch_sqli', 'monitor_logs'] },
            { id: 'network-admin', name: 'Network Admin', icon: '🌐', abilities: ['patch_ftp', 'harden_ssh'] },
            { id: 'incident-responder', name: 'Incident Responder', icon: '🚨', abilities: ['remove_rootkit', 'block_ip'] }
        ]
    };

    const abilities = {
        // Attaques Web
        discover_xss: { name: 'Scanner XSS', phase: 'website', target: 'xss', type: 'discover', points: 10 },
        exploit_xss: { name: 'Exploiter XSS', phase: 'website', target: 'xss', type: 'exploit', points: 25 },
        discover_sqli: { name: 'Scanner SQLi', phase: 'website', target: 'sqli', type: 'discover', points: 15 },
        exploit_sqli: { name: 'Exploiter SQLi', phase: 'website', target: 'sqli', type: 'exploit', points: 40 },
        // Attaques Serveur
        discover_ftp: { name: 'Scanner FTP', phase: 'server', target: 'ftp', type: 'discover', points: 10 },
        exploit_ftp: { name: 'Exfiltrer via FTP', phase: 'server', target: 'ftp', type: 'exploit', points: 30 },
        discover_ssh: { name: 'Scanner SSH', phase: 'server', target: 'ssh', type: 'discover', points: 10 },
        exploit_ssh: { name: 'Bruteforce SSH', phase: 'server', target: 'ssh', type: 'exploit', points: 50 },
        install_rootkit: { name: 'Installer Rootkit', phase: 'server', target: 'rootkit', type: 'exploit', points: 100 },
        // Défenses
        patch_xss: { name: 'Patch XSS', phase: 'website', target: 'xss', type: 'patch', points: 20 },
        patch_sqli: { name: 'Paramétrer requêtes', phase: 'website', target: 'sqli', type: 'patch', points: 30 },
        monitor_logs: { name: 'Analyser les logs', phase: 'all', type: 'info', points: 5 },
        patch_ftp: { name: 'Désactiver FTP anonyme', phase: 'server', target: 'ftp', type: 'patch', points: 20 },
        harden_ssh: { name: 'Renforcer SSH', phase: 'server', target: 'ssh', type: 'patch', points: 40 },
        remove_rootkit: { name: 'Supprimer Rootkit', phase: 'server', target: 'rootkit', type: 'patch', points: 80 },
        block_ip: { name: 'Bloquer IP suspecte', phase: 'all', type: 'info', points: 15 }
    };

    const addLog = (message, type = 'info') => {
        const icon = selectedTeam === 'attackers' ? '⚔️' : '🛡️';
        const color = type === 'attack' ? 'text-red-400' : type === 'defense' ? 'text-blue-400' : 'text-green-400';
        setGameLog(prev => [...prev.slice(-9), { text: `[${new Date().toLocaleTimeString()}] ${icon} ${message}`, color }]);
    };

    // NOUVELLE FONCTION D'ACTION PRINCIPALE
    const handleGameAction = (abilityId) => {
        const ability = abilities[abilityId];
        const team = selectedTeam;

        if (ability.phase !== 'all' && ability.phase !== currentPhase) {
            addLog(`Action impossible dans la phase actuelle.`, 'error');
            return;
        }

        const isWebsite = ability.phase === 'website';
        const stateToUpdate = isWebsite ? websiteState : serverState;
        const setState = isWebsite ? setWebsiteState : setServerState;
        const target = stateToUpdate[ability.target];

        if (!target && ability.type !== 'info') {
            addLog(`Cible invalide: ${ability.target}`, 'error');
            return;
        }

        let success = false;
        if(ability.type === 'discover'){
            if(!target.discovered){
                target.discovered = true;
                success = true;
                addLog(`Vulnérabilité "${target.name}" découverte !`, 'attack');
            } else { addLog(`"${target.name}" était déjà connue.`); }
        } else if(ability.type === 'exploit'){
            if(target.discovered && !target.exploited && !target.patched){
                target.exploited = true;
                success = true;
                addLog(`ATTAQUE REUSSIE sur "${target.name}" !`, 'attack');
            } else if(target.patched){ addLog(`Attaque bloquée: "${target.name}" est patchée.`, 'defense'); }
            else { addLog(`Il faut d'abord découvrir la faille.`); }
        } else if(ability.type === 'patch'){
            if(target.discovered && !target.patched){
                target.patched = true;
                success = true;
                addLog(`DEFENSE REUSSIE: "${target.name}" est maintenant protégée.`, 'defense');
            } else if(target.patched){ addLog(`"${target.name}" est déjà patchée.`); }
            else { addLog(`On ne peut pas patcher une faille non découverte.`); }
        } else if(ability.type === 'info') {
            success = true;
            addLog(ability.name, 'info');
        }

        if(success){
            const points = ability.points;
            setScores(prev => ({...prev, [team]: prev[team] + points }));
            setState({...stateToUpdate, [ability.target]: target});
        }
    };

    const handleRestartGame = () => {
        setGameState('lobby');
        setWebsiteState(initialWebsiteState);
        setServerState(initialServerState);
        // ... réinitialiser les autres états
        setCurrentPhase('website');
        setTimeLeft(420);
        setSelectedTeam(null);
        setSelectedRole(null);
        setScores({ attackers: 0, defenders: 0 });
        setGameLog([]);
    };

    // --- COMPOSANTS UI (avec nouvelles classes CSS) ---

    // Le Lobby et l'Intro restent similaires mais pourraient bénéficier des polices du nouveau CSS.

    const GameInterface = () => {
        const [activeTab, setActiveTab] = useState(currentPhase);
        const roleData = roles[selectedTeam]?.find(r => r.id === selectedRole);

        // Timer
        useEffect(() => {
            if (gameState === 'game' && timeLeft > 0) {
                const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
                return () => clearTimeout(timer);
            } else if (timeLeft === 0) {
                if (currentPhase === 'website') {
                    setCurrentPhase('server');
                    setActiveTab('server');
                    setTimeLeft(420);
                    addLog("FIN PHASE 1. Accès au serveur imminent...", 'system');
                } else {
                    setGameState('results');
                }
            }
        }, [timeLeft, gameState]);

        const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

        const renderAbilities = () => {
            if (!roleData) return null;
            return roleData.abilities.map(abilityId => {
                const ability = abilities[abilityId];
                if (ability.phase !== 'all' && ability.phase !== currentPhase) return null;

                const isAttack = selectedTeam === 'attackers';
                const target = (isAttack ? (ability.phase === 'website' ? websiteState : serverState) : (ability.phase === 'website' ? websiteState : serverState))[ability.target];
                let disabled = false;
                if(target) {
                    if(ability.type === 'exploit' && (target.patched || !target.discovered)) disabled = true;
                    if(ability.type === 'patch' && (target.patched || !target.discovered)) disabled = true;
                }

                return (
                    <button key={abilityId}
                            onClick={() => handleGameAction(abilityId)}
                            disabled={disabled}
                            className={`action-btn ${isAttack ? 'attack-btn' : 'defend-btn'} p-3 rounded-lg text-left w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}>
                        <p className="font-bold">{ability.name}</p>
                        <p className="text-xs opacity-80">Phase: {ability.phase} | Points: {ability.points}</p>
                    </button>
                )
            });
        };

        return (
            <div className="cyber-game-container min-h-screen bg-black text-white flex flex-col">
                {/* ... Header ... (adapté avec les nouvelles classes) */}
                <main className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-96 bg-panel border-r-2 border-border-color p-4 flex flex-col gap-4">
                        <div className="text-center p-4 bg-black/30 rounded-lg">
                            <div className="text-5xl mb-2">{roleData?.icon}</div>
                            <div className="font-bold text-xl neon-text-cyan">{roleData?.name}</div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-lg font-bold mb-3 text-cyan-400">⚡ CAPACITÉS</h3>
                            <div className="space-y-2 overflow-y-auto pr-2">
                                {renderAbilities()}
                            </div>
                        </div>
                        <div className="h-48 flex flex-col">
                            <h3 className="text-lg font-bold mb-3 text-cyan-400">📋 LOG D'ACTIVITÉ</h3>
                            <div className="bg-black/50 rounded p-2 flex-1 overflow-y-auto text-xs">
                                {gameLog.map((log, i) => <div key={i} className={`mb-1 ${log.color}`}>{log.text}</div>)}
                            </div>
                        </div>
                    </aside>

                    {/* Zone de jeu */}
                    <div className="flex-1 p-6 flex flex-col">
                        {currentPhase === 'website' ? <WebsiteInterface /> : <ServerInterface />}
                    </div>
                </main>
            </div>
        );
    };

    const renderVulnerability = (vuln) => (
        <div key={vuln.name} className="bg-black/40 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
            <span className="font-bold">{vuln.name}</span>
            <div className="flex items-center gap-4 text-xl">
                {vuln.discovered ? <Eye className="text-yellow-400" title="Découverte"/> : <EyeOff className="text-gray-500" title="Non découverte"/>}
                {vuln.exploited ? <Zap className="vuln-status-icon exploited" title="Exploitée"/> : <HelpCircle className="text-gray-500" title="Non exploitée"/>}
                {vuln.patched ? <Shield className="vuln-status-icon patched" title="Patchée"/> : <HelpCircle className="text-gray-500" title="Non patchée"/>}
            </div>
        </div>
    );

    const WebsiteInterface = () => (
        <div className="bg-panel rounded-lg p-6 h-full flex flex-col border border-border-color">
            <h2 className="text-3xl font-bold neon-text-red mb-6">🌐 CIBLE : SITE WEB</h2>
            <div className="space-y-4">
                {Object.values(websiteState).map(renderVulnerability)}
            </div>
        </div>
    );

    const ServerInterface = () => (
        <div className="bg-panel rounded-lg p-6 h-full flex flex-col border border-border-color">
            <h2 className="text-3xl font-bold neon-text-red mb-6">🖥️ CIBLE : SERVEUR</h2>
            <div className="space-y-4">
                {Object.values(serverState).map(renderVulnerability)}
            </div>
        </div>
    );

    // Le composant ResultsScreen reste fonctionnel
    const ResultsScreen = () => { /* ... (code du ResultsScreen précédent) ... */ };

    // --- SÉLECTEUR D'AFFICHAGE ---
    if (gameState === 'lobby') return <LobbyScreen />; // Placeholder, à styliser si besoin
    if (gameState === 'intro') return <IntroAnimation />; // Placeholder
    if (gameState === 'game') return <GameInterface />;
    if (gameState === 'results') return <ResultsScreen />; // Placeholder

    // Mettre ici les vrais composants Lobby et Intro
    return <GameInterface />; // Fallback pour le développement
};

export default CyberWarGame;