import { Router } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

// Mock User DB
const users = [
  { id: '1', email: 'user@example.com', password: 'password123', name: 'Demo User' }
];

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

authRouter.post('/register', (req, res) => {
  // Registration logic would go here
  res.status(501).json({ message: 'Registration not implemented in demo' });
});