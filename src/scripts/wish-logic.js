const wishes = {
  strength: 'Shenron sonríe: tu deseo se cumple. ¡Ahora entrena para alcanzar ese poder!',
  friends: 'El dragón reúne a tus amigos para una aventura inolvidable.',
  feast: 'Aparece un festín legendario. Hasta Goku queda impresionado.',
};

export function grantWish(wish) {
  return wishes[wish] ?? 'Shenron escuchó tu deseo. Elige una de las opciones para descubrir qué sucede.';
}
