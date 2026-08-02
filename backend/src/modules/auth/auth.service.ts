import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import prisma from '../../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_testing';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const getTransporter = async () => {
  // Using ethereal mock for simple testing
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const authService = {
  async register(data: any, host: string, protocol: string) {
    const { name, email, password, role } = data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = uuidv4();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        verification_token: verificationToken,
      },
    });

    const transporter = await getTransporter();
    const verifyUrl = `${protocol}://${host}/api/auth/verify-email/${verificationToken}`;
    
    const info = await transporter.sendMail({
      from: '"SFA System" <no-reply@sfa.com>',
      to: email,
      subject: 'Please Verify Your Email',
      text: `Welcome ${name}! Please verify your email by clicking the following link: ${verifyUrl}`,
      html: `<p>Welcome ${name}!</p><p>Please verify your email by clicking the following link: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return {
      userId: newUser.id,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  },

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verification_token: token },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_token: null,
      },
    });
    
    return true;
  },

  async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return { user, token };
  }
};
