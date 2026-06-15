export const isImageEmoji = (emoji) => {
  return typeof emoji === 'string' && (
    emoji.startsWith('/') || 
    emoji.startsWith('data:') || 
    emoji.includes('http') || 
    emoji.includes('assets') || 
    emoji.includes('static')
  );
};

const emojiMap = {
  'coca-cola': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Coca-Cola_bottle_cap.svg',
  'coca': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Coca-Cola_bottle_cap.svg',
  'pepsi': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Pepsi_logo_2023.svg',
  'guaraná': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Guarana-antarctica_2020.svg',
  'guarana': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Guarana-antarctica_2020.svg',
  'fanta': 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Fanta_2023.svg',
  'sprite': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Sprite_logo.svg',
  'red bull': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Red_Bull_Logo.svg',
  'redbull': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Red_Bull_Logo.svg',
  'monster': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Monster_Energy_logo.svg',
  'refri': '🥤',
  'suco': '🧃',
  'água': '💧',
  'agua': '💧',
  'cerveja': '🍺',
  'heineken': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Heineken_logo.svg',
  'chopp': '🍺',
  'vinho': '🍷',
  'café': '☕',
  'cafe': '☕',
  'shake': '🥤',
  'milkshake': '🥤',
  
  // Comidas Principais
  'burger': '🍔',
  'hambúrguer': '🍔',
  'x-': '🍔',
  'cheeseburger': '🍔',
  'pizza': '🍕',
  'calzone': '🍕',
  'batata': '🍟',
  'fritas': '🍟',
  'nugget': '🍗',
  'frango': '🍗',
  'chicken': '🍗',
  'carne': '🥩',
  'steak': '🥩',
  'churrasco': '🥩',
  'massa': '🍝',
  'macarrão': '🍝',
  'lasanha': '🍝',
  'espaguete': '🍝',
  'sushi': '🍣',
  'sashimi': '🍣',
  'temaki': '🍣',
  'hot roll': '🍣',
  'salada': '🥗',
  'fit': '🥗',
  'sanduíche': '🥪',
  'sanduiche': '🥪',
  'beirute': '🥪',
  'pão': '🍞',
  'pao': '🍞',
  'pastel': '🥟',
  'coxinha': '🍗',
  'salgado': '🥐',
  'taco': '🌮',
  'burrito': '🌯',
  'nachos': '🥙',
  
  // Açaí e Complementos
  'açaí': '🍇',
  'acai': '🥣',
  'leite ninho': '🥛',
  'ninho': '🥛',
  'leite condensado': '🍶',
  'leite em pó': '🥛',
  'condensado': '🍯',
  'granola': '🥣',
  'paçoca': '🥜',
  'amendoim': '🥜',
  'nutella': '🍫',
  'creme': '🍨',
  'kiwi': '🥝',
  'm&m': '🍫',
  'confete': '🍬',
  'castanha': '🌰',
  'mel': '🍯',
  'copo': '🥤',
  'tigela': '🥣',
  
  // Sobremesas / Doces
  'sorvete': '🍦',
  'picolé': '🍦',
  'picole': '🍦',
  'doce': '🍩',
  'donut': '🍩',
  'bolo': '🍰',
  'torta': '🥧',
  'chocolate': '🍫',
  'pudim': '🍮',
  'brownie': '🍰',
  'cookie': '🍪',
  
  // Frutas
  'morango': '🍓',
  'banana': '🍌',
  'uva': '🍇',
  'abacaxi': '🍍',
  'manga': '🥭',
  'limão': '🍋',
  'limao': '🍋',
  'laranja': '🍊',
  'coco': '🥥',
  
  // Ingredientes Pasta / Outros
  'penne': 'https://res.cloudinary.com/da6o1jan3/image/upload/co_white,e_make_transparent:20,q_auto/f_png/v1781484444/penne_lpvjhc.png',
  'fettuccine': 'https://res.cloudinary.com/da6o1jan3/image/upload/co_white,e_make_transparent:20,q_auto/f_png/v1781484080/fettuccine_eilapq.png',
  'rigatoni': '🥫',
  'farfalle': '🦋',
  'talharim': '🌾',
  'pomodoro': '🍅',
  'tomate': '🍅',
  'pesto': '🌿',
  'bolonhesa': '🥩',
  'alfredo': '🧈',
  'arrabbiata': '🌶️',
  'carbonara': '🥚',
  'funghi': '🍄',
  'cogumelo': '🍄',
  'camarão': '🦐',
  'camarao': '🦐',
  'salmão': '🐟',
  'salmao': '🐟',
  'linguiça': '🌭',
  'sem proteína': '🥦',
  'parmesão': '🧀',
  'parmesao': '🧀',
  'queijo': '🧀',
  'mussarela': '⚪',
  'rúcula': '🥬',
  'rucula': '🥬',
  'azeitona': '🫒',
  'bacon': '🥓',
  'pimenta': '🌶️',
  'azeite': '✨',
  'cebola': '🧅',
  'alho': '🧄',
  'milho': '🌽',
  'ervilha': '🫛',
  'brócolis': '🥦',
  'brocolis': '🥦',
  'ovo': '🥚',
};

export const getEmojiByName = (name, fallbackEmoji = '🍽️') => {
  if (!name) return fallbackEmoji;
  
  const lowerName = name.toLowerCase();
  
  // Tenta encontrar uma correspondência exata ou parcial por palavra-chave
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  
  return fallbackEmoji;
};
