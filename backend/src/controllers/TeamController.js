const { User, Establishment } = require('../models');
const { Op } = require('sequelize');

const TeamController = {
  // Listar membros da equipe do estabelecimento do admin
  async list(req, res) {
    try {
      const { establishmentId } = req.user;

      if (!establishmentId) {
        return res.status(403).json({ error: 'Usuário não está vinculado a nenhum estabelecimento.' });
      }

      const team = await User.findAll({
        where: {
          establishmentId,
          role: {
            [Op.notIn]: ['customer', 'admin'] // Retorna todos exceto clientes comuns e o dono (se o dono quiser se ver, removemos admin)
          }
        },
        attributes: { exclude: ['password', 'verificationToken'] }
      });

      return res.json({ data: team });
    } catch (error) {
      console.error('Erro ao listar equipe:', error);
      return res.status(500).json({ error: 'Erro ao listar equipe.' });
    }
  },

  // Adicionar um novo membro à equipe
  async create(req, res) {
    try {
      const { establishmentId } = req.user;
      const { name, email, password, role, phone } = req.body;

      if (!establishmentId) {
        return res.status(403).json({ error: 'Você não tem um estabelecimento vinculado.' });
      }

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Nome, email, senha e cargo são obrigatórios.' });
      }

      // Verifica se e-mail já existe
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'E-mail já está em uso.' });
      }

      const member = await User.create({
        name,
        email,
        password,
        role,
        phone,
        establishmentId,
        isEmailVerified: true, // Funcionários criados pelo dono não precisam verificar
        active: true
      });

      const memberData = member.toJSON();
      delete memberData.password;

      return res.status(201).json({ message: 'Membro adicionado com sucesso', data: memberData });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      return res.status(500).json({ error: 'Erro ao adicionar membro.' });
    }
  },

  // Atualizar dados de um membro da equipe
  async update(req, res) {
    try {
      const { id } = req.params;
      const { establishmentId } = req.user;
      const { name, role, active, phone, password } = req.body;

      const member = await User.findOne({ where: { id, establishmentId } });

      if (!member) {
        return res.status(404).json({ error: 'Membro não encontrado ou não pertence a este estabelecimento.' });
      }

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (role !== undefined) updates.role = role;
      if (active !== undefined) updates.active = active;
      if (phone !== undefined) updates.phone = phone;
      if (password) updates.password = password;

      await member.update(updates);

      const memberData = member.toJSON();
      delete memberData.password;

      return res.json({ message: 'Membro atualizado com sucesso', data: memberData });
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      return res.status(500).json({ error: 'Erro ao atualizar membro.' });
    }
  },

  // Excluir um membro permanentemente
  async delete(req, res) {
    try {
      const { id } = req.params;
      const { establishmentId } = req.user;

      const member = await User.findOne({ where: { id, establishmentId } });

      if (!member) {
        return res.status(404).json({ error: 'Membro não encontrado ou não pertence a este estabelecimento.' });
      }

      await member.destroy();

      return res.json({ message: 'Membro removido da equipe com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      return res.status(500).json({ error: 'Erro ao excluir membro.' });
    }
  }
};

module.exports = TeamController;
