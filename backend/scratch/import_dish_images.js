const { Product, Establishment } = require('../src/models');
const { sequelize } = require('../src/database');

const imageMap = [
  // Açaí
  { pattern: /tigela.*xg/i, url: 'https://images.unsplash.com/photo-1628557008761-fa08197779bf?auto=format&fit=crop&w=600&q=80' },
  { pattern: /tigela/i, url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80' },
  { pattern: /bowl fitness/i, url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80' },
  { pattern: /bowl/i, url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80' },
  { pattern: /copo.*acai/i, url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80' },
  { pattern: /copo/i, url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80' },
  { pattern: /creme/i, url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' },
  { pattern: /acai/i, url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80' },

  // Burgers
  { pattern: /double smash/i, url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { pattern: /classic smash/i, url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { pattern: /bbq smash/i, url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { pattern: /truffle smash/i, url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80' },
  { pattern: /crispy chicken/i, url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80' },
  { pattern: /spicy chicken/i, url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80' },
  { pattern: /chicken/i, url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80' },
  { pattern: /smash/i, url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { pattern: /combo/i, url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80' },

  // Pizza
  { pattern: /margherita/i, url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80' },
  { pattern: /marguerita/i, url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80' },
  { pattern: /calabresa/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { pattern: /napolitana/i, url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' },
  { pattern: /portuguesa/i, url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80' },
  { pattern: /quatro queijos/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { pattern: /salmão/i, url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { pattern: /trufada/i, url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80' },
  { pattern: /romeu/i, url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' },
  { pattern: /nutella/i, url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' },
  { pattern: /borda.*catupiry/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { pattern: /borda.*cheddar/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { pattern: /borda.*chocolate/i, url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80' },
  { pattern: /carne de sol.*nata/i, url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { pattern: /frango.*catupiry/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { pattern: /pizza/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },

  // Pasta
  { pattern: /espaguete/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /penne/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /fettuccine/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /rigatoni/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /farfalle/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /talharim/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { pattern: /pomodoro/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /pesto/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /bolonhesa/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /alfredo/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /arrabbiata/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /carbonara/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /funghi/i, url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=600&q=80' },
  { pattern: /massa/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },

  // Sides & Ingredients
  { pattern: /batata frita/i, url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  { pattern: /onion rings/i, url: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?auto=format&fit=crop&w=600&q=80' },
  { pattern: /granola/i, url: 'https://images.unsplash.com/photo-1517093157656-b9ecdf97c085?auto=format&fit=crop&w=600&q=80' },
  { pattern: /morango/i, url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80' },
  { pattern: /banana/i, url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
  { pattern: /manga/i, url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80' },
  { pattern: /kiwi/i, url: 'https://images.unsplash.com/photo-1585059895524-72359e061381?auto=format&fit=crop&w=600&q=80' },
  { pattern: /parmesão/i, url: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80' },
  { pattern: /mussarela de búfala/i, url: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=600&q=80' },
  { pattern: /tomate cereja/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { pattern: /rúcula/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { pattern: /azeitona/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { pattern: /cogumelo/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { pattern: /bacon/i, url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  { pattern: /azeite/i, url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { pattern: /pimenta/i, url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { pattern: /frango/i, url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80' },
  { pattern: /camarão/i, url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80' },
  { pattern: /linguiça/i, url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80' },
  { pattern: /castanha/i, url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
  { pattern: /amendoim/i, url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
  { pattern: /paçoca/i, url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
  { pattern: /m&ms/i, url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },

  // Drinks
  { pattern: /milkshake/i, url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' },
  { pattern: /refrigerante/i, url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { pattern: /suco/i, url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { pattern: /água/i, url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' }
];

const fallbackImages = {
  acai: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
};

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco SQLite estabelecida.');

    const products = await Product.findAll();
    console.log(`🔍 Encontrados ${products.length} produtos.`);

    const establishments = await Establishment.findAll();
    const estMap = new Map(establishments.map(e => [e.id, e]));

    let updatedCount = 0;

    for (const product of products) {
      const est = estMap.get(product.establishmentId);
      const estType = est ? est.type : 'pasta';

      // Encontrar URL no mapa
      let imageUrl = null;
      for (const item of imageMap) {
        if (item.pattern.test(product.name)) {
          imageUrl = item.url;
          break;
        }
      }

      // Fallback por tipo se não casou
      if (!imageUrl) {
        imageUrl = fallbackImages[estType] || fallbackImages.pasta;
      }

      // Atualizar o produto no banco
      product.image = imageUrl;
      await product.save();
      updatedCount++;
    }

    console.log(`🎉 Sucesso! ${updatedCount} pratos/itens atualizados com belas fotos reais do Unsplash.`);
  } catch (error) {
    console.error('❌ Erro durante a importação das imagens:', error);
  } finally {
    await sequelize.close();
  }
}

run();
