
/*
 * deducoes.js — Sistema de dedução lógica.
 *
 * Analisa as pistas reveladas e descobre quais
 * suspeitos, locais e armas continuam possíveis.
 *
 * Utiliza as funções do arquivo logica.js.
 */

(function (raiz) {
  const Logica = raiz.Logica ||
    (typeof require !== 'undefined'
      ? require('./logica.js')
      : null);

  const Cenarios = raiz.Cenarios ||
    (typeof require !== 'undefined'
      ? require('./cenarios.js')
      : null);

  // Retorna o cenário da investigação.
  function obterCenario(estado) {
    const cenario = Cenarios.buscar(estado.cenario);

    if (!cenario) {
      throw new Error('Cenário não encontrado.');
    }

    return cenario;
  }

  // Seleciona apenas as pistas já reveladas.
  function pistasReveladas(estado) {
    return estado.pistas.filter(pista =>
      estado.reveladas.includes(pista.id)
    );
  }

  // Obtém as proposições das pistas conhecidas.
  function proposicoesConhecidas(estado) {
    return pistasReveladas(estado)
      .map(pista => pista.expr)
      .filter(Boolean);
  }

  // Descobre todas as soluções compatíveis
  // com as pistas reveladas até o momento.
  function mundosPossiveis(estado) {
    const cenario = obterCenario(estado);
    const proposicoes = proposicoesConhecidas(estado);

    const reveladas = pistasReveladas(estado);

    if (proposicoes.length !== reveladas.length) {
      throw new Error(
        'Uma pista revelada não possui sua expressão lógica.'
      );
    }

    return Logica.solucoes(proposicoes, cenario);
  }

  // Retorna os índices de uma categoria
  // que continuam possíveis.
  function possibilidades(mundos, categoria) {
    return [...new Set(
      mundos.map(mundo => mundo[categoria])
    )].sort((a, b) => a - b);
  }

  // Transforma os índices em nomes.
  function nomesPossiveis(indices, itens) {
    return indices.map(indice => itens[indice].nome);
  }

  // Analisa a investigação.
  function analisar(estado) {
    const cenario = obterCenario(estado);
    const mundos = mundosPossiveis(estado);

    const suspeitos = possibilidades(mundos, 'S');
    const locais = possibilidades(mundos, 'L');
    const armas = possibilidades(mundos, 'A');

    return {
      pistasAnalisadas: pistasReveladas(estado).length,

      totalPossibilidades: mundos.length,

      suspeitos: nomesPossiveis(
        suspeitos,
        cenario.suspeitos
      ),

      locais: nomesPossiveis(
        locais,
        cenario.locais
      ),

      armas: nomesPossiveis(
        armas,
        cenario.armas
      ),

      // Uma conclusão só é confirmada quando
      // todas as soluções restantes concordam.
      confirmado: {
        suspeito: mundos.length > 0 && suspeitos.length === 1
          ? cenario.suspeitos[suspeitos[0]].nome
          : null,

        local: mundos.length > 0 && locais.length === 1
          ? cenario.locais[locais[0]].nome
          : null,

        arma: mundos.length > 0 && armas.length === 1
          ? cenario.armas[armas[0]].nome
          : null
      },

      solucaoUnica: mundos.length === 1
    };
  }

  // Gera mensagens para ajudar o jogador
  // a interpretar as deduções.
  function explicar(estado) {
    const resultado = analisar(estado);
    const mensagens = [];

    if (resultado.totalPossibilidades === 0) {
      mensagens.push(
        'As pistas são contraditórias. Verifique as proposições.'
      );
      return mensagens;
    }

    mensagens.push(
      `${resultado.totalPossibilidades} combinações ainda são possíveis.`
    );

    if (resultado.confirmado.suspeito) {
      mensagens.push(
        `Suspeito determinado: ${resultado.confirmado.suspeito}.`
      );
    }

    if (resultado.confirmado.local) {
      mensagens.push(
        `Local determinado: ${resultado.confirmado.local}.`
      );
    }

    if (resultado.confirmado.arma) {
      mensagens.push(
        `Arma determinada: ${resultado.confirmado.arma}.`
      );
    }

    if (resultado.solucaoUnica) {
      mensagens.push(
        'As pistas permitem uma única solução lógica!'
      );
    }

    return mensagens;
  }

  // Disponibiliza o sistema para o restante do jogo.
  raiz.Deducoes = {
    pistasReveladas,
    proposicoesConhecidas,
    mundosPossiveis,
    analisar,
    explicar
  };

  if (typeof module !== 'undefined') {
    module.exports = raiz.Deducoes;
  }

})(typeof window !== 'undefined' ? window : globalThis);
