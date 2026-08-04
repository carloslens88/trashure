// Skins cosméticas del robot: cambian su color e insignia en el mapa y en la
// tarjeta de jugador. Compra/equipar vive en el servidor (Chatarra real);
// esto solo mapea id → aspecto visual. 3 son exclusivas de una facción.

export const SKINS = {
  oxidado: { name: 'Chatarra Vieja', price: 50, faction: null, colors: ['#a8a29e', '#57534e'], badge: null },
  sombra: { name: 'Modelo Sombra', price: 300, faction: null, colors: ['#334155', '#0f172a'], badge: '🌑' },
  radiactivo: { name: 'Núcleo Filtrado', price: 400, faction: null, colors: ['#bbf7d0', '#16a34a'], badge: '☢️' },
  dorado: { name: 'Chapado en Oro', price: 500, faction: null, colors: ['#fef3c7', '#d97706'], badge: '✨' },
  arcoiris: { name: 'Prisma', price: 800, faction: null, colors: ['#f0abfc', '#818cf8'], badge: '🌈', animated: true },
  recicladores_skin: { name: 'Chapa de Reciclaje', price: 150, faction: 'recicladores', colors: ['#bbf7d0', '#15803d'], badge: '♻️' },
  anticuarios_skin: { name: 'Pátina Dorada', price: 150, faction: 'anticuarios', colors: ['#fde68a', '#92400e'], badge: '🏺' },
  contrabandistas_skin: { name: 'Camuflaje Furtivo', price: 150, faction: 'contrabandistas', colors: ['#a5f3fc', '#155e75'], badge: '🛸' },
}

export const SKIN_ORDER = Object.keys(SKINS)
