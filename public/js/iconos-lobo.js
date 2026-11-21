'use strict';
/* Iconos propios de Hombres lobo, en el mismo estilo del conjunto comun (viewBox 24, trazo 1,75). Se anaden a DCIcons para poder usar DCIcons.svg('lobo').
   Faltan en el diseno comun (anotado en el informe): lobo, orb (bola de cristal), target (diana), heart (corazon), skull, medal, megaphone, card. */
(function () {
  if (!window.DCIcons) return;
  var P = {
    lobo: 'M4 4l4 3h8l4-3v8c0 4.5-3.5 8-8 8s-8-3.5-8-8zM9.5 12.5h.01M14.5 12.5h.01M10 16.5l2 1.5 2-1.5',
    orb: 'M12 3.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM8 20.5h8M9 9.5a3.5 3.5 0 0 1 3-2',
    target: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 12h.01',
    heart: 'M12 20.5S3.5 15 3.5 9a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2c0 6-8.5 11.5-8.5 11.5z',
    skull: 'M12 3.5a7.5 7.5 0 0 0-4.5 13.5V20h9v-3A7.5 7.5 0 0 0 12 3.5zM9.5 11.5h.01M14.5 11.5h.01M10.5 17v3M13.5 17v3',
    medal: 'M12 3.5l2.2 4.5 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.7l4.8-.7z',
    megaphone: 'M4 10v4h3l8 4V6L7 10zM18.5 9.5a4 4 0 0 1 0 5',
    card: 'M6.5 3.5h11v17h-11zM12 9.5l2.5 2.5-2.5 2.5-2.5-2.5z'
  };
  Object.keys(P).forEach(function (k) { window.DCIcons.paths[k] = P[k]; });
})();
