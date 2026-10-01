export interface Gift {
  id: string;
  label: string;
  categoryId: string;
}

export interface GiftCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const giftCategories: GiftCategory[] = [
  { id: 'sala', label: 'Sala', icon: '🛋️', description: 'Um cantinho para estar junto.' },
  { id: 'cozinha', label: 'Cozinha', icon: '🍳', description: 'Para as receitas, os cafés e as conversas.' },
  { id: 'banheiros', label: 'Banheiros', icon: '🚿', description: 'Pequenos cuidados para o dia a dia.' },
  { id: 'quartos', label: 'Quartos', icon: '☾', description: 'Para noites tranquilas e manhãs felizes.' },
  { id: 'lavanderia', label: 'Lavanderia', icon: '🧺', description: 'Para deixar a rotina mais leve.' },
];

const giftNames: Record<string, string[]> = {
  sala: ['TV'],
  cozinha: [
    'Fruteira',
    'Micro-ondas',
    'Forno de embutir',
    'Sanduicheira / grill',
    'Garrafa de café',
    'Suporte para coador de papel',
    'Jogo de xícaras de café',
    'Jogo de xícaras de chá',
    'Panela de pressão',
    'Leiteira',
    'Assadeiras / formas',
    'Travessas',
    'Refratários de vidro',
    'Descanso de panela',
    'Luva térmica',
    'Jogo de pratos',
    'Jogo de sobremesa',
    'Jogo de copo',
    'Faqueiro',
    'Jarra de vidro',
    'Tigelas / bowls',
    'Tábua de corte',
    'Abridor de latas / garrafas',
    'Saca-rolhas',
    'Ralador',
    'Peneira',
    'Espátulas',
    'Tesoura de cozinha',
    'Descascador de legumes',
    'Fouet / batedor',
    'Copo medidor',
    'Colher medidora',
    'Vasilhas de vidro com tampa',
    'Vasilhas de plástico com tampa',
    'Porta-temperos',
    'Escorredor de louças',
    'Panos de prato',
    'Lixeira da cozinha',
    'Porta-detergente / esponja',
    'Porta-papel-toalha',
  ],
  banheiros: ['Toalhas de banho', 'Toalhas de rosto', 'Tapetes'],
  quartos: [
    'Jogos de lençol King',
    'Colcha / cobre-leito King',
    'Manta casal',
    'Cabides adulto e infantil',
    'Organizadores de gaveta',
    'Caixas / cestos organizadores',
    'Jogo de lençol de solteiro infantil',
    'Colcha / cobre-leito solteiro',
    'Manta solteiro',
    'Organizador de brinquedos',
  ],
  lavanderia: [
    'Pregadores',
    'Cesto de roupa suja',
    'Baldes',
    'Bacias',
    'Pá de lixo',
    'Panos de chão',
    'Flanelas',
    'Tábua de passar roupa',
    'Ferro de passar roupa',
    'Capa para máquina de lavar 15 kg',
    'Ventiladores',
  ],
};

export const gifts: Gift[] = giftCategories.flatMap(({ id: categoryId }) =>
  giftNames[categoryId].map((label, index) => ({
    id: `${categoryId}-${String(index + 1).padStart(2, '0')}`,
    label,
    categoryId,
  })),
);

export const giftCatalogByCategory: Record<string, number> = Object.fromEntries(
  giftCategories.map((category) => [
    category.id,
    gifts.filter((gift) => gift.categoryId === category.id).length,
  ]),
);
