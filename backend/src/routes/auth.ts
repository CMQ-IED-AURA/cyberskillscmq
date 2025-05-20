import { Router, Request, Response } from 'express';

const router = Router();

// @ts-ignore
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === 'test@example.com' && password === 'password') {
    return res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      token: 'secret',
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Identifiants invalides',
    });
  }
});

// @ts-ignore
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  return res.status(201).json({
    success: true,
    message: 'Inscription réussie',
  });
});

export default router;
