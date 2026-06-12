const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Deve ser a "Senha de Aplicativo" do Google, não a senha real
  },
});

const sendVerificationEmail = async (userEmail, userName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Delivery App" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Ative sua conta no Delivery App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #ff4757; text-align: center;">Bem-vindo(a) ao Delivery App, ${userName}!</h2>
        <p style="font-size: 16px; color: #333;">Falta muito pouco para você começar a fazer seus pedidos.</p>
        <p style="font-size: 16px; color: #333;">Por favor, clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta de forma segura:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #ff4757; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Ativar Minha Conta</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">Se você não se cadastrou no nosso app, pode ignorar este e-mail.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ E-mail de verificação enviado para ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de verificação:', error);
    // Em desenvolvimento, nós imprimimos o link no console caso falhe o envio por falta de senha
    if (process.env.NODE_ENV !== 'production') {
       console.log(`[DEV MODE] Como o envio falhou, acesse o link manualmente: ${verificationLink}`);
    }
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};
