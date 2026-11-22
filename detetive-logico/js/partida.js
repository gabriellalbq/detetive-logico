/* partida.js — controla o andamento da partida: ordem dos jogadores, vezes,
   rodadas, tempo, entrega das pistas e acusações. */
(function (raiz) {
  const Pistas = raiz.Pistas || (typeof require !== 'undefined' ? require('./pistas.js') : null);
  const Cenarios = raiz.Cenarios || (typeof require !== 'undefined' ? require('./cenarios.js') : null);

  const TEMPOS = [60, 120, 180, 300];   // opções de tempo por vez, em segundos
  const TEMPO_PADRAO = 180;             // 3 minutos

  function embaralhar(lista, rnd) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const copiar = (x) => JSON.parse(JSON.stringify(x));

  /* jogadores: [{id, nome}] — a ordem dos turnos é sorteada aqui. */
  function criarPartida(cenarioId, jogadores, rnd = Math.random, tempoVez = TEMPO_PADRAO) {
    if (jogadores.length < 3 || jogadores.length > 6) throw new Error('A partida precisa de 3 a 6 jogadores.');
    const cen = Cenarios.buscar(cenarioId);
    const inv = Pistas.gerarInvestigacao(cen, rnd);
    const pistasDoJogador = {};
    jogadores.forEach(j => { pistasDoJogador[j.id] = []; });
    return {
      cenario: cenarioId,
      jogadores: embaralhar(jogadores, rnd).map(j => ({ id: j.id, nome: j.nome, acusou: false, eliminado: false })),
      vez: 0,
      turno: 1,
      rodada: 1,
      tempoVez: TEMPOS.includes(tempoVez) ? tempoVez : TEMPO_PADRAO,
      revelouNaVez: false,    // cada detetive recebe no máximo uma pista por vez
      pistas: inv.pistas,
      reveladas: [],          // pistas que já saíram para alguém (usado no resultado final)
      pistasDoJogador,        // id do jogador -> ids das pistas que SÓ ele recebeu
      dadasNaRodada: [],      // pistas já entregues nesta rodada (ninguém repete na mesma rodada)
      solucao: inv.solucao,
      passos: inv.passos,
      acusacoes: [],
      vencedor: null,
      fim: false,
      ultimoEvento: null
    };
  }

  const jogadorDaVez = (est) => est.jogadores[est.vez];
  const ativos = (est) => est.jogadores.filter(j => !j.eliminado);

  /* Ids das pistas de um jogador, na ordem em que ele recebeu. */
  const idsDe = (est, jogadorId) => (est.pistasDoJogador && est.pistasDoJogador[jogadorId]) || [];
  const pistasDe = (est, jogadorId) => idsDe(est, jogadorId).map(id => est.pistas.find(p => p.id === id));

  /* Quantas pistas o jogador ainda não recebeu. Sem jogador, conta as que ninguém viu. */
  function pistasRestantes(est, jogadorId) {
    if (jogadorId === undefined) return est.pistas.length - est.reveladas.length;
    return est.pistas.length - idsDe(est, jogadorId).length;
  }

  /* Pistas que o jogador pode receber agora: ele não tem e ninguém recebeu nesta rodada. */
  function pistasDisponiveis(est, jogadorId) {
    const minhas = idsDe(est, jogadorId);
    const naRodada = est.dadasNaRodada || [];
    const semRepetir = est.pistas.filter(p => !minhas.includes(p.id) && !naRodada.includes(p.id));
    if (semRepetir.length) return semRepetir;
    // com muitos jogadores, nas rodadas finais pode faltar pista inédita na rodada:
    // aí vale repetir uma pista da rodada, desde que o jogador ainda não a tenha
    return est.pistas.filter(p => !minhas.includes(p.id));
  }

  function proximaVez(est) {
    if (ativos(est).length === 0) return est.vez;
    let i = est.vez;
    do { i = (i + 1) % est.jogadores.length; } while (est.jogadores[i].eliminado);
    return i;
  }

  function avancar(est) {
    const anterior = est.vez;
    est.vez = proximaVez(est);
    if (est.vez <= anterior) {          // deu a volta na mesa: começa uma rodada nova
      est.rodada = (est.rodada || 1) + 1;
      est.dadasNaRodada = [];
    }
    est.turno += 1;
    est.revelouNaVez = false;
    return est;
  }

  /* Entrega UMA pista só para o jogador da vez. A vez NÃO passa.
     Pistas que ninguém viu ainda têm prioridade; depois, as pistas começam a se repetir
     entre os jogadores, mas nunca para quem já recebeu. */
  function revelarPista(estAtual, jogadorId) {
    const est = copiar(estAtual);
    if (est.fim || est.revelouNaVez || jogadorDaVez(est).id !== jogadorId) return estAtual;
    est.pistasDoJogador = est.pistasDoJogador || {};
    est.dadasNaRodada = est.dadasNaRodada || [];

    const podem = pistasDisponiveis(est, jogadorId);
    if (!podem.length) return estAtual;
    const ineditas = podem.filter(p => !est.reveladas.includes(p.id));
    const opcoes = ineditas.length ? ineditas : podem;
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];

    est.pistasDoJogador[jogadorId] = [...idsDe(est, jogadorId), escolhida.id];
    est.dadasNaRodada.push(escolhida.id);
    if (!est.reveladas.includes(escolhida.id)) est.reveladas.push(escolhida.id);
    est.revelouNaVez = true;
    // o aviso geral diz só QUEM recebeu pista, nunca QUAL pista
    est.ultimoEvento = { tipo: 'pista', jogador: jogadorDaVez(est).nome, n: idsDe(est, jogadorId).length, turno: est.turno };
    return est;
  }

  /* O detetive encerra a própria vez antes do tempo acabar. */
  function passarVez(estAtual, jogadorId) {
    const est = copiar(estAtual);
    if (est.fim || jogadorDaVez(est).id !== jogadorId) return estAtual;
    est.ultimoEvento = { tipo: 'passou', jogador: jogadorDaVez(est).nome };
    return avancar(est);
  }

  /* O tempo da vez acabou. Só vale para o turno informado, para não pular duas vezes. */
  function tempoEsgotado(estAtual, turno) {
    const est = copiar(estAtual);
    if (est.fim || est.turno !== turno) return estAtual;
    est.ultimoEvento = { tipo: 'tempo', jogador: jogadorDaVez(est).nome };
    return avancar(est);
  }

  /* Acusação: acerto encerra a partida; erro elimina o detetive e passa a vez.
     acusacao = { S, L, A } com os índices escolhidos. */
  function acusar(estAtual, jogadorId, acusacao) {
    const est = copiar(estAtual);
    const quem = jogadorDaVez(est);
    if (est.fim || quem.id !== jogadorId || quem.acusou || quem.eliminado) return estAtual;

    const certo = acusacao.S === est.solucao.S && acusacao.L === est.solucao.L && acusacao.A === est.solucao.A;
    quem.acusou = true;
    est.acusacoes.push({ jogador: quem.nome, S: acusacao.S, L: acusacao.L, A: acusacao.A, certo });

    if (certo) {
      est.fim = true;
      est.vencedor = quem.nome;
      est.ultimoEvento = { tipo: 'acerto', jogador: quem.nome };
      return est;
    }

    quem.eliminado = true;
    est.ultimoEvento = { tipo: 'erro', jogador: quem.nome };
    if (ativos(est).length === 0) {       // todos erraram: caso sem solução
      est.fim = true;
      return est;
    }
    return avancar(est);
  }

  raiz.Partida = {
    TEMPOS, TEMPO_PADRAO, criarPartida, jogadorDaVez, ativos, idsDe, pistasDe,
    pistasRestantes, pistasDisponiveis, revelarPista, passarVez, tempoEsgotado, acusar, proximaVez
  };
  if (typeof module !== 'undefined') module.exports = raiz.Partida;
})(typeof window !== 'undefined' ? window : globalThis);