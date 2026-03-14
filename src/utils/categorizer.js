const DEFAULT_KEYWORDS = {
  'Alimentação': ['supermercado', 'restaurante', 'lanchonete', 'pizza', 'hamburguer', 'burger', 'pao', 'lanches', 'epa', 'chiezacoelh', 'ifood', 'uber eats', 'rappi', 'cafe', 'café', 'padaria', 'panificadora'],
  'Transporte': ['uber', '99', 'taxi', 'combustível', 'gasolina', 'etanol', 'diesel', 'posto', 'metrô', 'ônibus', 'trem', 'rodoviária', 'estacionamento', 'pedágio', 'auto proteja'],
  'Lazer': ['cinema', 'theatro', 'teatro', 'show', 'concerto', 'steam', 'playstation', 'xbox', 'game', 'jogo', 'beer', 'distribuidora', 'bebida', 'bar', 'adega', 'barzinho'],
  'Saúde': ['farmácia', 'drogaria', 'hospital', 'clínica', 'médico', 'dentista', 'laboratório', 'exame', 'vacina', 'plano de saúde'],
  'Educação': ['curso', 'escola', 'universidade', 'faculdade', 'livraria', 'ebook'],
  'Moradia': ['aluguel', 'condomínio', 'iptu', 'luz', 'água', 'gás', 'copasa', 'cemig', 'telecomunicações', 'internet', 'telefone', 'vivo', 'claro', 'oi', 'plano'],
  'Salário': ['salário', 'holerite', 'pagamento', 'depósito', 'recebimento'],
  'Investimento': ['investimento', 'rendimento', 'juros', 'aplicação', 'cdb', 'tesouro', 'fundos', 'ações', 'criptomoeda', 'bitcoin'],
  'Assinaturas': ['gympass', 'netflix', 'prime', 'disney', 'spotify', 'hbo', 'youtube', 'youtube premium', 'spotify'],
  'Vestuário': ['shein', 'c&a', 'kaedu', 'puma', 'adidas', 'nike', 'calcados', 'constance', 'riachuelo', 'marisa', 'lojasa'],
  'Presentes': [],
  'Outros': []
}

export const getCategoryFromDescription = (description, customKeywords = {}) => {
  const keywords = { ...DEFAULT_KEYWORDS, ...customKeywords }
  const desc = description.toLowerCase()

  for (const [category, words] of Object.entries(keywords)) {
    if (category === 'Outros') continue
    for (const word of words) {
      if (desc.includes(word.toLowerCase())) {
        return category
      }
    }
  }

  return 'Outros'
}

export const getDefaultCategories = () => Object.keys(DEFAULT_KEYWORDS)
