/* Operación Número 13 — guion de las escenas (cinemáticas).
   Cada beat: { bg, l, r, ghost, who, text, fx, card }
   bg: nombre de sala | 'finca' | 'velvet' | 'black' | 'room' (la sala actual)
   l / r: 'pepe' | 'jandro' (personaje a izquierda / derecha) · ghost: el de la derecha solo es una voz
   who: quién habla ('pepe' | 'jandro' | null = narrador)
   fx: 'fall' | 'shake' | 'flash' | 'vanish' | 'smoke'
   card: { n, num, sym, inv } carta de tarot a pantalla grande */
(function (root) {
  'use strict';

  const MAGO = { n: 'El Mago', num: 'I', sym: '🎩' };
  const LOCO = { n: 'El Loco', num: '0', sym: '🃏' };
  const JUSTICIA = { n: 'La Justicia', num: 'XI', sym: '⚖️' };

  const S = {
    intro: (s) => [
      { bg: 'finca', text: 'Una finca. Una casa. Todo en silencio... hasta que un coche estrafalario entra tambaleándose. Del retrovisor cuelga un muñeco cabezón: un pitoniso. Ritmo de jazz clásico de fondo.' },
      { bg: 'salon', l: 'pepe', text: 'Dentro, Pepe sustituye su foto de Guardia Civil por una enorme carta astral. Sube a una escalera... que se cierra poco a poco.', fx: 'fall' },
      { bg: 'salon', l: 'pepe', who: 'pepe', text: 'Ya sabía yo que me haría falta la colchoneta...' },
      { bg: 'salon', l: 'pepe', text: '¡RIIIING! Suena el timbre. Pepe guarda a toda prisa su marco con las medallas y apaga el pinchadiscos.', fx: 'shake' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'jandro', text: 'Propicios días. ¿Pepe? Aquí Jandro, su hombre místico de confianza.' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'pepe', text: '¿Triscaidecafobia, dice? Eso es. Desde el accidente. Lo importante no es qué pasó, sino en qué fecha: martes 13 de agosto de 2013.' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'jandro', text: '¿Le dejó su mujer? ¿Se le murió el gato? ¿De qué color? ¿Negro?' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'pepe', text: 'No sé... ¡SÍ!' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'jandro', text: 'No hay duda. Fue el gato.' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'pepe', text: 'Puto gato.' },
      { bg: 'salon', l: 'pepe', r: 'jandro', who: 'jandro', text: 'Para echar las malas energías de su hogar necesito dos horas. A solas, ya sabe las normas. Váyase tranquilo.' },
      { bg: 'finca', text: 'Pepe se marcha en su coche... pero esconde una cámara. Desde una tablet lo ve todo: Jandro desvalijando la casa y tirando de una bandera que no se acaba nunca. De pronto, la imagen se vuelve negra.', fx: 'flash' },
      { bg: 'finca', l: 'pepe', who: 'pepe', text: '¡Estafador! ¡Qué cabrón! ¡Y decían que yo estaba loco...!' },
      { bg: 'salon', l: 'pepe', who: 'pepe', text: '¡Alto, Guardia Civil! Queda usted detenido por la comisión de un supuesto delito de... ¿estafa?', fx: 'shake' },
      { bg: 'salon', l: 'pepe', text: 'No hay nadie. No hay nada. La casa vacía. Jandro ha desaparecido por arte de magia. Sí que era un estafador... pero también un mago. En el centro del salón, una carta del tarot.', card: MAGO },
      { bg: 'salon', l: 'pepe', r: 'jandro', ghost: true, who: 'jandro', text: 'Ale... Operación Número 13 en marcha. Tienes ' + s.minutes + ' minutos, Pepe. Y la puerta se ha cerrado sola.', fx: 'smoke' },
    ],

    tablet: () => [
      { bg: 'room', r: 'jandro', ghost: true, text: 'Tu móvil vibra sobre el mueble. Es una videollamada de un número oculto. Se descuelga solo.', fx: 'flash' },
      { bg: 'room', r: 'jandro', ghost: true, who: 'jandro', text: 'Vaya, vaya... dos cartas ya. No está mal para un hombre con tu pierna, Pepe.' },
      { bg: 'room', l: 'pepe', r: 'jandro', ghost: true, who: 'pepe', text: '¿Dónde estás, mago de pacotilla?' },
      { bg: 'room', l: 'pepe', r: 'jandro', ghost: true, who: 'jandro', text: 'Si te lo digo no tiene gracia. Te regalo una pista gratis: El Sumo Sacerdote siempre mira al revés. Ah, y el cuaderno de estafas no es mío. Es de un amigo.' },
      { bg: 'room', text: 'La llamada se corta. Has ganado una pista gratis.' },
    ],

    pasadizo: () => [
      { bg: 'salon', text: 'Colocas las tres cartas: La Torre, La Rueda y El Sumo Sacerdote. El tapete fucsia se estremece. Una bandera interminable cae del techo y tapa el sofá.', fx: 'shake' },
      { bg: 'salon', text: 'El arco azul del salón se abre despacio. Detrás hay un pasadizo oscuro y, al fondo, una luz fucsia.', fx: 'flash' },
      { bg: 'salon', r: 'jandro', ghost: true, who: 'jandro', text: 'Enhorabuena, Pepe. Pasa si te atreves. Y ponte la gorra, que hay corriente.' },
    ],

    final: (s, g) => [
      { bg: 'velvet', text: 'El pasadizo desemboca en una mesa cubierta por un tapete fucsia. Sentado, con un pañuelo en la cabeza, Jandro baraja cartas como si nada.' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'jandro', text: 'Propicios días otra vez, Pepe. ¿Ha venido a por su dinero?' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'pepe', text: '¡Alto, Guardia Civil! Queda usted detenido por un delito de estafa.', fx: 'shake' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'jandro', text: '¿Y las pruebas?' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'pepe', text: 'Una baraja marcada, un vudú de 2,99 €, un esqueleto con cuerda y un amuleto «Made in China»... ' + (g.pruebas >= 6 ? '¿Sigo?' : 'Y mucha mala leche.') },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'jandro', text: 'Puto gato...' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', text: 'Jandro le hace una peineta e intenta desaparecer por arte de magia... pero esta vez la gorra de Pepe pesa más que el truco.', fx: 'vanish' },
      { bg: 'velvet', l: 'pepe', text: 'Clic. Esposas. Por primera vez en años, a Pepe no se le cae el pantalón.', card: JUSTICIA },
    ],

    secreto: (s, g) => [
      { bg: 'velvet', text: 'El pasadizo desemboca en una mesa cubierta por un tapete fucsia. Sentado, con un pañuelo en la cabeza, Jandro baraja cartas como si nada.' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'pepe', text: '¡Alto, Guardia Civil! Queda usted detenido por un delito de estafa.', fx: 'shake' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'jandro', text: 'Jajaja. Tengo un truco para eso. Y ya sabes cuál.', fx: 'smoke' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'pepe', text: 'Lo sé. Pero hay una carta que te dejaste en la maleta, mago. La que nunca juegas.', card: LOCO },
      { bg: 'velvet', l: 'pepe', r: 'jandro', who: 'jandro', text: 'No... esa no...', fx: 'shake' },
      { bg: 'velvet', l: 'pepe', r: 'jandro', text: 'Jandro se va convirtiendo en una carta del tarot, en cuyo subtítulo dice: EL LOCO. Esta vez, la mano que la agarra no es la suya.', fx: 'vanish', card: LOCO },
      { bg: 'velvet', l: 'pepe', who: 'pepe', text: 'Operación Número 13... completada.' },
    ],

    derrota: () => [
      { bg: 'salon', text: 'Se acaba el tiempo. Un humo violeta llena el salón y, cuando se disipa, solo queda en el centro una carta del tarot: EL MAGO.', fx: 'smoke', card: MAGO },
      { bg: 'salon', l: 'pepe', text: 'Pepe se queda mirando, abstraído, con la muleta al hombro. Una música de jazz triste y dinámica retrata al desdichado... y se le caen los pantalones.', fx: 'fall' },
      { bg: 'velvet', text: 'La imagen se convierte en una carta del tarot cuyo subtítulo dice EL LOCO. Sobre un tapete fucsia, una mano la agarra y la hace desaparecer. ¡ZAS!', card: LOCO },
      { bg: 'velvet', r: 'jandro', who: 'jandro', text: 'Operación Número 13... completada.', fx: 'flash' },
    ],
  };

  root.Scenes = { get: (k, s, g) => S[k](s || {}, g || {}) };
})(window);
