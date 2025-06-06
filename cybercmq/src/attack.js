import React, { useState, useEffect } from 'react';
import { Terminal, Globe, Database, Shield, Eye, Zap, Search, Lock, Unlock, AlertTriangle, CheckCircle, Code, Server, Wifi } from 'lucide-react';

const AttackSimulator = () => {
    const [currentTarget, setCurrentTarget] = useState(null);
    const [gameState, setGameState] = useState('menu');
    const [discoveredInfo, setDiscoveredInfo] = useState([]);
    const [availableTools, setAvailableTools] = useState(['nmap', 'curl', 'nikto']);
    const [terminalHistory, setTerminalHistory] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [exploitedVulns, setExploitedVulns] = useState([]);
    const [systemAccess, setSystemAccess] = useState({ level: 0, privileges: [] });

    const generateRandomTarget = () => {
        const companies = ['TechCorp', 'SecureBank', 'DataFlow', 'CloudSys', 'NetLink'];
        const domains = ['corp.com', 'secure.net', 'systems.io', 'cloud.dev', 'network.local'];
        const ips = () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        const baseVulns = [
            { type: 'open_port', port: 22, service: 'SSH', version: 'OpenSSH 7.4', vuln: 'weak_auth' },
            { type: 'open_port', port: 80, service: 'HTTP', version: 'Apache 2.4.1', vuln: 'directory_traversal' },
            { type: 'open_port', port: 443, service: 'HTTPS', version: 'nginx 1.12', vuln: 'ssl_weak' },
            { type: 'open_port', port: 3306, service: 'MySQL', version: '5.7.20', vuln: 'sql_injection' },
            { type: 'web_vuln', location: '/admin', vuln: 'default_creds' },
            { type: 'web_vuln', location: '/upload', vuln: 'file_upload' },
            { type: 'web_vuln', location: '/search', vuln: 'xss' },
            { type: 'config_vuln', file: '.env', vuln: 'exposed_secrets' },
            { type: 'config_vuln', file: 'backup.zip', vuln: 'sensitive_backup' }
        ];

        // Mélanger et sélectionner aléatoirement les vulnérabilités
        const shuffled = [...baseVulns].sort(() => 0.5 - Math.random());
        const selectedVulns = shuffled.slice(0, Math.floor(Math.random() * 4) + 3);

        return {
            id: Date.now(),
            company: companies[Math.floor(Math.random() * companies.length)],
            domain: domains[Math.floor(Math.random() * domains.length)],
            ip: ips(),
            description: "Serveur web d'entreprise avec plusieurs services exposés",
            vulnerabilities: selectedVulns,
            hiddenInfo: {
                employees: ['admin', 'user', 'guest', 'service'],
                secrets: ['API_KEY=sk-abc123', 'DB_PASS=password123', 'JWT_SECRET=mysecret'],
                files: ['users.sql', 'config.php', 'admin_panel.zip']
            }
        };
    };

    const tools = {
        nmap: {
            name: 'Nmap',
            description: 'Scanner de ports et services',
            icon: <Search className="w-4 h-4" />,
            usage: 'nmap [options] <target>'
        },
        curl: {
            name: 'cURL',
            description: 'Client HTTP en ligne de commande',
            icon: <Globe className="w-4 h-4" />,
            usage: 'curl [options] <url>'
        },
        nikto: {
            name: 'Nikto',
            description: 'Scanner de vulnérabilités web',
            icon: <Shield className="w-4 h-4" />,
            usage: 'nikto -h <target>'
        },
        sqlmap: {
            name: 'SQLMap',
            description: 'Outil d\'injection SQL automatisé',
            icon: <Database className="w-4 h-4" />,
            usage: 'sqlmap -u <url> --batch'
        },
        hydra: {
            name: 'Hydra',
            description: 'Attaques par force brute',
            icon: <Zap className="w-4 h-4" />,
            usage: 'hydra -l <user> -P <wordlist> <target> <service>'
        },
        dirb: {
            name: 'DirB',
            description: 'Découverte de répertoires cachés',
            icon: <Eye className="w-4 h-4" />,
            usage: 'dirb <url> [wordlist]'
        }
    };

    const executeCommand = (cmd) => {
        const parts = cmd.trim().split(' ');
        const tool = parts[0];
        const args = parts.slice(1);

        let output = '';
        let newDiscoveries = [];
        let newTools = [];

        // Simulation des outils
        switch(tool) {
            case 'nmap':
                if (args.includes(currentTarget.ip) || args.includes(currentTarget.domain)) {
                    output = `Starting Nmap scan on ${currentTarget.ip}\n\n`;
                    const portVulns = currentTarget.vulnerabilities.filter(v => v.type === 'open_port');

                    portVulns.forEach(vuln => {
                        output += `${vuln.port}/tcp open  ${vuln.service.toLowerCase().padEnd(10)} ${vuln.version}\n`;
                        newDiscoveries.push({
                            type: 'port',
                            data: `Port ${vuln.port} ouvert - ${vuln.service} ${vuln.version}`,
                            vuln: vuln
                        });
                    });

                    output += `\nNmap done: 1 IP address scanned`;

                    // Débloquer de nouveaux outils selon les découvertes
                    if (portVulns.some(v => v.service === 'HTTP' || v.service === 'HTTPS')) {
                        newTools.push('nikto', 'dirb');
                    }
                    if (portVulns.some(v => v.service === 'MySQL')) {
                        newTools.push('sqlmap');
                    }
                    if (portVulns.some(v => v.service === 'SSH')) {
                        newTools.push('hydra');
                    }
                } else {
                    output = 'Erreur: Cible non spécifiée ou invalide';
                }
                break;

            case 'curl':
                const url = args.find(arg => arg.startsWith('http') || arg === currentTarget.domain);
                if (url) {
                    output = `HTTP/1.1 200 OK\nServer: Apache/2.4.1\nContent-Type: text/html\n\n`;
                    output += `<!DOCTYPE html>\n<html>\n<head><title>${currentTarget.company}</title></head>\n`;
                    output += `<body>\n<h1>Bienvenue sur ${currentTarget.company}</h1>\n`;

                    // Indices cachés dans le HTML
                    if (Math.random() > 0.5) {
                        output += `<!-- TODO: Supprimer /admin/backup.zip -->\n`;
                        newDiscoveries.push({
                            type: 'info',
                            data: 'Commentaire HTML révèle /admin/backup.zip'
                        });
                    }

                    output += `</body>\n</html>`;
                } else {
                    output = 'curl: erreur URL non spécifiée';
                }
                break;

            case 'nikto':
                const target = args.find(arg => arg.includes(currentTarget.domain) || arg.includes(currentTarget.ip));
                if (target) {
                    output = `- Nikto v2.1.6 - Scan web de ${target}\n`;
                    output += `+ Target IP: ${currentTarget.ip}\n+ Target Port: 80\n\n`;

                    const webVulns = currentTarget.vulnerabilities.filter(v => v.type === 'web_vuln');
                    webVulns.forEach(vuln => {
                        output += `+ ${vuln.location}: Vulnérabilité détectée - ${vuln.vuln}\n`;
                        newDiscoveries.push({
                            type: 'web_vuln',
                            data: `${vuln.location} - ${vuln.vuln}`,
                            vuln: vuln
                        });
                    });

                    output += `\n+ ${webVulns.length} item(s) trouvé(s) sur port 80`;
                } else {
                    output = 'Nikto: Cible non spécifiée';
                }
                break;

            case 'dirb':
                const webTarget = args[0];
                if (webTarget) {
                    output = `DIRB v2.22 - Web Content Scanner\n`;
                    output += `START_TIME: ${new Date().toLocaleTimeString()}\n`;
                    output += `URL_BASE: ${webTarget}\n\n`;

                    const directories = ['/admin', '/backup', '/config', '/upload', '/test'];
                    const foundDirs = directories.filter(() => Math.random() > 0.6);

                    foundDirs.forEach(dir => {
                        output += `+ ${webTarget}${dir} (CODE:200|SIZE:1234)\n`;
                        newDiscoveries.push({
                            type: 'directory',
                            data: `Répertoire trouvé: ${dir}`
                        });
                    });

                    output += `\n---- Scanning completed ----`;
                } else {
                    output = 'Dirb: URL requise';
                }
                break;

            case 'sqlmap':
                const sqlUrl = args.find(arg => arg.startsWith('http'));
                if (sqlUrl && currentTarget.vulnerabilities.some(v => v.vuln === 'sql_injection')) {
                    output = `sqlmap/1.4.7 - automatic SQL injection tool\n\n`;
                    output += `[INFO] testing connection to the target URL\n`;
                    output += `[INFO] testing if parameter is injectable\n`;
                    output += `[CRITICAL] parameter is vulnerable to SQL injection!\n`;
                    output += `[INFO] the back-end DBMS is MySQL\n`;
                    output += `[INFO] fetching database names\n`;
                    output += `available databases [3]:\n[*] information_schema\n[*] company_db\n[*] users\n`;

                    newDiscoveries.push({
                        type: 'exploit',
                        data: 'Injection SQL réussie - Accès base de données',
                        critical: true
                    });
                } else if (sqlUrl) {
                    output = `sqlmap/1.4.7 - automatic SQL injection tool\n\n`;
                    output += `[INFO] testing connection to the target URL\n`;
                    output += `[WARNING] parameter does not seem to be injectable\n`;
                } else {
                    output = 'SQLMap: URL requise avec -u';
                }
                break;

            case 'hydra':
                const service = args[args.length - 1];
                if (service === 'ssh' && currentTarget.vulnerabilities.some(v => v.vuln === 'weak_auth')) {
                    output = `Hydra v9.1 starting at ${new Date().toLocaleTimeString()}\n`;
                    output += `[22][ssh] host: ${currentTarget.ip}   login: admin   password: admin123\n`;
                    output += `1 of 1 target successfully completed, 1 valid password found\n`;

                    newDiscoveries.push({
                        type: 'exploit',
                        data: 'Authentification SSH cassée - admin:admin123',
                        critical: true
                    });
                } else {
                    output = `Hydra v9.1 starting at ${new Date().toLocaleTimeString()}\n`;
                    output += `[ERROR] No valid passwords found\n`;
                }
                break;

            case 'help':
                output = 'Outils disponibles:\n';
                availableTools.forEach(toolName => {
                    const tool = tools[toolName];
                    if (tool) {
                        output += `${toolName} - ${tool.description}\n  Usage: ${tool.usage}\n\n`;
                    }
                });
                break;

            default:
                output = `Commande non reconnue: ${tool}. Tapez 'help' pour voir les outils disponibles.`;
        }

        // Mettre à jour l'historique
        setTerminalHistory(prev => [...prev, { command: cmd, output }]);

        // Ajouter les découvertes
        if (newDiscoveries.length > 0) {
            setDiscoveredInfo(prev => [...prev, ...newDiscoveries]);
        }

        // Débloquer de nouveaux outils
        if (newTools.length > 0) {
            setAvailableTools(prev => [...new Set([...prev, ...newTools])]);
        }

        setCurrentCommand('');
    };

    const startNewMission = () => {
        const target = generateRandomTarget();
        setCurrentTarget(target);
        setGameState('hacking');
        setDiscoveredInfo([]);
        setAvailableTools(['nmap', 'curl']);
        setTerminalHistory([
            {
                command: 'mission-brief',
                output: `MISSION BRIEFING\n================\n\nCible: ${target.company}\nDomaine: ${target.domain}\nIP: ${target.ip}\n\nObjectif: Identifier et exploiter les vulnérabilités du système cible.\n\nCommencez par un scan de reconnaissance avec 'nmap ${target.ip}'\nTapez 'help' pour voir les outils disponibles.\n\n[READY] Terminal prêt pour l'attaque...`
            }
        ]);
        setExploitedVulns([]);
        setSystemAccess({ level: 0, privileges: [] });
    };

    if (gameState === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900 text-green-400 p-6 font-mono">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Terminal className="w-16 h-16 text-green-500 mr-4" />
                            <div>
                                <h1 className="text-4xl font-bold text-green-500">CYBERATTACK SIM</h1>
                                <p className="text-xl text-green-300">Ethical Hacking Training Platform</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black border-2 border-green-500 rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-green-400">[MISSION BRIEFING]</h2>
                        <div className="space-y-4 text-green-300">
                            <p>• Vous êtes un pentester engagé pour tester la sécurité de systèmes</p>
                            <p>• Chaque mission génère une cible aléatoire avec des vulnérabilités uniques</p>
                            <p>• Utilisez des outils réels de hacking pour découvrir et exploiter les failles</p>
                            <p>• Explorez, testez, découvrez - l'expérience est différente à chaque fois</p>
                        </div>

                        <div className="mt-6 p-4 bg-green-900/20 border border-green-500 rounded">
                            <h3 className="font-bold text-green-400 mb-2">[OUTILS DISPONIBLES]</h3>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                                {Object.entries(tools).map(([key, tool]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        {tool.icon}
                                        <span>{tool.name} - {tool.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={startNewMission}
                        className="w-full bg-green-600 hover:bg-green-700 text-black py-4 px-6 rounded-lg text-xl font-bold transition-colors flex items-center justify-center"
                    >
                        <Zap className="w-6 h-6 mr-2" />
                        INITIER NOUVELLE MISSION
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'hacking' && currentTarget) {
        return (
            <div className="min-h-screen bg-black text-green-400 p-4 font-mono">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="border-b border-green-500 pb-4 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-green-500">TARGET: {currentTarget.company}</h1>
                                <p className="text-green-300">{currentTarget.domain} ({currentTarget.ip})</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-green-300">Vulnérabilités: {exploitedVulns.length}/{currentTarget.vulnerabilities.length}</div>
                                <div className="text-sm text-green-300">Accès: Level {systemAccess.level}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Terminal */}
                        <div className="lg:col-span-3">
                            <div className="bg-gray-900 border-2 border-green-500 rounded-lg h-96 flex flex-col">
                                <div className="bg-green-500 text-black px-4 py-2 font-bold">
                                    TERMINAL - {currentTarget.ip}
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto">
                                    {terminalHistory.map((entry, idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="text-yellow-400">root@kali:~# {entry.command}</div>
                                            <pre className="text-green-300 text-sm whitespace-pre-wrap">{entry.output}</pre>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-green-500 p-4">
                                    <div className="flex">
                                        <span className="text-yellow-400 mr-2">root@kali:~#</span>
                                        <input
                                            type="text"
                                            value={currentCommand}
                                            onChange={(e) => setCurrentCommand(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    executeCommand(currentCommand);
                                                }
                                            }}
                                            className="flex-1 bg-transparent text-green-400 outline-none"
                                            placeholder="Tapez votre commande..."
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel d'informations */}
                        <div className="space-y-4">
                            {/* Outils disponibles */}
                            <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
                                <h3 className="text-green-500 font-bold mb-3">OUTILS</h3>
                                <div className="space-y-2">
                                    {availableTools.map(toolName => {
                                        const tool = tools[toolName];
                                        return tool ? (
                                            <div key={toolName} className="flex items-center space-x-2 text-sm">
                                                {tool.icon}
                                                <span className="text-green-300">{tool.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* Découvertes */}
                            {discoveredInfo.length > 0 && (
                                <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4">
                                    <h3 className="text-yellow-500 font-bold mb-3">DÉCOUVERTES</h3>
                                    <div className="space-y-2 text-sm">
                                        {discoveredInfo.map((info, idx) => (
                                            <div key={idx} className={`p-2 rounded ${
                                                info.critical ? 'bg-red-900/30 text-red-300' :
                                                    info.type === 'exploit' ? 'bg-yellow-900/30 text-yellow-300' :
                                                        'bg-green-900/30 text-green-300'
                                            }`}>
                                                {info.critical && <AlertTriangle className="w-4 h-4 inline mr-2" />}
                                                {info.data}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Commandes rapides */}
                            <div className="bg-gray-900 border border-blue-500 rounded-lg p-4">
                                <h3 className="text-blue-500 font-bold mb-3">COMMANDES</h3>
                                <div className="space-y-1 text-xs">
                                    <button
                                        onClick={() => executeCommand(`nmap ${currentTarget.ip}`)}
                                        className="block w-full text-left p-1 hover:bg-blue-900/30 rounded text-blue-300"
                                    >
                                        nmap {currentTarget.ip}
                                    </button>
                                    <button
                                        onClick={() => executeCommand(`curl http://${currentTarget.domain}`)}
                                        className="block w-full text-left p-1 hover:bg-blue-900/30 rounded text-blue-300"
                                    >
                                        curl http://{currentTarget.domain}
                                    </button>
                                    <button
                                        onClick={() => executeCommand(`nikto -h ${currentTarget.domain}`)}
                                        className="block w-full text-left p-1 hover:bg-blue-900/30 rounded text-blue-300"
                                    >
                                        nikto -h {currentTarget.domain}
                                    </button>
                                    <button
                                        onClick={() => executeCommand('help')}
                                        className="block w-full text-left p-1 hover:bg-blue-900/30 rounded text-blue-300"
                                    >
                                        help
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setGameState('menu')}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded mr-4"
                        >
                            ABORT MISSION
                        </button>
                        <button
                            onClick={startNewMission}
                            className="bg-green-600 hover:bg-green-700 text-black px-6 py-2 rounded"
                        >
                            NOUVELLE CIBLE
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AttackSimulator;