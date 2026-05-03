import { Router } from 'express';
import { register, login, logout, changePassword } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.put('/change-password', changePassword);
