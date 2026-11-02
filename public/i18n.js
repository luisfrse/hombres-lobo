/* Homes llop · i18n (català / castellano). Diccionarios planos ca y es: al añadir una clave, ponla en los dos (npm test lo comprueba).
   API: I18N.t(clave, vars) · I18N.set(idioma) · I18N.lang · I18N.langs. Archivo generado desde lobo-i18n/claves.py. */
(function (global) {
  'use strict';

  var DICT = {
 "ca": {
  "idioma": "Idioma",
  "cancelar": "Cancel·la",
  "app.nombre": "Homes llop",
  "app.doc": "Homes llop",
  "app.doc_narrador": "Homes llop · Narrador",
  "e.generico": "S'ha produït un error. Torna-ho a provar.",
  "e.conexion": "No s'ha pogut connectar amb el servidor.",
  "e.pin_invalido": "Codi no vàlid o partida no trobada.",
  "e.falta_nombre": "Escriu el teu nom.",
  "e.nombre_en_uso": "Ja hi ha algú amb aquest nom a la partida.",
  "e.partida_empezada": "La partida ja ha començat.",
  "e.partida_llena": "La partida és plena.",
  "e.demasiados_intentos": "Massa intents fallits. Espera uns minuts.",
  "e.servidor_lleno": "El servidor té el màxim de partides. Torna-ho a provar d'aquí a una estona.",
  "e.no_narrador": "Sessió de narrador no vàlida. Crea una partida nova.",
  "e.pocos_jugadores": "Calen almenys {n} jugadors.",
  "e.demasiados_roles": "Hi ha més rols ({r}) que jugadors ({n}).",
  "e.sin_lobos": "Hi ha d'haver almenys un llop.",
  "e.demasiados_lobos": "Hi ha massa llops: han de ser menys que la resta del poble.",
  "e.expulsado": "El narrador t'ha tret de la partida.",
  "e.partida_cerrada": "La partida s'ha tancat.",
  "e.accion_invalida": "Acció no vàlida en aquest moment.",
  "e.objetivo_invalido": "Jugador no vàlid per a aquesta acció.",
  "e.salvador_repite": "El Salvador no pot protegir la mateixa persona dues nits seguides.",
  "e.pocion_usada": "Aquesta poció ja s'ha fet servir.",
  "equipo.pueblo": "Poble",
  "equipo.lobos": "Llops",
  "rol.aldeano.n": "Vilatà",
  "rol.aldeano.d": "Sense poders especials. De dia, debat amb el poble i intenta descobrir qui són els llops per votar-ne l'eliminació.",
  "rol.lobo.n": "Llop",
  "rol.lobo.d": "Cada nit, amb la resta de llops, trieu un vilatà per devorar-lo. De dia, fes veure que ets un vilatà innocent. Els llops guanyen quan igualen en nombre la resta del poble.",
  "rol.vidente.n": "Vident",
  "rol.vidente.d": "Cada nit el narrador et deixa assenyalar un jugador i et diu en secret quin és el seu rol. Fes servir el que saps per guiar el poble sense que els llops et descobreixin.",
  "rol.bruja.n": "Bruixa",
  "rol.bruja.d": "Té dues pocions d'un sol ús: una de curació, que salva la víctima dels llops aquella nit, i una de verí, que elimina un jugador. Pot fer servir les dues la mateixa nit.",
  "rol.cazador.n": "Caçador",
  "rol.cazador.d": "Quan mor, sigui pel motiu que sigui, dispara a l'instant i s'endú un altre jugador a la seva elecció.",
  "rol.cupido.n": "Cupido",
  "rol.cupido.d": "La primera nit tria dos jugadors que queden enamorats. Si un mor, l'altre mor de pena. Si un és llop i l'altre vilatà, guanyen tots dos si són els únics que queden vius.",
  "rol.nina.n": "Nena",
  "rol.nina.d": "Pot entreobrir els ulls de nit per espiar els llops, però si la descobreixen, pot ser la seva víctima. El narrador vigila que no es noti.",
  "rol.salvador.n": "Salvador",
  "rol.salvador.d": "Cada nit protegeix un jugador (pot ser ell mateix) dels llops. No pot protegir la mateixa persona dues nits seguides.",
  "alguacil.n": "Alguatzir",
  "alguacil.d": "No és una carta: s'elegeix per votació el primer dia. El seu vot compta doble i, en morir, designa el seu successor.",
  "j.pin": "Codi de la partida",
  "j.nombre": "El teu nom",
  "j.nombre_ph": "Nom",
  "j.entrar": "Entra",
  "j.soy_narrador": "Sóc el narrador",
  "j.dentro": "Ja ets dins, {n}!",
  "j.espera": "Espera que el narrador repartesca els rols.",
  "j.en_sala": "{n} jugadors a la sala",
  "j.en_sala#1": "{n} jugador a la sala",
  "j.toca_ver": "Toca per veure el teu rol",
  "j.toca_ocultar": "Toca per amagar-lo",
  "j.tu_rol": "El teu rol",
  "j.companeros": "Els teus companys llops: {l}",
  "j.enamorado": "Estàs enamorat/da de {j}. Si un dels dos mor, l'altre també.",
  "j.alguacil": "Ets l'alguatzir: el teu vot val doble.",
  "j.noche": "És de nit. Tanca els ulls.",
  "j.noche_muerto": "Estàs eliminat/da: observa en silenci.",
  "j.noche_n": "Nit {n}",
  "j.dia_n": "Dia {n}",
  "j.dia": "És de dia: debateu i voteu.",
  "j.eliminado": "Has estat eliminat/da.",
  "j.eliminado_det": "Segueix la partida en silenci i no revelis cap informació.",
  "j.vivos": "El poble ({n} vius)",
  "j.vivos#1": "El poble (1 viu)",
  "j.fin": "Fi de la partida",
  "j.era": "era {r}",
  "j.salir": "Surt",
  "j.espera_nueva": "Espera que el narrador comenci una altra partida.",
  "j.tu_eras": "Tu eres: {r}",
  "g.pueblo": "Guanya el poble!",
  "g.lobos": "Guanyen els llops!",
  "g.amantes": "Guanyen els enamorats!",
  "n.titulo": "Narrador",
  "n.crear": "Crea una partida",
  "n.intro": "Crea la partida, deixa que els jugadors entrin amb el codi o el QR i tria els rols. Tu portes el joc des d'aquí: veuràs el rol de tothom.",
  "n.entra": "Els jugadors entren a {host} amb el codi",
  "n.o_qr": "o escanegen el QR",
  "n.qr_alt": "Codi QR per entrar",
  "n.jugadores": "{n} jugadors",
  "n.jugadores#1": "{n} jugador",
  "n.sin_jugadores": "Esperant jugadors…",
  "n.expulsar": "Treu de la partida",
  "n.confirm_expulsar": "Vols treure {j} de la partida?",
  "n.config": "Rols de la partida",
  "n.lobos": "Llops",
  "n.menos": "Un menys",
  "n.mas": "Un més",
  "n.info": "Què fa aquest rol",
  "n.activar": "Inclou el rol: {r}",
  "n.revelar": "Mostra el rol dels jugadors eliminats",
  "n.resumen": "Jugadors: {j} · Llops: {l} · Rols especials: {e} · Vilatans: {a}",
  "n.empezar": "Reparteix els rols i comença",
  "n.minimo": "Calen almenys {n} jugadors.",
  "n.cerrar": "Tanca la partida",
  "n.confirm_cerrar": "Vols tancar la partida? Es desconnectarà tothom.",
  "n.noche_n": "Nit {n}",
  "n.dia_n": "Dia {n}",
  "n.vivos": "{n} vius",
  "n.vivos#1": "1 viu",
  "n.th_jugador": "Jugador",
  "n.th_rol": "Rol",
  "n.th_estado": "Estat",
  "n.vivo": "viu",
  "n.muerto": "eliminat",
  "n.desconectado": "desconnectat",
  "n.paso.cupido": "Desperta Cupido: tria els dos enamorats",
  "n.paso.salvador": "Desperta el Salvador: a qui protegeix?",
  "n.paso.vidente": "Desperta la Vident: a qui vol mirar?",
  "n.paso.lobo": "Desperta els llops: a qui devoren?",
  "n.paso.bruja": "Desperta la Bruixa",
  "n.paso_n": "Pas {i} de {n}",
  "n.sin_pasos": "Aquesta nit no es desperta ningú.",
  "n.muerto_aviso": "Aquest jugador és eliminat: fes la pantomima igualment perquè no el delati.",
  "n.elige_dos": "Tria dos jugadors",
  "n.elige_uno": "Tria un jugador",
  "n.nadie": "Ningú",
  "n.saltar": "Salta aquest pas",
  "n.confirmar": "Confirma",
  "n.vision": "Ha mirat {j}: és",
  "n.vision_aviso": "Digues-ho en secret a la Vident (per exemple, amb un gest).",
  "n.siguiente": "Següent pas",
  "n.bruja_victima": "Els llops han atacat {j}.",
  "n.bruja_nadie": "Els llops no han triat ningú.",
  "n.bruja_protegida": "(El Salvador la protegeix: la poció de curació no serveix per a res.)",
  "n.bruja_cura": "Fer servir la poció de curació",
  "n.bruja_cura_usada": "Poció de curació ja usada",
  "n.bruja_veneno": "Fer servir la poció de verí sobre…",
  "n.bruja_veneno_usada": "Poció de verí ja usada",
  "n.amanece": "Es fa de dia al poble",
  "n.nadie_murio": "Aquesta nit no ha mort ningú.",
  "causa.lobos": "devorat pels llops",
  "causa.veneno": "enverinat",
  "causa.amor": "de pena d'amor",
  "causa.cazador": "abatut pel caçador",
  "causa.votacion": "eliminat pel poble",
  "n.murio": "{j} — {c}",
  "n.pend_cazador": "{j} era el Caçador: tria a qui dispara",
  "n.pend_alguacil": "{j} era l'alguatzir: designa el successor",
  "n.alguacil_titulo": "Alguatzir (vot doble)",
  "n.alguacil_actual": "Alguatzir actual: {j}",
  "n.alguacil_ninguno": "Encara no hi ha alguatzir.",
  "n.nombrar": "Nomena",
  "n.votacion": "Votació del poble",
  "n.votacion_ayuda": "Tria el jugador més votat o «Ningú» si hi ha empat.",
  "n.eliminar": "Elimina",
  "n.empezar_noche": "Comença la nit",
  "n.otra": "Una altra partida amb els mateixos jugadors",
  "n.solo_nuevos_roles": "Pots canviar els rols abans de repartir-los de nou.",
  "n.pendiente_primero": "Resol primer la decisió pendent.",
  "n.rol_de": "Rol de {j}",
  "n.alguacil_marca": "alguatzir",
  "n.amor_marca": "enamorat",
  "e.codigo_invalido": "Codi no vàlid, revocat o caducat.",
  "e.codigo_guardado_invalido": "El codi que tenies desat ja no és vàlid. Introdueix-ne un de nou.",
  "e.sesion_caducada": "Sessió caducada. Torna a entrar amb el teu codi.",
  "e.falta_etiqueta": "Escriu a qui correspon el codi.",
  "e.fecha_invalida": "Data de caducitat no vàlida.",
  "e.no_codigo_unico": "No s'ha pogut generar un codi únic.",
  "e.no_existe_codigo": "Aquest codi no existeix.",
  "e.peticion_invalida": "Petició no vàlida.",
  "e.max_partidas_codigo": "Ja tens {n} partides obertes. Tanca'n una abans de crear-ne una altra.",
  "acc.titulo": "Accés de narrador",
  "acc.intro": "Per portar una partida necessites un codi d'invitació.",
  "acc.codigo": "Codi d'invitació",
  "acc.entrar": "Entra",
  "acc.sin_codigo": "No tens codi?",
  "acc.solicitar": "Sol·licita'l",
  "acc.hola": "Hola, {n}",
  "acc.salir": "Canvia de codi",
  "ac.doc": "Homes llop · Codis d'invitació",
  "ac.titulo": "Codis d'invitació",
  "ac.persona": "Persona",
  "ac.persona_ph": "Ex.: Anna Puig (IES Mataró)",
  "ac.caduca_opc": "Caduca (opcional)",
  "ac.crear": "Crea el codi",
  "ac.estado_srv": "{a} partides actives · {j} jugadors jugant",
  "ac.vacio": "Encara no has creat cap codi.",
  "ac.th_persona": "Persona",
  "ac.th_codigo": "Codi",
  "ac.th_creado": "Creat",
  "ac.th_caduca": "Caduca",
  "ac.th_ultimo": "Últim ús",
  "ac.th_partidas": "Partides",
  "ac.th_vivo": "En directe",
  "ac.th_estado": "Estat",
  "ac.copiar": "Copia",
  "ac.invitacion": "Invitació",
  "ac.revocar": "Revoca",
  "ac.reactivar": "Reactiva",
  "ac.borrar": "Esborra",
  "ac.copiar_codigo": "Copia el codi",
  "ac.copiar_msg": "Copia el missatge d'invitació",
  "ac.copiado": "Copiat!",
  "ac.codigo_para": "Codi per a {n}",
  "ac.mensaje": "Hola, aquí tens el teu codi per portar partides de Homes llop: {c}\nEntra a {u}/narrador i escriu-lo (no cal registrar-se).",
  "ac.est_activo": "actiu",
  "ac.est_revocado": "revocat",
  "ac.est_caducado": "caducat",
  "ac.nunca": "mai",
  "ac.en_vivo": "{a} ({j} jugadors)",
  "ac.confirm_revocar": "Vols revocar el codi de {n}? Deixarà de funcionar i es tancaran les seves partides obertes.",
  "ac.confirm_borrar": "Vols esborrar definitivament el codi de {n}?",
  "reg.doc": "Homes llop · Regles",
  "reg.titulo": "Com es juga",
  "reg.enlace": "Regles del joc",
  "reg.volver": "Torna",
  "reg.intro": "Homes llop és un joc de deducció i engany per a 4 o més persones a la mateixa sala. Un narrador, que no juga, dirigeix la partida; la resta rep un rol secret al mòbil. El poble intenta descobrir els llops; els llops intenten devorar el poble sense que els descobreixin.",
  "reg.obj.t": "Objectiu",
  "reg.obj_pueblo": "Poble: eliminar tots els llops.",
  "reg.obj_lobos": "Llops: igualar en nombre la resta del poble.",
  "reg.obj_amantes": "Enamorats (si Cupido els uneix i són de bàndols diferents): quedar-se sols, els dos, amb vida.",
  "reg.prep.t": "Preparació",
  "reg.prep.p": "El narrador crea la partida i configura els rols. Els jugadors entren des del mòbil amb el codi o el QR i escriuen el seu nom (mínim 4 jugadors). En començar, cadascú veu el seu rol al mòbil: toca la carta per veure'l i torna-hi per amagar-lo. Que ningú vegi la teva pantalla.",
  "reg.noche.t": "La nit",
  "reg.noche.p1": "Tothom tanca els ulls i fa silenci. El narrador desperta, d'un en un, els rols que intervenen i sempre segueix aquest ordre:",
  "reg.noche.orden": "Cupido (només la primera nit) → Salvador → Vident → Llops → Bruixa.",
  "reg.noche.p2": "Cada rol obre els ulls, assenyala en silenci al narrador el que decideix i els torna a tancar. Encara que un rol ja estigui eliminat, el narrador fa igualment la pantomima perquè ningú descobreixi qui ha mort.",
  "reg.dia.t": "El dia",
  "reg.dia.p1": "Tothom obre els ulls. El narrador anuncia qui ha mort durant la nit i per què. Els eliminats deixen de parlar i de votar, però continuen mirant en silenci sense revelar res.",
  "reg.dia.p2": "Els vius debaten en veu alta: qui sembla un llop? Després voten; el més votat queda eliminat i el narrador el marca al seu panell. Si hi ha empat, no s'elimina ningú.",
  "reg.dia.p3": "El primer dia es tria un alguatzir: el seu vot compta doble i, si mor, designa el seu successor. El narrador el marca al seu panell.",
  "reg.fin.t": "Final de la partida",
  "reg.fin.p": "Després de cada mort es comprova si algú ha guanyat. En acabar es revelen tots els rols i el narrador pot començar una altra partida amb els mateixos jugadors.",
  "reg.lobos_num": "El nombre de llops el tria el narrador: l'app exigeix que siguin menys que la resta del poble.",
  "reg.consejos.t": "Consells",
  "reg.consejo1": "Mantén el mòbil amb el rol amagat quan no el miris.",
  "reg.consejo2": "Ulls tancats de debò: res d'espiar (llevat de la Nena, i amb molta cura).",
  "reg.consejo3": "Si t'eliminen, no parlis ni facis gestos: no revelis el teu rol ni el de ningú.",
  "reg.roles.t": "Els rols",
  "reg.roles.p": "Aquesta és la llista completa; el narrador tria quins es juguen a cada partida.",
  "guion.titulo": "Què dir",
  "guion.al_empezar": "En començar:",
  "guion.al_acabar": "En acabar:",
  "guion.apertura": "Mireu el vostre rol al mòbil sense que ningú el vegi i amagueu-lo. Cau la nit al poble: tothom tanca els ulls i no els obre fins que us ho digui.",
  "guion.noche": "Cau la nit al poble. Tothom tanca els ulls.",
  "guion.cupido.abre": "Cupido, obre els ulls i assenyala els dos jugadors que quedaran enamorats.",
  "guion.cupido.cierra": "Cupido, tanca els ulls. Enamorats: mireu el mòbil amb discreció per saber qui és la vostra parella.",
  "guion.salvador.abre": "Salvador, obre els ulls i assenyala a qui protegeixes aquesta nit.",
  "guion.salvador.cierra": "Salvador, tanca els ulls.",
  "guion.vidente.abre": "Vident, obre els ulls i assenyala el jugador que vols investigar.",
  "guion.vidente.cierra": "Vident, tanca els ulls.",
  "guion.lobo.abre": "Llops, obriu els ulls i assenyaleu en silenci la vostra víctima.",
  "guion.lobo.cierra": "Llops, tanqueu els ulls.",
  "guion.bruja.abre": "Bruixa, obre els ulls. Et mostro amb un gest la víctima dels llops. Vols fer servir alguna poció?",
  "guion.bruja.cierra": "Bruixa, tanca els ulls.",
  "guion.amanece_nadie": "Es fa de dia al poble. Tothom obre els ulls: aquesta nit no ha mort ningú.",
  "guion.amanece_muertos": "Es fa de dia al poble. Tothom obre els ulls. Aquesta nit han mort: {j}.",
  "guion.amanece_muertos#1": "Es fa de dia al poble. Tothom obre els ulls. Aquesta nit ha mort: {j}.",
  "guion.cazador": "{j} era el Caçador: amb el seu últim alè dispara. A qui assenyala?",
  "guion.alguacil": "{j} era l'alguatzir: abans de morir designa el seu successor.",
  "guion.alguacil_nombrar": "Si encara no hi ha alguatzir: que es proposin candidats, voteu i marca'l aquí.",
  "guion.votacion": "Ara debateu: qui creieu que és un llop? Quan estigueu preparats, voteu a mà alçada. Qui tingui més vots queda eliminat; si hi ha empat, no s'elimina ningú.",
  "guion.fin": "La partida ha acabat. Que cadascú ensenyi el seu rol i comenteu com ha anat."
 },
 "es": {
  "idioma": "Idioma",
  "cancelar": "Cancelar",
  "app.nombre": "Hombres lobo",
  "app.doc": "Hombres lobo",
  "app.doc_narrador": "Hombres lobo · Narrador",
  "e.generico": "Se ha producido un error. Inténtalo de nuevo.",
  "e.conexion": "No se pudo conectar con el servidor.",
  "e.pin_invalido": "Código no válido o partida no encontrada.",
  "e.falta_nombre": "Escribe tu nombre.",
  "e.nombre_en_uso": "Ya hay alguien con ese nombre en la partida.",
  "e.partida_empezada": "La partida ya ha empezado.",
  "e.partida_llena": "La partida está llena.",
  "e.demasiados_intentos": "Demasiados intentos fallidos. Espera unos minutos.",
  "e.servidor_lleno": "El servidor está al máximo de partidas. Inténtalo de nuevo dentro de un rato.",
  "e.no_narrador": "Sesión de narrador no válida. Crea una partida nueva.",
  "e.pocos_jugadores": "Hacen falta al menos {n} jugadores.",
  "e.demasiados_roles": "Hay más roles ({r}) que jugadores ({n}).",
  "e.sin_lobos": "Tiene que haber al menos un lobo.",
  "e.demasiados_lobos": "Hay demasiados lobos: deben ser menos que el resto del pueblo.",
  "e.expulsado": "El narrador te ha sacado de la partida.",
  "e.partida_cerrada": "La partida se ha cerrado.",
  "e.accion_invalida": "Acción no válida en este momento.",
  "e.objetivo_invalido": "Jugador no válido para esta acción.",
  "e.salvador_repite": "El Salvador no puede proteger a la misma persona dos noches seguidas.",
  "e.pocion_usada": "Esa poción ya se ha usado.",
  "equipo.pueblo": "Pueblo",
  "equipo.lobos": "Lobos",
  "rol.aldeano.n": "Aldeano",
  "rol.aldeano.d": "Sin poderes especiales. Durante el día debate con el pueblo e intenta descubrir quiénes son los lobos para votar su eliminación.",
  "rol.lobo.n": "Lobo",
  "rol.lobo.d": "Cada noche, con los demás lobos, elige a un aldeano para devorarlo. De día, finge ser un aldeano inocente. Los lobos ganan cuando igualan en número al resto del pueblo.",
  "rol.vidente.n": "Vidente",
  "rol.vidente.d": "Cada noche el narrador te deja señalar a un jugador y te dice en secreto cuál es su rol. Usa lo que sabes para guiar al pueblo sin que los lobos te descubran.",
  "rol.bruja.n": "Bruja",
  "rol.bruja.d": "Tiene dos pociones de un solo uso: una de curación, que salva a la víctima de los lobos esa noche, y una de veneno, que elimina a un jugador. Puede usar las dos la misma noche.",
  "rol.cazador.n": "Cazador",
  "rol.cazador.d": "Cuando muere, sea por el motivo que sea, dispara al instante y se lleva consigo a otro jugador a su elección.",
  "rol.cupido.n": "Cupido",
  "rol.cupido.d": "La primera noche elige a dos jugadores que quedan enamorados. Si uno muere, el otro muere de pena. Si uno es lobo y el otro aldeano, ganan los dos si son los únicos que quedan vivos.",
  "rol.nina.n": "Niña",
  "rol.nina.d": "Puede entreabrir los ojos por la noche para espiar a los lobos, pero si la descubren, puede ser su víctima. El narrador vigila que no se note.",
  "rol.salvador.n": "Salvador",
  "rol.salvador.d": "Cada noche protege a un jugador (puede ser él mismo) de los lobos. No puede proteger a la misma persona dos noches seguidas.",
  "alguacil.n": "Alguacil",
  "alguacil.d": "No es una carta: se elige por votación el primer día. Su voto cuenta doble y, al morir, designa a su sucesor.",
  "j.pin": "Código de la partida",
  "j.nombre": "Tu nombre",
  "j.nombre_ph": "Nombre",
  "j.entrar": "Entrar",
  "j.soy_narrador": "Soy el narrador",
  "j.dentro": "¡Estás dentro, {n}!",
  "j.espera": "Espera a que el narrador reparta los roles.",
  "j.en_sala": "{n} jugadores en la sala",
  "j.en_sala#1": "{n} jugador en la sala",
  "j.toca_ver": "Toca para ver tu rol",
  "j.toca_ocultar": "Toca para ocultarlo",
  "j.tu_rol": "Tu rol",
  "j.companeros": "Tus compañeros lobos: {l}",
  "j.enamorado": "Estás enamorado/a de {j}. Si uno de los dos muere, el otro también.",
  "j.alguacil": "Eres el alguacil: tu voto vale doble.",
  "j.noche": "Es de noche. Cierra los ojos.",
  "j.noche_muerto": "Estás eliminado/a: observa en silencio.",
  "j.noche_n": "Noche {n}",
  "j.dia_n": "Día {n}",
  "j.dia": "Es de día: debatid y votad.",
  "j.eliminado": "Has sido eliminado/a.",
  "j.eliminado_det": "Sigue la partida en silencio y no reveles ninguna información.",
  "j.vivos": "El pueblo ({n} vivos)",
  "j.vivos#1": "El pueblo (1 vivo)",
  "j.fin": "Fin de la partida",
  "j.era": "era {r}",
  "j.salir": "Salir",
  "j.espera_nueva": "Espera a que el narrador empiece otra partida.",
  "j.tu_eras": "Tú eras: {r}",
  "g.pueblo": "¡Gana el pueblo!",
  "g.lobos": "¡Ganan los lobos!",
  "g.amantes": "¡Ganan los enamorados!",
  "n.titulo": "Narrador",
  "n.crear": "Crear partida",
  "n.intro": "Crea la partida, deja que los jugadores entren con el código o el QR y elige los roles. Tú llevas el juego desde aquí: verás el rol de todos.",
  "n.entra": "Los jugadores entran en {host} con el código",
  "n.o_qr": "o escanean el QR",
  "n.qr_alt": "Código QR para entrar",
  "n.jugadores": "{n} jugadores",
  "n.jugadores#1": "{n} jugador",
  "n.sin_jugadores": "Esperando jugadores…",
  "n.expulsar": "Sacar de la partida",
  "n.confirm_expulsar": "¿Sacar a {j} de la partida?",
  "n.config": "Roles de la partida",
  "n.lobos": "Lobos",
  "n.menos": "Uno menos",
  "n.mas": "Uno más",
  "n.info": "Qué hace este rol",
  "n.activar": "Incluir el rol: {r}",
  "n.revelar": "Mostrar el rol de los jugadores eliminados",
  "n.resumen": "Jugadores: {j} · Lobos: {l} · Roles especiales: {e} · Aldeanos: {a}",
  "n.empezar": "Repartir roles y empezar",
  "n.minimo": "Hacen falta al menos {n} jugadores.",
  "n.cerrar": "Cerrar partida",
  "n.confirm_cerrar": "¿Cerrar la partida? Se desconectará a todos.",
  "n.noche_n": "Noche {n}",
  "n.dia_n": "Día {n}",
  "n.vivos": "{n} vivos",
  "n.vivos#1": "1 vivo",
  "n.th_jugador": "Jugador",
  "n.th_rol": "Rol",
  "n.th_estado": "Estado",
  "n.vivo": "vivo",
  "n.muerto": "eliminado",
  "n.desconectado": "desconectado",
  "n.paso.cupido": "Despierta a Cupido: elige a los dos enamorados",
  "n.paso.salvador": "Despierta al Salvador: ¿a quién protege?",
  "n.paso.vidente": "Despierta a la Vidente: ¿a quién quiere mirar?",
  "n.paso.lobo": "Despierta a los lobos: ¿a quién devoran?",
  "n.paso.bruja": "Despierta a la Bruja",
  "n.paso_n": "Paso {i} de {n}",
  "n.sin_pasos": "Esta noche no se despierta a nadie.",
  "n.muerto_aviso": "Este jugador está eliminado: haz la pantomima igualmente para no delatarlo.",
  "n.elige_dos": "Elige dos jugadores",
  "n.elige_uno": "Elige un jugador",
  "n.nadie": "Nadie",
  "n.saltar": "Saltar este paso",
  "n.confirmar": "Confirmar",
  "n.vision": "Ha mirado a {j}: es",
  "n.vision_aviso": "Díselo en secreto a la Vidente (por ejemplo, con un gesto).",
  "n.siguiente": "Siguiente paso",
  "n.bruja_victima": "Los lobos han atacado a {j}.",
  "n.bruja_nadie": "Los lobos no han elegido a nadie.",
  "n.bruja_protegida": "(El Salvador la protege: la poción de curación no haría falta.)",
  "n.bruja_cura": "Usar la poción de curación",
  "n.bruja_cura_usada": "Poción de curación ya usada",
  "n.bruja_veneno": "Usar la poción de veneno sobre…",
  "n.bruja_veneno_usada": "Poción de veneno ya usada",
  "n.amanece": "Amanece en el pueblo",
  "n.nadie_murio": "Esta noche no ha muerto nadie.",
  "causa.lobos": "devorado por los lobos",
  "causa.veneno": "envenenado",
  "causa.amor": "de pena de amor",
  "causa.cazador": "abatido por el cazador",
  "causa.votacion": "eliminado por el pueblo",
  "n.murio": "{j} — {c}",
  "n.pend_cazador": "{j} era el Cazador: elige a quién dispara",
  "n.pend_alguacil": "{j} era el alguacil: designa a su sucesor",
  "n.alguacil_titulo": "Alguacil (voto doble)",
  "n.alguacil_actual": "Alguacil actual: {j}",
  "n.alguacil_ninguno": "Todavía no hay alguacil.",
  "n.nombrar": "Nombrar",
  "n.votacion": "Votación del pueblo",
  "n.votacion_ayuda": "Elige al jugador más votado o «Nadie» si hay empate.",
  "n.eliminar": "Eliminar",
  "n.empezar_noche": "Empezar la noche",
  "n.otra": "Otra partida con los mismos jugadores",
  "n.solo_nuevos_roles": "Puedes cambiar los roles antes de repartirlos de nuevo.",
  "n.pendiente_primero": "Resuelve primero la decisión pendiente.",
  "n.rol_de": "Rol de {j}",
  "n.alguacil_marca": "alguacil",
  "n.amor_marca": "enamorado",
  "e.codigo_invalido": "Código no válido, revocado o caducado.",
  "e.codigo_guardado_invalido": "Tu código guardado ya no es válido. Introduce uno nuevo.",
  "e.sesion_caducada": "Sesión caducada. Vuelve a entrar con tu código.",
  "e.falta_etiqueta": "Escribe a quién corresponde el código.",
  "e.fecha_invalida": "Fecha de caducidad no válida.",
  "e.no_codigo_unico": "No se pudo generar un código único.",
  "e.no_existe_codigo": "No existe ese código.",
  "e.peticion_invalida": "Petición no válida.",
  "e.max_partidas_codigo": "Ya tienes {n} partidas abiertas. Cierra una antes de crear otra.",
  "acc.titulo": "Acceso de narrador",
  "acc.intro": "Para llevar una partida necesitas un código de invitación.",
  "acc.codigo": "Código de invitación",
  "acc.entrar": "Entrar",
  "acc.sin_codigo": "¿No tienes código?",
  "acc.solicitar": "Solicítalo",
  "acc.hola": "Hola, {n}",
  "acc.salir": "Cambiar de código",
  "ac.doc": "Hombres lobo · Códigos de invitación",
  "ac.titulo": "Códigos de invitación",
  "ac.persona": "Persona",
  "ac.persona_ph": "Ej.: Ana López (IES Mataró)",
  "ac.caduca_opc": "Caduca (opcional)",
  "ac.crear": "Crear código",
  "ac.estado_srv": "{a} partidas activas · {j} jugadores jugando",
  "ac.vacio": "Todavía no has creado ningún código.",
  "ac.th_persona": "Persona",
  "ac.th_codigo": "Código",
  "ac.th_creado": "Creado",
  "ac.th_caduca": "Caduca",
  "ac.th_ultimo": "Último uso",
  "ac.th_partidas": "Partidas",
  "ac.th_vivo": "En directo",
  "ac.th_estado": "Estado",
  "ac.copiar": "Copiar",
  "ac.invitacion": "Invitación",
  "ac.revocar": "Revocar",
  "ac.reactivar": "Reactivar",
  "ac.borrar": "Borrar",
  "ac.copiar_codigo": "Copiar código",
  "ac.copiar_msg": "Copiar mensaje de invitación",
  "ac.copiado": "¡Copiado!",
  "ac.codigo_para": "Código para {n}",
  "ac.mensaje": "Hola, aquí tienes tu código para llevar partidas de Hombres lobo: {c}\nEntra en {u}/narrador e introdúcelo (no hace falta registrarse).",
  "ac.est_activo": "activo",
  "ac.est_revocado": "revocado",
  "ac.est_caducado": "caducado",
  "ac.nunca": "nunca",
  "ac.en_vivo": "{a} ({j} jugadores)",
  "ac.confirm_revocar": "¿Revocar el código de {n}? Dejará de funcionar y se cerrarán sus partidas abiertas.",
  "ac.confirm_borrar": "¿Borrar definitivamente el código de {n}?",
  "reg.doc": "Hombres lobo · Reglas",
  "reg.titulo": "Cómo se juega",
  "reg.enlace": "Reglas del juego",
  "reg.volver": "Volver",
  "reg.intro": "Hombres lobo es un juego de deducción y engaño para 4 o más personas en la misma sala. Un narrador, que no juega, dirige la partida; el resto recibe un rol secreto en su móvil. El pueblo intenta descubrir a los lobos; los lobos intentan devorar al pueblo sin que los descubran.",
  "reg.obj.t": "Objetivo",
  "reg.obj_pueblo": "Pueblo: eliminar a todos los lobos.",
  "reg.obj_lobos": "Lobos: igualar en número al resto del pueblo.",
  "reg.obj_amantes": "Enamorados (si Cupido los une y son de bandos distintos): quedar solos, los dos, con vida.",
  "reg.prep.t": "Preparación",
  "reg.prep.p": "El narrador crea la partida y configura los roles. Los jugadores entran desde el móvil con el PIN o el QR y escriben su nombre (mínimo 4 jugadores). Al empezar, cada uno ve su rol en su móvil: toca la carta para verlo y vuelve a tocarla para ocultarlo. Que nadie vea tu pantalla.",
  "reg.noche.t": "La noche",
  "reg.noche.p1": "Todos cierran los ojos y guardan silencio. El narrador va despertando, de uno en uno, a los roles que intervienen y sigue siempre este orden:",
  "reg.noche.orden": "Cupido (solo la primera noche) → Salvador → Vidente → Lobos → Bruja.",
  "reg.noche.p2": "Cada rol abre los ojos, señala en silencio al narrador lo que decide y vuelve a cerrarlos. Aunque un rol ya esté eliminado, el narrador hace igualmente la pantomima para que nadie descubra quién ha muerto.",
  "reg.dia.t": "El día",
  "reg.dia.p1": "Todos abren los ojos. El narrador anuncia quién ha muerto durante la noche y por qué. Los eliminados dejan de hablar y votar, pero siguen mirando en silencio sin revelar nada.",
  "reg.dia.p2": "Los vivos debaten en voz alta: ¿quién parece un lobo? Después votan; el más votado queda eliminado y el narrador lo marca en su panel. Si hay empate, no se elimina a nadie.",
  "reg.dia.p3": "El primer día se elige un alguacil: su voto cuenta doble y, si muere, designa a su sucesor. El narrador lo marca en su panel.",
  "reg.fin.t": "Final de la partida",
  "reg.fin.p": "Después de cada muerte se comprueba si alguien ha ganado. Al terminar se revelan todos los roles y el narrador puede empezar otra partida con los mismos jugadores.",
  "reg.lobos_num": "El número de lobos lo elige el narrador: la app exige que sean menos que el resto del pueblo.",
  "reg.consejos.t": "Consejos",
  "reg.consejo1": "Mantén el móvil con el rol oculto cuando no lo mires.",
  "reg.consejo2": "Con los ojos cerrados de verdad: nada de espiar (salvo la Niña, y con mucho cuidado).",
  "reg.consejo3": "Si te eliminan, no hables ni hagas gestos: no reveles tu rol ni el de nadie.",
  "reg.roles.t": "Los roles",
  "reg.roles.p": "Esta es la lista completa; el narrador elige cuáles se juegan en cada partida.",
  "guion.titulo": "Qué decir",
  "guion.al_empezar": "Al empezar:",
  "guion.al_acabar": "Al terminar:",
  "guion.apertura": "Mirad vuestro rol en el móvil sin que nadie lo vea y ocultadlo. Cae la noche en el pueblo: todos cerráis los ojos y no los abrís hasta que os lo diga.",
  "guion.noche": "Cae la noche en el pueblo. Todos cerráis los ojos.",
  "guion.cupido.abre": "Cupido, abre los ojos y señala a los dos jugadores que quedarán enamorados.",
  "guion.cupido.cierra": "Cupido, cierra los ojos. Enamorados: mirad el móvil con discreción para saber quién es vuestra pareja.",
  "guion.salvador.abre": "Salvador, abre los ojos y señala a quién proteges esta noche.",
  "guion.salvador.cierra": "Salvador, cierra los ojos.",
  "guion.vidente.abre": "Vidente, abre los ojos y señala al jugador que quieres investigar.",
  "guion.vidente.cierra": "Vidente, cierra los ojos.",
  "guion.lobo.abre": "Lobos, abrid los ojos y señalad en silencio a vuestra víctima.",
  "guion.lobo.cierra": "Lobos, cerrad los ojos.",
  "guion.bruja.abre": "Bruja, abre los ojos. Te enseño con un gesto a la víctima de los lobos. ¿Quieres usar alguna poción?",
  "guion.bruja.cierra": "Bruja, cierra los ojos.",
  "guion.amanece_nadie": "Amanece en el pueblo. Todos abrid los ojos: esta noche no ha muerto nadie.",
  "guion.amanece_muertos": "Amanece en el pueblo. Todos abrid los ojos. Esta noche han muerto: {j}.",
  "guion.amanece_muertos#1": "Amanece en el pueblo. Todos abrid los ojos. Esta noche ha muerto: {j}.",
  "guion.cazador": "{j} era el Cazador: con su último aliento dispara. ¿A quién señala?",
  "guion.alguacil": "{j} era el alguacil: antes de morir designa a su sucesor.",
  "guion.alguacil_nombrar": "Si todavía no hay alguacil: que se propongan candidatos, votad y márcalo aquí.",
  "guion.votacion": "Ahora debatid: ¿quién creéis que es un lobo? Cuando estéis listos, votad a mano alzada. Quien tenga más votos queda eliminado; si hay empate, no se elimina a nadie.",
  "guion.fin": "La partida ha terminado. Que cada uno enseñe su rol y comentad cómo ha ido."
 }
};
  var LANGS = ['ca', 'es'];
  var CLAVE = 'quest-lang';
  var enNavegador = typeof document !== 'undefined';

  function guardado() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function detectar() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { /* sin URL */ }
    if (LANGS.indexOf(q) >= 0) return q;
    var g = guardado();
    if (LANGS.indexOf(g) >= 0) return g;
    var n = '';
    try { n = (navigator.language || '').toLowerCase(); } catch (e) { /* sin navigator */ }
    return n.indexOf('es') === 0 ? 'es' : 'ca';
  }

  var lang = enNavegador ? detectar() : 'ca';
  var registro = []; // textos y atributos pintados con T(): se vuelven a traducir al cambiar de idioma
  var oyentes = [];

  function tl(l, key, vars) {
    var d = DICT[l] || DICT.ca;
    var plural = vars && vars.n === 1;
    var s;
    if (plural) s = d[key + '#1'] !== undefined ? d[key + '#1'] : DICT.ca[key + '#1'];
    if (s === undefined) s = d[key] !== undefined ? d[key] : DICT.ca[key];
    if (s === undefined) return key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''; });
  }
  function t(key, vars) { return tl(lang, key, vars); }
  function has(key) { return DICT[lang][key] !== undefined || DICT.ca[key] !== undefined; }

  function D(key, vars) { this.key = key; this.vars = vars; }
  function T(key, vars) { return new D(key, vars); }
  function esD(x) { return x instanceof D; }

  function podar() {
    registro = registro.filter(function (r) { return (r.nodo || r.el).isConnected; });
  }
  function nodo(d) {
    var n = document.createTextNode(t(d.key, d.vars));
    registro.push({ tipo: 'texto', nodo: n, key: d.key, vars: d.vars });
    if (registro.length > 4000) podar();
    return n;
  }
  function bind(el, attr, d) {
    el.setAttribute(attr, t(d.key, d.vars));
    registro.push({ tipo: 'attr', el: el, attr: attr, key: d.key, vars: d.vars });
  }
  function bindFn(el, attr, fn) {
    el.setAttribute(attr, fn());
    registro.push({ tipo: 'fn', el: el, attr: attr, fn: fn });
  }
  function setT(el, key, vars) { el.replaceChildren(nodo(T(key, vars))); }
  function titulo(key, vars) {
    document.title = t(key, vars);
    registro = registro.filter(function (r) { return r.tipo !== 'titulo'; });
    registro.push({ tipo: 'titulo', el: document.documentElement, key: key, vars: vars });
  }

  // Texto con <b>, <strong>, <code>, <em> y <br> (para párrafos de las páginas estáticas)
  function rich(el, texto) {
    el.replaceChildren();
    var partes = String(texto).split(/(<\/?(?:b|strong|code|em)>|<br\s*\/?>)/);
    var pila = [el];
    partes.forEach(function (p) {
      var m = /^<(\/?)(b|strong|code|em)>$/.exec(p);
      if (m) {
        if (m[1]) { if (pila.length > 1) pila.pop(); } else {
          var e = document.createElement(m[2]);
          pila[pila.length - 1].appendChild(e);
          pila.push(e);
        }
      } else if (/^<br/.test(p)) pila[pila.length - 1].appendChild(document.createElement('br'));
      else if (p) pila[pila.length - 1].appendChild(document.createTextNode(p));
    });
  }

  function aplicar(raiz) {
    if (!enNavegador) return;
    raiz = raiz || document;
    var q = function (s) { return raiz.querySelectorAll ? raiz.querySelectorAll(s) : []; };
    Array.prototype.forEach.call(q('[data-i18n]'), function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (e) { rich(e, t(e.getAttribute('data-i18n-html'))); });
    Array.prototype.forEach.call(q('[data-i18n-ph]'), function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-i18n-ph'))); });
    Array.prototype.forEach.call(q('[data-i18n-aria]'), function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
    Array.prototype.forEach.call(q('[data-i18n-title]'), function (e) { e.setAttribute('title', t(e.getAttribute('data-i18n-title'))); });
    Array.prototype.forEach.call(q('[data-i18n-alt]'), function (e) { e.setAttribute('alt', t(e.getAttribute('data-i18n-alt'))); });
    var dt = document.querySelector('title[data-i18n-doc]');
    if (dt) document.title = t(dt.getAttribute('data-i18n-doc'));
  }

  function refrescar() {
    podar();
    registro.forEach(function (r) {
      if (r.tipo === 'texto') r.nodo.data = t(r.key, r.vars);
      else if (r.tipo === 'attr') r.el.setAttribute(r.attr, t(r.key, r.vars));
      else if (r.tipo === 'fn') r.el.setAttribute(r.attr, r.fn());
      else if (r.tipo === 'titulo') document.title = t(r.key, r.vars);
    });
  }

  function marcarSelectores() {
    if (!enNavegador) return;
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma button'), function (b) {
      var activo = b.getAttribute('data-lang') === lang;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma'), function (g) { g.setAttribute('aria-label', t('idioma')); });
  }

  function set(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l;
    try { localStorage.setItem(CLAVE, l); } catch (e) { /* sin almacenamiento */ }
    if (enNavegador) document.documentElement.lang = l;
    aplicar(document);
    refrescar();
    marcarSelectores();
    oyentes.slice().forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
  }

  function selector() {
    var g = document.createElement('div');
    g.className = 'selector-idioma';
    g.setAttribute('role', 'group');
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', l);
      b.textContent = l.toUpperCase();
      b.addEventListener('click', function () { set(l); });
      g.appendChild(b);
    });
    return g;
  }

  function montar() {
    document.documentElement.lang = lang;
    var huecos = document.querySelectorAll('[data-lang-slot]');
    if (huecos.length) {
      Array.prototype.forEach.call(huecos, function (h) { h.replaceChildren(selector()); });
    } else {
      var c = document.createElement('div');
      c.className = 'selector-flotante';
      c.appendChild(selector());
      document.body.appendChild(c);
    }
    aplicar(document);
    marcarSelectores();
  }
  if (enNavegador) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
  }

  // Formatos según idioma
  function loc() { return lang === 'es' ? 'es-ES' : 'ca-ES'; }
  function locDe(l) { return l === 'es' ? 'es-ES' : 'ca-ES'; }
  var ZONA = 'Europe/Madrid';
  function setZona(z) { ZONA = z; }
  function fecha(d, l) {
    return new Date(d).toLocaleDateString(locDe(l || lang), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA });
  }
  function fechaHora(d, l) {
    var x = new Date(d);
    return fecha(x, l) + ' ' + x.toLocaleTimeString(locDe(l || lang), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA });
  }
  function num(n, opciones, l) { return new Intl.NumberFormat(locDe(l || lang), opciones).format(n); }
  function seg(ms, l) { return num(ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, l) + ' s'; }
  function segNum(ms, l) { return num(ms / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, l); }
  function ordenar(a, b) { return String(a).localeCompare(String(b), loc(), { numeric: true, sensitivity: 'base' }); }

  // Error con código: el mensaje se traduce al crearlo; el código permite volver a traducirlo
  function Err(code, vars) {
    var e = new Error(t('e.' + code, vars));
    e.code = code;
    e.vars = vars;
    return e;
  }
  // Texto de un error del servidor ({ error: 'codigo', vars }) o de un Error con código
  function errTxt(codigo, vars, porDefecto) {
    if (codigo && has('e.' + codigo)) return t('e.' + codigo, vars);
    return t(porDefecto || 'e.generico');
  }

  var API = {
    t: t, tl: tl, T: T, D: D, esD: esD, has: has, set: set, nodo: nodo, bind: bind, bindFn: bindFn, setT: setT, titulo: titulo,
    rich: rich, apply: aplicar, selector: selector, fecha: fecha, fechaHora: fechaHora, num: num, seg: seg, segNum: segNum,
    ordenar: ordenar, loc: loc, setZona: setZona, Err: Err, errTxt: errTxt,
    onChange: function (f) { oyentes.push(f); },
    langs: LANGS.slice(), dict: DICT,
  };
  Object.defineProperty(API, 'lang', { get: function () { return lang; } });
  global.I18N = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
