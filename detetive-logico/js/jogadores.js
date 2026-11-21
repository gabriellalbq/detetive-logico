
/*
 * jogadores.js — Gerenciamento dos jogadores.
 *
 * Funcionalidades:
 * - Cadastrar jogadores
 * - Editar nomes
 * - Remover jogadores
 * - Validar de 3 a 6 participantes
 * - Impedir nomes repetidos
 * - Preparar a lista para iniciar uma partida
 *
 * A ordem dos turnos e as eliminações
 * são controladas pelo partida.js.
 */

(function (raiz) {
  "use strict";

  const MIN_JOGADORES = 3;
  const MAX_JOGADORES = 6;

  // Remove espaços desnecessários do nome.
  function normalizarNome(nome) {
    if (typeof nome !== "string") {
      throw new Error("O nome deve ser um texto.");
    }

    return nome.trim().replace(/\s+/g, " ");
  }

  // Cria uma lista vazia para o cadastro.
  function novaLista() {
    return [];
  }

  // Verifica se já existe outro jogador com esse nome.
  function nomeRepetido(lista, nome, ignorarId = null) {
    const nomeNormalizado = normalizarNome(nome)
      .toLocaleLowerCase("pt-BR");

    return lista.some(jogador =>
      jogador.id !== ignorarId &&
      jogador.nome.toLocaleLowerCase("pt-BR") ===
        nomeNormalizado
    );
  }

  // Cria um ID único para um jogador.
  function gerarId(lista) {
    let numero = 1;

    while (lista.some(j => j.id === `j${numero}`)) {
      numero++;
    }

    return `j${numero}`;
  }

  // Adiciona um jogador sem alterar a lista original.
  function adicionar(lista, nome) {
    if (!Array.isArray(lista)) {
      throw new Error("Lista de jogadores inválida.");
    }

    if (lista.length >= MAX_JOGADORES) {
      throw new Error(
        "A partida aceita no máximo 6 jogadores."
      );
    }

    const nomeLimpo = normalizarNome(nome);

    if (!nomeLimpo) {
      throw new Error("Digite o nome do jogador.");
    }

    if (nomeLimpo.length > 30) {
      throw new Error(
        "O nome deve ter no máximo 30 caracteres."
      );
    }

    if (nomeRepetido(lista, nomeLimpo)) {
      throw new Error(
        "Já existe um jogador com esse nome."
      );
    }

    const novoJogador = {
      id: gerarId(lista),
      nome: nomeLimpo
    };

    return [...lista, novoJogador];
  }

  // Permite editar o nome de um jogador.
  function editar(lista, jogadorId, novoNome) {
    const nomeLimpo = normalizarNome(novoNome);

    if (!lista.some(j => j.id === jogadorId)) {
      throw new Error("Jogador não encontrado.");
    }

    if (!nomeLimpo || nomeLimpo.length > 30) {
      throw new Error(
        "Informe um nome de 1 a 30 caracteres."
      );
    }

    if (nomeRepetido(lista, nomeLimpo, jogadorId)) {
      throw new Error(
        "Já existe outro jogador com esse nome."
      );
    }

    return lista.map(jogador =>
      jogador.id === jogadorId
        ? { ...jogador, nome: nomeLimpo }
        : { ...jogador }
    );
  }

  // Remove um jogador antes da partida começar.
  function remover(lista, jogadorId) {
    if (!lista.some(j => j.id === jogadorId)) {
      throw new Error("Jogador não encontrado.");
    }

    return lista
      .filter(j => j.id !== jogadorId)
      .map(j => ({ ...j }));
  }

  // Confere se há jogadores suficientes.
  function validar(lista) {
    if (!Array.isArray(lista)) {
      throw new Error("Lista de jogadores inválida.");
    }

    if (
      lista.length < MIN_JOGADORES ||
      lista.length > MAX_JOGADORES
    ) {
      throw new Error(
        "A partida precisa de 3 a 6 jogadores."
      );
    }

    const ids = new Set();
    const nomes = new Set();

    for (const jogador of lista) {
      if (
        !jogador ||
        typeof jogador.id !== "string" ||
        !jogador.id.trim()
      ) {
        throw new Error("ID de jogador inválido.");
      }

      const nome = normalizarNome(jogador.nome);

      if (!nome || nome.length > 30) {
        throw new Error("Nome de jogador inválido.");
      }

      const chave = nome.toLocaleLowerCase("pt-BR");

      if (ids.has(jogador.id) || nomes.has(chave)) {
        throw new Error(
          "Existem IDs ou nomes de jogadores repetidos."
        );
      }

      ids.add(jogador.id);
      nomes.add(chave);
    }

    return true;
  }

  // Prepara os jogadores para o partida.js.
  function prepararPartida(lista) {
    validar(lista);

    return lista.map(jogador => ({
      id: jogador.id,
      nome: normalizarNome(jogador.nome)
    }));
  }

  // Disponibiliza as funções para outros arquivos.
  raiz.Jogadores = {
    MIN_JOGADORES,
    MAX_JOGADORES,
    novaLista,
    adicionar,
    editar,
    remover,
    validar,
    prepararPartida
  };

  // Permite executar testes com Node.js.
  if (typeof module !== "undefined") {
    module.exports = raiz.Jogadores;
  }

})(typeof window !== "undefined" ? window : globalThis);
