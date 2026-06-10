const jwt = require('jsonwebtoken');
const { User, Establishment } = require('../models');

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

      const user = await User.create({ name, email, password, phone });
      const token = jwt.sign({ id: user.id, role: user.role, establishmentId: user.establishmentId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        data: { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, establishmentId: user.establishmentId, address: user.address } },
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
}

module.exports = new AuthController();
