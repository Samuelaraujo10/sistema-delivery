const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });
      }

      const user = await User.create({ name, email, password, phone });
      const token = jwt.sign({ id: user.id, role: user.role, establishmentId: user.establishmentId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, establishmentId: user.establishmentId } },
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email, active: true } });
      if (!user || !(await user.validatePassword(password))) {
        return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
      }

      const token = jwt.sign({ id: user.id, role: user.role, establishmentId: user.establishmentId }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, establishmentId: user.establishmentId } },
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
      });
      return res.json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
