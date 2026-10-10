/* Operación Número 13 — Escape room · datos y lógica (sin interfaz). */
(function (root) {
  'use strict';

  const DIFF = {
    relajado: { n: 'Relajado', min: 10 },
    normal:   { n: 'Normal',   min: 6 },
    reto:     { n: 'Reto',     min: 3 },
  };
  const HINT_COST = 30;      // segundos que cuesta una pista
  const P_CODE = 10, P_ORDER = 15; // penalización por fallar un código / un orden
  const MAX_READINGS = 2;    // lecturas de tarot por partida
  const ROOMS = [
    { id: 'salon', n: 'Salón' }, { id: 'cocina', n: 'Cocina' }, { id: 'dormitorio', n: 'Dormitorio' },
    { id: 'despacho', n: 'Despacho' }, { id: 'bano', n: 'Baño' }, { id: 'jardin', n: 'Jardín' }, { id: 'coche', n: 'Coche' }, { id: 'pasadizo', n: 'Pasadizo' },
  ];
  const BG = { salon: 'salon', cocina: 'cocina', dormitorio: 'dormitorio', despacho: 'despacho', bano: 'bano' };
  // vistas especiales: 'square' = plano de la finca centrado · 'closeup' = interior del coche
  const VIEW = { jardin: 'garden', coche: 'closeup', pasadizo: 'velvet' };
  // plano de la casa (en % de la escena del jardín): [x, y, ancho, alto] y puertas entre salas
  const PLAN = {
    house: [4.5, 7, 67.5, 82],
    rooms: { bano: [6, 9.5, 17, 33], despacho: [26, 9.5, 44, 33], dormitorio: [6, 46, 17, 41], salon: [26, 46, 24, 41], cocina: [52.5, 46, 17.5, 41] },
    doors: [['bano', 'dormitorio', 14.5, 44.2], ['dormitorio', 'salon', 24.5, 66], ['salon', 'despacho', 38, 44.2], ['salon', 'cocina', 51.3, 66], ['despacho', 'cocina', 61, 44.2]],
    entrance: [38, 88.4],
  };

  /* ---------- Objetos ---------- */
  // card: carta de tarot dibujada en CSS · prueba: cuenta para el marcador de pruebas
  const ITEMS = {
    linterna: { n: 'Linterna', d: 'Ilumina rincones oscuros. Para usarla: selecciónala y haz clic en algo oscuro.' },
    libro: { n: 'Manual de ilusionismo', prueba: true, d: 'Un libro de trucos con una esquina doblada en el capítulo 13.',
      read: '«Capítulo 13 · Las cerraduras de Pepe.\nTodo hombre con miedo al 13 usa la fecha de su desgracia como clave: día y mes, sin barras.\nSu desgracia: martes 13 de agosto.»' },
    llave: { n: 'Llave del despacho', d: 'Una llavecita con una etiqueta: «Despacho».' },
    lupa: { n: 'Lupa', d: 'Para leer la letra pequeña. Selecciónala y úsala sobre algo con letras diminutas.' },
    libro2: { n: 'Cuaderno de estafas', prueba: true, d: 'Los apuntes de Jandro sobre sus «clientes».',
      read: '«Cliente nº 13: PEPE.\n— Triscaidecafobia.\n— Cojea de la pierna izquierda.\n— Contraseña del ordenador: la criatura que le arruinó la vida (4 letras, minúsculas).\n— Muy fácil de impresionar. Cobrar por adelantado.»' },
    cuchillo: { n: 'Cuchillo de plata', d: 'Afilado. Sirve para cortar cosas cosidas, entre otras.' },
    telefono: { n: 'Móvil de Pepe', d: 'Tiene una nota de voz de «J. el Mago».',
      read: 'Nota de voz de Jandro:\n«Pepe, Pepe... ¿todavía buscando? Te regalo una pista: las pociones se toman en orden. Primero la que sabe dulce, luego la que NO se bebe, y por último la que apaga la sed.\nAh, y tu coche abre más cosas de las que crees.»' },
    coche_llave: { n: 'Llave del coche', d: 'La llave de tu coche estrafalario. Tiene un llavero de calavera.' },
    pocion_roja: { n: 'Poción roja', d: 'Etiqueta: «Poción de amor». Sabe a fresa. Poder mágico: cero.' },
    pocion_verde: { n: 'Poción verde', d: 'Etiqueta: «Poción de la verdad». Es limpiacristales. No beber. Nunca.' },
    pocion_azul: { n: 'Poción azul', d: 'Etiqueta: «Agua de luna». Es agua del grifo con purpurina.' },
    policia: { n: 'Gorra de Guardia Civil', d: 'Tu gorra. Sin ella, ni tú mismo te tomas en serio.' },
    cartas: { n: 'Baraja marcada', prueba: true, d: 'Todas las cartas de El Mago llevan una marca en la esquina. ¡Prueba de estafa! Úsala en el último truco... y pulsa 🃏 Tarot para pedirle una lectura a Jandro.' },
    vudu: { n: 'Muñeco vudú', prueba: true, d: 'Etiqueta: 2,99 €. Agujas no incluidas. ¡Prueba de estafa!' },
    amuleto: { n: 'Amuleto', prueba: true, d: 'Dice «Protección total». Pone «Made in China». ¡Prueba de estafa!' },
    esqueleto: { n: 'Esqueleto articulado', prueba: true, d: 'Los espíritus no llevan cuerda en la espalda. ¡Prueba de estafa!' },
    nota: { n: 'Nota de Jandro', emoji: '📝', d: 'La encontraste bajo el sillón del jardín.',
      read: '«Querido Pepe:\nSi has llegado hasta aquí, mereces un premio. Mi maleta de cuero se abre con tu fecha maldita... pero al revés, como tu suerte.\nAtentamente, J.»' },
    expedientes: { n: 'Expedientes', emoji: '📁', prueba: true, d: 'Tus propios expedientes sobre Jandro, con su foto y tu vieja placa estropeada. ¡Los habías perdido!' },
    carta_loco: { n: 'El Loco', card: { num: '0', sym: '🃏' }, secret: true, d: 'La carta que Jandro nunca juega. Guárdala para el momento adecuado.',
      read: 'En el reverso:\n«Si la juegas contra un mago, te acordarás de mí.»' },
    joya: { n: 'Anillo de la abuela', d: 'Brilla muchísimo. A Jandro le brillarán los ojos al verlo: úsalo para distraerlo en el último truco.' },
    rifle: { n: 'Rifle de colección', d: 'Sin munición, pero muy decorativo. Sirve de palo largo para alcanzar cosas altas.' },
    espejo: { n: 'Espejo de mano', d: 'Un espejo barroco. Los magos odian que les enseñen su reflejo: úsalo en el último truco.' },
    cartera: { n: 'Cartera vacía', prueba: true, d: 'Tu cartera, sin los 500 € (diez billetes de 50) que le pagaste a Jandro «por adelantado». Con un recibo falso dentro. ¡Prueba de estafa!' },
    carta_mago: { n: 'El Mago', card: { num: 'I', sym: '🎩' }, d: 'La carta que Jandro dejó sobre la mesa.',
      read: 'En el reverso, con letra de ilusionista:\n«Mi carta astral esconde el orden de la lectura. Léela con lupa. —J.»' },
    carta_torre: { n: 'La Torre', card: { num: 'XVI', sym: '🗼' }, d: 'La torre cae, y con ella las mentiras.' },
    carta_rueda: { n: 'La Rueda', card: { num: 'X', sym: '☸️' }, d: 'La rueda gira. Siempre.' },
    carta_sacerdote: { n: 'El Sumo Sacerdote', card: { num: 'V', sym: '🔮', inv: true }, d: 'Está boca abajo, como en tu lectura.' },
  };
  const CARDS = ['carta_torre', 'carta_rueda', 'carta_sacerdote'];
  const POTION_ORDER = ['pocion_roja', 'pocion_verde', 'pocion_azul'];
  const PRUEBAS = Object.keys(ITEMS).filter((k) => ITEMS[k].prueba);

  const TV_MSG = (min) => `La tele se enciende sola y aparece Jandro, haciendo una reverencia:

«Querido Pepe: sí, soy un estafador. Y también un mago.
Si quieres encontrarme, tienes ${min} minutos.

1) Reúne las tres cartas de tu lectura: La Torre, La Rueda y El Sumo Sacerdote.
2) Colócalas en su orden sobre la mesa del salón.
3) Entra por mi pasadizo con la gorra puesta: un Guardia Civil sin gorra no detiene a nadie.

P.D.: la puerta de casa se ha cerrado sola. Operación Número 13 en marcha.»`;

  /* ---------- Zonas interactivas ----------
     box = [x, y, ancho, alto] en % de la imagen. on(g, sel): g = API, sel = objeto seleccionado.
     done(g): true cuando ya no hay nada más que hacer ahí (apaga el punto de ayuda). */
  const HS = {
    salon: [
      { id: 'tv', n: 'Televisión', box: [37.5, 25.2, 20.5, 21.5], on: (g) => { g.set('tv'); g.read('Mensaje de Jandro', TV_MSG(g.s.minutes)); } },
      { id: 'sofa', n: 'Sofá', box: [57.5, 52, 26.5, 43], done: (g) => g.flag('bandera'),
        on: (g) => {
          if (g.flag('bandera')) return g.say('Del sofá todavía cuelga un trozo de bandera. No sabes dónde guardarla.');
          g.set('bandera'); g.give('linterna'); g.ach('bandera');
          g.say('Un pañuelo rojo y amarillo asoma bajo el cojín. Tiras... y tiras... ¡es tu bandera, que no se acaba nunca! Al final, enredada, aparece una linterna.');
        } },
      { id: 'estanteria', n: 'Estantería', box: [65.3, 20.6, 13.8, 43.5], done: (g) => g.flag('libro'),
        on: (g) => {
          if (g.flag('libro')) return g.say('Libros de astrología, de numerología y uno sobre cómo dejar de creer en ellos.');
          g.set('libro'); g.give('libro');
          g.say('Entre los libros de astrología hay un «Manual de ilusionismo» con una esquina doblada. Qué casualidad.');
        } },
      { id: 'sillon', n: 'Sillón amarillo', box: [7.5, 60.5, 20.5, 32], done: (g) => g.flag('cllave'),
        on: (g) => {
          if (g.flag('cllave')) return g.say('Un sillón cómodo y sin más secretos.');
          g.set('cllave'); g.give('coche_llave');
          g.say('Entre los cojines, la llave de tu coche. ¿Cómo ha llegado hasta aquí? Jandro...');
        } },
      { id: 'mueble_tv', n: 'Mueble de la tele', box: [33.5, 50.9, 30, 12], done: (g) => g.flag('cartas'),
        on: (g) => {
          if (g.flag('cartas')) return g.say('El mueble de la tele está vacío. Ya no queda ni un mando.');
          g.set('cartas'); g.give('cartas');
          g.say('En el cajón del centro, una baraja de tarot. ¡Las cartas de El Mago llevan una marca en la esquina! Esto es una prueba.');
        } },
      { id: 'astral', n: 'Carta astral', box: [20.3, 16, 14.3, 22.5], done: (g) => g.flag('orden'),
        on: (g, sel) => {
          if (sel === 'lupa') {
            g.set('orden');
            return g.read('Carta astral (con lupa)', 'Con la lupa, en el borde, se lee una frase minúscula:\n\n«ORDEN DE LA LECTURA\n1.º La Torre cae.\n2.º La Rueda gira.\n3.º El Sumo Sacerdote bendice.»');
          }
          if (g.flag('orden')) return g.read('Carta astral', '1.º La Torre cae.\n2.º La Rueda gira.\n3.º El Sumo Sacerdote bendice.');
          g.say(g.has('lupa')
            ? 'Una enorme carta astral con letra diminuta en el borde. Selecciona la lupa en tu inventario y úsala aquí.'
            : 'Una enorme carta astral, con letra diminuta en el borde. Ni con tus gafas se lee. Necesitas algo para ver mejor.');
        } },
      { id: 'mesa', n: 'Mesa de tapete fucsia', box: [39, 64.2, 18.5, 16.5], done: (g) => g.flag('mesa_resuelta'),
        on: (g) => {
          if (!g.flag('mago')) {
            g.set('mago'); g.give('carta_mago');
            return g.say('Sobre el tapete fucsia, una carta: EL MAGO. La guardas. Tiene algo escrito detrás.');
          }
          if (g.flag('mesa_resuelta')) return g.say('Las tres cartas siguen sobre la mesa, en su sitio. El arco del salón ya no es una pared.');
          const faltan = CARDS.filter((c) => !g.has(c));
          if (faltan.length) return g.say(`Sobre la mesa hay tres huecos para cartas. Todavía te faltan ${faltan.length}: ${faltan.map((c) => ITEMS[c].n).join(', ')}.`);
          g.finalTable();
        } },
      { id: 'arco', n: 'Arco azul', box: [82, 11.9, 16, 51.3], on: (g) => {
          if (!g.flag('mesa_resuelta')) return g.say('La puerta está cerrada, con una cerradura en forma de carta de tarot. Se oye una risita al otro lado: «Se abre cuando yo quiera.»');
          g.goRoom('pasadizo');
          g.say(g.has('policia') ? 'Cruzas el arco azul. Al fondo, una luz fucsia... y alguien barajando cartas.' : 'Cruzas el arco. Al fondo hay una luz fucsia, pero sin tu gorra de Guardia Civil no podrás detener a nadie. ¡Recuérdalo!');
        } },
      { id: 'girasol', n: 'Girasol', box: [15, 37.6, 6.5, 21], on: (g) => g.say('Un girasol de mentira. Qué bonito. Qué inútil.') },
      { id: 'arco_rosa', n: 'Arco rosa', box: [1, 17.4, 8.8, 63], done: (g) => g.flag('rifle'),
        on: (g) => {
          if (g.flag('rifle')) return g.say('Un arco rosa decorativo. Ya sin rifle.');
          g.set('rifle'); g.give('rifle');
          g.say('Detrás del arco rosa, colgado de la pared, tu rifle de colección. Sin munición, pero largo. ¡Qué casualidad que alguien lo escondiera ahí!');
        } },
      { id: 'pinchadiscos', n: 'Pinchadiscos', box: [87.5, 72, 11, 20],
        on: (g) => { const on = g.toggleJazz(); g.say(on ? 'Enciendes el pinchadiscos: un chasquido... y nada. Jandro se llevó los discos. Pepe mueve el pie igualmente, por costumbre.' : 'Apagas el pinchadiscos. Como si hiciera falta: ya reina un silencio incómodo, como en el corto.'); g.count('dj', 3); } },
      { id: 'lampara', n: 'Lámpara de bola', box: [89.5, 50, 8, 15], on: (g) => g.say('Una lámpara con forma de luna. Ilumina poco y adivina menos.') },
    ],

    cocina: [
      { id: 'nevera', n: 'Nevera', box: [11, 18, 22, 66], done: (g) => g.flag('nevera'),
        on: (g) => {
          if (g.flag('nevera')) return g.say('Una nevera vacía. Pepe no cocina desde que se fue su mujer.');
          g.set('nevera'); g.give('pocion_roja');
          g.say('Entre cartones de leche caducada hay un frasco rojo: «Poción de amor». Huele a fresa.');
        } },
      { id: 'fregadero', n: 'Armario del fregadero', box: [51.6, 58, 23.8, 24.5], done: (g) => g.flag('fregadero'),
        on: (g) => {
          if (g.flag('fregadero')) return g.say('Bajo el fregadero solo queda un charco y una esponja.');
          g.set('fregadero'); g.give('pocion_verde');
          g.say('Detrás de las lejías, un frasco verde: «Poción de la verdad». Es limpiacristales con colorante.');
        } },
      { id: 'cajones', n: 'Cajones', box: [75, 60, 7, 35], done: (g) => g.flag('cuchillo'),
        on: (g) => {
          if (g.flag('cuchillo')) return g.say('Cubiertos, servilletas y una bolsa de bridas. Nada más.');
          g.set('cuchillo'); g.give('cuchillo');
          g.say('En los cajones, un cuchillo de plata. Perfecto para cortar cosas... cosidas.');
        } },
      { id: 'microondas', n: 'Microondas', box: [88.2, 17.4, 11.8, 19.3], done: (g) => g.flag('micro'),
        on: (g) => {
          if (g.flag('micro')) return g.say('El microondas está abierto y vacío. Huele a palomitas quemadas.');
          g.keypad({
            title: 'Microondas', prompt: 'En lugar de temporizador tiene un teclado de 4 cifras.', answer: '1308',
            onOk: () => { g.set('micro'); g.give('llave'); g.say('¡Clic! El microondas se abre y dentro hay una llavecita con una etiqueta: «Despacho».'); },
          });
        } },
      { id: 'horno', n: 'Horno', box: [32, 60, 19, 24], done: (g) => g.flag('horno'),
        on: (g, sel) => {
          if (sel === 'linterna') {
            g.set('horno');
            return g.read('Fondo del horno', 'Con la linterna ves, pegado con celo al fondo del horno, un post-it:\n\n«Martes 13-08.\nSiempre.»');
          }
          if (g.flag('horno')) return g.read('Fondo del horno', 'Un post-it pegado al fondo del horno:\n\n«Martes 13-08. Siempre.»');
          g.say(g.has('linterna') ? 'Está oscuro dentro del horno. Selecciona la linterna y úsala aquí.' : 'Está muy oscuro dentro del horno. Con una linterna se vería algo.');
        } },
      { id: 'olla', n: 'Ollas', box: [33.5, 44, 17, 12], done: (g) => g.flag('vudu'),
        on: (g) => {
          if (g.flag('vudu')) return g.say('Dos ollas sin sopa. Lo normal en esta casa.');
          g.set('vudu'); g.give('vudu');
          g.say('En la olla amarilla, un muñeco vudú con etiqueta de oferta: 2,99 €. Otra prueba contra Jandro.');
        } },
      { id: 'utensilios', n: 'Utensilios', box: [38, 31, 9.3, 13.5], on: (g) => g.say('Una espumadera, un cucharón y un tenedor gigante. Ni un solo truco de magia.') },
      { id: 'armarios', n: 'Armarios altos', box: [51.3, 5, 28.7, 23.4], done: (g) => g.flag('cartera'),
        on: (g) => {
          if (g.flag('cartera')) return g.say('Cereales. Y más cereales. Nada que ver con la magia.');
          g.set('cartera'); g.give('cartera');
          g.say('Entre cereales, tu cartera... vacía. Falta el dinero que le diste a Jandro «por adelantado»: diez billetes de 50. Y hay un recibo falso. ¡Otra prueba!');
        } },
      { id: 'campana', n: 'Campana extractora', box: [33, 2, 17.5, 26], on: (g) => g.say('Una campana extractora rosa. Hace más ruido que humo.') },
    ],

    dormitorio: [
      { id: 'mesilla1', n: 'Mesilla (cajón de arriba)', box: [12, 61.3, 9.3, 9.4], done: (g) => g.flag('telefono'),
        on: (g) => {
          if (g.flag('telefono')) return g.say('El cajón está vacío salvo por un cargador sin enchufe.');
          g.set('telefono'); g.give('telefono');
          g.say('Tu móvil. Tiene una llamada perdida de «J. el Mago» y una nota de voz. Mejor escúchala (selecciónalo y pulsa Examinar).');
        } },
      { id: 'mesilla2', n: 'Mesilla (cajón de abajo)', box: [12, 71.8, 9.3, 8], done: (g) => g.flag('joya'),
        on: (g) => {
          if (g.flag('joya')) return g.say('Calcetines sin pareja, como todo en tu vida.');
          g.set('joya'); g.give('joya');
          g.say('Bajo unos calcetines sin pareja, el anillo de tu abuela. Brilla tanto que casi te ciega.');
        } },
      { id: 'mesilla3', n: 'Mesilla derecha', box: [45.7, 53.7, 7, 6.5], done: (g) => g.flag('azul'),
        on: (g) => {
          if (g.flag('azul')) return g.say('Nada más que un despertador que va 13 minutos atrasado.');
          g.set('azul'); g.give('pocion_azul');
          g.say('En el cajón, un frasco azul: «Agua de luna». Parece agua con purpurina.');
        } },
      { id: 'puf', n: 'Puf con ruedas', box: [56.8, 74.7, 11.8, 17], done: (g) => g.flag('puf'),
        on: (g, sel) => {
          if (g.flag('puf')) return g.say('Un puf con ruedas, ahora con una cicatriz. Lo prefieres al monociclo.');
          if (sel === 'cuchillo') {
            g.set('puf'); g.give('carta_rueda');
            return g.say('Cortas la costura del puf... ¡dentro hay una carta! LA RUEDA. Giró hasta aquí.');
          }
          g.say(g.has('cuchillo')
            ? 'El puf tiene una costura rarísima, recién cosida. Selecciona el cuchillo y úsalo aquí.'
            : 'El puf tiene una costura rarísima, recién cosida. Necesitas algo afilado.');
        } },
      { id: 'armario', n: 'Armario', box: [68.2, 7.2, 26.4, 71.4], done: (g) => g.flag('armario'),
        on: (g, sel) => {
          if (g.flag('armario')) return g.say('El armario está abierto. Dentro ya solo quedan perchas y polillas.');
          if (sel === 'coche_llave') {
            g.set('armario'); g.give('policia'); g.give('esqueleto');
            return g.say('¡Clic! Jandro cambió la cerradura por una de coche. Dentro, tu gorra... y un esqueleto articulado. «Todo el mundo tiene un esqueleto en el armario», pensabas. Tú, literalmente.');
          }
          g.say(g.has('coche_llave')
            ? 'La cerradura del armario tiene forma de llave de coche. Selecciona la llave del coche y úsala aquí.'
            : 'El armario está cerrado con una cerradura muy rara, en forma de llave de coche. Jandro la cambió.');
        } },
      { id: 'planta', n: 'Planta', box: [54, 38, 10, 28], done: (g) => g.flag('amuleto'),
        on: (g) => {
          if (g.flag('amuleto')) return g.say('Una planta con mejor suerte que tú.');
          g.set('amuleto'); g.give('amuleto');
          g.say('Enterrado en la maceta hay un amuleto «Protección total». Detrás pone «Made in China». Otra prueba.');
        } },
      { id: 'ventana', n: 'Ventana', box: [17.6, 8.5, 20.4, 34.5], done: (g) => g.flag('ventana'),
        on: (g, sel) => {
          if (g.flag('ventana')) return g.say('La ventana está abierta de par en par. Fuera se ve el jardín... y un coche de lo más raro.');
          if (sel === 'cuchillo') {
            g.set('ventana'); g.unlock('jardin');
            return g.say('Metes el cuchillo en la rendija y haces palanca. ¡CRAC! La ventana se abre. Ya puedes salir al jardín (pestaña «Jardín»).');
          }
          g.say(g.has('cuchillo')
            ? 'La ventana está atascada con pintura. Selecciona el cuchillo y úsalo como palanca.'
            : 'La ventana da al jardín, pero está atascada con pintura. Necesitas algo plano y afilado para hacer palanca.');
        } },
      { id: 'cama', n: 'Cama', box: [20.7, 58, 45, 32], on: (g) => { g.say('Tu cama... y a los pies, una colchoneta de tu tamaño, lista por si alguien se cae de la escalera. «Ya sabía yo que me haría falta la colchoneta», murmuras.'); g.ach('colchoneta'); } },
      { id: 'estante', n: 'Estante redondo', box: [61, 8.5, 10, 17.7], on: (g) => g.say('Libros de autoayuda: «Supera tus miedos», «Cómo ser feliz con el 13»... Ninguno funciona. Y ahí, tu marco con todas las medallas de Guardia Civil, que guardaste a toda prisa.') },
    ],

    despacho: [
      { id: 'cajon1', n: 'Cajonera (cajón 1)', box: [67.9, 45.2, 10, 9.2], done: (g) => g.flag('lupa'),
        on: (g) => {
          if (g.flag('lupa')) return g.say('Un cajón vacío y con olor a lápiz.');
          g.set('lupa'); g.give('lupa');
          g.say('En el primer cajón, una lupa. Perfecta para leer la letra pequeña.');
        } },
      { id: 'cajon2', n: 'Cajonera (cajón 2)', box: [67.9, 56, 10, 8.9], done: (g) => g.flag('libro2'),
        on: (g) => {
          if (g.flag('libro2')) return g.say('Un cajón con papeles en blanco.');
          g.set('libro2'); g.give('libro2');
          g.say('Bajo unos folios, un cuaderno de tapas negras: «Clientes». Hay uno subrayado con tu nombre.');
        } },
      { id: 'cajon3', n: 'Cajonera (cajón 3)', box: [67.9, 66.6, 10, 8.8], on: (g) => g.say('Vacío. Dentro, una nota: «Sigue buscando. —J.»') },
      { id: 'monitor', n: 'Ordenador', box: [42.5, 34.3, 13.2, 16], done: (g) => g.flag('pc'),
        on: (g) => {
          const video = () => g.read('Vídeo de Jandro (grabado en tu ordenador)',
            'Jandro, mirando a cámara:\n\n«Para tu lectura necesitas tres cartas. La Torre vive donde se apilan cosas en lo alto. La Rueda rueda donde se sientan los pies. Y El Sumo Sacerdote... se mira en un espejo, pero boca abajo.»');
          if (g.flag('pc')) return video();
          g.textInput({
            title: 'Ordenador de Pepe', prompt: 'Contraseña (4 letras):', answer: 'gato',
            onOk: () => { g.set('pc'); g.say('¡Dentro! Pepe, tu contraseña era demasiado fácil.'); video(); },
          });
        } },
      { id: 'silla', n: 'Silla roja', box: [25.7, 53, 15, 37], done: (g) => g.flag('silla'),
        on: (g) => {
          if (g.flag('silla')) return g.say('La silla ya está bajo la estantería. Con la pierna que tienes, mejor no te subas a lo tonto.');
          g.set('silla');
          g.say('Arrastras la silla roja hasta la estantería. Ahora podrías llegar a lo más alto.');
        } },
      { id: 'torre', n: 'Torre de bloques', box: [22.9, 21.6, 10.7, 8.8], done: (g) => g.flag('torre'),
        on: (g, sel) => {
          if (g.flag('torre')) return g.say('Los bloques están por el suelo. Como tus planes de las últimas semanas.');
          if (sel === 'rifle') { g.set('torre'); g.give('carta_torre'); return g.say('Alargas el rifle de colección y empujas la torre... ¡PUM! Entre los cubos cae una carta: LA TORRE. Por fin sirve para algo.'); }
          if (!g.flag('silla')) return g.say(g.has('rifle') ? 'Una torre de bloques en lo alto. No llegas ni de puntillas... pero con algo largo, como el rifle, sí.' : 'Una torre de bloques en lo alto de la estantería. No llegas ni de puntillas. Algo para subirte, o algo largo...');
          g.set('torre'); g.give('carta_torre');
          g.say('Subido a la silla, derribas la torre... ¡PUM! Entre los cubos cae una carta: LA TORRE.');
        } },
      { id: 'cajones_p', n: 'Cajones del escritorio', box: [54.9, 58.3, 10.3, 17.7], done: (g) => g.flag('espejo_m'),
        on: (g) => {
          if (g.flag('espejo_m')) return g.say('Bolígrafos secos y gomas de borrar. Ni un truco más.');
          g.set('espejo_m'); g.give('espejo');
          g.say('En los cajones pequeños hay un espejo de mano barroco. Raro en un despacho... salvo que alguien lo haya dejado para ti.');
        } },
      { id: 'teclado', n: 'Teclado (¿o piano?)', box: [17, 56, 9, 6],
        on: (g) => { g.piano(); g.say('Pulsas el teclado y suena una nota de piano: ¡chan-chán! De pronto, una voz lejana: «Toca mejor que Pepe, caballero.»'); g.count('chan', 3); } },
      { id: 'estanteria_d', n: 'Estantería roja', box: [19.6, 38, 16, 28], on: (g) => g.say('Libros para niños y figuras de colores. Jandro eligió bien dónde esconder las cosas: a la vista.') },
      { id: 'pizarra', n: 'Pizarra', box: [81, 12.4, 15, 52], on: (g) => g.say('Una pizarra con dibujos y la «Lista de sospechosos»: 1. Jandro. 2. Jandro. 3. El gato.') },
    ],

    jardin: [
      { id: 'coche_ext', n: 'Coche estrafalario', box: [75, 56, 22, 28], done: (g) => g.flag('coche_abierto'),
        on: (g, sel) => {
          if (g.flag('coche_abierto')) return g.goRoom('coche');
          if (sel === 'coche_llave') {
            g.set('coche_abierto'); g.unlock('coche');
            g.say('Tu llave abre el coche de Jandro. «Siempre copio las llaves», debía de pensar. Subes al asiento del conductor (pestaña «Coche»).');
            return g.goRoom('coche');
          }
          g.say(g.has('coche_llave')
            ? 'El coche de Jandro: rosa, abollado y lleno de purpurina. Está cerrado. Prueba con la llave de tu coche (selecciónala y úsala aquí).'
            : 'El coche estrafalario de Jandro, aparcado donde pilla. Está cerrado con llave.');
        } },
      { id: 'sillon_j', n: 'Sillón del jardín', box: [78, 26, 9, 15], done: (g) => g.flag('nota'),
        on: (g) => {
          if (g.flag('nota')) return g.say('Un sillón rosa abandonado en el jardín. Ni una sola nota más.');
          g.set('nota'); g.give('nota');
          g.say('Bajo el cojín del sillón, un sobre con tu nombre. Dentro, una nota de Jandro. ¡Mejor léela (selecciónala y pulsa Examinar)!');
        } },
      { id: 'monociclo', n: 'Monociclo', sprite: '🛞', box: [1.5, 83, 12, 14],
        on: (g) => { g.say('Tu viejo monociclo. «Cuando paraba en los semáforos me sacaba unas pelillas extra...» Hasta que una escalera se cerró por arte de magia.'); g.ach('monociclo'); } },
      { id: 'camino', n: 'Camino de entrada', box: [30, 89.5, 16, 9.5], on: (g) => g.say('El camino de losas hasta la verja. La verja, claro, se ha cerrado sola. Jandro piensa en todo.') },
      { id: 'arbustos', n: 'Arbustos', box: [51, 90, 11, 9], on: (g) => g.say('Arbustos redondos, perfectos... y falsos. Como Jandro.') },
      { id: 'arbol', n: 'Árbol', box: [87, 5, 11, 19], on: (g) => g.say('Un árbol redondo. Nunca se ha caído nada de él, salvo tú una vez.') },
    ],

    coche: [
      { id: 'talisman', n: 'Talismán del retrovisor', sprite: 'amuleto', box: [6, 8, 16, 30], on: (g) => g.say('Un talismán «para la buena suerte» colgado del retrovisor. Otra vez «Made in China». Jandro tiene proveedor fijo.') },
      { id: 'muneco', n: 'Muñeco cabezón', sprite: 'vudu', box: [28, 10, 16, 30], on: (g) => g.say('Un pitoniso de plástico con la cabeza bailona. Se parece sospechosamente a Jandro. Hasta en la sonrisa.') },
      { id: 'guantera', n: 'Guantera', sprite: '📁', box: [52, 50, 20, 34], done: (g) => g.flag('expedientes'),
        on: (g) => {
          if (g.flag('expedientes')) return g.say('La guantera está vacía, salvo por unas gominolas sospechosas.');
          g.set('expedientes'); g.give('expedientes');
          g.say('En la guantera, ¡tus expedientes de Jandro! Con su foto y tu vieja placa estropeada. Los habías perdido hace semanas.');
        } },
      { id: 'maleta', n: 'Maleta de cuero', sprite: 'cartera', box: [14, 52, 26, 38], done: (g) => g.flag('maleta'),
        on: (g) => {
          if (g.flag('maleta')) return g.say('La maleta está abierta y vacía. Huele a naftalina y a truco viejo.');
          g.keypad({
            title: 'Maleta de cuero', prompt: 'Un candado de 4 cifras. ¿Cómo decía la nota? «Tu fecha maldita... al revés.»', answer: '8031',
            onOk: () => { g.set('maleta'); g.give('carta_loco'); g.say('¡Clic! Dentro, sobre un tapete fucsia, una carta que nunca has visto jugar a Jandro: EL LOCO. Mejor guárdala.'); },
          });
        } },
    ],

    pasadizo: [
      { id: 'jandro_p', n: 'Jandro', box: [36, 12, 28, 58], done: (g) => false,
        on: (g) => {
          if (!g.has('policia')) return g.say('Jandro ni se inmuta: «Propicios días, Pepe. ¿Sin gorra? Un Guardia Civil sin gorra no detiene a nadie. Ve a buscarla.»', 'jandro');
          g.trick();
        } },
      { id: 'cortina_i', n: 'Cortina', box: [0, 0, 14, 100], on: (g) => g.say('Una cortina de terciopelo fucsia. Detrás no hay nada; Jandro prefiere los trucos de frente.') },
      { id: 'cortina_d', n: 'Cortina', box: [86, 0, 14, 100], on: (g) => g.say('Otra cortina de terciopelo. Huele a incienso y a truco barato.') },
      { id: 'bola', n: 'Bola de cristal', sprite: '🔮', box: [70, 52, 11, 18], on: (g) => g.say('Una bola de cristal... de plástico. Dentro hay una pegatina: «Made in China». Cómo no.') },
    ],

    bano: [
      { id: 'repisa', n: 'Repisa de los frascos', box: [40.4, 13.7, 15.7, 21.5], done: (g) => g.flag('espejo_abierto'),
        on: (g) => {
          if (g.flag('espejo_abierto')) return g.say('Los tres frascos brillan en la repisa. El espejo ya está abierto.');
          const faltan = POTION_ORDER.filter((p) => !g.has(p));
          if (faltan.length) return g.say(`En la repisa hay tres huecos con forma de frasco. Todavía te faltan ${faltan.length} frascos: busca por la casa.`);
          g.potions();
        } },
      { id: 'espejo', n: 'Espejo', box: [67.1, 4.6, 13.9, 33.9], done: (g) => g.flag('sacerdote'),
        on: (g) => {
          if (!g.flag('espejo_abierto')) return g.say('Tu cara de susto. Detrás se intuye un hueco, pero el espejo no cede.');
          if (g.flag('sacerdote')) return g.say('El espejo se ve normal. Tu cara de susto sigue ahí.');
          g.set('sacerdote'); g.give('carta_sacerdote');
          g.say('El espejo se desliza y detrás hay una carta, ¡boca abajo!: EL SUMO SACERDOTE (invertido, como en tu lectura).');
        } },
      { id: 'lavabo', n: 'Mueble del lavabo', box: [64.3, 55, 12, 30], done: (g) => g.flag('botiquin'),
        on: (g) => {
          if (g.flag('botiquin')) return g.say('Toallas enrolladas. Ni rastro de patitos.');
          g.set('botiquin'); g.freeHint();
          g.say('Bajo las toallas, un botiquín. Te pones una tirita en la pierna. Te sientes con ideas: ¡una pista gratis!');
        } },
      { id: 'banera', n: 'Bañera', box: [11, 61.3, 41.4, 28.7], on: (g) => g.say('Una bañera con un patito de goma. Te mira. Pepe no confía en el patito.') },
      { id: 'inodoro', n: 'Inodoro', box: [77, 54, 19.5, 43.7], on: (g) => g.say('Aquí llorabas por el gato. «Puto gato», murmuras.') },
      { id: 'mueble_izq', n: 'Mueble de la bañera', box: [2.9, 71.7, 17, 27.4], on: (g) => g.say('Toallas, jabón y un reloj de arena. No hay tiempo para limpiar.') },
    ],
  };

  /* ---------- Pistas (en orden del camino principal) ---------- */
  const STAGES = [
    { id: 'libro', unmet: (g) => !g.flag('libro'), t: ['Los libros de un «mago» siempre esconden secretos. Mira bien el salón.', 'Coge el «Manual de ilusionismo» de la estantería del salón (a la derecha de la tele).'] },
    { id: 'micro', unmet: (g) => !g.flag('micro'), t: ['Hay un aparato con teclado numérico en la cocina. El libro habla de una fecha.', 'Microondas de la cocina: código 1308 (13 de agosto, día y mes, que dice el libro).'] },
    { id: 'despacho', unmet: (g) => !g.s.unlocked.despacho, t: ['Ya tienes la llave del despacho. ¿Para qué sirve una llave?', 'Pulsa la pestaña «Despacho» con la llave en el inventario.'] },
    { id: 'cajones', unmet: (g) => !g.flag('lupa') || !g.flag('libro2'), t: ['La cajonera azul del despacho guarda dos cosas útiles.', 'Abre los dos primeros cajones de la cajonera azul: una lupa y un cuaderno.'] },
    { id: 'astral', unmet: (g) => !g.flag('orden'), t: ['La carta astral del salón tiene letra diminuta.', 'Selecciona la lupa en el inventario y haz clic en la carta astral del salón.'] },
    { id: 'pc', unmet: (g) => !g.flag('pc'), t: ['El ordenador del despacho pide una contraseña. El cuaderno de estafas habla de ella.', 'Contraseña del ordenador: «gato».'] },
    { id: 'torre', unmet: (g) => !g.has('carta_torre'), t: ['Algo está muy alto en el despacho. Necesitas un apoyo.', 'En el despacho: arrastra la silla roja (clic) y luego toca la torre de bloques.'] },
    { id: 'cuchillo', unmet: (g) => !g.has('carta_rueda') && !g.has('cuchillo'), t: ['Para cortar una costura necesitas algo afilado. Revisa la cocina.', 'Abre los cajones de la cocina (esquina derecha) para coger el cuchillo.'] },
    { id: 'rueda', unmet: (g) => !g.has('carta_rueda'), t: ['El puf del dormitorio tiene una costura sospechosa.', 'Selecciona el cuchillo y haz clic en el puf con ruedas del dormitorio.'] },
    { id: 'frascos', unmet: (g) => POTION_ORDER.some((p) => !g.has(p)) && !g.flag('espejo_abierto'), t: ['Hay tres frascos escondidos: uno en frío, uno entre lejías y otro junto a una cama.', 'Frasco rojo: nevera. Verde: armario del fregadero. Azul: mesilla derecha del dormitorio.'] },
    { id: 'orden_pociones', unmet: (g) => !g.flag('espejo_abierto'), t: ['Escucha la nota de voz del móvil (dormitorio): te dice el orden. Luego, la repisa del baño.', 'Repisa del baño: roja (dulce), verde (no se bebe), azul (apaga la sed).'] },
    { id: 'sacerdote', unmet: (g) => !g.has('carta_sacerdote'), t: ['El espejo del baño ya no es solo un espejo.', 'Haz clic en el espejo del baño para coger La carta del Sumo Sacerdote.'] },
    { id: 'gorra', unmet: (g) => !g.has('policia'), t: ['Falta algo para ser Guardia Civil. La nota de voz habla de tu coche.', 'La llave del coche está en el sillón del salón; úsala en el armario del dormitorio.'] },
    { id: 'mesa', unmet: (g) => !g.flag('mesa_resuelta'), t: ['Con las tres cartas, la mesa del salón te espera. El orden está en la carta astral.', 'Mesa del salón: La Torre, La Rueda, El Sumo Sacerdote (en ese orden).'] },
    { id: 'final', unmet: () => true, t: ['El arco azul del salón ya no es una pared. ¿Llevas la gorra?', 'Entra por el arco azul, ve a la pestaña Pasadizo y haz clic en Jandro con la gorra puesta. Sigue la carta del Mago: la baraja marcada, el anillo y el espejo ayudan.'] },
  ];

  /* ---------- Logros ---------- */
  const ACH = {
    sin_pistas: { n: 'Sin ayuda', d: 'Gana sin pedir ninguna pista.', i: '🧠' },
    rapido: { n: 'Contrarreloj', d: 'Gana con más del 60 % del tiempo por delante.', i: '⚡' },
    detective: { n: 'Detective de verdad', d: 'Encuentra todas las pruebas de la estafa.', i: '🔍' },
    secreto: { n: 'El Loco', d: 'Consigue el final secreto.', i: '🃏' },
    vidente: { n: 'Vidente', d: 'Acierta las tres preguntas de una lectura de tarot.', i: '🔮' },
    gato: { n: '¡Puto gato!', d: 'Atrapa al gato negro cuando camina hacia la izquierda (¡es fundamental!).', i: '🐈‍⬛' },
    bandera: { n: 'Bandera infinita', d: 'Tira del pañuelo rojo y amarillo del sofá.', i: '🚩' },
    chan: { n: 'Chan-chán', d: 'Toca tres notas en el teclado del despacho.', i: '🎹' },
    dj: { n: 'DJ Pepe', d: 'Enciende y apaga el pinchadiscos tres veces.', i: '🎧' },
    triscai: { n: 'Triscaidecafobia', d: 'Pulsa el reloj 13 veces.', i: '1️⃣3️⃣' },
    colchoneta: { n: 'Ya sabía yo...', d: 'Encuentra la colchoneta preparada.', i: '🛏️' },
    monociclo: { n: 'Sobre una rueda', d: 'Encuentra el monociclo de Pepe en el jardín.', i: '🛞' },
    mago: { n: 'Mago de pacotilla', d: 'Supera el último truco sin usar ninguna ayuda.', i: '🎩' },
    perfecto: { n: 'Obra maestra', d: 'Consigue las 3 estrellas en dificultad Reto.', i: '🌟' },
  };

  /* ---------- Estado ---------- */
  function newState(diffKey) {
    const d = DIFF[diffKey] || DIFF.normal;
    return {
      diff: diffKey in DIFF ? diffKey : 'normal', minutes: d.min, timeLeft: d.min * 60,
      room: 'salon', inv: [], flags: {}, unlocked: { salon: true, cocina: true, dormitorio: true, bano: true, despacho: false, jardin: false, coche: false, pasadizo: false },
      sel: null, hints: 0, freeHints: 0, hintCount: {}, penalties: 0, readings: 0, perfectReading: false, counters: {}, trickFails: 0, aidsUsed: 0, over: null, started: Date.now(), total: d.min * 60,
    };
  }

  /* ---------- Motor ---------- */
  const Game = {
    s: null, ui: null, api: null,
    bind(ui) { this.ui = ui; },
    start(diffKey) { this.s = newState(diffKey); this.makeApi(); },
    restore(saved) { // compatible con partidas guardadas de versiones anteriores
      const d = newState(saved.diff);
      this.s = Object.assign(d, saved); this.s.unlocked = Object.assign(d.unlocked, saved.unlocked || {});
      this.s.counters = saved.counters || {}; this.s.total = saved.total || d.total; this.makeApi();
    },
    makeApi() {
      const G = this, s = this.s;
      this.api = {
        s,
        has: (id) => s.inv.includes(id),
        flag: (k) => !!s.flags[k],
        set: (k, v) => { s.flags[k] = v === undefined ? true : v; },
        give: (id) => { if (!s.inv.includes(id)) { s.inv.push(id); G.ui.gained(id); } },
        take: (id) => { s.inv = s.inv.filter((x) => x !== id); if (s.sel === id) s.sel = null; },
        say: (t, who) => G.ui.say(t, who),
        read: (title, text, item) => G.ui.read(title, text, item),
        keypad: (o) => G.ui.keypad(Object.assign({}, o, { onFail: () => G.penalty(P_CODE, 'Código incorrecto.') })),
        textInput: (o) => G.ui.textInput(Object.assign({}, o, { onFail: () => G.penalty(P_CODE, 'Contraseña incorrecta.') })),
        potions: () => G.ui.potions({
          order: POTION_ORDER,
          onOk: () => { s.flags.espejo_abierto = true; G.ui.say('Colocas las pociones: dulce, no se bebe, sed. ¡Clic! El espejo del baño se desliza un poco.'); G.ui.refresh(); },
          onFail: () => G.penalty(P_ORDER, 'Orden equivocado: los frascos huelen mal.'),
        }),
        finalTable: () => G.ui.finalTable({
          order: CARDS,
          onOk: () => {
            s.flags.mesa_resuelta = true; G.ui.sfx('magic');
            s.unlocked.pasadizo = true; s.room = 'salon'; G.ui.refresh();
            G.ui.cine('pasadizo', () => { G.ui.say('El arco azul del salón se ha abierto en un pasadizo. Ahora, a por Jandro. ¿Llevas la gorra?'); G.ui.refresh(); G.save(); });
          },
          onFail: () => G.penalty(P_ORDER, 'Las cartas se barajan solas y vuelven a tu mano. Jandro se ríe desde algún sitio.'),
        }),
        freeHint: () => { s.freeHints++; G.ui.refresh(); },
        unlock: (r) => { s.unlocked[r] = true; G.ui.sfx('gain'); G.ui.refresh(); },
        goRoom: (r) => { if (s.unlocked[r]) { s.room = r; G.ui.refresh(); } },
        win: (secret) => G.win(secret),
        ach: (id) => G.ui.achieve(id),
        count: (k, n) => { s.counters[k] = (s.counters[k] || 0) + 1; if (s.counters[k] >= n) G.ui.achieve(k); },
        toggleJazz: () => G.ui.toggleJazz(),
        piano: () => G.ui.piano(),
        trick: () => G.ui.trick({
          aids: { cartas: s.inv.includes('cartas'), joya: s.inv.includes('joya'), espejo: s.inv.includes('espejo'), loco: s.inv.includes('carta_loco') },
          diff: s.diff,
          onWin: (aids) => { s.aidsUsed = aids; G.win(false); },
          onSecret: () => G.win(true),
          onFail: () => { s.trickFails++; G.penalty(P_ORDER, 'Jandro ríe: «¡Esa no era mi carta, Pepe!»'); },
        }),
      };
    },
    selected() { return this.s.sel; },
    select(id) { this.s.sel = this.s.sel === id ? null : id; this.ui.refresh(); },
    click(roomId, hsId) {
      const h = HS[roomId].find((x) => x.id === hsId);
      if (!h || this.s.over) return;
      const sel = this.s.sel;
      const before = JSON.stringify([this.s.inv, this.s.flags]);
      h.on(this.api, sel);
      // si usaste un objeto y la zona avanzó, se suelta la selección
      if (sel && JSON.stringify([this.s.inv, this.s.flags]) !== before) this.s.sel = null;
      this.ui.refresh();
      this.save();
      if (this.cards() >= 2 && !this.s.flags.cine_cartas && !this.s.over) {
        this.s.flags.cine_cartas = true;
        this.ui.cine('tablet', () => { this.s.freeHints++; this.ui.say('Jandro te ha regalado una pista gratis. Pulsa el botón de la bola de cristal cuando la necesites.', 'jandro'); this.ui.refresh(); this.save(); });
      }
    },
    goRoom(r) {
      const s = this.s;
      if (!s.unlocked[r]) {
        if (s.inv.includes('llave') && r === 'despacho') {
          s.unlocked.despacho = true; s.flags.despacho_open = true; this.api.take('llave');
          this.ui.say('Giras la llave en la cerradura del despacho. ¡Clic! Ya puedes pasar.'); this.ui.sfx('gain');
        } else {
          this.ui.say(r === 'despacho' ? 'La puerta del despacho está cerrada con llave. Nadie la ha abierto desde que Pepe perdió el trabajo.' : 'Cerrado.');
          this.ui.sfx('fail'); return;
        }
      }
      s.room = r; this.ui.refresh(); this.save();
    },
    examine(id) { const it = ITEMS[id]; this.ui.read(it.n, it.read ? it.read : it.d, id, it.read ? it.d : null); },
    penalty(sec, msg) { this.s.timeLeft = Math.max(0, this.s.timeLeft - sec); this.s.penalties += sec; this.ui.say(`${msg} (−${sec} s)`); this.ui.sfx('fail'); this.ui.refresh(); },
    pruebas() { return this.s.inv.filter((i) => ITEMS[i].prueba).length; },
    cards() { return CARDS.filter((c) => this.s.inv.includes(c)).length; },
    objective() {
      const g = this.api;
      if (g.flag('mesa_resuelta')) return g.has('policia') ? 'Entra por el arco azul, ve al Pasadizo y atrapa a Jandro: ¡supera su último truco!' : 'El pasadizo está abierto. Consigue tu gorra de Guardia Civil (dormitorio) y ve a por Jandro.';
      if (this.cards() === 3) return 'Tienes las 3 cartas: colócalas en el orden correcto sobre la mesa del salón.';
      return 'Reúne las tres cartas de tu lectura, colócalas en la mesa del salón y consigue tu gorra.';
    },
    nextHint() {
      const s = this.s, g = this.api;
      if (s.over) return null;
      if (s.freeHints <= 0 && s.timeLeft <= HINT_COST) { this.ui.say('Te queda muy poco tiempo para pedir una pista.'); return null; }
      const st = STAGES.find((x) => x.unmet(g));
      if (!st) return null;
      const n = s.hintCount[st.id] || 0;
      s.hintCount[st.id] = Math.min(n + 1, st.t.length);
      const txt = st.t[Math.min(n, st.t.length - 1)];
      if (s.freeHints > 0) s.freeHints--; else { s.timeLeft -= HINT_COST; s.penalties += HINT_COST; }
      s.hints++;
      this.ui.read('Pista de la bola de cristal', txt, null, null, 'pista');
      this.save();
      return txt;
    },
    win(secret) {
      const s = this.s; s.over = 'win';
      const p = this.pruebas();
      let stars = 1;
      if (s.timeLeft > s.total * 0.35) stars++;
      if (p === PRUEBAS.length) stars++;
      this.clearSave();
      const res = { win: true, secret: !!secret, stars, timeLeft: s.timeLeft, total: s.total, diff: s.diff, hints: s.hints, pruebas: p, totalPruebas: PRUEBAS.length, perfectReading: s.perfectReading, trickFails: s.trickFails, aids: s.aidsUsed };
      this.ui.cine(secret ? 'secreto' : 'final', () => this.ui.end(res), { pruebas: p });
    },
    lose() {
      const s = this.s; if (s.over) return; s.over = 'lose'; this.clearSave();
      this.ui.cine('derrota', () => this.ui.end({ win: false, hints: s.hints, pruebas: this.pruebas(), totalPruebas: PRUEBAS.length, cards: this.cards(), diff: s.diff }));
    },
    tarotLeft() { return MAX_READINGS - this.s.readings; },
    tarotAvailable() { return this.s && !this.s.over && this.s.inv.includes('cartas') && this.s.readings < MAX_READINGS; },
    // score: aciertos de la lectura (0-3)
    readingDone(score) {
      const s = this.s; s.readings++;
      let msg;
      if (score === 3) { s.freeHints++; s.perfectReading = true; msg = 'Lectura perfecta: Jandro, sorprendido, te regala una pista gratis.'; this.ui.achieve('vidente'); }
      else if (score === 2) { s.timeLeft += 20; msg = 'Buena lectura: ganas 20 segundos.'; }
      else if (score === 1) msg = 'Lectura regular: las estrellas no se pronuncian.';
      else { s.timeLeft = Math.max(1, s.timeLeft - 10); msg = 'Lectura fatal: pierdes 10 segundos.'; }
      this.ui.say(msg, 'jandro'); this.ui.refresh(); this.save();
      return msg;
    },
    tick(dt) {
      const s = this.s; if (!s || s.over) return;
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) { s.timeLeft = 0; this.lose(); }
    },
    pending(roomId) {
      return HS[roomId].filter((h) => h.done && !h.done(this.api)).length;
    },
    save() { try { localStorage.setItem('on13_escape', JSON.stringify(this.s)); } catch (e) {} },
    clearSave() { try { localStorage.removeItem('on13_escape'); } catch (e) {} },
    loadSaved() { try { const j = localStorage.getItem('on13_escape'); return j ? JSON.parse(j) : null; } catch (e) { return null; } },
  };

  const E = { DIFF, ROOMS, BG, VIEW, PLAN, MAX_READINGS, ACH, ITEMS, HS, CARDS, POTION_ORDER, PRUEBAS, STAGES, HINT_COST, Game };
  root.Escape = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
