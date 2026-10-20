/**
 * ENCONTRAAÍ - DADOS INICIAIS E SINCRONIZAÇÃO COM O LOCALSTORAGE
 * Pré-carregado com itens, locais urbanos, categorias e conversas realistas.
 */

const STORAGE_KEYS = {
  ITEMS: 'encontraai_items_v6',
  CONVERSATIONS: 'encontraai_conversations_v6',
  USER_PROFILE: 'encontraai_user_profile_v6',
  FAVORITES: 'encontraai_favorites_v6',
  ALERTS: 'encontraai_alerts_v6'
};

const INITIAL_CATEGORIES = {
  eletronicos: { id: 'eletronicos', name: 'Eletrônicos & Fones' },
  documentos: { id: 'documentos', name: 'Documentos & Cartões' },
  chaves: { id: 'chaves', name: 'Chaves & Crachás' },
  mochilas: { id: 'mochilas', name: 'Mochilas & Bolsas' },
  roupas: { id: 'roupas', name: 'Roupas & Agasalhos' },
  garrafas: { id: 'garrafas', name: 'Garrafas & Copos' },
  oculos: { id: 'oculos', name: 'Óculos & Acessórios' },
  outros: { id: 'outros', name: 'Outros Pertences' }
};

const INITIAL_ITEMS = [
  {
    id: 'EA-8492',
    title: 'Mochila Preta Dell com notebook e caderno de anotações',
    type: 'found', // 'found' or 'lost'
    category: 'mochilas',
    location: 'Biblioteca Mário de Andrade - 2º Andar',
    locationDetail: 'Sala de leitura, 2º andar, mesa 14, perto da janela - bairro do Sé',
    date: '2026-09-25',
    time: '16:40',
    image: 'recursos/imagens/mochila.jpg',
    thumbnails: [
      'recursos/imagens/mochila.jpg',
      'recursos/imagens/fone.jpg',
      'recursos/imagens/garrafa.jpg'
    ],
    status: 'active', // 'active', 'in_progress', 'resolved'
    securityQuestion: 'Qual o adesivo colado na tampa do notebook dentro dela?',
    securityAnswer: 'Adesivo da NASA e Python',
    description: 'Mochila reforçada preta da marca Dell em excelente estado de conservação. Contém um caderno espiral pautado, estojo com canetas e uma garrafa no bolso lateral. Deixada sobre a mesa de leitura no fim da tarde, na Biblioteca Mário de Andrade.',
    publicator: {
      name: 'Carlos Eduardo',
      initials: 'CE',
      role: 'Morador dos Campos Elíseos',
      verified: true,
      phone: '(11) 98765-4321',
      memberSince: 'Março de 2024'
    },
    views: 142,
    dateFormatted: 'Ontem às 16:40',
    isMyItem: false
  },
  {
    id: 'EA-7120',
    title: 'Chaveiro com 3 chaves e cordão azul',
    type: 'found',
    category: 'chaves',
    location: 'Estação de Metrô',
    locationDetail: 'Túnel de acesso, perto da catraca principal - Estação Sé',
    date: '2026-09-26',
    time: '08:15',
    image: 'recursos/imagens/chaves.jpg',
    thumbnails: [
      'recursos/imagens/chaves.jpg',
      'recursos/imagens/carteira.jpg'
    ],
    status: 'active',
    securityQuestion: 'O que está escrito na tag plástica azul?',
    securityAnswer: 'Residência 314, Bloco 2',
    description: 'Conjunto de três chaves prateadas de porta com um cordão azul trançado e uma etiqueta plástica azul. Encontrado caído no chão da Estação Sé, no Centro, perto da catraca principal.',
    publicator: {
      name: 'Cleiton',
      initials: 'C',
      role: 'Morador de Pinheiros',
      verified: true,
      phone: '(11) 99887-1122',
      memberSince: 'Janeiro de 2023'
    },
    views: 89,
    dateFormatted: 'Hoje às 08:15',
    isMyItem: true
  },
  {
    id: 'EA-6304',
    title: 'Carteira masculina de couro marrom com cartões',
    type: 'found',
    category: 'documentos',
    location: 'Ceasa',
    locationDetail: 'Restaurante Popular, mesa próxima ao caixa - bairro da Saúde',
    date: '2026-09-25',
    time: '12:30',
    image: 'recursos/imagens/carteira.jpg',
    thumbnails: [
      'recursos/imagens/carteira.jpg'
    ],
    status: 'active',
    securityQuestion: 'Qual o primeiro nome no cartão do banco no compartimento principal?',
    securityAnswer: 'Lucas',
    description: 'Carteira de couro legítimo marrom envelhecido. Contém cartão de transporte, cartão deConvênio e documentos pessoais. Entregue sob guarda segura no Centro de Distribuição da Ceasa, aguardando o verdadeiro titular.',
    publicator: {
      name: 'Mariana Silva',
      initials: 'MS',
      role: 'Moradora do Mooca',
      verified: true,
      phone: '(11) 97766-5544',
      memberSince: 'Agosto de 2023'
    },
    views: 215,
    dateFormatted: 'Há 1 dia',
    isMyItem: false
  },
  {
    id: 'EA-5891',
    title: 'Fone de ouvido Sony over-ear Bluetooth preto fosco',
    type: 'lost',
    category: 'eletronicos',
    location: 'Mercado Municipal',
    locationDetail: 'Corredor das frutas, ao lado dos caixas - Liberdade',
    date: '2026-09-24',
    time: '18:20',
    image: 'recursos/imagens/fone.jpg',
    thumbnails: [
      'recursos/imagens/fone.jpg'
    ],
    status: 'active',
    securityQuestion: 'Tem algum risco ou marcação específica na haste?',
    securityAnswer: 'Pequeno risco prata próximo ao botão de power',
    description: 'Esqueci meu fone de ouvido Sony wireless preto sobre a bancada ao lado dos caixas, no Mercadão, depois de terminar as compras. O fone tem valor alto para o meu trabalho. Recompensa para quem ajudar na localização!',
    publicator: {
      name: 'Felipe Andrade',
      initials: 'FA',
      role: 'Morador do Tatuapé',
      verified: true,
      phone: '(11) 96655-4433',
      memberSince: 'Fevereiro de 2024'
    },
    views: 310,
    dateFormatted: 'Há 2 dias',
    isMyItem: false
  },
  {
    id: 'EA-4921',
    title: 'Garrafa térmica azul Hydro Flask com bocal largo',
    type: 'found',
    category: 'garrafas',
    location: 'Auditório Ibirapuera',
    locationDetail: 'Fila D, poltrona 12 - bairro da Saúde',
    date: '2026-09-26',
    time: '09:40',
    image: 'recursos/imagens/garrafa.jpg',
    thumbnails: [
      'recursos/imagens/garrafa.jpg'
    ],
    status: 'active',
    securityQuestion: 'Quantos adesivos estão colados na base da garrafa?',
    securityAnswer: 'Dois adesivos',
    description: 'Garrafa térmica azul cobalto de 750ml, muito bem cuidada, encontrada no apoio de braço do auditório logo após o encerramento de um curso no Ibirapuera.',
    publicator: {
      name: 'Cleiton',
      initials: 'C',
      role: 'Morador de Pinheiros',
      verified: true,
      phone: '(11) 99887-1122',
      memberSince: 'Janeiro de 2023'
    },
    views: 64,
    dateFormatted: 'Hoje às 09:40',
    isMyItem: true
  },
  {
    id: 'EA-3310',
    title: 'Óculos de grau com armação tartaruga redonda e estojo',
    type: 'found',
    category: 'oculos',
    location: 'Biblioteca Mário de Andrade',
    locationDetail: 'Sala de periódicos e jornais, 1º andar - bairro do Sé',
    date: '2026-09-25',
    time: '15:10',
    image: 'recursos/imagens/oculos.jpg',
    thumbnails: [
      'recursos/imagens/oculos.jpg'
    ],
    status: 'active',
    securityQuestion: 'Qual a cor interna do estojo de proteção?',
    securityAnswer: 'Forro aveludado marrom',
    description: 'Óculos de grau com armação redonda em acetato tartaruga (marrom rajado), deixado sobre a mesa de leitura junto com um estojo de couro sintético.',
    publicator: {
      name: 'Helena Costa',
      initials: 'HC',
      role: 'Moradora da Vila Mariana',
      verified: true,
      phone: '(11) 95544-3322',
      memberSince: 'Agosto de 2022'
    },
    views: 98,
    dateFormatted: 'Ontem às 15:10',
    isMyItem: false
  }
];

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    itemId: 'EA-8492',
    itemTitle: 'Mochila Preta Dell com notebook e caderno',
    itemImage: 'recursos/imagens/mochila.jpg',
    itemStatus: 'active',
    itemCode: '#EA-8492',
    contact: {
      name: 'Mariana Silva',
      initials: 'MS',
      role: 'Moradora do Mooca',
      verified: true,
      online: true,
      avatarBg: '#0d8a74'
    },
    lastMessage: 'Perfeito! Você está por onde agora? Eu saio do trabalho às 17h.',
    lastTime: '14:32',
    unread: 1,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        text: 'Olá Cleiton! Vi que você cadastrou uma mochila preta encontrada na Biblioteca Mário de Andrade ontem...',
        time: '14:20'
      },
      {
        id: 'm2',
        sender: 'them',
        text: 'Acho que é a minha! Ela tem um chaveiro no zíper lateral e um caderno de anotações dentro.',
        time: '14:22'
      },
      {
        id: 'm3',
        sender: 'me',
        text: 'Oi Mariana! É essa mesma, acabei de conferir o caderno de anotações e o chaveiro. Podemos combinar de te devolver hoje?',
        time: '14:28'
      },
      {
        id: 'm4',
        sender: 'them',
        text: 'Perfeito! Você está por onde agora? Eu saio do trabalho às 17h.',
        time: '14:32'
      }
    ]
  },
  {
    id: 'conv-2',
    itemId: 'EA-7120',
    itemTitle: 'Chaveiro com 3 chaves e cordão azul',
    itemImage: 'recursos/imagens/chaves.jpg',
    itemStatus: 'resolved',
    itemCode: '#EA-7120',
    contact: {
      name: 'Lucas Mendes',
      initials: 'LM',
      role: 'Morador da Perdizes',
      verified: true,
      online: false,
      avatarBg: '#0284c7'
    },
    lastMessage: 'Muito obrigado por ter cadastrado as chaves! Já retirei na Biblioteca.',
    lastTime: 'Ontem',
    unread: 0,
    messages: [
      {
        id: 'm201',
        sender: 'them',
        text: 'Boa tarde! Essas chaves são do meu apartamento!',
        time: 'Ontem 16:00'
      },
      {
        id: 'm202',
        sender: 'me',
        text: 'Oi Lucas! Como eu passava por lá, deixei no balcão de informações da Biblioteca Mário de Andrade com o atendente Marcos.',
        time: 'Ontem 16:15'
      },
      {
        id: 'm203',
        sender: 'them',
        text: 'Muito obrigado por ter cadastrado as chaves! Já retirei na Biblioteca.',
        time: 'Ontem 17:30'
      }
    ]
  },
  {
    id: 'conv-3',
    itemId: 'EA-4921',
    itemTitle: 'Garrafa térmica azul Hydro Flask com bocal largo',
    itemImage: 'recursos/imagens/garrafa.jpg',
    itemStatus: 'active',
    itemCode: '#EA-4921',
    contact: {
      name: 'Camila Rocha',
      initials: 'CR',
      role: 'Moradora da Vila Madalena',
      verified: true,
      online: true,
      avatarBg: '#d97706'
    },
    lastMessage: 'Oi! A garrafa azul Hydro Flask ainda está com você?',
    lastTime: '11:15',
    unread: 1,
    messages: [
      {
        id: 'm301',
        sender: 'them',
        text: 'Oi! A garrafa azul Hydro Flask que você achou no Auditório Ibirapuera ainda está com você?',
        time: '11:15'
      }
    ]
  }
];

