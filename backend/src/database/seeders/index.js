const { Establishment, Category, Product, User } = require('../../models');

const seedDatabase = async () => {
  const count = await Establishment.count();
  if (count > 0) {
    console.log('📦 Banco já populado, pulando seed...');
    return;
  }

  console.log('🌱 Populando banco de dados com dados de exemplo...');

  // Admin user
  await User.create({
    name: 'Admin',
    email: 'admin@delivery.com',
    password: '123456',
    role: 'admin',
  });

  await User.create({
    name: 'João Silva',
    email: 'joao@email.com',
    password: '123456',
    role: 'customer',
  });

  // === AÇAÍ STORE ===
  const acai = await Establishment.create({
    name: 'Açaí Lovers',
    slug: 'acai-lovers',
    type: 'acai',
    description: 'O melhor açaí da cidade! Tigelas, bowls e sorvetes artesanais com os melhores complementos.',
    primaryColor: '#6B21A8',
    secondaryColor: '#A855F7',
    deliveryFee: 4.99,
    minOrder: 20,
    deliveryTime: 30,
    rating: 4.8,
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 98765-4321',
    isOpen: true,
  });

  const acaiCat1 = await Category.create({ name: 'Tigelas', icon: '🍇', order: 1, establishmentId: acai.id });
  const acaiCat2 = await Category.create({ name: 'Bowls', icon: '🥣', order: 2, establishmentId: acai.id });
  const acaiCat3 = await Category.create({ name: 'Complementos', icon: '🍓', order: 3, establishmentId: acai.id });

  await Product.bulkCreate([
    { name: 'Tigela Tradicional 300ml', description: 'Açaí puro com granola e leite condensado', price: 18.90, featured: true, categoryId: acaiCat1.id, establishmentId: acai.id },
    { name: 'Tigela Premium 500ml', description: 'Açaí cremoso com frutas, granola e mel', price: 28.90, featured: true, categoryId: acaiCat1.id, establishmentId: acai.id },
    { name: 'Tigela XG 700ml', description: 'Para os famintos! Açaí com tudo', price: 38.90, categoryId: acaiCat1.id, establishmentId: acai.id },
    { name: 'Bowl Tropical', description: 'Açaí com manga, morango e coco ralado', price: 32.90, featured: true, categoryId: acaiCat2.id, establishmentId: acai.id },
    { name: 'Bowl Fitness', description: 'Açaí sem açúcar com chia, granola fit e banana', price: 29.90, categoryId: acaiCat2.id, establishmentId: acai.id },
    { name: 'Bowl Kids', description: 'Açaí com confetes e leite condensado para os pequenos', price: 16.90, categoryId: acaiCat2.id, establishmentId: acai.id },
    { name: 'Granola Extra', description: 'Porção adicional de granola', price: 3.00, categoryId: acaiCat3.id, establishmentId: acai.id },
    { name: 'Leite Condensado', description: 'Calda de leite condensado', price: 2.50, categoryId: acaiCat3.id, establishmentId: acai.id },
    { name: 'Morango', description: 'Morangos frescos', price: 4.00, categoryId: acaiCat3.id, establishmentId: acai.id },
  ]);

  // === PIZZARIA ===
  const pizza = await Establishment.create({
    name: 'Pizzaria Bella Napoli',
    slug: 'bella-napoli',
    type: 'pizza',
    description: 'Pizzas artesanais com ingredientes importados e forno a lenha. Tradição italiana desde 1985.',
    primaryColor: '#B91C1C',
    secondaryColor: '#F59E0B',
    deliveryFee: 6.99,
    minOrder: 35,
    deliveryTime: 45,
    rating: 4.7,
    address: 'Av. Itália, 456 - Vila Nova',
    phone: '(11) 3456-7890',
    isOpen: true,
  });

  const pizzaCat1 = await Category.create({ name: 'Tradicionais', icon: '🍕', order: 1, establishmentId: pizza.id });
  const pizzaCat2 = await Category.create({ name: 'Especiais', icon: '⭐', order: 2, establishmentId: pizza.id });
  const pizzaCat3 = await Category.create({ name: 'Doces', icon: '🍫', order: 3, establishmentId: pizza.id });
  const pizzaCat4 = await Category.create({ name: 'Bebidas', icon: '🥤', order: 4, establishmentId: pizza.id });

  await Product.bulkCreate([
    { name: 'Margherita', description: 'Molho de tomate, mussarela e manjericão fresco', price: 42.90, featured: true, categoryId: pizzaCat1.id, establishmentId: pizza.id },
    { name: 'Calabresa', description: 'Molho de tomate, mussarela e calabresa artesanal', price: 44.90, featured: true, categoryId: pizzaCat1.id, establishmentId: pizza.id },
    { name: 'Napolitana', description: 'Molho de tomate, mussarela, tomate e alho', price: 43.90, categoryId: pizzaCat1.id, establishmentId: pizza.id },
    { name: 'Portuguesa', description: 'Presunto, ovos, cebola, mussarela e azeitona', price: 46.90, categoryId: pizzaCat1.id, establishmentId: pizza.id },
    { name: 'Quatro Queijos', description: 'Mussarela, gorgonzola, parmesão e catupiry', price: 54.90, featured: true, categoryId: pizzaCat2.id, establishmentId: pizza.id },
    { name: 'Salmão Especial', description: 'Salmão defumado, cream cheese e alcaparras', price: 62.90, categoryId: pizzaCat2.id, establishmentId: pizza.id },
    { name: 'Trufada', description: 'Cogumelos, mussarela e azeite de trufa negra', price: 68.90, categoryId: pizzaCat2.id, establishmentId: pizza.id },
    { name: 'Romeu e Julieta', description: 'Mussarela e goiabada artesanal', price: 38.90, featured: true, categoryId: pizzaCat3.id, establishmentId: pizza.id },
    { name: 'Nutella com Morango', description: 'Nutella cremosa com morangos frescos', price: 44.90, categoryId: pizzaCat3.id, establishmentId: pizza.id },
    { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Sprite', price: 14.90, categoryId: pizzaCat4.id, establishmentId: pizza.id },
    { name: 'Suco Natural', description: 'Limão, laranja ou maracujá 500ml', price: 12.90, categoryId: pizzaCat4.id, establishmentId: pizza.id },
  ]);

  // === HAMBURGUERIA ===
  const burger = await Establishment.create({
    name: 'BurguerCraft',
    slug: 'burguercraft',
    type: 'burger',
    description: 'Hambúrgueres artesanais com carne bovina 180g, ingredientes frescos e pão brioche próprio.',
    primaryColor: '#92400E',
    secondaryColor: '#F97316',
    deliveryFee: 5.99,
    minOrder: 30,
    deliveryTime: 35,
    rating: 4.9,
    address: 'Rua dos Artesãos, 789 - Bairro Gourmet',
    phone: '(11) 99999-8888',
    isOpen: true,
  });

  const burgerCat1 = await Category.create({ name: 'Smash Burgers', icon: '🍔', order: 1, establishmentId: burger.id });
  const burgerCat2 = await Category.create({ name: 'Chicken Burgers', icon: '🐔', order: 2, establishmentId: burger.id });
  const burgerCat3 = await Category.create({ name: 'Combos', icon: '🎁', order: 3, establishmentId: burger.id });
  const burgerCat4 = await Category.create({ name: 'Sides', icon: '🍟', order: 4, establishmentId: burger.id });

  await Product.bulkCreate([
    { name: 'Classic Smash', description: 'Smash 180g, queijo americano, picles, mostarda e ketchup', price: 34.90, featured: true, categoryId: burgerCat1.id, establishmentId: burger.id },
    { name: 'Double Smash', description: 'Dois smash 180g, duplo queijo, bacon crocante e molho especial', price: 48.90, featured: true, categoryId: burgerCat1.id, establishmentId: burger.id },
    { name: 'BBQ Smash', description: 'Smash 180g, queijo cheddar, cebola caramelizada e molho BBQ', price: 42.90, categoryId: burgerCat1.id, establishmentId: burger.id },
    { name: 'Truffle Smash', description: 'Smash 180g, queijo brie, rúcula e maionese de trufa', price: 52.90, featured: true, categoryId: burgerCat1.id, establishmentId: burger.id },
    { name: 'Crispy Chicken', description: 'Frango empanado crocante, alface, tomate e maionese de mel e mostarda', price: 36.90, featured: true, categoryId: burgerCat2.id, establishmentId: burger.id },
    { name: 'Spicy Chicken', description: 'Frango grelhado temperado, pimenta jalapeño e queijo pepper jack', price: 38.90, categoryId: burgerCat2.id, establishmentId: burger.id },
    { name: 'Combo Classic', description: 'Classic Smash + Batata Frita + Refrigerante', price: 54.90, originalPrice: 62.80, featured: true, categoryId: burgerCat3.id, establishmentId: burger.id },
    { name: 'Combo Double', description: 'Double Smash + Onion Rings + Refrigerante', price: 68.90, originalPrice: 76.80, categoryId: burgerCat3.id, establishmentId: burger.id },
    { name: 'Batata Frita', description: 'Batata frita crocante com tempero da casa', price: 18.90, featured: true, categoryId: burgerCat4.id, establishmentId: burger.id },
    { name: 'Onion Rings', description: 'Anéis de cebola empanados com molho ranch', price: 22.90, categoryId: burgerCat4.id, establishmentId: burger.id },
    { name: 'Milkshake', description: 'Baunilha, chocolate ou morango 400ml', price: 24.90, categoryId: burgerCat4.id, establishmentId: burger.id },
  ]);

  // === PASTA BUILDER (Estilo Spoleto) ===
  const pasta = await Establishment.create({
    name: 'Pasta & Co.',
    slug: 'pasta-co',
    type: 'pasta',
    description: 'Monte sua massa do jeito que você quiser! Escolha a massa, o molho, a proteína e os toppings para criar seu prato único.',
    primaryColor: '#16A34A',
    secondaryColor: '#84CC16',
    deliveryFee: 5.99,
    minOrder: 25,
    deliveryTime: 25,
    rating: 4.9,
    address: 'Av. Italia, 1200 - Centro',
    phone: '(11) 94567-8901',
    isOpen: true,
  });

  const pastaCatMassa    = await Category.create({ name: 'Massas', icon: '🍝', order: 1, establishmentId: pasta.id });
  const pastaCatMolho    = await Category.create({ name: 'Molhos', icon: '🫙', order: 2, establishmentId: pasta.id });
  const pastaCatProt     = await Category.create({ name: 'Proteínas', icon: '🍗', order: 3, establishmentId: pasta.id });
  const pastaCatTopping  = await Category.create({ name: 'Toppings', icon: '🧀', order: 4, establishmentId: pasta.id });
  const pastaCatBebida   = await Category.create({ name: 'Bebidas', icon: '🥤', order: 5, establishmentId: pasta.id });

  // MASSAS
  await Product.bulkCreate([
    { name: 'Espaguete', description: 'Massa longa e redonda, a clássica italiana', price: 22.90, featured: true, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
    { name: 'Penne', description: 'Massa tubular com ranhuras para segurar o molho', price: 22.90, featured: true, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
    { name: 'Fettuccine', description: 'Massa larga e achatada, perfeita para molhos cremosos', price: 24.90, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
    { name: 'Rigatoni', description: 'Massa tubular grande com sulcos profundos', price: 22.90, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
    { name: 'Farfalle', description: 'Gravatinha, massa em formato de borboleta', price: 23.90, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
    { name: 'Talharim Integral', description: 'Massa integral com mais fibras e sabor', price: 25.90, builderRole: 'massa', categoryId: pastaCatMassa.id, establishmentId: pasta.id },
  ]);

  // MOLHOS
  await Product.bulkCreate([
    { name: 'Pomodoro', description: 'Molho de tomate fresco com manjericão e alho', price: 8.90, featured: true, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Pesto Genovese', description: 'Manjericão fresco, pinhões, azeite e parmesão', price: 12.90, featured: true, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Bolonhesa', description: 'Molho de carne moída com tomate e ervas', price: 11.90, featured: true, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Alfredo', description: 'Creme de manteiga e parmesão, suave e encorpado', price: 11.90, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Arrabbiata', description: 'Pomodoro apimentado com pimenta calabresa', price: 9.90, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Carbonara', description: 'Gema de ovo, pecorino, guanciale e pimenta-do-reino', price: 13.90, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
    { name: 'Funghi Trifolati', description: 'Cogumelos salteados com azeite e alho', price: 14.90, builderRole: 'molho', categoryId: pastaCatMolho.id, establishmentId: pasta.id },
  ]);

  // PROTEÍNAS
  await Product.bulkCreate([
    { name: 'Frango Grelhado', description: 'Filé de frango grelhado fatiado', price: 9.90, featured: true, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
    { name: 'Camarão Salteado', description: 'Camarões salteados na manteiga com alho', price: 18.90, featured: true, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
    { name: 'Salmão Grelhado', description: 'Filé de salmão grelhado em azeite', price: 19.90, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
    { name: 'Carne Moída', description: 'Carne moída refogada com temperos', price: 10.90, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
    { name: 'Linguiça Artesanal', description: 'Linguiça suína defumada fatiada', price: 11.90, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
    { name: 'Sem proteína', description: 'Massa vegetariana sem proteína animal', price: 0, builderRole: 'proteina', categoryId: pastaCatProt.id, establishmentId: pasta.id },
  ]);

  // TOPPINGS (seleção múltipla)
  await Product.bulkCreate([
    { name: 'Parmesão Ralado', description: 'Queijo parmesão italiano ralado na hora', price: 3.90, featured: true, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Mussarela de Búfala', description: 'Bolinhas de mussarela de búfala fresca', price: 5.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Tomate Cereja', description: 'Tomatinhos assados com azeite e sal', price: 3.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Rúcula Fresca', description: 'Folhas de rúcula orgânica', price: 2.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Azeitonas Pretas', description: 'Azeitonas pretas fatiadas', price: 2.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Cogumelos Paris', description: 'Cogumelos salteados na manteiga', price: 4.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Bacon Crocante', description: 'Bacon em cubinhos tostado', price: 4.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Pimenta Calabresa', description: 'Para quem gosta de ardência', price: 1.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
    { name: 'Azeite Trufado', description: 'Fio de azeite aromatizado com trufa', price: 6.90, builderRole: 'topping', categoryId: pastaCatTopping.id, establishmentId: pasta.id },
  ]);

  // BEBIDAS
  await Product.bulkCreate([
    { name: 'Água com Gás', description: 'Água mineral com gás 500ml', price: 5.90, categoryId: pastaCatBebida.id, establishmentId: pasta.id },
    { name: 'Suco de Uva', description: 'Suco integral de uva 300ml', price: 9.90, categoryId: pastaCatBebida.id, establishmentId: pasta.id },
    { name: 'Refrigerante Lata', description: 'Coca-Cola, Sprite ou Fanta', price: 6.90, categoryId: pastaCatBebida.id, establishmentId: pasta.id },
  ]);

  // Adicionando um item com modificadores reais no Pasta & Co
  await Product.create({
    name: 'Monte sua Massa (Personalizado)',
    description: 'Escolha cada detalhe do seu prato.',
    price: 25.90,
    featured: true,
    categoryId: pastaCatMassa.id,
    establishmentId: pasta.id,
    modifierGroups: [
      {
        name: 'Massa',
        min: 1,
        max: 1,
        options: [
          { name: 'Espaguete', price: 0 },
          { name: 'Penne', price: 0 },
          { name: 'Fettuccine', price: 2.00 }
        ]
      },
      {
        name: 'Molho',
        min: 1,
        max: 1,
        options: [
          { name: 'Pomodoro', price: 0 },
          { name: 'Bolonhesa', price: 3.50 },
          { name: 'Pesto', price: 5.00 }
        ]
      },
      {
        name: 'Toppings Extras',
        min: 0,
        max: 4,
        options: [
          { name: 'Bacon', price: 4.50 },
          { name: 'Parmesão', price: 3.00 },
          { name: 'Alho Frito', price: 1.50 },
          { name: 'Manjericão', price: 0 }
        ]
      }
    ]
  });

  // === MEGA AÇAÍ BUILDER ===
  // === MEGA AÇAÍ BUILDER ===
  const megaAcaiEst = await Establishment.create({
    name: 'Mega Açaí',
    slug: 'mega-acai',
    type: 'acai',
    description: 'O melhor açaí da região! Monte do seu jeito com acompanhamentos ilimitados e frutas frescas.',
    primaryColor: '#6B21A8',
    secondaryColor: '#D8B4FE',
    deliveryFee: 4.50,
    minOrder: 15,
    deliveryTime: 20,
    rating: 4.8,
    address: 'Rua das Palmeiras, 450 - Bairro Alto',
    phone: '(11) 93333-2222',
    isOpen: true,
  });

  const acaiCatSize  = await Category.create({ name: 'Tamanho do Copo', icon: '🥤', order: 1, establishmentId: megaAcaiEst.id });
  const acaiCatFruit = await Category.create({ name: 'Frutas Frescas', icon: '🍓', order: 2, establishmentId: megaAcaiEst.id });
  const acaiCatComp  = await Category.create({ name: 'Complementos', icon: '🥜', order: 3, establishmentId: megaAcaiEst.id });
  const acaiCatSauce = await Category.create({ name: 'Caldas e Coberturas', icon: '🍯', order: 4, establishmentId: megaAcaiEst.id });

  // TAMANHOS
  await Product.bulkCreate([
    { name: 'Copo 300ml', description: 'Açaí puro e cremoso em copo de 300ml', price: 15.90, builderRole: 'tamanho', categoryId: acaiCatSize.id, establishmentId: megaAcaiEst.id },
    { name: 'Copo 500ml', description: 'O queridinho da galera! Copo de 500ml', price: 21.90, featured: true, builderRole: 'tamanho', categoryId: acaiCatSize.id, establishmentId: megaAcaiEst.id },
    { name: 'Copo 700ml', description: 'Para os apaixonados por açaí, copo de 700ml', price: 28.90, builderRole: 'tamanho', categoryId: acaiCatSize.id, establishmentId: megaAcaiEst.id },
    { name: 'Tigela 1 Litro', description: 'Açaí gigante para compartilhar (ou não!)', price: 38.90, builderRole: 'tamanho', categoryId: acaiCatSize.id, establishmentId: megaAcaiEst.id },
  ]);

  // FRUTAS
  await Product.bulkCreate([
    { name: 'Banana', description: 'Rodelas de banana prata fresquinhas', price: 0, builderRole: 'fruta', categoryId: acaiCatFruit.id, establishmentId: megaAcaiEst.id },
    { name: 'Morango', description: 'Morangos selecionados e picados', price: 3.50, featured: true, builderRole: 'fruta', categoryId: acaiCatFruit.id, establishmentId: megaAcaiEst.id },
    { name: 'Manga', description: 'Cubos de manga palmer docinha', price: 2.50, builderRole: 'fruta', categoryId: acaiCatFruit.id, establishmentId: megaAcaiEst.id },
    { name: 'Kiwi', description: 'Kiwi fatiado, um toque azedinho', price: 3.00, builderRole: 'fruta', categoryId: acaiCatFruit.id, establishmentId: megaAcaiEst.id },
  ]);

  // COMPLEMENTOS (incluindo Castanha e Amendoim)
  await Product.bulkCreate([
    { name: 'Leite em Pó', description: 'O clássico Leite Ninho', price: 0, featured: true, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
    { name: 'Granola Tradicional', description: 'Mix de cereais crocantes', price: 0, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
    { name: 'Paçoca', description: 'Amendoim moído e docinho', price: 1.50, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
    { name: 'Castanha de Caju', description: 'Castanhas torradas e quebradas', price: 4.00, featured: true, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
    { name: 'Amendoim Triturado', description: 'Amendoim crocante sem pele', price: 2.50, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
    { name: 'M&Ms', description: 'Confeitos coloridos de chocolate', price: 4.50, builderRole: 'complemento', categoryId: acaiCatComp.id, establishmentId: megaAcaiEst.id },
  ]);

  // CREMES (Nova categoria)
  const acaiCatCreme = await Category.create({ name: 'Cremes Especiais', icon: '🍨', order: 5, establishmentId: megaAcaiEst.id });
  await Product.bulkCreate([
    { name: 'Creme de Ninho', description: 'Receita artesanal Mega Açaí', price: 4.50, featured: true, builderRole: 'creme', categoryId: acaiCatCreme.id, establishmentId: megaAcaiEst.id },
    { name: 'Creme de Morango', description: 'Sabor refrescante da fruta', price: 4.00, builderRole: 'creme', categoryId: acaiCatCreme.id, establishmentId: megaAcaiEst.id },
    { name: 'Creme de Cupuaçu', description: 'O clássico da Amazônia', price: 5.00, builderRole: 'creme', categoryId: acaiCatCreme.id, establishmentId: megaAcaiEst.id },
  ]);

  // CALDAS
  await Product.bulkCreate([
    { name: 'Leite Condensado', description: 'Original Moça', price: 0, featured: true, builderRole: 'calda', categoryId: acaiCatSauce.id, establishmentId: megaAcaiEst.id },
    { name: 'Nutella Real', description: 'Creme de avelã original', price: 6.90, featured: true, builderRole: 'calda', categoryId: acaiCatSauce.id, establishmentId: megaAcaiEst.id },
    { name: 'Mel de Engenho', description: 'Mel puro natural', price: 3.50, builderRole: 'calda', categoryId: acaiCatSauce.id, establishmentId: megaAcaiEst.id },
  ]);

  // === PIZZA PLANET BUILDER ===
  const pizzaPlanet = await Establishment.create({
    name: 'Pizza Planet',
    slug: 'pizza-planet',
    type: 'pizza',
    description: 'Pizzas artesanais com massa de longa fermentação e ingredientes selecionados.',
    primaryColor: '#EF4444',
    secondaryColor: '#FBBF24',
    deliveryFee: 7.00,
    minOrder: 35,
    deliveryTime: 40,
    rating: 4.7,
    address: 'Av. das Estrelas, 99 - Galáxia Sul',
    phone: '(11) 97777-6666',
    isOpen: true,
  });

  const pizzaCatSize   = await Category.create({ name: 'Tamanho da Pizza', icon: '📏', order: 1, establishmentId: pizzaPlanet.id });
  const pizzaCatFlavor = await Category.create({ name: 'Sabores Tradicionais', icon: '🍕', order: 2, establishmentId: pizzaPlanet.id });
  const pizzaCatCrust  = await Category.create({ name: 'Bordas Recheadas', icon: '🥯', order: 3, establishmentId: pizzaPlanet.id });

  // TAMANHOS
  await Product.bulkCreate([
    { name: 'Pizza P (4 Fatias)', description: 'Ideal para uma pessoa faminta', price: 32.90, builderRole: 'tamanho', categoryId: pizzaCatSize.id, establishmentId: pizzaPlanet.id },
    { name: 'Pizza M (6 Fatias)', description: 'Perfeita para compartilhar a dois', price: 45.90, featured: true, builderRole: 'tamanho', categoryId: pizzaCatSize.id, establishmentId: pizzaPlanet.id },
    { name: 'Pizza G (8 Fatias)', description: 'A clássica para a família toda', price: 58.90, builderRole: 'tamanho', categoryId: pizzaCatSize.id, establishmentId: pizzaPlanet.id },
  ]);

  // SABORES
  await Product.bulkCreate([
    { name: 'Calabresa Tradicional', description: 'Calabresa fatiada, cebola e orégano', price: 0, featured: true, builderRole: 'sabor', categoryId: pizzaCatFlavor.id, establishmentId: pizzaPlanet.id },
    { name: 'Marguerita Especial', description: 'Mussarela, tomate, manjericão e parmesão', price: 0, featured: true, builderRole: 'sabor', categoryId: pizzaCatFlavor.id, establishmentId: pizzaPlanet.id },
    { name: 'Carne de Sol com Nata', description: 'Carne de sol desfiada, queijo coalho e nata', price: 8.50, builderRole: 'sabor', categoryId: pizzaCatFlavor.id, establishmentId: pizzaPlanet.id },
    { name: 'Frango com Catupiry', description: 'Peito de frango desfiado com Catupiry original', price: 4.50, builderRole: 'sabor', categoryId: pizzaCatFlavor.id, establishmentId: pizzaPlanet.id },
    { name: 'Quatro Queijos', description: 'Mussarela, parmesão, provolone e gorgonzola', price: 6.00, builderRole: 'sabor', categoryId: pizzaCatFlavor.id, establishmentId: pizzaPlanet.id },
  ]);

  // BORDAS
  await Product.bulkCreate([
    { name: 'Sem Borda Recheada', description: 'Borda tradicional crocante', price: 0, builderRole: 'borda', categoryId: pizzaCatCrust.id, establishmentId: pizzaPlanet.id },
    { name: 'Borda de Catupiry', description: 'Catupiry original cremoso', price: 9.90, featured: true, builderRole: 'borda', categoryId: pizzaCatCrust.id, establishmentId: pizzaPlanet.id },
    { name: 'Borda de Cheddar', description: 'Cheddar especial derretido', price: 8.90, builderRole: 'borda', categoryId: pizzaCatCrust.id, establishmentId: pizzaPlanet.id },
    { name: 'Borda de Chocolate', description: 'Chocolate ao leite para fechar bem', price: 12.90, builderRole: 'borda', categoryId: pizzaCatCrust.id, establishmentId: pizzaPlanet.id },
  ]);

  console.log('✅ Seed concluído! Dados de exemplo inseridos.');
  console.log('👤 Admin: admin@delivery.com / 123456');
  console.log('👤 Cliente: joao@email.com / 123456');
};

module.exports = { seedDatabase };


