# EncontraAÍ

Aplicação web de **achados e perdidos** para a região de São Paulo. O objetivo é
conectar quem perdeu um objeto a quem encontrou, com conversa direta e um
sistema de comprovação de posse para devolver com segurança.

Projeto Front-End, sem framework e sem build: HTML, CSS e JavaScript puros.

## Como rodar

Não há instalação. Basta servir a pasta por HTTP (o `localStorage` não funciona
em `file://`):

```bash
python -m http.server 3000
```

Depois abra <http://localhost:3000>.

## Funcionalidades

- **Início** — busca por palavra-chave, filtro por categoria e itens recentes.
- **Feed** — anúncios em destaque, com filtros por tipo.
- **Detalhe do item** — galeria de fotos, local, data e botão de conversa.
- **Cadastrar item** — formulário com upload de imagem.
- **Mensagens** — conversa por item, com respostas rápidas, indicador de
  digitação e contador de não lidas.
- **Meus itens** — acompanhamento do que você perdeu e do que você devolveu.
- **Perfil** — dados do usuário e itens favoritos.
- **Comprovação de posse** — pergunta de segurança antes de liberar o contato,
  evitando que outra pessoa leve o objeto sem ser a dona.

## Bot de respostas

As respostas do bot são escolhidas pelo **assunto** da mensagem e usam os dados
reais do anúncio, em vez de serem sorteadas de uma lista genérica. Por exemplo,
ao perguntar a cor do objeto, a resposta vem da cor extraída do título e da
descrição do item.

```
"Detalhes" (cor)  -> "Sim! Chaveiro com 3 chaves e cordão azul — a cor é azul."
"Você está livre às 17h?" -> "Depois das 18h, aí em Estação de Metrô..."
```

A detecção de intenção é feita em `scripts/app.js`, nos métodos
`buildReplyFor()` e `extractItemColor()`.

## Estrutura

```
index.html              estrutura e handlers inline
estilos/estilo.css      estilos da aplicação
scripts/dados.js        dados, persistência e operações do DataService
scripts/app.js          controlador principal (app)
recursos/imagens/       fotos dos anúncios
telas_figma/             telas de referência do Figma
rascunho/               script de captura de tela e anotações de processo
```

## Persistência

Os dados ficam em `localStorage`, com as chaves em `STORAGE_KEYS`
(`scripts/dados.js`). O sufixo de versão (`_v6`) controla o formato: ao mudar a
estrutura dos dados, incremente o sufixo para forçar uma nova semeadura em vez
de tentar migrar dados antigos incompatíveis.

O `updateConversation()` recebe uma função mutadora e devolve o objeto já
alterado, o que evita o bug de chamar `saveConversations()` com uma lista
obtida numa chamada separada e perder a alteração.

## Segurança

- Todo dado vindo do `localStorage` passa por `escapeHtml()` antes de entrar em
  um `innerHTML`.
- Cores vindas do storage são validadas por `safeColor()` (apenas hex).
- `?debug=1` na URL ativa um visor de erro na própria tela, útil para
  depurar sem abrir o console do navegador.

## Créditos

Design baseado em telas do Figma. Imagens de demonstração incluídas no
repositório.
