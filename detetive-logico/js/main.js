/* main.js — telas, navegação e integração dos módulos do Detetive Lógico.
   Responsável: Integrante 5 (Integração, Interações e Testes). */
(function () {
  'use strict';

  const { lista: CENARIOS, buscar, imagem } = window.Cenarios;
  const P = window.Partida;
  const Logica = window.Logica;
  const app = document.getElementById('app');
  const camada = document.getElementById('camada-modal');

  const ESPERA_AUSENTE = 15;

  const A = {
    modo: 'local',
    cenarioId: null,
    numJogadores: 3,
    nomes: ['', '', '', '', '', ''],
    tempoVez: 120,
    estado: null,
    marcas: {},
    tela: 'inicio',
    relogio: { turno: null, inicio: 0, disparado: false },
    online: {
      ok: false,
      podeEscrever: true,
      codigo: null,
      anfitriao: false,
      sala: null,
      jogadores: [],
      pararSala: null,
      pararJogadores: null,
      eventoVisto: null,
      carregando: false
    }
  };

  /* ---------- utilidades ---------- */

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const cenario = () =>
    buscar(A.cenarioId || (A.estado && A.estado.cenario));

  const minutos = (s) =>
    s % 60 === 0
      ? `${s / 60} min`
      : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const relogioTexto = (s) => {
    const t = Math.max(0, Math.ceil(s));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };

  const ICONE = {
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
    pista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/></svg>',
    acusar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20h10M6 16l8-8M10 6l4-4 6 6-4 4zM12 8l4 4"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>'
  };

  function trocarTela(nome, html) {
    A.tela = nome;
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  let timerToast = null;

  function toast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);

    clearTimeout(timerToast);
    timerToast = setTimeout(() => t.remove(), 3600);
  }

  function abrirModal(html, classe = '', opaco = false) {
    camada.innerHTML = `
      <div class="fundo-modal ${opaco ? 'opaco' : ''}" data-fundo-modal>
        <div class="modal folha ${classe}" role="dialog" aria-modal="true">
          ${html}
        </div>
      </div>`;

    const foco = camada.querySelector('[data-foco]') ||
      camada.querySelector('button, select, input');

    if (foco) foco.focus();
  }

  function fecharModal() {
    camada.innerHTML = '';
  }

  const modalAberto = () => camada.innerHTML !== '';

  function retrato(s, alt = '') {
    return `<img src="${esc(imagem(s.imagem))}" alt="${esc(alt)}" loading="lazy">`;
  }

  function recorte(cen, local, rotulo = '') {
    const [x, y, w, h] = local.recorte;

    return `
      <svg viewBox="${x} ${y} ${w} ${h}"
           preserveAspectRatio="xMidYMid slice"
           role="img"
           aria-label="${esc(rotulo || local.nome)}">
        <image href="${esc(imagem(cen.imagem))}"
               width="${cen.larguraImagem}"
               height="${cen.alturaImagem}"/>
      </svg>`;
  }

  function seletorTempo() {
    return `
      <div class="campo">
        <label id="rot-tempo">Tempo de cada vez</label>
      </div>

      <div class="contagem tempos"
           role="group"
           aria-labelledby="rot-tempo">

        ${[60, 120].map(s => `
          <button type="button"
                  data-acao="tempo"
                  data-s="${s}"
                  aria-pressed="${s === A.tempoVez}">
            ${minutos(s)}
          </button>
        `).join('')}

      </div>

      <p class="suave dica-tempo">
        Quando o tempo acaba, a vez passa sozinha
        para o próximo detetive.
      </p>`;
  }

  /* ---------- tela inicial ---------- */

  function telaInicio() {
    pararOnline();

    trocarTela('inicio', `
      <section class="inicio">
        <div class="capa folha clipe">

          <div class="cabecalho-folha">
            <span>Departamento de Investigação Lógica</span>
            <span>Arquivo confidencial</span>
          </div>

          <h1>DETETIVE LÓGICO</h1>

          <span class="carimbo bater">
            O mistério está nas proposições
          </span>

          <div class="acoes">
            <button class="botao" data-acao="jogar" data-foco>
              ${ICONE.lupa} Jogar
            </button>

            <button class="botao secundario" data-acao="como-jogar">
              Como jogar
            </button>
          </div>

          <p class="rodape-capa">
            3 detetives. Até 2 minutos por turno.
            Descubra quem, onde e com qual arma.
          </p>

          <div class="marca-dagua" aria-hidden="true">
            ¬ ∧ ∨ → ↔
          </div>

        </div>
      </section>`);
  }

  /* ---------- como jogar ---------- */

  function telaComoJogar() {
    trocarTela('como-jogar', `
      <div class="tela">

        <button class="link-voltar" data-acao="inicio">
          ‹ Voltar
        </button>

        <article class="manual folha">
          <h2>Como jogar</h2>

          <h3>O objetivo</h3>
          <p>
            Um crime aconteceu. Descubra
            <strong>quem</strong> foi o culpado,
            <strong>onde</strong> aconteceu e
            <strong>qual arma</strong> foi usada.
            Cada partida sorteia um crime novo.
          </p>

          <h3>Na sua vez</h3>
          <p>
            Cada vez tem até 2 minutos.
            O relógio começa quando a sua vez começa.
          </p>

          <ol>
            <li>
              Clique em <strong>Revelar pista</strong>.
              A pista aparece só para você.
              Você recebe uma pista por vez.
            </li>
            <li>
              Use o tempo que sobra para analisar as pistas
              e marcar a sua tabela de eliminação.
            </li>
            <li>
              Se já tiver certeza, clique em
              <strong>Fazer acusação</strong>.
              Se não, clique em <strong>Passar a vez</strong>.
            </li>
            <li>
              Quando o tempo acaba, a vez passa sozinha
              para o próximo detetive.
            </li>
          </ol>

          <h3>A acusação</h3>
          <p>
            Cada detetive pode acusar
            <strong>uma única vez</strong>.
            Quem acertar os três elementos primeiro vence.
            Quem errar sai da disputa, mas continua
            acompanhando a partida.
          </p>

          <h3>Os conectivos das pistas</h3>

          <table class="tabela-conectivos">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Conectivo</th>
                <th>Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="simbolo">¬</td>
                <td>Negação</td>
                <td>
                  O crime não aconteceu na Cozinha.
                  <span class="formula">¬P</span>
                </td>
              </tr>
              <tr>
                <td class="simbolo">∧</td>
                <td>Conjunção</td>
                <td>
                  Nem Alfredo nem Jorge cometeram o crime.
                  <span class="formula">¬P ∧ ¬Q</span>
                </td>
              </tr>
              <tr>
                <td class="simbolo">∨</td>
                <td>Disjunção</td>
                <td>
                  O crime aconteceu na Biblioteca
                  ou no Escritório.
                  <span class="formula">P ∨ Q</span>
                </td>
              </tr>
              <tr>
                <td class="simbolo">→</td>
                <td>Condicional</td>
                <td>
                  Se o crime aconteceu na Biblioteca,
                  então Dr. Otávio cometeu o crime.
                  <span class="formula">P → Q</span>
                </td>
              </tr>
              <tr>
                <td class="simbolo">↔</td>
                <td>Bicondicional</td>
                <td>
                  Isabela cometeu o crime se, e somente se,
                  a arma foi o Veneno.
                  <span class="formula">P ↔ Q</span>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Regras de dedução que ajudam</h3>

          <div class="regra-ded">
            <strong>Modus ponens</strong>
            <span class="formula">P → Q, P ⊢ Q</span>
            <p>
              Se foi na Biblioteca, foi o Veneno.
              Foi na Biblioteca. Então foi o Veneno.
            </p>
          </div>

          <div class="regra-ded">
            <strong>Modus tollens</strong>
            <span class="formula">P → Q, ¬Q ⊢ ¬P</span>
            <p>
              Se foi no Porão, foi a Corda.
              Não foi a Corda. Então não foi no Porão.
            </p>
          </div>

          <div class="regra-ded">
            <strong>Silogismo disjuntivo</strong>
            <span class="formula">P ∨ Q, ¬P ⊢ Q</span>
            <p>
              Foi na Cozinha ou no Sótão.
              Não foi na Cozinha. Então foi no Sótão.
            </p>
          </div>

          <div class="regra-ded">
            <strong>Silogismo hipotético</strong>
            <span class="formula">P → Q, Q → R ⊢ P → R</span>
            <p>
              Se foi no Sótão, foi a Corda.
              Se foi a Corda, foi o Jorge.
              Então, se foi no Sótão, foi o Jorge.
            </p>
          </div>

          <h3>A tabela de eliminação</h3>
          <p>
            Cada detetive tem a sua.
            Toque num item para mudar a marcação:
            possível, eliminado, confirmado
            e de volta a sem marcação.
            As marcações são só anotações:
            não mudam o crime.
          </p>

          <p>
            <button class="botao" data-acao="jogar">
              ${ICONE.lupa} Jogar agora
            </button>
          </p>
        </article>
      </div>`);
  }

  /* ---------- modo de jogo ---------- */

  function telaModo() {
    const o = A.online;

    trocarTela('modo', `
      <div class="tela">
        <button class="link-voltar" data-acao="inicio">
          ‹ Voltar
        </button>

        <div class="tela-titulo">
          <h2>Como vocês vão jogar?</h2>
        </div>

        <div class="modos">
          <div class="modo folha">
            <h3>Neste computador</h3>
            <p class="suave">
              Todos jogam no mesmo aparelho,
              passando a vez.
            </p>
            <button class="botao"
                    data-acao="modo-local"
                    data-foco>
              Jogar neste computador
            </button>
          </div>

          <div class="modo folha">
            <h3>Online, cada um em casa</h3>
            <p class="suave">
              Crie uma sala, envie o código
              e cada detetive entra pelo próprio computador.
            </p>

            ${o.podeEscrever ? `
              <button class="botao" data-acao="modo-criar">
                Criar sala
              </button>
              <button class="botao secundario" data-acao="modo-entrar">
                Entrar com código
              </button>
            ` : `
              <p class="aviso">
                Seu acesso a este jogo é só de leitura.
              </p>
            `}
          </div>
        </div>
      </div>`);
  }

  /* ---------- seleção de cenário ---------- */

  function telaCenarios() {
    trocarTela('cenarios', `
      <div class="tela">

        <button class="link-voltar"
                data-acao="${A.online.ok ? 'jogar' : 'inicio'}">
          ‹ Voltar
        </button>

        <div class="tela-titulo">
          <h2>Escolha o caso</h2>
          <p>
            Cada partida sorteia um culpado,
            um local e uma arma.
          </p>
        </div>

        <div class="cenarios">

          ${CENARIOS.map((c, i) => `
            <article class="pasta folha"
                     data-aba="Caso nº ${String(i + 1).padStart(3, '0')}">

              <div class="foto">
                <img src="${esc(imagem(c.imagem))}"
                     alt="Planta ilustrada: ${esc(c.curto)}"
                     loading="lazy">
              </div>

              <h3>${esc(c.curto)}</h3>
              <p>${esc(c.descricao)}</p>

              <button class="botao largo"
                      data-acao="escolher-cenario"
                      data-id="${c.id}"
                      ${i === 0 ? 'data-foco' : ''}>
                Investigar este caso
              </button>
            </article>
          `).join('')}

        </div>
      </div>`);
  }

  /* ---------- cadastro de jogadores ---------- */

  function telaJogadores() {
    const cen = cenario();
    const n = A.numJogadores;

    trocarTela('jogadores', `
      <div class="tela">

        <button class="link-voltar"
                data-acao="voltar-cenarios">
          ‹ Trocar de caso
        </button>

        <div class="tela-titulo">
          <h2>Quem vai investigar?</h2>
          <p>${esc(cen.curto)}</p>
        </div>

        <form class="cadastro folha"
              data-form="jogadores"
              novalidate>

          <div class="campo">
            <label id="rot-qtd">
              Número de detetives
            </label>
          </div>

          <div class="contagem"
               role="group"
               aria-labelledby="rot-qtd">

            <button type="button"
                    data-acao="qtd"
                    data-n="3"
                    aria-pressed="true">
              3
            </button>
          </div>

          ${Array.from({ length: n }, (_, i) => `
            <div class="campo">
              <label for="nome-${i}">
                Detetive ${i + 1}
              </label>

              <input id="nome-${i}"
                     data-nome="${i}"
                     maxlength="18"
                     autocomplete="off"
                     placeholder="Nome"
                     value="${esc(A.nomes[i])}">
            </div>
          `).join('')}

          ${seletorTempo()}

          <p class="erro" data-erro></p>

          <button class="botao largo" type="submit">
            Sortear a ordem e começar
          </button>
        </form>
      </div>`);

    const primeiro = app.querySelector('#nome-0');

    if (primeiro && !A.nomes[0]) {
      primeiro.focus();
    }
  }

  function comecarLocal() {
    const n = A.numJogadores;

    const nomes = A.nomes
      .slice(0, n)
      .map((t, i) => t.trim() || `Detetive ${i + 1}`);

    const repetidos = nomes.filter(
      (t, i) =>
        nomes.findIndex(
          u => u.toLowerCase() === t.toLowerCase()
        ) !== i
    );

    if (repetidos.length) {
      app.querySelector('[data-erro]').textContent =
        `O nome “${repetidos[0]}” aparece duas vezes. Use nomes diferentes.`;
      return;
    }

    A.modo = 'local';

    A.estado = P.criarPartida(
      A.cenarioId,
      nomes.map((nome, i) => ({
        id: 'j' + i,
        nome
      })),
      Math.random,
      A.tempoVez
    );

    A.marcas = {};

    A.relogio = {
      turno: null,
      inicio: 0,
      disparado: false
    };

    telaInvestigacao();

    const ordem = A.estado.jogadores
      .map(j => j.nome)
      .join(', ');

    mostrarPassagem(`Ordem sorteada: ${ordem}.`);
  }

  /* ---------- modo online ---------- */

  function telaNomeOnline(tipo) {
    const cen = tipo === 'criar' ? cenario() : null;

    trocarTela('nome-online', `
      <div class="tela">
        <button class="link-voltar"
                data-acao="${tipo === 'criar' ? 'voltar-cenarios' : 'jogar'}">
          ‹ Voltar
        </button>

        <div class="tela-titulo">
          <h2>
            ${tipo === 'criar' ? 'Criar sala' : 'Entrar em uma sala'}
          </h2>
          ${cen ? `<p>${esc(cen.curto)}</p>` : ''}
        </div>

        <form class="cadastro folha"
              data-form="${tipo}"
              novalidate>

          ${tipo === 'entrar' ? `
            <div class="campo">
              <label for="codigo">Código da sala</label>
              <input id="codigo"
                     maxlength="8"
                     autocomplete="off"
                     placeholder="DET123"
                     style="text-transform:uppercase;letter-spacing:.1em"
                     data-foco>
            </div>
          ` : ''}

          <div class="campo">
            <label for="meu-nome">
              Seu nome de detetive
            </label>

            <input id="meu-nome"
                   maxlength="18"
                   autocomplete="off"
                   placeholder="Nome"
                   ${tipo === 'criar' ? 'data-foco' : ''}>
          </div>

          ${tipo === 'criar' ? seletorTempo() : ''}

          <p class="erro" data-erro></p>

          <button class="botao largo" type="submit">
            ${tipo === 'criar' ? 'Criar sala' : 'Entrar na sala'}
          </button>
        </form>
      </div>`);

    const f = app.querySelector('[data-foco]');
    if (f) f.focus();
  }

  async function enviarOnline(tipo, form) {
    const erro = form.querySelector('[data-erro]');
    const nome = form.querySelector('#meu-nome').value.trim();

    if (!nome) {
      erro.textContent =
        'Digite seu nome para os outros saberem quem é você.';
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    erro.textContent = '';

    try {
      let codigo;

      if (tipo === 'criar') {
        codigo = await window.Salas.criarSala(
          A.cenarioId,
          nome,
          A.tempoVez
        );
        A.online.anfitriao = true;
      } else {
        const txt = form.querySelector('#codigo').value;

        if (!window.Salas.normalizarCodigo(txt)) {
          erro.textContent =
            'Digite o código que você recebeu, por exemplo DET123.';
          botao.disabled = false;
          return;
        }

        codigo = await window.Salas.entrarSala(txt, nome);
        A.online.anfitriao = false;
      }

      A.modo = 'online';
      A.online.codigo = codigo;

      try {
        localStorage.setItem(
          'detetive-ultima-sala',
          codigo
        );
      } catch (e) {
        // Armazenamento indisponível.
      }

      ouvirSala(codigo);

    } catch (e) {
      erro.textContent = e && e.message
        ? e.message
        : 'Não foi possível conectar. Tente novamente.';

      botao.disabled = false;
    }
  }

  function ouvirSala(codigo) {
    pararOnline();

    trocarTela('lobby', `
      <div class="tela">
        <div class="cadastro folha">
          <p>Conectando à sala ${esc(codigo)}…</p>
        </div>
      </div>`);

    const espera = setTimeout(() => {
      if (!A.online.sala) {
        toast('A conexão está demorando. Confira sua internet.');
      }
    }, 10000);

    A.online.pararSala = window.Salas.ouvirSala(
      codigo,
      sala => {
        clearTimeout(espera);

        if (!sala) {
          toast('A sala não existe mais.');
          telaInicio();
          return;
        }

        A.online.sala = sala;
        A.cenarioId = sala.cenario;
        A.online.anfitriao =
          sala.anfitriao === window.Salas.meuId;

        if (sala.status === 'espera') {
          telaLobby();
          return;
        }

        if (sala.partida) {
          receberEstadoOnline(sala.partida);
        }
      },
      () => {
        clearTimeout(espera);
        toast(
          'A conexão com a sala caiu. Entre novamente com o código.'
        );
      }
    );

    A.online.pararJogadores = window.Salas.ouvirJogadores(
      codigo,
      lista => {
        A.online.jogadores = lista;

        if (
          A.tela === 'lobby' &&
          A.online.sala &&
          A.online.sala.status === 'espera'
        ) {
          telaLobby();
        }
      }
    );
  }

  function pararOnline() {
    const o = A.online;

    if (o.pararSala) o.pararSala();
    if (o.pararJogadores) o.pararJogadores();

    o.pararSala = null;
    o.pararJogadores = null;
    o.sala = null;
    o.jogadores = [];
    o.eventoVisto = null;
  }

  function telaLobby() {
    const o = A.online;
    const cen = cenario();
    const lista = o.jogadores;
    const n = lista.length;

    const pode = n === 3;

    trocarTela('lobby', `
      <div class="tela">
        <button class="link-voltar" data-acao="sair-sala">
          ‹ Sair da sala
        </button>

        <div class="tela-titulo">
          <h2>Sala de espera</h2>
          <p>${esc(cen ? cen.curto : '')}</p>
        </div>

        <div class="cadastro folha">
          <p class="suave">Código da sala</p>

          <div class="codigo-sala">
            ${esc(o.codigo)}
          </div>

          <p>
            Envie este código para os outros detetives.
          </p>

          <p class="suave">
            Tempo de cada vez:
            ${minutos(o.sala.tempoVez || 120)}.
          </p>

          <h3>
            Detetives na sala (${n} de 3)
          </h3>

          <ul class="lista-sala">
            ${lista.map(j => `
              <li>
                <span>
                  ${esc(j.nome)}
                  ${j.id === window.Salas.meuId ? ' (você)' : ''}
                </span>

                <span class="suave">
                  ${j.id === o.sala.anfitriao
                    ? 'anfitrião'
                    : ''}
                </span>
              </li>
            `).join('') || '<li>Ninguém ainda.</li>'}
          </ul>

          ${o.anfitriao ? `
            <button class="botao largo"
                    data-acao="iniciar-online"
                    ${pode ? '' : 'disabled'}>
              Iniciar a investigação
            </button>

            <p class="suave">
              ${n < 3
                ? `Faltam ${3 - n} detetive(s) para começar.`
                : n > 3
                  ? 'A sala permite somente 3 detetives.'
                  : 'Todos dentro? Pode começar.'}
            </p>
          ` : `
            <p class="aviso">
              Aguardando o anfitrião iniciar a investigação.
            </p>
          `}
        </div>
      </div>`);
  }

  async function iniciarOnline() {
    const o = A.online;

    if (o.jogadores.length !== 3) {
      toast('A partida precisa de exatamente 3 detetives.');
      return;
    }

    const jogs = o.jogadores.map(j => ({
      id: j.id,
      nome: j.nome
    }));

    const estado = P.criarPartida(
      o.sala.cenario,
      jogs,
      Math.random,
      Math.min(o.sala.tempoVez || 120, 120)
    );

    try {
      await window.Salas.comecarPartida(o.codigo, estado);
    } catch (e) {
      toast('Não foi possível iniciar. Tente novamente.');
    }
  }

  async function receberEstadoOnline(estado) {
    const anterior = A.estado;
    A.estado = estado;

    if (estado.fim) {
      if (A.tela !== 'resultado') telaResultado();
      return;
    }

    if (A.relogio.turno !== estado.turno) {
      iniciarRelogio();
    }

    if (A.tela !== 'investigacao') {
      if (A.online.carregando) return;

      A.online.carregando = true;

      A.marcas = await window.Salas.carregarMarcas(
        A.online.codigo
      );

      A.online.carregando = false;

      telaInvestigacao();

      if (!anterior) {
        toast(
          `Ordem sorteada: ${
            estado.jogadores.map(j => j.nome).join(', ')
          }.`
        );
      }

      A.online.eventoVisto = chaveEvento(estado);
      return;
    }

    const chave = chaveEvento(estado);

    const novaPista =
      estado.ultimoEvento &&
      estado.ultimoEvento.tipo === 'pista' &&
      chave !== A.online.eventoVisto
        ? null
        : null;

    atualizarInvestigacao(false, novaPista);

    if (chave !== A.online.eventoVisto) {
      A.online.eventoVisto = chave;
      const ev = estado.ultimoEvento;

      if (ev && ev.jogador !== meuNome()) {
        if (ev.tipo === 'pista') {
          toast(`${ev.jogador} recebeu uma pista.`);
        }
        if (ev.tipo === 'erro') {
          toast(`${ev.jogador} acusou e errou.`);
        }
        if (ev.tipo === 'passou') {
          toast(`${ev.jogador} passou a vez.`);
        }
        if (ev.tipo === 'tempo') {
          toast(`O tempo de ${ev.jogador} acabou.`);
        }
      }

      if (
        ev &&
        ev.tipo !== 'pista' &&
        P.jogadorDaVez(estado).id === window.Salas.meuId &&
        !modalAberto()
      ) {
        toast('Sua vez! O relógio já está correndo.');
      }
    }
  }

  const chaveEvento = est =>
    `${est.turno}-${est.ultimoEvento
      ? est.ultimoEvento.tipo
      : ''}`;

  function meuNome() {
    const j = A.estado &&
      A.estado.jogadores.find(
        x => x.id === window.Salas.meuId
      );

    return j ? j.nome : '';
  }

  /* ---------- relógio ---------- */

  function iniciarRelogio() {
    A.relogio = {
      turno: A.estado.turno,
      inicio: Date.now(),
      disparado: false
    };
  }

  function tempoRestante() {
    if (
      !A.estado ||
      A.relogio.turno !== A.estado.turno
    ) {
      return null;
    }

    return A.estado.tempoVez -
      (Date.now() - A.relogio.inicio) / 1000;
  }

  function pintarRelogio() {
    const caixa = app.querySelector('[data-relogio]');

    if (!caixa || !A.estado) return;

    const r = tempoRestante();
    const total = A.estado.tempoVez;
    const mostrar = r === null
      ? total
      : Math.max(0, r);

    caixa.querySelector('[data-tempo]').textContent =
      relogioTexto(mostrar);

    caixa.querySelector('[data-barra-tempo]').style.width =
      `${(mostrar / total) * 100}%`;

    caixa.classList.toggle('pausado', r === null);
    caixa.classList.toggle('urgente', r !== null && r <= 30);
    caixa.classList.toggle('final', r !== null && r <= 10);
  }

  function tempoAcabou() {
    const quem = P.jogadorDaVez(A.estado);

    const novo = P.tempoEsgotado(
      A.estado,
      A.estado.turno
    );

    if (novo === A.estado) return;

    fecharModal();

    A.online.eventoVisto = chaveEvento(novo);
    aplicar(novo);

    if (A.modo === 'online') iniciarRelogio();

    atualizarInvestigacao();

    if (A.modo === 'local') {
      esconderTabela();
      mostrarPassagem(`O tempo de ${quem.nome} acabou.`);
    } else if (quem.id === window.Salas.meuId) {
      toast('Seu tempo acabou. A vez passou.');
    } else {
      toast(`O tempo de ${quem.nome} acabou.`);
    }
  }

  setInterval(() => {
    if (
      A.tela !== 'investigacao' ||
      !A.estado ||
      A.estado.fim
    ) {
      return;
    }

    pintarRelogio();

    const r = tempoRestante();

    if (r === null || A.relogio.disparado) {
      return;
    }

    const atual = P.jogadorDaVez(A.estado);

    const souEu =
      A.modo === 'local' ||
      atual.id === window.Salas.meuId;

    if (
      (souEu && r <= 0) ||
      (A.modo === 'online' && r <= -ESPERA_AUSENTE)
    ) {
      A.relogio.disparado = true;
      tempoAcabou();
    }
  }, 250);

  /* ---------- investigação ---------- */

  function idObservador() {
    return A.modo === 'online'
      ? window.Salas.meuId
      : P.jogadorDaVez(A.estado).id;
  }

  function minhasMarcas() {
    if (A.modo === 'online') {
      return Logica.completarTabela(A.marcas);
    }

    return Logica.tabelaDoJogador(
      A.marcas,
      idObservador()
    );
  }

  function souDaVez() {
    const j = P.jogadorDaVez(A.estado);

    return A.modo === 'local'
      ? true
      : j.id === window.Salas.meuId;
  }

  function telaInvestigacao() {
    trocarTela('investigacao', `
      <div class="tela">

        <header class="barra folha"
                data-barra>
        </header>

        <div class="mesa-investigacao">
          <aside class="dossie folha"
                 data-dossie>
          </aside>

          <section class="quadro-pistas folha"
                   aria-labelledby="titulo-pistas">

            <div class="titulo-coluna">
              <h3 id="titulo-pistas">
                Suas pistas
              </h3>

              <span data-contagem></span>
            </div>

            <ol class="pistas"
                data-pistas>
            </ol>
          </section>

          <section class="tabela folha"
                   aria-labelledby="titulo-tabela"
                   data-tabela>
          </section>
        </div>
      </div>`);

    atualizarInvestigacao(true);
  }

  function atualizarInvestigacao(tudo = false, novaPista = null) {
    if (A.tela !== 'investigacao') return;

    const est = A.estado;
    const cen = cenario();
    const atual = P.jogadorDaVez(est);
    const obs = idObservador();
    const minhas = P.idsDe(est, obs);
    const restantes = P.pistasDisponiveis(est, obs).length;

    const euId =
      A.modo === 'online'
        ? window.Salas.meuId
        : null;

    const eu = euId
      ? est.jogadores.find(j => j.id === euId)
      : null;

    app.querySelector('[data-barra]').innerHTML = `
      <div>
        <div class="caso">${esc(cen.curto)}</div>
        <div class="turno">Turno ${est.turno}</div>
      </div>

      <div class="vez">
        <span class="rotulo">Vez de</span>
        <strong>
          ${esc(atual.nome)}
          ${euId && atual.id === euId ? ' (você)' : ''}
        </strong>
      </div>

      <ul class="jogadores-faixa"
          aria-label="Ordem dos turnos">

        ${est.jogadores.map((j, i) => `
          <li class="
            ${i === est.vez ? 'atual' : ''}
            ${j.eliminado ? 'fora' : ''}
          "
          title="${j.eliminado ? 'Errou a acusação' : ''}">

            ${esc(j.nome)}
            ${j.eliminado ? ' ✕' : ''}
          </li>
        `).join('')}
      </ul>`;

    const minhaVez = souDaVez() && !atual.eliminado;

    const jaAcusou = A.modo === 'online'
      ? (eu && eu.acusou)
      : atual.acusou;

    const podeRevelar =
      minhaVez &&
      !est.revelouNaVez &&
      restantes > 0;

    let aviso = '';

    if (eu && eu.eliminado) {
      aviso =
        'Você errou a acusação e está fora da disputa.';
    } else if (
      A.modo === 'online' &&
      !minhaVez
    ) {
      aviso =
        `Aguardando ${esc(atual.nome)}. ` +
        'Enquanto isso, atualize sua tabela.';
    } else if (est.revelouNaVez) {
      aviso =
        'Pista desta vez já revelada. ' +
        'Analise, marque a tabela e acuse ou passe a vez.';
    } else if (restantes === 0) {
      aviso =
        'Não há pista nova para você nesta vez.';
    }

    app.querySelector('[data-dossie]').innerHTML = `
      <button class="foto"
              data-acao="ampliar"
              aria-label="Ampliar a planta do cenário">

        <img src="${esc(imagem(cen.imagem))}"
             alt="Planta ilustrada: ${esc(cen.curto)}">
      </button>

      <h3>O caso</h3>

      <p class="misterio">
        ${esc(cen.misterio)}
      </p>

      <div class="acoes">
        <div class="relogio"
             data-relogio
             role="timer"
             aria-label="Tempo restante da vez">

          <div class="linha-relogio">
            ${ICONE.relogio}

            <span class="rotulo-tempo">
              Tempo da vez
            </span>

            <span class="tempo"
                  data-tempo>
              ${relogioTexto(est.tempoVez)}
            </span>
          </div>

          <div class="trilho">
            <div class="barra-tempo"
                 data-barra-tempo>
            </div>
          </div>
        </div>

        ${restantes > 0 ? `
          <button class="botao"
                  data-acao="revelar"
                  ${podeRevelar ? '' : 'disabled'}>

            ${ICONE.pista} Revelar pista
          </button>
        ` : ''}

        <button class="botao perigo"
                data-acao="acusar"
                ${minhaVez && !jaAcusou ? '' : 'disabled'}>

          ${ICONE.acusar} Fazer acusação
        </button>

        <button class="botao secundario"
                data-acao="passar"
                ${minhaVez ? '' : 'disabled'}>

          Passar a vez
        </button>
      </div>

      <p class="contador">
        Você tem ${minhas.length}
        de ${est.pistas.length}
        pistas
      </p>

      ${aviso ? `
        <p class="aviso">${aviso}</p>
      ` : ''}`;

    pintarRelogio();

    app.querySelector('[data-contagem]').textContent =
      `${minhas.length} de ${est.pistas.length}`;

    const lista = minhas.slice().reverse();

    app.querySelector('[data-pistas]').innerHTML =
      lista.length
        ? lista.map(
            id => cartaoPista(
              est,
              id,
              id === novaPista,
              minhas.indexOf(id) + 1
            )
          ).join('')
        : `
          <li class="vazio">
            Nenhuma pista revelada ainda.
            Na sua vez, clique em
            <strong>Revelar pista</strong>.
          </li>`;

    if (tudo) renderTabela();
  }

  /* ---------- tabela individual ---------- */

  function esconderTabela() {
    const t = app.querySelector('[data-tabela]');

    const pistas = app.querySelector('[data-pistas]');

    if (pistas && A.modo === 'local') {
      pistas.innerHTML = `
        <li class="vazio">
          As pistas do próximo detetive aparecem
          quando ele começar o turno.
        </li>`;
    }

    if (t && A.modo === 'local') {
      t.innerHTML = `
        <div class="vazio">
          A tabela do próximo detetive aparece
          quando ele começar o turno.
        </div>`;
    }
  }

  function cartaoPista(est, id, nova = false, numero = null) {
    const p = est.pistas.find(x => x.id === id);
    const n = numero || est.reveladas.indexOf(id) + 1;

    return `
      <li class="pista ${nova ? 'nova' : ''}">
        <div class="topo">
          <span>Pista ${n}</span>
        </div>

        <p class="frase">
          ${esc(p.frase)}
        </p>

        <div class="linha-formula">
          <span class="formula">
            ${esc(p.formula)}
          </span>

          <span class="selo">
            ${esc(p.conectivo)}
            ${esc(p.simbolo)}
          </span>
        </div>

        <ul class="legenda">
          ${p.legenda.map(l => `
            <li>
              <b>${esc(l.letra)}</b>
              ${esc(l.texto)}
            </li>
          `).join('')}
        </ul>
      </li>`;
  }

  function renderTabela() {
    const est = A.estado;
    const cen = cenario();
    const m = minhasMarcas();

    const dono = A.modo === 'online'
      ? 'Minha tabela'
      : `Tabela de ${P.jogadorDaVez(est).nome}`;

    const item = (cat, i, conteudo, nome) => {
      const marca = m[cat][i] || '';

      return `
        <button type="button"
                class="item"
                data-acao="marcar"
                data-cat="${cat}"
                data-i="${i}"
                data-marca="${marca}"
                aria-label="${esc(nome)}: ${Logica.NOME_MARCA[marca]}">

          ${conteudo}
        </button>`;
    };

    app.querySelector('[data-tabela]').innerHTML = `
      <div class="titulo-coluna">
        <h3 id="titulo-tabela">
          ${esc(dono)}
        </h3>

        <span>Toque para marcar</span>
      </div>

      <div class="legenda-marcas">
        <span class="m-possivel">Possível</span>
        <span class="m-eliminado">Eliminado</span>
        <span class="m-confirmado">Confirmado</span>
      </div>

      <div class="grupo">
        <h4>Suspeitos</h4>

        <div class="itens fotos">
          ${cen.suspeitos.map((s, i) =>
            item(
              'S',
              i,
              `${retrato(s)}
               <span class="nome">${esc(s.nome)}</span>
               <span class="papel">${esc(s.papel)}</span>`,
              s.nome
            )
          ).join('')}
        </div>
      </div>

      <div class="grupo">
        <h4>Locais</h4>

        <div class="itens locais">
          ${cen.locais.map((l, i) =>
            item(
              'L',
              i,
              `${recorte(cen, l)}
               <span class="nome">${esc(l.nome)}</span>`,
              l.nome
            )
          ).join('')}
        </div>
      </div>

      <div class="grupo">
        <h4>Armas</h4>

        <div class="itens armas">
          ${cen.armas.map((w, i) =>
            item(
              'A',
              i,
              `<span class="nome">${esc(w.nome)}</span>`,
              w.nome
            )
          ).join('')}
        </div>
      </div>`;
  }

  function marcar(botao) {
    const cat = botao.dataset.cat;
    const i = botao.dataset.i;

    const nova = Logica.marcarItem(
      minhasMarcas(),
      cat,
      i
    );

    botao.dataset.marca = nova;

    botao.setAttribute(
      'aria-label',
      botao.getAttribute('aria-label')
        .replace(/:.*$/, ': ' + Logica.NOME_MARCA[nova])
    );

    if (A.modo === 'online') {
      window.Salas.salvarMarcas(
        A.online.codigo,
        A.marcas
      );
    }
  }

  /* ---------- ações do turno ---------- */

  function aplicar(novo) {
    A.estado = novo;

    if (A.modo === 'online') {
      window.Salas.salvarEstado(
        A.online.codigo,
        novo
      ).catch(() =>
        toast('Não foi possível salvar a jogada.')
      );
    }
  }

  function revelar() {
    const antes = A.estado;

    const novo = P.revelarPista(
      antes,
      idObservador()
    );

    if (novo === antes) return;

    A.online.eventoVisto = chaveEvento(novo);
    aplicar(novo);

    const minhas = P.idsDe(novo, idObservador());
    const id = minhas[minhas.length - 1];

    atualizarInvestigacao(false, id);

    const r = tempoRestante();

    abrirModal(`
      <h2>Nova pista</h2>

      <ol class="pistas">
        ${cartaoPista(novo, id, true, minhas.length)}
      </ol>

      <p class="suave">
        O relógio continua correndo
        ${r !== null
          ? `: faltam ${relogioTexto(r)}`
          : ''}.
        Analise as pistas, marque a sua tabela
        e acuse ou passe a vez.
      </p>

      <div class="acoes">
        <button class="botao"
                data-acao="fechar-modal"
                data-foco>
          Analisar as pistas
        </button>
      </div>`);
  }

  function passar(confirmado = false) {
    const est = A.estado;

    if (
      !confirmado &&
      !est.revelouNaVez &&
      P.pistasDisponiveis(est, idObservador()).length > 0
    ) {
      abrirModal(`
        <h2>Passar sem revelar pista?</h2>

        <p>
          Você ainda não revelou a pista desta vez.
          Se passar agora, você fica sem pista
          nesta vez.
        </p>

        <div class="acoes">
          <button class="botao secundario"
                  data-acao="fechar-modal"
                  data-foco>
            Voltar
          </button>

          <button class="botao"
                  data-acao="confirmar-passar">
            Passar a vez
          </button>
        </div>`);

      return;
    }

    const novo = P.passarVez(
      est,
      idObservador()
    );

    if (novo === est) return;

    fecharModal();

    A.online.eventoVisto = chaveEvento(novo);
    aplicar(novo);

    if (A.modo === 'online') iniciarRelogio();

    atualizarInvestigacao();
    esconderTabela();

    if (A.modo === 'local') {
      mostrarPassagem();
    }
  }

  function mostrarPassagem(extra = '') {
    if (
      A.modo !== 'local' ||
      A.estado.fim
    ) {
      return;
    }

    const j = P.jogadorDaVez(A.estado);

    abrirModal(`
      <div class="passagem">

        <p class="suave">
          Turno ${A.estado.turno}
        </p>

        <p>Passe o computador para</p>

        <strong>${esc(j.nome)}</strong>

        ${extra ? `
          <p class="suave">${esc(extra)}</p>
        ` : ''}

        <p class="suave">
          Você terá ${minutos(A.estado.tempoVez)}
          a partir de quando tocar no botão.
          A tabela que aparece é só sua.
        </p>

        <div class="acoes"
             style="justify-content:center">

          <button class="botao"
                  data-acao="comecar-turno"
                  data-foco>
            Começar meu turno
          </button>
        </div>
      </div>`, '', true);
  }

  /* ---------- acusação ---------- */

  function abrirAcusacao() {
    const cen = cenario();
    const m = minhasMarcas();

    const confirmadoDe = cat => {
      const k = Object.keys(m[cat])
        .find(i => m[cat][i] === 'confirmado');

      return k === undefined ? '' : k;
    };

    const opcoes = (lista, cat) =>
      `<option value="">Escolha…</option>` +
      lista.map((x, i) => `
        <option value="${i}"
                ${String(confirmadoDe(cat)) === String(i)
                  ? 'selected'
                  : ''}>
          ${esc(x.nome)}
        </option>
      `).join('');

    abrirModal(`
      <h2>Fazer acusação</h2>

      <p>
        Você só pode acusar <strong>uma vez</strong>.
        Se errar, sai da disputa.
        O relógio continua correndo.
      </p>

      <form data-form="acusacao" novalidate>
        <div class="campo">
          <label for="ac-S">
            1. Escolha o suspeito
          </label>

          <select id="ac-S"
                  data-ac="S"
                  data-foco>
            ${opcoes(cen.suspeitos, 'S')}
          </select>
        </div>

        <div class="campo">
          <label for="ac-L">
            2. Escolha o local
          </label>

          <select id="ac-L" data-ac="L">
            ${opcoes(cen.locais, 'L')}
          </select>
        </div>

        <div class="campo">
          <label for="ac-A">
            3. Escolha a arma
          </label>

          <select id="ac-A" data-ac="A">
            ${opcoes(cen.armas, 'A')}
          </select>
        </div>

        <div class="acusacao-previa" data-previa></div>

        <p class="erro" data-erro></p>

        <div class="acoes">
          <button type="button"
                  class="botao secundario"
                  data-acao="fechar-modal">
            Cancelar
          </button>

          <button type="submit"
                  class="botao perigo">
            Confirmar acusação
          </button>
        </div>
      </form>`);

    atualizarPrevia();
  }

  function atualizarPrevia() {
    const cen = cenario();

    const v = k =>
      camada.querySelector(`[data-ac="${k}"]`).value;

    const s = v('S');
    const l = v('L');
    const a = v('A');

    const alvo = camada.querySelector('[data-previa]');

    if (!alvo) return;

    alvo.innerHTML = `
      <figure>
        ${s !== ''
          ? retrato(cen.suspeitos[s], cen.suspeitos[s].nome)
          : '<div class="arma">?</div>'}

        <figcaption>
          ${s !== ''
            ? esc(cen.suspeitos[s].nome)
            : 'Suspeito'}
        </figcaption>
      </figure>

      <figure>
        ${l !== ''
          ? recorte(cen, cen.locais[l])
          : '<div class="arma">?</div>'}

        <figcaption>
          ${l !== ''
            ? esc(cen.locais[l].nome)
            : 'Local'}
        </figcaption>
      </figure>

      <figure>
        <div class="arma">
          ${a !== ''
            ? esc(cen.armas[a].nome)
            : '?'}
        </div>

        <figcaption>Arma</figcaption>
      </figure>`;
  }

  function confirmarAcusacao(form) {
    const v = k =>
      form.querySelector(`[data-ac="${k}"]`).value;

    if (
      v('S') === '' ||
      v('L') === '' ||
      v('A') === ''
    ) {
      form.querySelector('[data-erro]').textContent =
        'Escolha o suspeito, o local e a arma.';
      return;
    }

    const quem = P.jogadorDaVez(A.estado);

    const novo = P.acusar(
      A.estado,
      idObservador(),
      {
        S: +v('S'),
        L: +v('L'),
        A: +v('A')
      }
    );

    if (novo === A.estado) return;

    A.online.eventoVisto = chaveEvento(novo);
    aplicar(novo);

    if (A.modo === 'online' && !novo.fim) {
      iniciarRelogio();
    }

    const acerto = novo.vencedor === quem.nome;

    if (acerto) {
      abrirModal(`
        <div class="resultado-carimbo">
          <span class="carimbo bater">
            Caso encerrado
          </span>
        </div>

        <p style="text-align:center">
          ${esc(quem.nome)} acertou os três elementos.
        </p>

        <div class="acoes"
             style="justify-content:center">

          <button class="botao"
                  data-acao="ver-resultado"
                  data-foco>
            Ver a solução
          </button>
        </div>`);

      return;
    }

    abrirModal(`
      <div class="resultado-carimbo">
        <span class="carimbo bater">
          Eliminado
        </span>
      </div>

      <p style="text-align:center">
        A acusação de ${esc(quem.nome)} estava errada.
        ${esc(quem.nome)} sai da disputa,
        mas pode acompanhar a partida até o fim.
      </p>

      <div class="acoes"
           style="justify-content:center">

        <button class="botao"
                data-acao="${
                  novo.fim
                    ? 'ver-resultado'
                    : A.modo === 'local'
                      ? 'passar-modal'
                      : 'fechar-modal'
                }"
                data-foco>

          ${novo.fim ? 'Ver a solução' : 'Continuar'}
        </button>
      </div>`, '', A.modo === 'local');

    atualizarInvestigacao();
    esconderTabela();
  }

  /* ---------- resultado ---------- */

  function telaResultado() {
    fecharModal();

    const est = A.estado;
    const cen = buscar(est.cenario);
    const sol = est.solucao;

    const s = cen.suspeitos[sol.S];
    const l = cen.locais[sol.L];
    const w = cen.armas[sol.A];

    trocarTela('resultado', `
      <div class="tela">
        <article class="resultado folha clipe">

          <div class="cabecalho-folha">
            <span>${esc(cen.curto)}</span>
            <span>Turno ${est.turno}</span>
          </div>

          <span class="carimbo bater">
            ${est.vencedor
              ? 'Caso encerrado'
              : 'Caso sem solução'}
          </span>

          <h2>
            ${est.vencedor
              ? `${esc(est.vencedor)} desvendou o crime`
              : 'Todos os detetives erraram a acusação'}
          </h2>

          <p class="suave">
            ${est.vencedor
              ? 'Acertou o culpado, o local e a arma.'
              : 'Ninguém acertou. Esta era a solução:'}
          </p>

          <div class="solucao">
            <figure>
              ${retrato(s, s.nome)}

              <figcaption>
                <strong>${esc(s.nome)}</strong>
                <span>${esc(s.papel)}</span>
              </figcaption>
            </figure>

            <figure>
              ${recorte(cen, l)}

              <figcaption>
                <strong>${esc(l.nome)}</strong>
                <span>Local do crime</span>
              </figcaption>
            </figure>

            <figure>
              <div class="arma">
                ${esc(w.nome)}
              </div>

              <figcaption>
                <strong>${esc(w.nome)}</strong>
                <span>Arma usada</span>
              </figcaption>
            </figure>
          </div>

          <h3>Como chegar à resposta</h3>

          <ol class="passos">
            ${est.passos.map(p => `
              <li>
                <b>${esc(p.regra)}.</b>
                ${esc(p.texto)}
              </li>
            `).join('')}
          </ol>

          <h3>
            Pistas descobertas
            (${est.reveladas.length}
            de ${est.pistas.length})
          </h3>

          <ol class="pistas">
            ${est.reveladas.length
              ? est.reveladas
                  .map(id => cartaoPista(est, id))
                  .join('')
              : '<li class="vazio">Nenhuma pista revelada.</li>'}
          </ol>

          ${est.acusacoes.length ? `
            <h3>Acusações</h3>

            <ul>
              ${est.acusacoes.map(a => `
                <li>
                  ${esc(a.jogador)}:
                  ${esc(cen.suspeitos[a.S].nome)},
                  ${esc(cen.locais[a.L].nome)},
                  ${esc(cen.armas[a.A].nome)}
                  ${a.certo ? '(acertou)' : '(errou)'}
                </li>
              `).join('')}
            </ul>
          ` : ''}

          <p style="margin-top:26px">
            <button class="botao"
                    data-acao="nova-partida"
                    data-foco>
              Nova partida
            </button>
          </p>

        </article>
      </div>`);
  }

  /* ---------- eventos ---------- */

  document.addEventListener('click', e => {
    if (
      e.target.matches('[data-fundo-modal]') &&
      A.tela !== 'investigacao'
    ) {
      fecharModal();
      return;
    }

    const b = e.target.closest('[data-acao]');

    if (!b || b.disabled) return;

    const acao = b.dataset.acao;

    switch (acao) {
      case 'inicio':
        telaInicio();
        break;

      case 'como-jogar':
        telaComoJogar();
        break;

      case 'jogar':
        irParaJogar();
        break;

      case 'modo-local':
        A.modo = 'local';
        telaCenarios();
        break;

      case 'modo-criar':
        A.modo = 'online-criar';
        telaCenarios();
        break;

      case 'modo-entrar':
        telaNomeOnline('entrar');
        break;

      case 'escolher-cenario':
        A.cenarioId = b.dataset.id;

        if (A.modo === 'online-criar') {
          telaNomeOnline('criar');
        } else {
          telaJogadores();
        }
        break;

      case 'voltar-cenarios':
        telaCenarios();
        break;

      case 'qtd':
        guardarNomes();
        A.numJogadores = 3;
        telaJogadores();
        break;

      case 'tempo':
        A.tempoVez = +b.dataset.s;

        app.querySelectorAll('[data-acao="tempo"]')
          .forEach(x =>
            x.setAttribute(
              'aria-pressed',
              String(x === b)
            )
          );
        break;

      case 'iniciar-online':
        iniciarOnline();
        break;

      case 'sair-sala':
        if (A.online.codigo) {
          window.Salas.sairDaSala(A.online.codigo);
        }
        telaInicio();
        break;

      case 'revelar':
        revelar();
        break;

      case 'passar':
        passar();
        break;

      case 'confirmar-passar':
        passar(true);
        break;

      case 'acusar':
        abrirAcusacao();
        break;

      case 'marcar':
        marcar(b);
        break;

      case 'ampliar': {
        const cen = cenario();

        abrirModal(`
          <img src="${esc(imagem(cen.imagem))}"
               alt="Planta ilustrada: ${esc(cen.curto)}">

          <div class="acoes">
            <button class="botao"
                    data-acao="fechar-modal"
                    data-foco>
              Fechar
            </button>
          </div>`, 'grande');

        break;
      }

      case 'fechar-modal':
        fecharModal();

        if (A.estado && A.estado.fim) {
          telaResultado();
        }
        break;

      case 'passar-modal':
        fecharModal();
        atualizarInvestigacao();

        if (A.estado.fim) {
          telaResultado();
        } else {
          mostrarPassagem();
        }
        break;

      case 'comecar-turno':
        fecharModal();
        iniciarRelogio();
        atualizarInvestigacao(true);
        break;

      case 'ver-resultado':
        telaResultado();
        break;

      case 'nova-partida':
        A.estado = null;
        A.online.codigo = null;
        telaInicio();
        break;
    }
  });

  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]');

    if (!f) return;

    e.preventDefault();

    const tipo = f.dataset.form;

    if (tipo === 'jogadores') {
      guardarNomes();
      comecarLocal();
    }

    if (tipo === 'criar' || tipo === 'entrar') {
      enviarOnline(tipo, f);
    }

    if (tipo === 'acusacao') {
      confirmarAcusacao(f);
    }
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-ac]')) {
      atualizarPrevia();
    }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-nome]')) {
      A.nomes[+e.target.dataset.nome] = e.target.value;
    }
  });

  document.addEventListener('keydown', e => {
    if (
      e.key === 'Escape' &&
      modalAberto() &&
      !camada.querySelector(
        '[data-acao="comecar-turno"], ' +
        '[data-acao="passar-modal"], ' +
        '[data-acao="ver-resultado"]'
      )
    ) {
      fecharModal();
    }
  });

  function guardarNomes() {
    app.querySelectorAll('[data-nome]')
      .forEach(inp => {
        A.nomes[+inp.dataset.nome] = inp.value;
      });
  }

  /* ---------- inicialização ---------- */

  if (location.hash === '#teste') {
    window.__estado = () => A.estado;
    window.__relogio = () => ({
      ...A.relogio,
      agora: Date.now()
    });
  }

  telaInicio();

  let onlinePronto = !window.Salas;

  const promessaOnline = window.Salas
    ? window.Salas.iniciar().then(r => {
        A.online.ok = !!r.ok;
        A.online.podeEscrever =
          r.podeEscrever !== false;

        onlinePronto = true;
      })
    : Promise.resolve();

  async function irParaJogar() {
    if (!onlinePronto) {
      trocarTela(
        'carregando',
        `<div class="tela">
          <div class="cadastro folha">
            <p>Preparando a mesa de investigação…</p>
          </div>
        </div>`
      );

      await Promise.race([
        promessaOnline,
        new Promise(r => setTimeout(r, 4000))
      ]);
    }

    if (A.online.ok) {
      telaModo();
    } else {
      A.modo = 'local';
      telaCenarios();
    }
  }
})();