const INITIAL_PROFILE = {
  name: 'Cleiton',
  initials: 'C',
  email: 'cleiton@email.com',
  role: 'Morador de Pinheiros',
  bio: 'Ajudando a construir uma comunidade mais unida, honesta e colaborativa.',
  verified: true,
  stats: {
    posted: 12,
    returned: 9,
    successRate: '94%',
    points: 450,
    level: 'Guardião Ouro'
  },
  timeline: [
    {
      title: 'Mochila Dell devolvida com sucesso',
      desc: 'Entregue para Mariana Silva no ponto de encontro da Biblioteca Mário de Andrade',
      date: 'Ontem às 17h'
    },
    {
      title: 'Chaveiro com cordão cadastrado',
      desc: 'Encontrado na Estação Sé e anunciado no feed',
      date: 'Hoje às 08h15'
    },
    {
      title: 'Novo distintivo conquistado!',
      desc: 'Você atingiu 450 pontos e conquistou o nível Guardião Ouro',
      date: 'Há 3 dias'
    },
    {
      title: 'Calculadora Casio devolvida',
      desc: 'Reivindicada com sucesso por Pedro Alcantara',
      date: 'Semana passada'
    }
  ]
};

// Instância Única do Serviço de Dados
const DataService = {
  // Cópia profunda: impede que os dados semeados sejam corrompidos por mutação
  clone(data) {
    return JSON.parse(JSON.stringify(data));
  },

  getItems() {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      this.saveItems(INITIAL_ITEMS);
      return this.clone(INITIAL_ITEMS);
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.clone(INITIAL_ITEMS);
    }
  },

  saveItems(items) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  },

  getItemById(id) {
    const items = this.getItems();
    return items.find(i => i.id === id);
  },

  addItem(newItem) {
    const items = this.getItems();
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  },

  updateItem(updatedItem) {
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === updatedItem.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updatedItem };
      this.saveItems(items);
    }
  },

  deleteItem(id) {
    let items = this.getItems();
    items = items.filter(i => i.id !== id);
    this.saveItems(items);
  },

  // Fonte única de verdade para "Meus Itens": evita comparar com nome hardcoded
  getMyItems() {
    const profile = this.getProfile();
    return this.getItems().filter(i => i.isMyItem || (i.publicator && i.publicator.name === profile.name));
  },

  getConversations() {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) {
      this.saveConversations(INITIAL_CONVERSATIONS);
      return INITIAL_CONVERSATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  },

  saveConversations(convs) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
  },

  // Aplica a mutação no array já em mãos e grava.
  // getConversations() devolve um JSON.parse novo a cada chamada, então mutar
  // um objeto e depois salvar um novo parse descarta a alteração silenciosamente.
  updateConversation(convId, mutator) {
    const convs = this.getConversations();
    const conv = convs.find(c => c.id === convId);
    if (!conv) return null;

    mutator(conv);
    this.saveConversations(convs);
    return conv;
  },

  getUnreadTotal() {
    return this.getConversations()
      .reduce((total, c) => total + (Number(c.unread) || 0), 0);
  },

  getProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      this.saveProfile(INITIAL_PROFILE);
      return this.clone(INITIAL_PROFILE);
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.clone(INITIAL_PROFILE);
    }
  },

  saveProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // Iniciais derivadas do nome, com fallback para quem tem um único nome
  deriveInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    const letters = parts.map(p => p[0]).join('');
    return (parts.length === 1 ? letters[0] : letters.slice(0, 2)).toUpperCase();
  },

  // Renomeia o usuário e propaga a nova identidade para os itens já publicados
  renameProfile({ name, email, role, bio }) {
    const profile = this.getProfile();
    const cleanName = String(name == null ? '' : name).trim();

    if (cleanName) {
      profile.name = cleanName;
      profile.initials = this.deriveInitials(cleanName);
    }
    if (typeof email === 'string') profile.email = email.trim();
    if (typeof role === 'string' && role.trim()) profile.role = role.trim();
    if (typeof bio === 'string' && bio.trim()) profile.bio = bio.trim();

    this.saveProfile(profile);

    const items = this.getItems();
    let changed = false;
    items.forEach(item => {
      if (item.isMyItem && item.publicator) {
        item.publicator.name = profile.name;
        item.publicator.initials = profile.initials;
        item.publicator.role = profile.role;
        changed = true;
      }
    });
    if (changed) this.saveItems(items);

    return profile;
  },

  getFavorites() {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  },

  toggleFavorite(itemId) {
    let favs = this.getFavorites();
    if (favs.includes(itemId)) {
      favs = favs.filter(id => id !== itemId);
    } else {
      favs.push(itemId);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    return favs.includes(itemId);
  }
};
