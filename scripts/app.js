/**
 * ENCONTRAAÍ - CONTROLADOR PRINCIPAL DA APLICAÇÃO
 * Lógica interativa completa para as 8 telas do Figma.
 */

const app = {
  currentView: 'home',
  selectedItemId: null,
  activeConversationId: null,
  homeFilter: 'all',
  feedTypeFilter: 'all',
  currentDashFilter: 'all',
  uploadedImageSrc: null,
  isLoggedIn: true,
  // Respostas pendentes indexadas por conversa. Com um único slot global, uma
  // resposta armada na conversa A era descartada ao enviar na conversa B.
  pendingReplies: new Map(),
  defaultAvatarBg: '#0d8a74',

  // ==========================================================================
  // HELPERS DE SEGURANÇA (renderização)
  // ==========================================================================

  // Escape de HTML: todo dado vindo do usuário/ storage é interpolado em
  // templates, então precisa ser escapado antes de chegar no innerHTML.
  escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Cores vêm do storage e entram num style="background: ...".
  // Só aceitamos hex, senão cai na cor padrão.
  safeColor(value, fallback) {
    const fallbackColor = fallback || this.defaultAvatarBg;
    return /^#[0-9a-fA-F]{3,8}$/.test(String(value || '').trim())
      ? String(value).trim()
      : fallbackColor;
  },

  // Normaliza texto para comparação: minúsculas, sem acento e sem pontuação.
  normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Escrita segura em elemento do DOM: se o elemento não existir, não estoura
  // "Cannot read properties of null" no meio de um clique e deixa a tela
  // pela metade. Devolve o elemento (ou null) para o chamador poder encadear.
  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value === null || value === undefined ? '' : value;
    return el;
  },

  setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value === null || value === undefined ? '' : value;
    return el;
  },

  setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el && value !== null && value !== undefined && value !== '') el.setAttribute(attr, value);
    return el;
  },

  setStyleBg(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.background = value;
    return el;
  },

  // Initialization
  init() {
    this.bindEvents();
    this.renderHome();
    this.renderFeed();
    this.renderConversations();
    this.renderDashboard();
    this.renderProfile();

    // Verifica o hash da URL para links diretos
    const hash = window.location.hash.replace('#', '');
    this.navigateTo(this.isKnownView(hash) ? hash : 'home');
  },

  // Ouvintes de Eventos
  bindEvents() {
    // Botão/gesto de voltar do navegador. navigateTo empilha uma entrada de
    // histórico por navegação, mas sem este listener o hash mudava e a view
    // continuava a mesma: no celular a pessoa ficava presa no chat e achava
    // que o app tinha bugado.
    window.addEventListener('hashchange', () => {
      const view = window.location.hash.replace('#', '');
      if (view && view !== this.currentView && this.isKnownView(view)) {
        this.applyView(view);
      }
    });

    // Busca do cabeçalho ao pressionar Enter
    const headerInput = document.getElementById('header-search-input');
    if (headerInput) {
      headerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = headerInput.value.trim();
          if (q) {
            this.navigateTo('feed');
            const feedSearch = document.getElementById('feed-search-input');
            if (feedSearch) {
              feedSearch.value = q;
              this.triggerFilterUpdate();
            }
          }
        }
      });
    }

    // Arrastar e soltar no cadastro de item
    const dropzone = document.getElementById('item-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag-over');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.processImageFile(files[0]);
        }
      });
    }

    // Fecha os popovers ao clicar fora
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('user-dropdown-popover');
      const avatarBtn = document.getElementById('btn-user-avatar');
      if (popover && avatarBtn && !popover.contains(e.target) && !avatarBtn.contains(e.target)) {
        popover.classList.remove('show');
      }
    });

    // Data de hoje como padrão no cadastro de item
    const dateInput = document.getElementById('item-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  },

  // Sistema de Navegação de Views
  isKnownView(name) {
    return ['home', 'feed', 'create-item', 'messages', 'my-items', 'profile'].includes(name);
  },

  navigateTo(viewName) {
    if (!this.isKnownView(viewName)) viewName = 'home';

    // Não empilha uma entrada de histórico quando já estamos na view: sem
    // esta checagem, cada ida e volta no histórico exigia vários "voltar".
    if (window.location.hash.replace('#', '') !== viewName) {
      window.location.hash = viewName;
    }

    this.applyView(viewName);
  },

  // Aplica a view sem mexer no histórico. Fica separado de navigateTo para o
  // listener de hashchange poder reagir ao botão Voltar sem criar outra
  // entrada de histórico.
  applyView(viewName) {
    this.currentView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Atualiza a visibilidade das seções
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Atualiza o destaque dos links de navegação
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-nav') === viewName) {
        btn.classList.add('active');
      }
    });

    // Atualiza o contexto se necessário
    if (viewName === 'home') {
      this.renderHome();
    } else if (viewName === 'feed') {
      this.triggerFilterUpdate();
    } else if (viewName === 'my-items') {
      this.renderDashboard();
    } else if (viewName === 'messages') {
      // openConversation já redesenha a lista de conversas (e cobre o caso
      // sem conversa nenhuma). Chamar renderConversations aqui renderizava a
      // lista duas vezes, recriando o item sob o dedo da pessoa.
      this.openConversation(this.activeConversationId);
    } else if (viewName === 'profile') {
      this.renderProfile();
    }
  },

  goBack() {
    this.navigateTo('feed');
  },

  toggleUserMenu() {
    const pop = document.getElementById('user-dropdown-popover');
    if (pop) pop.classList.toggle('show');
  },

  // ==========================================================================
  // VISÃO 1: LÓGICA DA PÁGINA INICIAL
  // ==========================================================================
  handleHeroAction(action) {
    if (action === 'lost') {
      this.setFeedTypeFilter('lost');
      this.navigateTo('feed');
      this.showToast('Filtrando por itens perdidos cadastrados em São Paulo.', 'info');
    } else if (action === 'found') {
      this.setCreateItemType('found');
      this.navigateTo('create-item');
      this.showToast('Obrigado por ajudar! Preencha os detalhes do item encontrado.', 'success');
    }
  },

  renderHome() {
    this.renderHomeCategories();
    this.renderHomeLiveActivity();
    this.renderHomeRecentItems();
  },

  renderHomeCategories() {
    const container = document.getElementById('categories-chips-container');
    if (!container) return;

    const items = DataService.getItems();
    const categories = Object.values(INITIAL_CATEGORIES);

    container.innerHTML = categories.map(cat => {
      const count = items.filter(i => i.category === cat.id).length;
      return `
        <div class="category-card" onclick="app.selectCategoryFilter('${cat.id}')">
          <span class="category-name">${cat.name.split('&')[0]}</span>
          <span class="category-count">${count} ${count === 1 ? 'item' : 'itens'}</span>
        </div>
      `;
    }).join('');
  },

  renderHomeLiveActivity() {
    const container = document.getElementById('hero-activity-list');
    if (!container) return;

    const items = DataService.getItems().slice(0, 3);
    container.innerHTML = items.map(item => `
      <div class="activity-item-row" onclick="app.openItemDetail('${item.id}')">
        <img class="activity-item-thumb" src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.title)}" />
        <div class="activity-item-info">
          <div class="activity-item-title">${this.escapeHtml(item.title)}</div>
          <div class="activity-item-meta">
            <span class="activity-status-pill ${item.status === 'resolved' ? 'resolved' : 'found'}">
              ${item.status === 'resolved' ? '✓ DEVOLVIDO' : (item.type === 'found' ? 'ACHADO' : 'PERDIDO')}
            </span>
            <span>• ${this.escapeHtml(item.location.split('-')[0].trim())}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderHomeRecentItems() {
    const grid = document.getElementById('home-recent-items-grid');
    if (!grid) return;

    let items = DataService.getItems();
    if (this.homeFilter === 'found') {
      items = items.filter(i => i.type === 'found');
    } else if (this.homeFilter === 'lost') {
      items = items.filter(i => i.type === 'lost');
    }

    const recents = items.slice(0, 6);
    grid.innerHTML = recents.map(item => this.createItemCardHtml(item)).join('');
  },

  filterHomeItems(filterType) {
    this.homeFilter = filterType;
    document.querySelectorAll('.filter-tabs-pill .tab-pill').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === filterType) {
        btn.classList.add('active');
      }
    });
    this.renderHomeRecentItems();
  },

  executeHomeSearch() {
    const query = document.getElementById('home-search-query').value.trim();
    const cat = document.getElementById('home-search-category').value;
    const loc = document.getElementById('home-search-location').value;

    this.navigateTo('feed');

    if (query) {
      document.getElementById('feed-search-input').value = query;
    }
    if (loc) {
      document.getElementById('feed-filter-location').value = loc;
    }
    if (cat) {
      document.querySelectorAll('#feed-category-checkboxes input').forEach(chk => {
        chk.checked = (chk.value === cat);
      });
    }

    this.triggerFilterUpdate();
  },

  selectCategoryFilter(catId) {
    this.navigateTo('feed');
    document.querySelectorAll('#feed-category-checkboxes input').forEach(chk => {
      chk.checked = (chk.value === catId);
    });
    this.triggerFilterUpdate();
  },

  // HTML do Cartão Auxiliar
  createItemCardHtml(item) {
    const isFav = DataService.getFavorites().includes(item.id);
    const catObj = INITIAL_CATEGORIES[item.category] || { name: item.category };

    return `
      <div class="item-card" onclick="app.openItemDetail('${item.id}')">
        <div class="item-card-media">
          <img class="item-card-img" src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.title)}" loading="lazy" />
          <div class="item-badge-corner">
            <span class="badge-status ${item.status === 'resolved' ? 'badge-resolved' : (item.type === 'found' ? 'badge-found' : 'badge-lost')}">
              ${item.status === 'resolved' ? '✓ Devolvido' : (item.type === 'found' ? 'Achado' : 'Perdido')}
            </span>
          </div>
          <button class="item-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${item.id}', this)" title="Salvar item">
            <svg viewBox="0 0 20 20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <div class="item-card-body">
          <div class="item-card-meta-top">
            <span class="item-card-category">${this.escapeHtml(catObj.name.split('&')[0])}</span>
            <span>${this.escapeHtml(item.dateFormatted || item.date)}</span>
          </div>

          <h3 class="item-card-title">${this.escapeHtml(item.title)}</h3>
          <p class="item-card-desc">${this.escapeHtml(item.description)}</p>

          <div class="item-card-location">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <span>${this.escapeHtml(item.location)}</span>
          </div>

          <div class="item-card-footer">
            <button class="btn btn-outline btn-card-details" onclick="event.stopPropagation(); app.openItemDetail('${item.id}')">
              Ver Detalhes &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // VISÃO 2: LÓGICA DO FEED E DA BUSCA AVANÇADA
  // ==========================================================================
  renderFeed() {
    this.updateCategoryCounters();
    this.triggerFilterUpdate();
  },

  updateCategoryCounters() {
    const items = DataService.getItems();
    Object.keys(INITIAL_CATEGORIES).forEach(catId => {
      const countEl = document.getElementById(`count-cat-${catId}`);
      if (countEl) {
        countEl.textContent = items.filter(i => i.category === catId).length;
      }
    });
  },

  setFeedTypeFilter(type) {
    this.feedTypeFilter = type;
    document.querySelectorAll('.type-segmented-control .seg-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-type') === type) {
        btn.classList.add('active');
      }
    });
    this.triggerFilterUpdate();
  },

  applyQuickFilter(term) {
    const feedSearch = document.getElementById('feed-search-input');
    if (feedSearch) {
      feedSearch.value = term;
      this.triggerFilterUpdate();
    }
  },

  clearAllFilters() {
    document.getElementById('feed-search-input').value = '';
    document.getElementById('feed-filter-location').value = '';
    document.getElementById('feed-filter-period').value = 'all';
    document.getElementById('feed-filter-unresolved').checked = false;
    document.querySelectorAll('#feed-category-checkboxes input').forEach(chk => {
      chk.checked = true;
    });
    this.setFeedTypeFilter('all');
    this.showToast('Filtros restaurados com sucesso.', 'info');
  },

  triggerFilterUpdate() {
    const query = (document.getElementById('feed-search-input')?.value || '').toLowerCase().trim();
    const location = document.getElementById('feed-filter-location')?.value || '';
    const period = document.getElementById('feed-filter-period')?.value || 'all';
    const unresolvedOnly = document.getElementById('feed-filter-unresolved')?.checked ?? true;
    const sortVal = document.getElementById('feed-sort-select')?.value || 'recent';

    // Categorias marcadas
    const selectedCats = [];
    document.querySelectorAll('#feed-category-checkboxes input:checked').forEach(chk => {
      selectedCats.push(chk.value);
    });

    let items = DataService.getItems();

    // 1. Filter by Type
    if (this.feedTypeFilter !== 'all') {
      items = items.filter(i => i.type === this.feedTypeFilter);
    }

    // 2. Filter by Category
    if (selectedCats.length > 0) {
      items = items.filter(i => selectedCats.includes(i.category));
    }

    // 3. Filter by Location
    if (location) {
      items = items.filter(i => i.location.includes(location));
    }

    // 4. Filter by Unresolved Only
    if (unresolvedOnly) {
      items = items.filter(i => i.status !== 'resolved');
    }

    // 5. Filter by Query
    if (query) {
      items = items.filter(i => 
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        i.id.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortVal === 'recent') {
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortVal === 'oldest') {
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortVal === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Renderiza a Grade
    const grid = document.getElementById('feed-items-grid');
    const emptyState = document.getElementById('feed-empty-state');
    const countText = document.getElementById('results-count-text');

    if (countText) {
      countText.innerHTML = `Exibindo <strong>${items.length}</strong> de <strong>${DataService.getItems().length}</strong> itens`;
    }

    if (items.length === 0) {
      if (grid) grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (grid) {
        grid.style.display = 'grid';
        grid.innerHTML = items.map(item => this.createItemCardHtml(item)).join('');
      }
      if (emptyState) emptyState.style.display = 'none';
    }
  },

  // ==========================================================================
  // VISÃO 3: MODAL/VIEW DE DETALHES DO ITEM (TELA 3 DO FIGMA)
  // ==========================================================================
  openItemDetail(itemId) {
    const item = DataService.getItemById(itemId);
    if (!item) return;

    this.selectedItemId = itemId;
    this.navigateTo('item-detail');

    const content = document.getElementById('detail-dynamic-content');
    if (!content) return;

    const catObj = INITIAL_CATEGORIES[item.category] || { name: item.category };
    const thumbnails = item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails : [item.image];

    content.innerHTML = `
      <!-- Coluna Esquerda: Galeria e Publicador -->
      <div class="detail-gallery-col">
        <div class="detail-main-photo-wrapper">
          <img id="detail-active-photo" class="detail-main-photo" src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.title)}" />
        </div>

        <div class="detail-thumbs-row">
          ${thumbnails.map((t, idx) => `
            <div class="detail-thumb ${idx === 0 ? 'active' : ''}" onclick="app.switchDetailPhoto('${t}', this)">
              <img src="${t}" alt="Miniatura ${idx + 1}" />
            </div>
          `).join('')}
        </div>

        <!-- Cartão do Publicador (Tela 3 do Figma) -->
        <div class="publicator-card">
          <div class="publicator-info">
            <div class="publicator-avatar">${this.escapeHtml(item.publicator.initials)}</div>
            <div>
              <div class="publicator-name">${this.escapeHtml(item.publicator.name)}</div>
              <div class="publicator-badge">✓ ${this.escapeHtml(item.publicator.role)}</div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="app.showToast('Membro da comunidade com reputação verificada!', 'info')">
            Ver Perfil
          </button>
        </div>
      </div>

      <!-- Coluna Direita: Informações e Ações -->
      <div class="detail-info-col">
        <div class="detail-badge-row">
          <span class="badge-status ${item.status === 'resolved' ? 'badge-resolved' : (item.type === 'found' ? 'badge-found' : 'badge-lost')}">
            ${item.status === 'resolved' ? '✓ Devolvido' : (item.type === 'found' ? 'Achado' : 'Perdido')}
          </span>
          <span class="detail-item-id">Código: ${item.id}</span>
        </div>

        <h1 class="detail-title">${this.escapeHtml(item.title)}</h1>

        <div class="detail-meta-list">
          <div class="meta-entry">
            <span class="meta-entry-label">Categoria</span>
            <span class="meta-entry-val">${this.escapeHtml(catObj.name)}</span>
          </div>
          <div class="meta-entry">
            <span class="meta-entry-label">Data do Registro</span>
            <span class="meta-entry-val">${this.escapeHtml(item.dateFormatted || item.date)}</span>
          </div>
          <div class="meta-entry">
            <span class="meta-entry-label">Localização Exata</span>
            <span class="meta-entry-val">${this.escapeHtml(item.location)}</span>
          </div>
          <div class="meta-entry">
            <span class="meta-entry-label">Ponto de Referência</span>
            <span class="meta-entry-val">${this.escapeHtml(item.locationDetail || 'Não especificado')}</span>
          </div>
        </div>

        <div class="detail-desc-box">
          <h4>Descrição Completa do Objeto</h4>
          <p>${this.escapeHtml(item.description)}</p>
        </div>

        <!-- Caixa de Verificação de Segurança (Tela 3 do Figma) -->
        <div class="security-validation-box">
          <div class="sec-box-header">
            Pergunta de Comprovação de Propriedade
          </div>
          <p class="sec-box-prompt">"${this.escapeHtml(item.securityQuestion || 'Qual o detalhe específico que só o dono sabe?')}"</p>
          <div class="sec-input-row">
            <input type="text" id="detail-sec-input" placeholder="Digite sua resposta para validar a posse..." />
            <button class="btn btn-sm btn-primary" onclick="app.validateSecurityAnswer('${item.id}')">Validar</button>
          </div>
          <small id="sec-validation-feedback" style="display: none; margin-top: 6px; font-weight: 700;"></small>
        </div>

        <!-- Botões de Ação -->
        <div class="detail-cta-row">
          ${item.isMyItem ? `
            <div class="detail-own-item-note">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zm1 14H9v-6h2v6zm0-8H9V5h2v2z" clip-rule="evenodd"/></svg>
              Este é o seu anúncio. Gerencie-o pelo painel “Meus Itens”.
            </div>
          ` : `
            <button class="btn btn-primary btn-lg" onclick="app.startChatForItem('${item.id}')">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clip-rule="evenodd"/></svg>
              Entrar em Contato (Chat)
            </button>
            <button class="btn btn-secondary btn-lg" onclick="app.openClaimModal('${item.id}')">
              Reivindicar Item
            </button>
          `}
        </div>
      </div>
    `;

    // Renderiza os Itens Relacionados
    this.renderRelatedItems(item);
  },

  switchDetailPhoto(src, thumbEl) {
    const mainImg = document.getElementById('detail-active-photo');
    if (mainImg) mainImg.src = src;

    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  },

  // Valida a resposta da pergunta de segurança por aproximação de palavras.
  // Antes bastava 4 caracteres quaisquer (|| answer.length > 3), então "xxxx"
  // era aceito. Aqui: normaliza, compara palavras com 3+ caracteres e exige
  // pelo menos 1 acerto cobrindo 50% do esperado.
  scoreSecurityAnswer(expected, answer) {
    const words = text => this.normalizeText(text).split(' ').filter(w => w.length >= 3);

    const expectedWords = [...new Set(words(expected))];
    const answerWords = [...new Set(words(answer))];

    if (expectedWords.length === 0) return null; // anúncio sem pergunta de segurança
    if (answerWords.length === 0) return 0;

    const matched = expectedWords.filter(w => answerWords.includes(w)).length;
    const coverage = matched / expectedWords.length;

    return (matched >= 1 && coverage >= 0.5) ? 1 : 0;
  },

  validateSecurityAnswer(itemId) {
    const item = DataService.getItemById(itemId);
    const input = document.getElementById('detail-sec-input');
    const feedback = document.getElementById('sec-validation-feedback');
    if (!item || !input || !feedback) return;

    const answer = input.value.trim();
    feedback.style.display = 'block';

    if (!answer) {
      feedback.style.color = '#dc2626';
      feedback.textContent = 'Digite sua resposta para validar a posse.';
      return;
    }

    const result = this.scoreSecurityAnswer(item.securityAnswer, answer);

    if (result === null) {
      feedback.style.color = '#b45309';
      feedback.textContent = 'Este anúncio não define pergunta de segurança. Confirme o item com o anunciante pelo chat.';
      this.showToast('Anúncio sem pergunta de segurança.', 'info');
      return;
    }

    if (result === 1) {
      feedback.style.color = '#059669';
      feedback.textContent = '✓ Resposta compatível! Inicie o chat com o anunciante para combinar a entrega segura.';
      this.showToast('Resposta de comprovação aceita com sucesso!', 'success');
    } else {
      feedback.style.color = '#dc2626';
      feedback.textContent = 'A resposta não confere. Confira a pergunta exibida e tente de novo, ou esclareça pelo chat.';
      this.showToast('Resposta de comprovação não confere.', 'error');
    }
  },

  renderRelatedItems(currentItem) {
    const container = document.getElementById('detail-related-grid');
    if (!container) return;

    const related = DataService.getItems()
      .filter(i => i.id !== currentItem.id && (i.category === currentItem.category || i.location.includes(currentItem.location.split('-')[0].trim())))
      .slice(0, 3);

    if (related.length === 0) {
      container.innerHTML = `<p class="text-muted">Nenhum outro item cadastrado nesta mesma área no momento.</p>`;
    } else {
      container.innerHTML = related.map(item => this.createItemCardHtml(item)).join('');
    }
  },

  shareCurrentItem() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Link do anúncio copiado para a área de transferência!', 'success');
    } else {
      this.showToast('Link: ' + window.location.href, 'info');
    }
  },

  toggleFavorite(itemId, btn) {
    const isNowFav = DataService.toggleFavorite(itemId);
    if (btn) {
      btn.classList.toggle('active', isNowFav);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isNowFav ? 'currentColor' : 'none');
    }
    this.showToast(isNowFav ? 'Item salvo nos seus favoritos!' : 'Item removido dos favoritos.', 'info');
  },

  toggleCurrentFavorite() {
    if (!this.selectedItemId) return;
    const btn = document.getElementById('btn-favorite-item');
    this.toggleFavorite(this.selectedItemId, btn);
  },

  // ==========================================================================
  // VISÃO 4: CRIAR / REPORTAR ITEM (TELA 5 DO FIGMA)
  // ==========================================================================
  setCreateItemType(type) {
    const optFound = document.getElementById('type-opt-found');
    const optLost = document.getElementById('type-opt-lost');
    const radioFound = document.querySelector('input[name="item_type"][value="found"]');
    const radioLost = document.querySelector('input[name="item_type"][value="lost"]');
    const secBox = document.getElementById('security-question-card');

    if (type === 'found') {
      optFound?.classList.add('active');
      optLost?.classList.remove('active');
      if (radioFound) radioFound.checked = true;
      if (secBox) secBox.style.display = 'block';
    } else {
      optFound?.classList.remove('active');
      optLost?.classList.add('active');
      if (radioLost) radioLost.checked = true;
      if (secBox) secBox.style.display = 'none';
    }
  },

  // A câmera do celular só abre direto com capture="environment". Manter dois
  // inputs separados dá o caminho explícito sem tirar o de escolher da galeria.
  openPhotoSource(source) {
    const input = document.getElementById(source === 'camera' ? 'file-input-camera' : 'file-input-gallery');
    if (input) input.click();
  },

  handleImageFileSelect(e) {
    const input = e.target;
    const file = input.files && input.files[0];

    // Zerar o value devolve o controle a "nada selecionado". Sem isto,
    // escolher a mesma foto duas vezes seguidas não dispara o change.
    input.value = '';

    if (file) {
      this.processImageFile(file);
    }
  },

  // Guardar o arquivo original em base64 estoura a cota do localStorage em
  // poucos MB, e o item nunca é salvo. Reduzimos para no máximo 1280px e
  // JPEG de qualidade 0.72, o que cabe folgadamente em base64.
  processImageFile(file) {
    if (!file) return;

    // "image/*" aceita SVG, que passa pela checagem e depois quebra a galeria
    // e o preview. HEIC entra porque é o formato nativo do iPhone e o
    // accept="image/*" do input deixa passar em qualquer iOS moderno.
    const rasterTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const type = String(file.type || '').toLowerCase();
    const isRaster = type
      ? rasterTypes.includes(type)
      : /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || '');
    if (!isRaster) {
      this.showToast('Selecione uma foto (JPG, PNG, WEBP ou HEIC).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('A imagem deve ter no máximo 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => this.showToast('Não foi possível ler a imagem.', 'error');
    reader.onload = (event) => {
      this.compressImage(event.target.result)
        .then(src => {
          if (!src) {
            this.showToast('Este navegador não conseguiu abrir a foto. Salve em JPG e tente de novo.', 'error');
            return;
          }
          this.setSampleImage(src);
          this.showToast('Foto carregada com sucesso!', 'success');
        })
        .catch(() => this.showToast('Não foi possível processar a imagem.', 'error'));
    };
    reader.readAsDataURL(file);
  },

  // Redimensiona via canvas e reexporta em JPEG. Devolve null quando o
  // navegador não decodifica a imagem (HEIC no Android, por exemplo): antes
  // devolvia o data URL original, que ia para o localStorage e não aparecia
  // nem no preview nem no feed — o anúncio ficava com foto quebrada.
  compressImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        // 900px/0.68 em vez de 1280px/0.72: corta o base64 de ~180KB para
        // ~70KB sem perda visível num anúncio de celular, e é exatamente esse
        // base64 que estoura a cota de ~5MB do localStorage — fewas fotos já
        // travavam o app. Continua sendo compressão, não reencode do
        // original: a origem só é reduzida se passar de maxSide.
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        try {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.68));
        } catch {
          resolve(null);
        }
      };
      img.src = dataUrl;
    });
  },

  setSampleImage(src) {
    this.uploadedImageSrc = src;
    const previewArea = document.getElementById('uploaded-previews-area');
    const imgElement = document.getElementById('image-preview-element');
    if (previewArea && imgElement) {
      imgElement.src = src;
      previewArea.style.display = 'block';
    }
  },

  clearUploadedImage() {
    this.uploadedImageSrc = null;
    const previewArea = document.getElementById('uploaded-previews-area');
    if (previewArea) previewArea.style.display = 'none';
    ['file-input-camera', 'file-input-gallery'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
  },

  handleLocationPresetChange() {
    const preset = document.getElementById('item-location-preset').value;
    const detail = document.getElementById('item-location-detail');
    if (detail) {
      detail.placeholder = preset
        ? `Ex: ${preset} - ponto de referência`
        : 'Ex: prunedão, 2º andar, perto da janela - bairro do Sé';
    }
  },

  handleCreateItemSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('item-title').value.trim();
    const category = document.getElementById('item-category').value;
    const date = document.getElementById('item-date').value;
    const location = document.getElementById('item-location-preset').value;
    const locationDetail = document.getElementById('item-location-detail').value.trim();
    const description = document.getElementById('item-description').value.trim();
    const securityQuestion = document.getElementById('item-security-question')?.value.trim() || 'Descreva marcas ou itens internos específicos';
    const securityAnswer = document.getElementById('item-security-answer')?.value.trim() || '';
    const type = document.querySelector('input[name="item_type"]:checked')?.value || 'found';

    if (!title || !category || !date || !location || !description) {
      this.showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const randomId = 'EA-' + Math.floor(1000 + Math.random() * 9000);
    const profile = DataService.getProfile();

    const newItem = {
      id: randomId,
      title,
      type,
      category,
      // Componho o detalhe no location: a tabela de "Meus Itens" mostra só
      // este campo, então guardar o preset sozinho exibia um endereço incompleto.
      location: [location, locationDetail].filter(Boolean).join(' - '),
      locationDetail,
      date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: this.uploadedImageSrc || 'recursos/imagens/mochila.jpg',
      thumbnails: [this.uploadedImageSrc || 'recursos/imagens/mochila.jpg'],
      status: 'active',
      securityQuestion,
      securityAnswer,
      description,
      publicator: {
        name: profile.name,
        initials: profile.initials,
        role: profile.role,
        verified: true,
        phone: '(11) 99887-1122',
        memberSince: 'Setembro de 2026'
      },
      views: 1,
      dateFormatted: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMyItem: true
    };

    // addItem devolve null quando a cota do localStorage estoura. Resetar o
    // form nesse caso perderia tudo que o usuário preencheu sem aviso.
    if (!DataService.addItem(newItem)) {
      this.showToast('Não foi possível salvar: espaço de armazenamento cheio. Tente uma foto menor.', 'error');
      return;
    }

    // Atualiza as estatísticas do perfil
    profile.stats.posted += 1;
    profile.timeline.unshift({
      title: `${type === 'found' ? 'Novo achado' : 'Item perdido'} anunciado: ${title}`,
      desc: `Registrado em ${newItem.location}`,
      date: 'Agora mesmo'
    });
    DataService.saveProfile(profile);

    this.showToast('Anúncio publicado com sucesso no EncontraAÍ!', 'success');
    this.resetCreateItemForm(e.target);

    // Abre o detalhe do item criado
    this.openItemDetail(newItem.id);
  },

  // Devolve o formulário ao estado inicial de forma coerente. Um e.target.reset()
  // sozinho não serve: ele devolve o radio para "found" mas mantém o destaque
  // visual em "lost", deixa o card de pergunta de segurança oculto e esvazia a
  // data, que só recebia o default de "hoje" uma única vez no bindEvents.
  resetCreateItemForm(form) {
    if (form) form.reset();

    this.setCreateItemType('found');
    this.clearUploadedImage();

    const dateInput = document.getElementById('item-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    const detail = document.getElementById('item-location-detail');
    if (detail) detail.placeholder = 'Ex: prunedão, 2º andar, perto da janela - bairro do Sé';
  },

  // ==========================================================================
  // VISÃO 5: CHAT E MENSAGENS (TELA 6 DO FIGMA)
  // ==========================================================================
  renderConversations() {
    const list = document.getElementById('conversations-list');
    if (!list) return;

    const convs = DataService.getConversations();
    const q = (document.getElementById('conv-search-input')?.value || '').toLowerCase().trim();

    const visible = convs.filter(c => {
      if (!q) return true;
      return this.normalizeText(`${c.contact?.name} ${c.itemTitle} ${c.lastMessage}`).includes(this.normalizeText(q));
    });

    if (visible.length === 0) {
      list.innerHTML = `
        <div class="conv-list-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3>${q ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</h3>
          <p>${q ? 'Tente outro termo de busca.' : 'Encontre um item e toque em “Entrar em Contato” para começar.'}</p>
        </div>`;
      this.updateUnreadBadge();
      return;
    }

    list.innerHTML = visible.map(c => {
      const id = this.escapeHtml(c.id);
      const unread = Number(c.unread) || 0;
      return `
      <div class="conv-item ${c.id === this.activeConversationId ? 'active' : ''}" data-conv-id="${id}" onclick="app.openConversation('${id}')">
        <div class="conv-avatar-box">
          <div class="conv-avatar" style="background: ${this.safeColor(c.contact?.avatarBg)};">
            ${this.escapeHtml(c.contact?.initials)}
          </div>
          ${c.contact?.online ? '<span class="conv-online-dot"></span>' : ''}
        </div>
        <div class="conv-details">
          <div class="conv-row-top">
            <span class="conv-name">${this.escapeHtml(c.contact?.name)}</span>
            <span class="conv-time">${this.escapeHtml(c.lastTime)}</span>
          </div>
          <div class="conv-item-tag">${this.escapeHtml(c.itemTitle)}</div>
          <div class="conv-snippet">${this.escapeHtml(c.lastMessage)}</div>
        </div>
        ${unread > 0 ? `<span class="conv-unread-bubble">${unread}</span>` : ''}
      </div>`;
    }).join('');

    this.updateUnreadBadge();
  },

  // Badge do menu: soma de todas as não lidas, escondido quando zero.
  updateUnreadBadge() {
    const badge = document.getElementById('unread-messages-badge');
    if (!badge) return;

    const total = DataService.getUnreadTotal();
    badge.textContent = total > 99 ? '99+' : String(total);
    badge.title = total > 0 ? `${total} mensagem${total > 1 ? 'ns' : ''} não lida${total > 1 ? 's' : ''}` : '';
    badge.setAttribute('aria-label', badge.title || 'Nenhuma mensagem não lida');
    badge.style.display = total > 0 ? 'inline-flex' : 'none';
  },

  filterConversations() {
    this.renderConversations();
  },

  openConversation(convId) {
    // Busca sem gravar: o painel não pode depender de uma escrita bem-sucedida
    // no localStorage para abrir. Se o id não existir mais (dados limpos, bump
    // de schema, conversa removida), caímos na primeira conversa disponível em
    // vez de abortar e deixar a tela com os dados da conversa anterior.
    const conversations = DataService.getConversations();
    const target = conversations.find(c => c.id === convId) || conversations[0] || null;

    if (!target) {
      this.renderNoConversation();
      return;
    }

    this.activeConversationId = target.id;

    // O campo de texto é markup estático e sobrevive à troca de view. Sem isto,
    // o que a pessoa digitou na conversa A era enviado para a conversa B.
    const input = document.getElementById('chat-input-field');
    if (input) input.value = '';

    // Zera as não lidas só quando há algo a zerar. Uma falha de cota não pode
    // travar o painel: a conversa abre e a não lida volta a aparecer.
    if (Number(target.unread) || 0) {
      if (DataService.updateConversation(target.id, c => { c.unread = 0; })) {
        target.unread = 0;
      }
    }

    // Não cancela a resposta pendente: ela sempre deve chegar. O timer
    // guarda a própria conversa e só redesenha se ela ainda for a ativa,
    // senão vira não-lida. Só escondemos o indicador quando a conversa
    // pendente é outra, para o nome do contato não vazar para a tela errada.
    this.syncTypingIndicator(target.id);
    this.renderConversations();

    // O local vem do anúncio, não de um texto fixo.
    const item = target.itemId ? DataService.getItemById(target.itemId) : null;
    const locationParts = [
      item?.location,
      item?.locationDetail
    ].filter(Boolean);

    this.setAttr('chat-banner-item-thumb', 'src', target.itemImage);
    this.setText('chat-banner-item-title', target.itemTitle);
    this.setText('chat-banner-item-code', target.itemCode);
    this.setText('chat-banner-item-location', locationParts.length
      ? locationParts.join(' · ')
      : 'Local não informado');

    const statusBadge = document.getElementById('chat-banner-status-badge');
    if (statusBadge) {
      statusBadge.textContent = target.itemStatus === 'resolved' ? 'DEVOLVIDO' : 'EM ANDAMENTO';
      statusBadge.className = `badge-status ${target.itemStatus === 'resolved' ? 'badge-resolved' : 'badge-found'}`;
    }

    this.setText('chat-active-name', target.contact?.name);
    this.setText('chat-active-avatar', target.contact?.initials);
    this.setStyleBg('chat-active-avatar', this.safeColor(target.contact?.avatarBg));
    this.setHtml('chat-active-status', target.contact?.online
      ? '<span class="status-dot green"></span> Online agora'
      : '<span class="status-dot"></span> Visto recentemente');

    // Renderiza os balões de mensagem
    this.renderChatMessages(target);
  },

  // Não há conversa alguma (primeiro uso, storage limpo, tudo removido).
  // O painel precisa de um estado próprio: sem isso ele ficava mostrando o
  // HTML fixo do index.html enquanto a lista ao lado já estava vazia.
  renderNoConversation() {
    this.activeConversationId = null;
    this.renderConversations();

    const banner = document.getElementById('chat-item-banner');
    if (banner) banner.style.display = 'none';

    this.setText('chat-active-name', 'Nenhuma conversa');
    this.setText('chat-active-avatar', '—');
    this.setHtml('chat-active-status', 'Selecione ou inicie uma conversa pela lista ao lado.');

    const typing = document.getElementById('chat-typing-indicator');
    if (typing) typing.style.display = 'none';

    const stream = document.getElementById('chat-messages-stream');
    if (stream) {
      stream.innerHTML = '<div class="conv-list-empty"><h3>Nenhuma conversa aberta</h3><p>Encontre um item e toque em "Falar com quem achou" para começar.</p></div>';
    }
  },

  // Sincroniza o indicador de digitação com a resposta pendente.
  // Some quando não há nada pendente ou quando a pendente é de OUTRA conversa
  // (senão o nome do contato vaza para a tela errada), e volta a aparecer
  // quando o usuário retorna à conversa que está esperando resposta.
  syncTypingIndicator(convId) {
    const indicator = document.getElementById('chat-typing-indicator');
    if (!indicator) return;

    const pending = this.pendingReplies.get(convId);
    if (pending) {
      const authorEl = document.getElementById('typing-author');
      if (authorEl) authorEl.textContent = pending.author || '';
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  },

  // Ancora o fluxo na última mensagem. O segundo passo no próximo quadro não
  // é redundância: definir innerHTML e medir logo em seguida usa a altura
  // antes de a página assentar (fonte do Google carregando, miniatura do item
  // decodificando, balão quebrando linha). Medindo uma vez só, o scroll ficava
  // ~27px curto do fim e a mensagem recém-enviada aparecia cortada — em tela
  // baixa, onde o fluxo tem poucas dezenas de pixels, isso a escondia de vez.
  // Instantâneo, sem animação: num chat, ver a conversa deslizar a cada
  // mensagem é pior do que ancorar de uma vez.
  scrollStreamToBottom() {
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;
    stream.scrollTop = stream.scrollHeight;
    requestAnimationFrame(() => {
      stream.scrollTop = stream.scrollHeight;
    });
  },

  renderChatMessages(conv) {
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;

    if (!conv.messages || conv.messages.length === 0) {
      stream.innerHTML = `
        <div class="conv-list-empty">
          <h3>Nenhuma mensagem ainda</h3>
          <p>Escreva a primeira mensagem abaixo para iniciar a negociação.</p>
        </div>`;
      this.scrollStreamToBottom();
      return;
    }

    stream.innerHTML = conv.messages.map(m => `
      <div class="chat-bubble-row ${m.sender === 'me' ? 'outbound' : 'inbound'}">
        <div class="bubble-avatar">${m.sender === 'me' ? 'Você' : this.escapeHtml(conv.contact?.initials)}</div>
        <div class="chat-bubble">
          <p>${this.escapeHtml(m.text)}</p>
          <div class="bubble-time">${this.escapeHtml(m.time)} ${m.sender === 'me' ? '✓✓' : ''}</div>
        </div>
      </div>
    `).join('');

    this.scrollStreamToBottom();
  },

  handleChatKeyDown(e) {
    // Durante a composição de um acento (PT-BR no Windows, GBoard no Android)
    // o Enter confirma a letra e dispara keydown. Sem esta guarda, a mensagem
    // era enviada no meio da digitação e o resto da palavra continuava no
    // campo depois do envio.
    if (e.isComposing || e.keyCode === 229) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendChatMessage();
    }
  },

  // forcedText envia um texto pronto sem tocar no que já está digitado. As
  // pílulas de resposta rápida usavam o campo como rascunho e disparavam esse
  // rascunho junto: "oi, então " + "Agradecer" saíam como uma mensagem só.
  sendChatMessage(forcedText) {
    const input = document.getElementById('chat-input-field');
    if (!input) return;

    const isQuickReply = typeof forcedText === 'string';
    const text = (isQuickReply ? forcedText : input.value).trim();
    if (!text) return;

    const conv = DataService.getConversations().find(c => c.id === this.activeConversationId);
    if (!conv) {
      this.showToast('Selecione uma conversa antes de enviar.', 'error');
      return;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sent = { id: 'm-' + Date.now(), sender: 'me', text, time };

    // O retorno é o objeto realmente mutado. Renderizar `conv` (que vem de
    // outro getConversations) fazia a mensagem não aparecer na tela.
    const updated = DataService.updateConversation(conv.id, c => {
      c.messages.push(sent);
      c.lastMessage = text;
      c.lastTime = time;
    });

    // Cota estourada NÃO pode barrar o envio. Recusar a mensagem aqui deixava
    // o chat morto para sempre: o localStorage cheio é permanente (nada é
    // removido), então toda tentativa futura era negada do mesmo jeito e o
    // campo continuava cheio, sem volta. Mandar e avisar é melhor que um
    // chat que não aceita mais nada.
    //
    // updateConversation já aplicou a mutação, mas numa cópia descartada.
    // `conv` é a única cópia que sobrou, então é nela que a mensagem entra
    // para a tela mostrar o que a pessoa escreveu.
    let shown = updated;
    if (!shown) {
      conv.messages.push(sent);
      conv.lastMessage = text;
      conv.lastTime = time;
      shown = conv;
    }

    if (!isQuickReply) input.value = '';

    this.renderConversations();
    this.renderChatMessages(shown);

    if (!updated) {
      this.showToast('Mensagem na tela, mas o armazenamento está cheio: apague um item antigo para ela não sumir ao recarregar.', 'error');
      return;
    }

    // Simulador de Respostas Amigáveis do Bot
    this.simulateIncomingReply(shown, text);
  },

  sendQuickReply(text) {
    this.sendChatMessage(text);
  },

  // Dicionário de cores usado para responder "qual a cor do objeto?".
  // A ordem importa: termos mais específicos têm que vir antes, senão
  // "azul cobalto" casaria com "azul" e perderia precisão.
  itemColorDictionary: [
    { terms: ['cobalto'], label: 'azul cobalto' },
    { terms: ['tartaruga'], label: 'marrom rajado, estilo tartaruga' },
    { terms: ['rajado', 'xadrez'], label: 'mesclada' },
    { terms: ['creme'], label: 'creme' },
    { terms: ['preta', 'preto'], label: 'preta' },
    { terms: ['azul'], label: 'azul' },
    { terms: ['marrom'], label: 'marrom' },
    { terms: ['vermelha', 'vermelho'], label: 'vermelha' },
    { terms: ['branca', 'branco'], label: 'branca' },
    { terms: ['amarela', 'amarelo'], label: 'amarela' },
    { terms: ['verde'], label: 'verde' },
    { terms: ['roxa', 'roxo'], label: 'roxa' },
    { terms: ['rosa'], label: 'rosa' },
    { terms: ['laranja'], label: 'laranja' },
    { terms: ['cinza'], label: 'cinza' },
    { terms: ['bege'], label: 'bege' },
    { terms: ['dourada', 'dourado'], label: 'dourada' },
    { terms: ['prateada', 'prateado', 'prateadas', 'prateados', 'prata'], label: 'prateada' }
  ],

  // Descobre a cor do item procurando no título e na descrição. Usa
  // normalizeText(), então "CORDÃO" casa com "cordao" e acentos não pesam.
  extractItemColor(item) {
    if (!item) return '';
    const fonte = this.normalizeText(item.title + ' ' + (item.description || ''));
    if (!fonte) return '';

    for (const entrada of this.itemColorDictionary) {
      for (const termo of entrada.terms) {
        const alvo = this.normalizeText(termo);
        if (alvo && new RegExp('(^|\\s)' + alvo + '($|\\s)').test(fonte)) {
          return entrada.label;
        }
      }
    }
    return '';
  },

  // Escolhe a resposta pelo ASSUNTO da mensagem, usando os dados reais do
  // item. Antes era um sorteio aleatório entre 4 frases genéricas: mandar
  // "Pode confirmar a cor exata do objeto?" e receber "estarei lá às 17h"
  // é o que fazia o chat parecer quebrado.
  buildReplyFor(conv, text) {
    const item = conv && conv.itemId ? DataService.getItemById(conv.itemId) : null;
    const titulo = item ? item.title : (conv && conv.itemTitle) || 'o item';
    const local = item ? (item.location || item.locationDetail || '') : '';
    const t = this.normalizeText(text);

    // `\b` no FIM impede prefixos de casar: \bcomprov\b não acha "comprovacao",
    // porque não há fronteira entre "comprov" e "acao". Por isso os padrões de
    // prefixo abrem com \b e não fecham com \b.
    //
    // Para "cor" o \b final é proibido de propósito, senão "cordao" deixaria de
    // contar como pergunta de cor.
    const citaCor = /\b(cor|cores|coloracao|tinta|pintad)/.test(t) ||
      this.itemColorDictionary.some(e =>
        e.terms.some(term => new RegExp('(^|\\s)' + this.normalizeText(term) + '($|\\s)').test(t)));

    if (citaCor) {
      const cor = this.extractItemColor(item);
      if (cor) return `Sim! ${titulo} — a cor é ${cor}. Também está descrito no anúncio, se quiser conferir.`;
      return `É ${titulo}. Não tenho certeza da cor exata, então prefiro não te induzir a erro. Se quiser, combinamos um ponto para você conferir pessoalmente.`;
    }

    if (/\b(onde|local|endereco|passo|posicao|ponto|entrega|entregar|levar|buscar|retirar)\b/.test(t)) {
      if (local) return `Claro! ${local}. Esse é o ponto exato onde ele apareceu, dá para combinar a entrega por aqui.`;
      return 'Combinado! Me chama aqui que a gente finaliza o ponto de encontro.';
    }

    if (/\b(hora|horario|quando|disponivel|livre|hoje|amanha|noite|pode)/.test(t)) {
      const base = local ? `Depois das 18h, aí em ${local}, funciona melhor pra mim.` : 'Depois das 18h fica bom pra mim.';
      return `Sim, sem problema! ${base}`;
    }

    if (/\b(comprov|document|identific|prova|rg|cpf|print)/.test(t)) {
      return 'Tenho sim! Posso te enviar a comprovação por aqui mesmo, é só me avisar que eu mando.';
    }

    if (/\b(detalhe|descrev|descr|material|modelo|marca|o que e)/.test(t)) {
      const desc = item && item.description ? ' ' + String(item.description).trim() : '';
      return `É ${titulo}.${desc}`;
    }

    if (/\b(obrigad|valeu|agradeco|gentil|amig)/.test(t)) {
      return 'Imagina! Qualquer coisa é só chamar por aqui. Boa sorte com o reencontro!';
    }

    return 'Entendi! Vou verificar isso para você e te retorno por aqui em instantes.';
  },

  simulateIncomingReply(conv, text) {
    const convId = conv.id;
    const author = String(conv.contact?.name || '').split(' ')[0];
    const replyText = this.buildReplyFor(conv, text || '');

    // Só cancela a pendência da MESMA conversa. Com um timer único global,
    // mandar mensagem na conversa B descartava a resposta armada na A, e a A
    // nunca respondia — sem virar não lida, sem notificação, silenciosamente.
    this.cancelPendingReply(convId);

    const timer = setTimeout(() => {
      this.pendingReplies.delete(convId);
      const typingIndicator = document.getElementById('chat-typing-indicator');
      if (typingIndicator) typingIndicator.style.display = 'none';

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // updateConversation aplica a mutação no array já em mãos, então a
      // resposta realmente é persistida (antes saveConversations(getConversations())
      // descartava a alteração e a mensagem sumia ao reabrir a conversa).
      const reply = { id: 'm-reply-' + Date.now(), sender: 'them', text: replyText, time };
      const updated = DataService.updateConversation(convId, c => {
        c.messages.push(reply);
        c.lastMessage = replyText;
        c.lastTime = time;
        // Só conta como não lida se o usuário estiver olhando outra conversa.
        if (c.id !== this.activeConversationId) {
          c.unread = (Number(c.unread) || 0) + 1;
        }
      });

      // Mesma razão do envio: com a cota estourada a resposta não grava, mas
      // ela ainda precisa aparecer. Sem isto o indicador "está digitando"
      // sumia e nada chegava, e o chat parecia travado.
      let shown = updated;
      if (!shown) {
        conv.messages.push(reply);
        conv.lastMessage = replyText;
        conv.lastTime = time;
        shown = conv;
      }

      // Se o usuário trocou de conversa, renderConversations() atualiza o
      // contador e nada mais: não pode redesenhar o stream de outra conversa.
      this.renderConversations();

      if (shown.id === this.activeConversationId) {
        this.renderChatMessages(shown);
      }
    }, 1300);

    this.pendingReplies.set(convId, { timer, author });
    this.syncTypingIndicator(convId);
  },

  // Cancela a resposta pendente de UMA conversa. As demais seguem intactas.
  cancelPendingReply(convId) {
    const pending = this.pendingReplies.get(convId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingReplies.delete(convId);
  },

  simulateAttachPhoto() {
    this.showToast('Foto do pertence anexada à conversa.', 'info');
    this.sendChatMessage('[Foto anexada do objeto]');
  },

  startChatForItem(itemId) {
    const item = DataService.getItemById(itemId);
    if (!item) return;

    // Não faz sentido "conversar" com o próprio anúncio.
    if (item.isMyItem) {
      this.showToast('Este é o seu anúncio. Use “Meus Itens” para gerenciá-lo.', 'info');
      return;
    }

    let convs = DataService.getConversations();
    let conv = convs.find(c => c.itemId === itemId);

    if (!conv) {
      conv = {
        id: 'conv-' + Date.now(),
        itemId: item.id,
        itemTitle: item.title,
        itemImage: item.image,
        itemStatus: item.status,
        itemCode: '#' + item.id,
        contact: {
          name: item.publicator.name,
          initials: item.publicator.initials,
          role: item.publicator.role,
          verified: true,
          online: true,
          avatarBg: '#0d8a74'
        },
        lastMessage: 'Iniciou uma conversa sobre este item.',
        lastTime: 'Agora',
        unread: 0,
        messages: [
          {
            id: 'm-init',
            sender: 'them',
            text: `Olá! Vi seu interesse no item "${item.title}". Como posso te ajudar na retirada?`,
            time: 'Agora'
          }
        ]
      };
      convs.unshift(conv);
      DataService.saveConversations(convs);
    }

    this.activeConversationId = conv.id;
    this.navigateTo('messages');
  },

  viewItemFromChat() {
    const conv = DataService.getConversations().find(c => c.id === this.activeConversationId);
    if (conv && conv.itemId) {
      this.openItemDetail(conv.itemId);
    }
  },

  markItemResolvedFromChat() {
    const activeId = this.activeConversationId;
    const existing = DataService.getConversations().find(c => c.id === activeId);
    if (!existing) return;

    // Idempotente: o +50 de pontos só pode ser creditado uma vez.
    if (existing.itemStatus === 'resolved') {
      this.showToast('Este item já está marcado como devolvido.', 'info');
      this.openConversation(activeId);
      return;
    }

    // Persiste a mudança pela mutação no array já em mãos.
    const conv = DataService.updateConversation(activeId, c => { c.itemStatus = 'resolved'; });

    const item = conv.itemId ? DataService.getItemById(conv.itemId) : null;
    if (item) {
      item.status = 'resolved';
      DataService.updateItem(item);
    }

    // Adiciona pontos de reputação ao perfil
    const profile = DataService.getProfile();
    profile.stats.returned += 1;
    profile.stats.points += 50;
    profile.timeline.unshift({
      title: `Item devolvido com sucesso: ${conv.itemTitle}`,
      desc: `Devolução concluída com ${conv.contact?.name || 'o anunciante'}. +50 pontos adicionados!`,
      date: 'Agora mesmo'
    });
    DataService.saveProfile(profile);
    this.renderProfile();

    this.openConversation(activeId);
    this.showToast('Item marcado como Devolvido! Parabéns pela iniciativa!', 'success');
  },

  // ==========================================================================
  // VISÃO 6: PAINEL DE MEUS ITENS (TELA 7 DO FIGMA)
  // ==========================================================================
  renderDashboard() {
    const items = DataService.getItems();
    const myItems = DataService.getMyItems();

    const total = myItems.length;
    const active = myItems.filter(i => i.status === 'active' || i.status === 'in_progress').length;
    const resolved = myItems.filter(i => i.status === 'resolved').length;
    const messagesCount = DataService.getConversations().length;

    document.getElementById('dash-stat-total').textContent = total;
    document.getElementById('dash-stat-active').textContent = active;
    document.getElementById('dash-stat-resolved').textContent = resolved;
    document.getElementById('dash-stat-messages').textContent = messagesCount;

    this.filterDashboardItems(this.currentDashFilter);
  },

  filterDashboardItems(filter) {
    this.currentDashFilter = filter;
    document.querySelectorAll('.dash-tabs .dash-tab').forEach(t => {
      t.classList.remove('active');
      if (t.getAttribute('data-filter') === filter) {
        t.classList.add('active');
      }
    });

    const q = document.getElementById('dash-search-input')?.value.toLowerCase().trim() || '';
    let items = DataService.getMyItems();

    if (filter === 'found') {
      items = items.filter(i => i.type === 'found');
    } else if (filter === 'lost') {
      items = items.filter(i => i.type === 'lost');
    } else if (filter === 'resolved') {
      items = items.filter(i => i.status === 'resolved');
    }

    if (q) {
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }

    const tbody = document.getElementById('dash-items-tbody');
    const countEl = document.getElementById('dash-table-count');
    if (countEl) countEl.innerHTML = `Mostrando <strong>${items.length}</strong> itens`;

    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Nenhum item cadastrado nesta categoria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const catObj = INITIAL_CATEGORIES[item.category] || { name: item.category };
      const statusLabel = item.status === 'resolved' ? 'Devolvido' : (item.status === 'in_progress' ? 'Em Análise' : 'Ativo');

      return `
        <tr>
          <td>
            <div class="dash-table-item">
              <img class="dash-table-thumb" src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.title)}" />
              <div class="dash-item-titles">
                <strong>${this.escapeHtml(item.title)}</strong>
                <span class="dash-item-code">${this.escapeHtml(item.id)}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="status-badge-inline ${item.type === 'found' ? 'active' : 'resolved'}">
              ${item.type === 'found' ? 'Achado' : 'Perdido'}
            </span>
          </td>
          <td>${this.escapeHtml(catObj.name.split('&')[0])}</td>
          <td>${this.escapeHtml(item.dateFormatted || item.date)}</td>
          <td>
            <span class="status-badge-inline ${item.status}">
              ${statusLabel}
            </span>
          </td>
          <td class="text-right">
            <div class="table-action-btns">
              <button class="btn-tbl-action" onclick="app.openItemDetail('${item.id}')" title="Visualizar">
                Ver
              </button>
              <button class="btn-tbl-action" onclick="app.openEditModal('${item.id}')" title="Editar">
                Editar
              </button>
              <button class="btn-tbl-action ${item.status === 'resolved' ? '' : 'active'}" onclick="app.toggleItemResolvedStatus('${item.id}')" title="Devolvido">
                ${item.status === 'resolved' ? 'Reabrir' : 'Devolver'}
              </button>
              <button class="btn-tbl-action danger" onclick="app.deleteItemPrompt('${item.id}')" title="Excluir">
                &times;
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  toggleItemResolvedStatus(itemId) {
    const item = DataService.getItemById(itemId);
    if (!item) return;

    const nextStatus = item.status === 'resolved' ? 'active' : 'resolved';
    if (!DataService.updateItem({ id: itemId, status: nextStatus })) {
      this.showToast('Não foi possível salvar: espaço de armazenamento cheio.', 'error');
      return;
    }
    this.renderDashboard();
    this.showToast(`Status do item ${item.id} atualizado com sucesso.`, 'success');
  },

  deleteItemPrompt(itemId) {
    if (confirm('Tem certeza que deseja remover este anúncio de achados e perdidos?')) {
      DataService.deleteItem(itemId);
      this.renderDashboard();
      this.showToast('Anúncio removido com sucesso.', 'info');
    }
  },

  openEditModal(itemId) {
    const item = DataService.getItemById(itemId);
    if (!item) return;

    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-title').value = item.title;
    document.getElementById('edit-item-location').value = item.location;
    document.getElementById('edit-item-status').value = item.status;
    document.getElementById('edit-item-desc').value = item.description;

    document.getElementById('modal-edit-item').classList.add('show');
  },

  closeEditModal() {
    document.getElementById('modal-edit-item').classList.remove('show');
  },

  handleEditItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-item-id').value;
    const title = document.getElementById('edit-item-title').value.trim();
    const location = document.getElementById('edit-item-location').value.trim();
    const status = document.getElementById('edit-item-status').value;
    const description = document.getElementById('edit-item-desc').value.trim();

    if (!DataService.updateItem({ id, title, location, status, description })) {
      this.showToast('Não foi possível salvar: espaço de armazenamento cheio.', 'error');
      return;
    }
    this.closeEditModal();
    this.renderDashboard();
    this.showToast('Informações do item atualizadas!', 'success');
  },

  // ==========================================================================
  // VISÃO 7: PERFIL DO USUÁRIO (TELA 8 DO FIGMA)
  // ==========================================================================

  // Sincroniza todos os nós que exibem a identidade do usuário a partir do perfil
  renderProfile() {
    const profile = DataService.getProfile();
    const stats = profile.stats || {};
    const firstName = (profile.name || '').trim().split(/\s+/)[0] || '';
    const initials = profile.initials || DataService.deriveInitials(profile.name);

    // Cabeçalho e dropdown
    this.setText('header-user-name', firstName);
    this.setText('header-user-initials', initials);
    this.setText('dropdown-avatar', initials);
    this.setText('dropdown-name', profile.name);
    this.setText('dropdown-email', profile.email);
    this.setText('dropdown-role-badge', `${stats.level} (${stats.points} pts)`);

    // Página de perfil
    this.setText('profile-name-text', profile.name);
    this.setText('profile-large-initials', initials);
    this.setText('profile-meta-text', profile.role);
    this.setText('profile-bio-text', profile.bio);
    this.setText('profile-metric-posted', stats.posted);
    this.setText('profile-metric-returned', stats.returned);
    this.setText('profile-metric-rate', stats.successRate);
    this.setText('profile-metric-points', `${stats.points} pts`);
    this.setText('profile-level-text', `Nível ${stats.level}`);

    const timelineContainer = document.getElementById('profile-activity-timeline');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = (profile.timeline || []).map(entry => `
      <div class="timeline-entry">
        <div class="timeline-content">
          <strong>${this.escapeHtml(entry.title)}</strong>
          <p>${this.escapeHtml(entry.desc)}</p>
          <div class="timeline-date">${this.escapeHtml(entry.date)}</div>
        </div>
      </div>
    `).join('');
  },

  editProfileModal() {
    const profile = DataService.getProfile();
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value == null ? '' : value;
    };

    setValue('edit-profile-name', profile.name);
    setValue('edit-profile-email', profile.email);
    setValue('edit-profile-role', profile.role);
    setValue('edit-profile-bio', profile.bio);

    document.getElementById('modal-edit-profile')?.classList.add('show');
  },

  closeEditProfileModal() {
    document.getElementById('modal-edit-profile')?.classList.remove('show');
  },

  handleEditProfileSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('edit-profile-name')?.value.trim();
    if (!name) {
      this.showToast('Informe um nome para o seu perfil.', 'error');
      return;
    }

    DataService.renameProfile({
      name,
      email: document.getElementById('edit-profile-email')?.value,
      role: document.getElementById('edit-profile-role')?.value,
      bio: document.getElementById('edit-profile-bio')?.value
    });

    this.renderProfile();
    this.renderDashboard();
    this.renderHome();
    this.renderFeed();

    this.closeEditProfileModal();
    this.showToast('Perfil atualizado com sucesso!', 'success');
  },

  // ==========================================================================
  // MODALS & OVERLAYS
  // ==========================================================================
  openAuthModal() {
    document.getElementById('modal-auth').classList.add('show');
  },

  closeAuthModal() {
    document.getElementById('modal-auth').classList.remove('show');
  },

  switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-auth-login');
    const tabReg = document.getElementById('tab-auth-register');
    const nameGroup = document.getElementById('group-auth-name');
    const heading = document.getElementById('auth-heading-text');
    const sub = document.getElementById('auth-sub-text');
    const submitBtn = document.getElementById('btn-auth-submit');

    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
      nameGroup.style.display = 'none';
      heading.textContent = 'Boas-vindas de volta!';
      sub.textContent = 'Acesse sua conta para gerenciar itens ou conversar.';
      submitBtn.textContent = 'Entrar na Conta';
    } else {
      tabLogin.classList.remove('active');
      tabReg.classList.add('active');
      nameGroup.style.display = 'block';
      heading.textContent = 'Crie sua conta no EncontraAÍ';
      sub.textContent = 'Junte-se à comunidade e ajude a recuperar pertences.';
      submitBtn.textContent = 'Cadastrar Conta Grátis';
    }
  },

  handleAuthSubmit(e) {
    e.preventDefault();
    this.closeAuthModal();
    this.showToast('Login efetuado com sucesso! Bem-vindo de volta.', 'success');
  },

  simulateSocialLogin(provider) {
    this.closeAuthModal();
    this.showToast(`Autenticado com sucesso via ${provider}!`, 'success');
  },

  // Modal de Reivindicação
  openClaimModal(itemId) {
    const item = DataService.getItemById(itemId);
    if (!item) return;

    if (item.isMyItem) {
      this.showToast('Este é o seu anúncio. Não há o que reivindicar.', 'info');
      return;
    }

    this.selectedItemId = itemId;
    const summary = document.getElementById('claim-item-summary');
    if (summary) {
      summary.innerHTML = `
        <img src="${this.escapeHtml(item.image)}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" alt="${this.escapeHtml(item.title)}" />
        <div>
          <strong>${this.escapeHtml(item.title)}</strong>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Local: ${this.escapeHtml(item.location)} • ID: ${this.escapeHtml(item.id)}</p>
        </div>
      `;
    }

    const qText = document.getElementById('claim-question-text');
    if (qText) {
      qText.textContent = `"${item.securityQuestion || 'Descreva marcas ou itens internos específicos'}"`;
    }

    const contact = document.getElementById('claim-input-contact');
    if (contact) contact.value = DataService.getProfile().email || '';

    const answerInput = document.getElementById('claim-input-answer');
    if (answerInput) answerInput.value = '';

    document.getElementById('modal-claim-item').classList.add('show');
  },

  closeClaimModal() {
    document.getElementById('modal-claim-item').classList.remove('show');
  },

  handleClaimSubmit(e) {
    e.preventDefault();

    const answerInput = document.getElementById('claim-input-answer');
    const answer = answerInput ? answerInput.value.trim() : '';
    if (!answer) return;

    const item = DataService.getItemById(this.selectedItemId);
    if (!item) return;

    // A reivindicação usava a resposta só como texto e jogava fora: agora ela
    // passa pela mesma validação por aproximação da pergunta de segurança.
    const result = this.scoreSecurityAnswer(item.securityAnswer, answer);
    if (result === 0) {
      this.showToast('A resposta não confere com a pergunta de segurança.', 'error');
      return;
    }

    this.closeClaimModal();
    if (result === null) {
      this.showToast('Anúncio sem pergunta de segurança. Abrindo chat para negociação.', 'info');
    } else {
      this.showToast('Comprovação aceita! Abrindo chat com quem encontrou o item.', 'success');
    }
    this.startChatForItem(this.selectedItemId);
  },

  // Modal de Alerta
  openCreateAlertModal() {
    const email = document.getElementById('alert-input-email');
    if (email) email.value = DataService.getProfile().email || '';
    document.getElementById('modal-create-alert').classList.add('show');
  },

  closeCreateAlertModal() {
    document.getElementById('modal-create-alert').classList.remove('show');
  },

  handleAlertSubmit(e) {
    e.preventDefault();
    const query = document.getElementById('alert-query').value.trim();
    this.closeCreateAlertModal();
    this.showToast(`Alerta ativado para "${query}"! Avisaremos assim que alguém cadastrar.`, 'success');
  },

  showSafetyModal() {
    alert(`REGRAS DE SEGURANÇA ENCONTRAAÍ:

1. PONTO DE ENCONTRO SEGURO:
Combine a entrega sempre em locais monitorados e públicos de São Paulo (Biblioteca Mário de Andrade, uma estação de metrô ou o Auditório Ibirapuera).

2. COMPROVAÇÃO DE POSSE:
Solicite detalhes que apenas o dono conhece (senhas de desbloqueio, papéis de parede, marcas no zíper, notas fiscais).

3. PRIVACIDADE:
Evite repassar senhas ou dados bancários no chat.`);
  },

  // ==========================================================================
  // NOTIFICAÇÕES TOAST
  // ==========================================================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <span class="toast-msg">${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }
};

// ============================================================================
// VISOR DE ERRO NA PAGINA (temporario, de diagnostico)
// ============================================================================
// Qualquer excecao morre silenciosa no console do navegador. Quem nao abre o
// DevTools nunca ve o erro, e sobra so a percepcao de que "o app bugou".
// Este visor mostra o erro na propria tela.
//
// Aparece SO com ?debug=1 na URL, entao nao atrapalha o uso normal.
// Remova este bloco inteiro quando o problema estiver resolvido.
(function instalarVisorDeErro() {
  const ativo = /[?&]debug=1\b/.test(window.location.search);
  if (!ativo) return;

  const erros = [];

  const caixa = document.createElement('div');
  caixa.id = 'debug-error-box';
  caixa.style.cssText = [
    'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:99999',
    'max-height:45vh', 'overflow:auto', 'background:#7f1d1d', 'color:#fff',
    'font:12px/1.5 Consolas,monospace', 'padding:10px 12px',
    'border-top:3px solid #ef4444', 'white-space:pre-wrap', 'display:none'
  ].join(';');

  const mostrar = () => {
    caixa.style.display = 'block';
    caixa.textContent = '';
    for (const e of erros.slice(-8)) {
      const linha = document.createElement('div');
      linha.textContent = e;
      linha.style.cssText = 'padding:4px 0;border-bottom:1px solid rgba(255,255,255,.25)';
      caixa.appendChild(linha);
    }
    const fechar = document.createElement('button');
    fechar.textContent = 'Fechar';
    fechar.style.cssText = 'margin-top:8px;padding:4px 10px;cursor:pointer';
    fechar.addEventListener('click', () => { caixa.style.display = 'none'; });
    caixa.appendChild(fechar);
  };

  const registrar = msg => {
    erros.push(msg);
    try { mostrar(); } catch (e) { /* nada a fazer se nem o visor roda */ }
  };

  window.addEventListener('error', ev => {
    registrar('ERRO: ' + (ev.message || '(sem mensagem)') +
      (ev.filename ? '\n  em ' + ev.filename + ':' + ev.lineno + ':' + ev.colno : '') +
      (ev.error && ev.error.stack ? '\n  ' + String(ev.error.stack).split('\n').slice(0, 3).join('\n  ') : ''));
  });

  window.addEventListener('unhandledrejection', ev => {
    registrar('PROMISE REJEITADA: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)));
  });

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(caixa));
  registrar('Debug ligado (?debug=1). Aparece aqui qualquer erro de JavaScript.\nClique em "Detalhes" ou envie uma mensagem no chat.');
})();

// Launch on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
