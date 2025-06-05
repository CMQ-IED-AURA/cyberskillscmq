import React, { useState, useEffect } from 'react';
import { Shield, Zap, Eye, Lock, Unlock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const AttackSimulator = () => {
    const [currentScenario, setCurrentScenario] = useState(null);
    const [gameState, setGameState] = useState('menu');
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [discoveries, setDiscoveries] = useState([]);
    const [selectedTechnique, setSelectedTechnique] = useState(null);

    const attackScenarios = [
        {
            id: 1,
            title: "Site E-commerce Vulnérable",
            description: "Vous devez tester la sécurité d'un site e-commerce. Trouvez les failles !",
            target: "boutique-enligne.com",
            vulnerabilities: [
                {
                    type: "SQL Injection",
                    location: "Barre de recherche",
                    payload: "' OR 1=1 --",
                    difficulty: "Facile",
                    points: 100,
                    hint: "Que se passe-t-il si on met des guillemets dans la recherche ?",
                    explanation: "L'injection SQL exploite des requêtes mal protégées pour accéder à la base de données."
                },
                {
                    type: "XSS Stocké",
                    location: "Commentaires produits",
                    payload: "<script>alert('XSS')</script>",
                    difficulty: "Moyen",
                    points: 200,
                    hint: "Les commentaires sont-ils filtrés correctement ?",
                    explanation: "Le XSS permet d'injecter du code JavaScript malveillant dans les pages web."
                },
                {
                    type: "Traversée de répertoire",
                    location: "URL de téléchargement",
                    payload: "../../../etc/passwd",
                    difficulty: "Difficile",
                    points: 300,
                    hint: "Peut-on accéder à des fichiers en dehors du répertoire prévu ?",
                    explanation: "Cette faille permet d'accéder à des fichiers système non autorisés."
                }
            ]
        },
        {
            id: 2,
            title: "Application Web Corporate",
            description: "Pentestez l'application interne d'une entreprise",
            target: "intranet.corp.local",
            vulnerabilities: [
                {
                    type: "Broken Authentication",
                    location: "Page de connexion",
                    payload: "admin/password123",
                    difficulty: "Facile",
                    points: 150,
                    hint: "Les mots de passe par défaut sont-ils changés ?",
                    explanation: "Les identifiants faibles ou par défaut sont une porte d'entrée commune."
                },
                {
                    type: "CSRF",
                    location: "Formulaire de virement",
                    payload: "Requête cross-origin",
                    difficulty: "Moyen",
                    points: 250,
                    hint: "Les actions sensibles sont-elles protégées contre les requêtes forgées ?",
                    explanation: "CSRF force un utilisateur à exécuter des actions non désirées."
                },
                {
                    type: "Désérialisation",
                    location: "Upload de fichier",
                    payload: "Objet sérialisé malveillant",
                    difficulty: "Difficile",
                    points: 400,
                    hint: "Que se passe-t-il si on upload un fichier de configuration modifié ?",
                    explanation: "La désérialisation non sécurisée peut permettre l'exécution de code arbitraire."
                }
            ]
        },
        {
            id: 3,
            title: "API REST Mobile",
            description: "Analysez la sécurité de l'API d'une application mobile",
            target: "api.mobileapp.com",
            vulnerabilities: [
                {
                    type: "API non sécurisée",
                    location: "Endpoint /users",
                    payload: "Énumération d'IDs",
                    difficulty: "Facile",
                    points: 120,
                    hint: "Peut-on accéder aux données d'autres utilisateurs en changeant l'ID ?",
                    explanation: "Les APIs doivent vérifier les autorisations pour chaque ressource."
                },
                {
                    type: "Rate Limiting absent",
                    location: "Login endpoint",
                    payload: "Attaque par force brute",
                    difficulty: "Moyen",
                    points: 180,
                    hint: "Combien de tentatives de connexion peut-on faire ?",
                    explanation: "Sans limitation de taux, les attaques par force brute deviennent possibles."
                },
                {
                    type: "JWT mal configuré",
                    location: "Token d'authentification",
                    payload: "Modification du payload",
                    difficulty: "Difficile",
                    points: 350,
                    hint: "Le token peut-il être modifié sans être détecté ?",
                    explanation: "Les JWT doivent être correctement signés et validés."
                }
            ]
        }
    ];

    const attackTechniques = [
        { name: "Injection SQL", icon: "💉", description: "Injecter du code SQL malveillant" },
        { name: "Cross-Site Scripting", icon: "🎭", description: "Injecter du JavaScript" },
        { name: "Brute Force", icon: "🔨", description: "Tester tous les mots de passe" },
        { name: "Social Engineering", icon: "🎪", description: "Manipuler les utilisateurs" },
        { name: "Fuzzing", icon: "🎲", description: "Envoyer des données aléatoires" },
        { name: "Reconnaissance", icon: "🔍", description: "Collecter des informations" }
    ];

    const startNewScenario = () => {
        const randomScenario = attackScenarios[Math.floor(Math.random() * attackScenarios.length)];
        setCurrentScenario(randomScenario);
        setGameState('playing');
        setScore(0);
        setAttempts(0);
        setDiscoveries([]);
        setSelectedTechnique(null);
    };

    const attemptAttack = (vulnerability, technique) => {
        setAttempts(prev => prev + 1);

        // Logique simplifiée : certaines techniques marchent mieux selon la vulnérabilité
        const compatibility = {
            "SQL Injection": ["Injection SQL", "Fuzzing"],
            "XSS Stocké": ["Cross-Site Scripting", "Fuzzing"],
            "Traversée de répertoire": ["Fuzzing", "Reconnaissance"],
            "Broken Authentication": ["Brute Force", "Social Engineering"],
            "CSRF": ["Cross-Site Scripting", "Social Engineering"],
            "Désérialisation": ["Fuzzing", "Reconnaissance"],
            "API non sécurisée": ["Reconnaissance", "Fuzzing"],
            "Rate Limiting absent": ["Brute Force", "Fuzzing"],
            "JWT mal configuré": ["Fuzzing", "Reconnaissance"]
        };

        const isSuccessful = compatibility[vulnerability.type]?.includes(technique) || Math.random() > 0.7;

        if (isSuccessful && !discoveries.find(d => d.type === vulnerability.type)) {
            setDiscoveries(prev => [...prev, vulnerability]);
            setScore(prev => prev + vulnerability.points);
            return true;
        }
        return false;
    };

    const resetGame = () => {
        setGameState('menu');
        setCurrentScenario(null);
        setScore(0);
        setAttempts(0);
        setDiscoveries([]);
    };

    if (gameState === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black text-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Zap className="w-12 h-12 text-red-500 mr-3" />
                            <h1 className="text-4xl font-bold">CyberAttack Simulator</h1>
                        </div>
                        <p className="text-xl text-gray-300">Mode Hacker - Apprenez les techniques d'attaque</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-red-400">🎯 Objectif</h2>
                        <p className="text-gray-300 mb-4">
                            Incarnez un hacker éthique et découvrez les failles de sécurité dans différents systèmes.
                            Chaque scénario vous présente un environnement unique avec ses propres vulnérabilités à exploiter.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-700 p-4 rounded">
                                <h3 className="font-bold text-yellow-400 mb-2">Comment jouer :</h3>
                                <ul className="text-sm space-y-1">
                                    <li>• Choisissez vos techniques d'attaque</li>
                                    <li>• Explorez les différentes parties du système</li>
                                    <li>• Trouvez et exploitez les vulnérabilités</li>
                                    <li>• Apprenez les explications techniques</li>
                                </ul>
                            </div>
                            <div className="bg-gray-700 p-4 rounded">
                                <h3 className="font-bold text-green-400 mb-2">Techniques disponibles :</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {attackTechniques.slice(0, 4).map((tech, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <span className="mr-2">{tech.icon}</span>
                                            <span>{tech.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={startNewScenario}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg text-xl font-bold transition-colors flex items-center justify-center"
                    >
                        <Zap className="w-6 h-6 mr-2" />
                        Commencer une Attaque
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'playing' && currentScenario) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black text-white p-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-2xl font-bold text-red-400">{currentScenario.title}</h1>
                            <div className="flex space-x-4">
                                <span className="bg-red-600 px-3 py-1 rounded">Score: {score}</span>
                                <span className="bg-gray-600 px-3 py-1 rounded">Tentatives: {attempts}</span>
                            </div>
                        </div>
                        <p className="text-gray-300">{currentScenario.description}</p>
                        <p className="text-yellow-400 font-mono">Cible: {currentScenario.target}</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Techniques d'attaque */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 rounded-lg p-4">
                                <h2 className="text-xl font-bold mb-4 text-yellow-400">🛠️ Techniques d'Attaque</h2>
                                <div className="space-y-2">
                                    {attackTechniques.map((technique, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedTechnique(technique.name)}
                                            className={`w-full p-3 rounded text-left transition-colors ${
                                                selectedTechnique === technique.name
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <span className="text-xl mr-3">{technique.icon}</span>
                                                <div>
                                                    <div className="font-bold">{technique.name}</div>
                                                    <div className="text-xs opacity-75">{technique.description}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Zone d'attaque */}
                        <div className="lg:col-span-2">
                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                                <h2 className="text-xl font-bold mb-4 text-green-400">🎯 Zones à Tester</h2>
                                <div className="grid gap-4">
                                    {currentScenario.vulnerabilities.map((vuln, idx) => {
                                        const discovered = discoveries.find(d => d.type === vuln.type);
                                        return (
                                            <div key={idx} className={`border-2 rounded-lg p-4 ${
                                                discovered ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-700'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold">{vuln.location}</h3>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            vuln.difficulty === 'Facile' ? 'bg-green-600' :
                                                                vuln.difficulty === 'Moyen' ? 'bg-yellow-600' : 'bg-red-600'
                                                        }`}>
                              {vuln.difficulty} - {vuln.points} pts
                            </span>
                                                    </div>
                                                    {discovered ? (
                                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                                    ) : (
                                                        <Lock className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>

                                                {!discovered && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-blue-300 mb-2">💡 {vuln.hint}</p>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedTechnique) {
                                                                    const success = attemptAttack(vuln, selectedTechnique);
                                                                    if (!success) {
                                                                        alert(`L'attaque ${selectedTechnique} n'a pas fonctionné sur ${vuln.location}. Essayez une autre technique !`);
                                                                    }
                                                                } else {
                                                                    alert('Sélectionnez d\'abord une technique d\'attaque !');
                                                                }
                                                            }}
                                                            disabled={!selectedTechnique}
                                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                                                        >
                                                            {selectedTechnique ? `Attaquer avec ${selectedTechnique}` : 'Choisir une technique'}
                                                        </button>
                                                    </div>
                                                )}

                                                {discovered && (
                                                    <div className="bg-green-900/30 p-3 rounded mt-3">
                                                        <h4 className="font-bold text-green-400 mb-1">✅ {vuln.type} Découvert !</h4>
                                                        <p className="text-sm text-gray-300">{vuln.explanation}</p>
                                                        <p className="text-xs text-yellow-300 mt-1 font-mono">Payload: {vuln.payload}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Résultats */}
                            {discoveries.length > 0 && (
                                <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-green-400 mb-2">🏆 Vulnérabilités Découvertes</h3>
                                    <div className="space-y-2">
                                        {discoveries.map((disco, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-green-900/30 p-2 rounded">
                                                <span>{disco.type} - {disco.location}</span>
                                                <span className="text-yellow-400">+{disco.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                    {discoveries.length === currentScenario.vulnerabilities.length && (
                                        <div className="mt-4 text-center">
                                            <p className="text-xl font-bold text-green-400 mb-2">🎉 Scenario Completé !</p>
                                            <p className="text-gray-300">Score final: {score} points en {attempts} tentatives</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={resetGame}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded mr-4"
                        >
                            Retour au Menu
                        </button>
                        <button
                            onClick={startNewScenario}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
                        >
                            Nouveau Scénario
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AttackSimulator;