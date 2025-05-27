import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Interface pour typer req.user
interface AuthenticatedRequest extends Request {
    user?: { userId: string };
}

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware pour vérifier le token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Créer un match
router.post('/create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const redTeam = await prisma.team.create({ data: { name: 'Équipe Rouge' } });
        const blueTeam = await prisma.team.create({ data: { name: 'Équipe Bleue' } });

        const match = await prisma.match.create({
            data: {
                redTeamId: redTeam.id,
                blueTeamId: blueTeam.id,
            },
        });

        return res.status(201).json({
            success: true,
            matchId: match.id,
            redTeamId: redTeam.id,
            blueTeamId: blueTeam.id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du match' });
    }
});

// Liste des matchs
router.get('/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const matches = await prisma.match.findMany({
            include: {
                redTeam: true,
                blueTeam: true,
            },
        });
        return res.status(200).json({
            success: true,
            matches,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des matchs' });
    }
});

// Obtenir les membres des équipes d'un match
router.get('/:matchId/teams', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }
        return res.status(200).json({
            success: true,
            redTeam: match.redTeam,
            blueTeam: match.blueTeam,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes' });
    }
});

// Rejoindre une équipe
router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId, teamId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }



        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        if (user.teamId) {
            return res.status(400).json({ success: false, message: 'Vous êtes déjà dans une équipe' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId },
        });

        return res.status(200).json({ success: true, message: 'Équipe rejointe avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la jointure de l\'équipe' });
    }
});

// Quitter une équipe
router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        if (!user.teamId) {
            return res.status(400).json({ success: false, message: 'Vous n\'êtes pas dans une équipe' });
        }

        const match = await prisma.match.findFirst({
            where: {
                OR: [
                    { redTeamId: user.teamId },
                    { blueTeamId: user.teamId },
                ],
            },
        });


        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });

        return res.status(200).json({ success: true, message: 'Équipe quittée avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la sortie de l\'équipe' });
    }
});

// Supprimer un match
router.delete('/:matchId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { redTeam: true, blueTeam: true },
        });

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }


        await prisma.user.updateMany({
            where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
            data: { teamId: null },
        });

        await prisma.team.deleteMany({
            where: { id: { in: [match.redTeamId, match.blueTeamId] } },
        });

        await prisma.match.delete({
            where: { id: matchId },
        });

        return res.status(200).json({ success: true, message: 'Match supprimé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du match' });
    }
});

// Lancer un match
router.post('/:matchId/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }
        return res.status(200).json({ success: true, message: 'Match lancé avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors du lancement du match' });
    }
});

export default router;