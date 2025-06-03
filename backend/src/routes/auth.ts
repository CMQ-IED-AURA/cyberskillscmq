import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Route Inscription
// @ts-ignore
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Vérifier si username existe
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Nom d'utilisateur déjà utilisé." });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer utilisateur
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    // Générer JWT
    const token = jwt.sign({ userId: newUser.id, role: newUser.role, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

    console.log('Utilisateur inscrit:', { userId: newUser.id, username: newUser.username });
    return res.status(201).json({
      success: false,
      message: 'Inscription réussie',
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
      token,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// Route Connexion
// @ts-ignore
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides.' });
    }

    // Vérifier mot de passe
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides.' });
    }

    // Générer JWT
    const token = jwt.sign({ userId: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    console.log('Utilisateur connecté:', { userId: user.id, username: user.username });
    return res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      user: { id: user.id, username: user.username, role: user.role },
      token,
    });
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion.' });
  }
});

export default router;