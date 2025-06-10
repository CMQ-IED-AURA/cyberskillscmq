import { useState, useEffect } from 'react';

// Données des failles et défenses avec explications pédagogiques
const vulnerabilities = [
    { id: 1, name: "Injection SQL", points: 100, description: "Une attaque qui insère du code SQL malveillant dans une requête pour manipuler la base de données." },
    { id: 2, name: "XSS (Cross-Site Scripting)", points: 80, description: "Injection de scripts malveillants dans une page web pour voler des données ou exécuter des actions." },
    { id: 3, name: "Brute Force", points: 60, description: "Tentative répétée de deviner un mot de passe pour accéder à un système." },
    { id: 4, name: "CSRF", points: 90, description: "Attaque forçant un utilisateur à exécuter des actions non désirées sur un site où il est authentifié." },
    { id: 5, name: "File Inclusion", points: 120, description: "Exploitation permettant d'inclure des fichiers non autorisés sur le serveur." }
];

const defenses = [
    { id: 1, name: "Pare-feu (WAF)", blocks: [1, 2], description: "Filtre les requêtes malveillantes pour protéger contre les injections SQL et XSS." },
    { id: 2, name: "Sanitisation des entrées", blocks: [1, 2, 4], description: "Nettoie les données utilisateur pour empêcher l'injection de code malveillant." },
    { id: 3, name: "Limitation de tentatives", blocks: [3], description: "Bloque les tentatives répétées de connexion pour contrer le brute force." },
    { id: 4, name: "Jeton CSRF", blocks: [4], description: "Ajoute un jeton unique pour valider les requêtes et empêcher les attaques CSRF." },
    { id: 5, name: "Restriction des fichiers", blocks: [5], description: "Limite l'accès aux fichiers pour empêcher l'inclusion non autorisée." }
];

const AttackSimulator = () => {
    const [gameState, setGameState] = useState({
        turn: 1,
        maxTurns: 7,
        timeLeft: 120, // 2 minutes par tour
        attackersScore: 0,
        defendersScore: 0,
        attackerActions: [],
        defenderActions: [],
        gameOver: false
    });

    // Timer pour chaque tour
    useEffect(() => {
        if (gameState.timeLeft <= 0 && gameState.turn < gameState.maxTurns) {
            endTurn();
        } else if (gameState.timeLeft <= 0 && gameState.turn === gameState.maxTurns) {
            setGameState({ ...gameState, gameOver: true });
        } else {
            const timer = setInterval(() => {
                setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState.timeLeft]);

    // Fin du tour : calcul des scores
    const endTurn = () => {
        let newAttackersScore = gameState.attackersScore;
        let newDefendersScore = gameState.defendersScore;

        gameState.attackerActions.forEach(action => {
            const vuln = vulnerabilities.find(v => v.id === action);
            const isBlocked = gameState.defenderActions.some(d =>
                defenses.find(def => def.id === d).blocks.includes(action)
            );
            if (!isBlocked) {
                newAttackersScore += vuln.points;
            } else {
                newDefendersScore += vuln.points;
            }
        });

        setGameState({
            ...gameState,
            turn: gameState.turn + 1,
            timeLeft: 120,
            attackersScore: newAttackersScore,
            defendersScore: newDefendersScore,
            attackerActions: [],
            defenderActions: []
        });
    };

    // Sélection d'une action par l'équipe
    const selectAction = (team, actionId) => {
        if (gameState.timeLeft <= 0 || gameState.gameOver) return;
        if (team === 'attackers') {
            setGameState({
                ...gameState,
                attackerActions: [...gameState.attackerActions, actionId]
            });
        } else {
            setGameState({
                ...gameState,
                defenderActions: [...gameState.defenderActions, actionId]
            });
        }
    };

    // Affichage du gagnant
    const getWinner = () => {
        if (gameState.attackersScore > gameState.defendersScore) return "Les attaquants gagnent !";
        if (gameState.defendersScore > gameState.attackersScore) return "Les défenseurs gagnent !";
        return "Égalité !";
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl text-center text-cyan-400 mb-4">Cyber Escape : Attaque vs Défense</h1>
            <div className="flex justify-between mb-4">
                <div className="text-lg">Tour : {gameState.turn}/{gameState.maxTurns}</div>
                <div className="text-lg">Temps restant : {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}</div>
                <div className="text-lg">Score Attaquants : {gameState.attackersScore}</div>
                <div className="text-lg">Score Défenseurs : {gameState.defendersScore}</div>
            </div>

            {gameState.gameOver ? (
                <div className="text-center text-2xl text-yellow-400">{getWinner()}</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Équipe attaquants */}
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                        <h2 className="text-2xl text-red-400 mb-2">Équipe Attaquants</h2>
                        <p className="mb-2">Choisissez une faille à exploiter :</p>
                        {vulnerabilities.map(vuln => (
                            <div key={vuln.id} className="mb-2">
                                <button
                                    onClick={() => selectAction('attackers', vuln.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-2"
                                    disabled={gameState.attackerActions.includes(vuln.id)}
                                >
                                    {vuln.name} ({vuln.points} pts)
                                </button>
                                <span className="text-sm text-gray-400">{vuln.description}</span>
                            </div>
                        ))}
                    </div>

                    {/* Équipe défenseurs */}
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                        <h2 className="text-2xl text-blue-400 mb-2">Équipe Défenseurs</h2>
                        <p className="mb-2">Choisissez une défense à appliquer :</p>
                        {defenses.map(def => (
                            <div key={def.id} className="mb-2">
                                <button
                                    onClick={() => selectAction('defenders', def.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"
                                    disabled={gameState.defenderActions.includes(def.id)}
                                >
                                    {def.name}
                                </button>
                                <span className="text-sm text-gray-400">{def.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttackSimulator;