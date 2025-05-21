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
  const { email, password, username } = req.body;

  try {
    // Vérifier si email existe
    const existingUserEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserEmail) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }

    // Vérifier si username existe
    const existingUserName = await prisma.user.findUnique({ where: { username } });
    if (existingUserName) {
      return res.status(400).json({ success: false, message: "Nom d'utilisateur déjà utilisé" });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route Connexion
// @ts-ignore
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // Vérifier mot de passe
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // Générer JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      user: { id: user.id, email: user.email, username: user.username },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erreur serveur lors de la connexion' });
  }
});

export default router;
