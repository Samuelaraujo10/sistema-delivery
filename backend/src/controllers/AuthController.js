const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, Establishment } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      if (!phone || phone.trim() === '') {
        return res.status(400).json({ success: false, message: 'O número de WhatsApp é obrigatório para contato' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = await User.create({ name, email, password, phone, verificationToken });

      // Envia o e-mail de verificação
      await sendVerificationEmail(user.email, user.name, verificationToken);

      return res.status(201).json({
        success: true,
        message: 'Cadastro realizado com sucesso! Verifique sua caixa de entrada para ativar a conta.',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email, active: true },
        include: [{ model: Establishment, as: 'establishment', attributes: ['id', 'name', 'slug'] }]
      });
      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
      }

      // Bloqueia login se não tiver verificado o e-mail (para usuários novos que têm verificationToken preenchido)
      if (user.isEmailVerified === false && user.verificationToken !== null) {
        return res.status(403).json({ success: false, message: 'Sua conta ainda não foi ativada. Por favor, verifique sua caixa de e-mail.' });
      }

      const token = jwt.sign({ id: user.id, role: user.role, establishmentId: user.establishmentId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        data: { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, establishmentId: user.establishmentId, address: user.address, establishment: user.establishment } },
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{ model: Establishment, as: 'establishment', attributes: ['id', 'name', 'slug'] }]
      });
      return res.json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, email, phone, address, password } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      // Valida se o email já está em uso por outro usuário
      if (email && email !== user.email) {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'E-mail já cadastrado por outro usuário' });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (phone) {
        if (phone.trim() === '') {
          return res.status(400).json({ success: false, message: 'O número de WhatsApp não pode estar vazio' });
        }
        user.phone = phone;
      }
      if (address !== undefined) user.address = address;

      if (password && password.trim() !== '') {
        if (password.length < 6) {
          return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres' });
        }
        user.password = password; // O hashing seguro é feito no hook beforeUpdate/beforeCreate de User.js
      }

      await user.save();

      const updatedUser = await User.findByPk(req.user.id, {
        include: [{ model: Establishment, as: 'establishment', attributes: ['id', 'name', 'slug'] }]
      });

      return res.json({
        success: true,
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          establishmentId: updatedUser.establishmentId,
          address: updatedUser.address,
          establishment: updatedUser.establishment
        }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Link de verificação inválido.' });
      }

      const user = await User.findOne({ where: { verificationToken: token } });
      if (!user) {
        return res.status(400).json({ success: false, message: 'Token de ativação inválido ou já utilizado.' });
      }

      user.isEmailVerified = true;
      user.verificationToken = null;
      await user.save();

      return res.json({ success: true, message: 'Conta ativada com sucesso! Você já pode fazer login.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async googleLogin(req, res) {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ success: false, message: 'Google Token ausente' });
      }

      // 1. Validar o token direto no Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      if (!email) {
        return res.status(400).json({ success: false, message: 'E-mail não fornecido pelo Google' });
      }

      // 2. Buscar usuário existente
      let user = await User.findOne({
        where: { email },
        include: [{ model: Establishment, as: 'establishment', attributes: ['id', 'name', 'slug'] }]
      });

      if (!user) {
        // 3. Cadastrar usuário novo via Google
        const randomPassword = crypto.randomBytes(16).toString('hex');
        user = await User.create({
          name,
          email,
          password: randomPassword, // Senha forte e desconhecida, ele usará sempre o botão do Google
          avatar: picture,
          isEmailVerified: true, // O e-mail do Google já é verificado
          verificationToken: null,
          phone: '',
        });
      } else {
        // 4. Se ele já tinha conta mas não tinha verificado o e-mail, ativamos agora pois o Google provou ser dono
        if (user.isEmailVerified === false) {
          user.isEmailVerified = true;
          user.verificationToken = null;
          await user.save();
        }
      }

      if (user.active === false) {
         return res.status(401).json({ success: false, message: 'Esta conta foi desativada' });
      }

      // 5. Gerar nosso token JWT para manter a sessão
      const token = jwt.sign({ id: user.id, role: user.role, establishmentId: user.establishmentId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            establishmentId: user.establishmentId,
            address: user.address,
            establishment: user.establishment || null
          }
        },
      });
    } catch (error) {
      console.error('Erro no Login via Google:', error);
      return res.status(400).json({ success: false, message: 'Falha na autenticação com o Google' });
    }
  }
}

module.exports = new AuthController();
