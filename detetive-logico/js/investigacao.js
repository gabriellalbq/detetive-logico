
/*
 * investigacao.js — Controle da investigação.
 *
 * Integra os módulos de partidas e deduções.
 *
 * Funcionalidades:
 * - Iniciar uma investigação
 * - Consultar o jogador da vez
 * - Revelar pistas
 * - Analisar possibilidades
 * - Passar a vez
 * - Controlar o fim do tempo
 * - Registrar acusações
 * - Gerar informações para a interface
 */

(function (raiz) {
  "use strict";

  const Partida = raiz.Partida ||
    (typeof require !== "undefined"
      ? require("./partida.js")
      : null);

  const Deducoes = raiz.Deducoes ||
    (typeof require !== "undefined"
      ? require("./deducoes.js")
      : null);

  const Cenarios = raiz.Cenarios ||
    (typeof require !== "undefined"
      ? require("./cenarios.js")
      : null);

  if (!Partida || !Deducoes || !Cenarios) {
    throw new Error(
      "Os módulos Partida, Deducoes e Cenarios são necessários."
    );
  }

  // Verifica se existe uma investigação válida.
  function validarEstado(estado) {
    if (!estado || !Array.isArray(estado.jogadores)) {
      throw new Error("Investigação inválida.");
    }
  }

  // Inicia uma partida com 3 a 6 jogadores.
  function iniciar(cenarioId, jogadores, tempoVez = 180) {
    if (!Array.isArray(jogadores)) {
      throw new Error("A lista de jogadores é inválida.");
    }

    if (jogadores.length < 3 || jogadores.length > 6) {
      throw new Error(
        "A investigação precisa de 3 a 6 jogadores."
      );
    }

    return Partida.criarPartida(
      cenarioId,
      jogadores,
      Math.random,
      tempoVez
    );
  }

  // Retorna o cenário escolhido.
  function obterCenario(estado) {
    validarEstado(estado);
    return Cenarios.buscar(estado.cenario);
  }

  // Retorna o jogador que está na vez.
  function jogadorAtual(estado) {
    validarEstado(estado);
    return Partida.jogadorDaVez(estado);
  }

  // Retorna apenas as pistas reveladas.
  function pistasConhecidas(estado) {
    validarEstado(estado);

    return estado.pistas.filter(pista =>
      estado.reveladas.includes(pista.id)
    );
  }

  // Revela uma nova pista na vez do jogador.
  function revelar(estado, jogadorId) {
    validarEstado(estado);

    return Partida.revelarPista(
      estado,
      jogadorId
    );
  }

  // Consulta as deduções possíveis.
  function analisar(estado) {
    validarEstado(estado);

    return Deducoes.analisar(estado);
  }

  // Retorna explicações baseadas nas pistas.
  function explicar(estado) {
    validarEstado(estado);

    return Deducoes.explicar(estado);
  }

  // Encerra voluntariamente a vez do jogador.
  function passarVez(estado, jogadorId) {
    validarEstado(estado);

    return Partida.passarVez(
      estado,
      jogadorId
    );
  }

  // Encerra a vez quando o cronômetro acaba.
  function tempoEsgotado(estado, numeroTurno) {
    validarEstado(estado);

    return Partida.tempoEsgotado(
      estado,
      numeroTurno
    );
  }

  // Registra uma acusação.
  function acusar(estado, jogadorId, suspeito, local, arma) {
    validarEstado(estado);

    if (typeof Partida.acusar !== "function") {
      throw new Error(
        "A função acusar ainda não foi implementada em partida.js."
      );
    }

    const acusacao = {
      S: suspeito,
      L: local,
      A: arma
    };

    return Partida.acusar(
      estado,
      jogadorId,
      acusacao
    );
  }

  // Monta um resumo para mostrar na interface.
  // Não revela a solução secreta da partida.
  function resumo(estado) {
    validarEstado(estado);

    const cenario = obterCenario(estado);
    const deducoes = analisar(estado);
    const jogador = jogadorAtual(estado);

    return {
      cenario: cenario.nome,
      turno: estado.turno,
      tempoVez: estado.tempoVez,

      jogadorAtual: jogador
        ? jogador.nome
        : null,

      jogadoresAtivos: Partida.ativos(estado).length,

      totalPistas: estado.pistas.length,
      pistasReveladas: estado.reveladas.length,
      pistasRestantes: Partida.pistasRestantes(estado),

      pistas: pistasConhecidas(estado).map(pista => ({
        id: pista.id,
        frase: pista.frase,
        formula: pista.formula,
        legenda: pista.legenda,
        conectivo: pista.conectivo,
        simbolo: pista.simbolo
      })),

      possibilidades: {
        total: deducoes.totalPossibilidades,
        suspeitos: deducoes.suspeitos,
        locais: deducoes.locais,
        armas: deducoes.armas
      },

      conclusoes: deducoes.confirmado,
      solucaoUnica: deducoes.solucaoUnica,

      fim: estado.fim,
      vencedor: estado.fim
        ? estado.vencedor
        : null
    };
  }

  // Disponibiliza as funções para outros arquivos.
  raiz.Investigacao = {
    iniciar,
    obterCenario,
    jogadorAtual,
    pistasConhecidas,
    revelar,
    analisar,
    explicar,
    passarVez,
    tempoEsgotado,
    acusar,
    resumo
  };

  // Permite utilizar o arquivo nos testes com Node.js.
  if (typeof module !== "undefined") {
    module.exports = raiz.Investigacao;
  }

})(typeof window !== "undefined" ? window : globalThis);
