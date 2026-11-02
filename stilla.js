'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const GRAVITY      = 0.0006;
const MAX_PULL     = 80;
const MAX_DOTS     = 8;
const DROPLET_R    = 18;
const LAUNCH_SCALE = 0.014;
const CLOUD_W      = 120;
const CLOUD_H      = 54;
const STORM_MS     = 1500;
const SECTION_H_FACTOR = 1.6;  // each definition occupies 1.6 viewport heights → wider row spacing
const SQUASH_MS    = 300;
const WIN_MS       = 3000;
const GAMEOVER_MS  = 800;

// ── UFO rescue ────────────────────────────────────────────────────────────────
const UFO_ENTER_MS   = 680;   // UFO descends from off-screen
const UFO_BEAM_MS    = 480;   // beam extends / locks onto droplet
const UFO_LIFT_MS    = 440;   // droplet rises into beam
const UFO_MOVE_MS    = 660;   // UFO glides sideways past cloud edge
const UFO_RELEASE_MS = 360;   // beam fades, UFO drifts up, droplet released
const UFO_HOVER_GAP  = 92;    // world-px: UFO centre above droplet while hovering
const UFO_LIFT_PX    = 40;    // world-px: how far droplet rises while in beam (stays below the hull)
const UFO_SIDE_PAD   = 24;    // extra px past cloud edge before dropping

// ── Definitions ───────────────────────────────────────────────────────────────
// distractors format: array of arrays — one inner array per fragment row,
// each containing 2 alternatives syntactically/semantically matching that row.
const DEFINITIONS = [
  // ── Geometria ────────────────────────────────────────────────────────────────
  { id: 'circ-01', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di circonferenza',
    fragments:   ['La circonferenza', 'è il luogo', 'dei punti', 'equidistanti', 'da un punto', 'detto centro'],
    distractors: [
      ["Il cerchio", "L'ellisse"],
      ["è l'insieme", "è la curva"],
      ["delle rette", "dei segmenti"],
      ["perpendicolari", "simmetrici"],
      ["da una retta", "da un piano"],
      ["detto fuoco", "detto vertice"]
    ]},
  { id: 'tria-01', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di triangolo',
    fragments:   ['Il triangolo', 'è un poligono', 'con tre lati', 'e tre angoli', 'la cui somma', 'è 180 gradi'],
    distractors: [
      ["Il quadrilatero", "Il pentagono"],
      ["è un poliedro", "è una figura piana"],
      ["con quattro lati", "con due lati"],
      ["e due angoli", "e quattro angoli"],
      ["il cui prodotto", "la cui differenza"],
      ["è 360 gradi", "è 90 gradi"]
    ]},
  { id: 'geo-02', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di perimetro',
    fragments:   ['Il perimetro', 'di un poligono', 'è la somma', 'delle lunghezze', 'di tutti i suoi lati'],
    distractors: [
      ["L'area", "Il volume"],
      ["di un solido", "di un cerchio"],
      ["è il prodotto", "è la differenza"],
      ["degli angoli interni", "delle diagonali"],
      ["di tutti i suoi angoli", "delle sue diagonali"]
    ]},
  { id: 'geo-03', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: "Definizione di area del cerchio",
    fragments:   ["L'area del cerchio", 'è uguale', 'al prodotto', 'di pigreco', 'per il quadrato del raggio'],
    distractors: [
      ["Il perimetro del cerchio", "La superficie sferica"],
      ["è proporzionale", "è minore"],
      ["al rapporto", "alla somma"],
      ["di due pigreco", "del diametro"],
      ["per il doppio del raggio", "per il cubo del raggio"]
    ]},
  { id: 'geo-04', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: "Definizione di angolo",
    fragments:   ["L'angolo", "è la figura geometrica", "formata da due semirette", "con la stessa origine", "detta vertice"],
    distractors: [
      ["Il segmento", "Il vettore"],
      ["è la misura geometrica", "è la curva piana"],
      ["formata da due rette parallele", "formata da tre punti"],
      ["con la stessa direzione", "con lo stesso modulo"],
      ["dette basi", "dette estremità"]
    ]},
  { id: 'geo-05', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Teorema di Pitagora',
    fragments:   ['In un triangolo rettangolo', "il quadrato dell'ipotenusa", 'è uguale', 'alla somma', 'dei quadrati dei cateti'],
    distractors: [
      ["In un triangolo equilatero", "In un triangolo isoscele"],
      ["il doppio dell'ipotenusa", "il cubo del cateto"],
      ["è proporzionale", "è minore"],
      ["al prodotto", "alla differenza"],
      ["delle altezze dei cateti", "dei quadrati degli angoli"]
    ]},
  { id: 'geo-06', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di rette parallele',
    fragments:   ['Due rette', 'sono parallele', 'se giacciono sullo stesso piano', 'e non si intersecano', 'in nessun punto'],
    distractors: [
      ["Due piani", "Due segmenti"],
      ["sono perpendicolari", "sono complanari"],
      ["se giacciono su piani diversi", "se appartengono allo spazio"],
      ["e si intersecano", "e si incontrano"],
      ["in un solo punto", "in infiniti punti"]
    ]},
  { id: 'geo-07', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di simmetria assiale',
    fragments:   ['La simmetria assiale', 'è una trasformazione geometrica', 'che associa a ogni punto', 'il suo simmetrico', 'rispetto a una retta asse'],
    distractors: [
      ["La simmetria centrale", "La traslazione"],
      ["è una proiezione geometrica", "è una rotazione piana"],
      ["che associa a ogni segmento", "che sposta ogni piano"],
      ["il suo contrario", "la sua proiezione"],
      ["rispetto a un punto fisso", "rispetto a un piano"]
    ]},
  { id: 'geo-08', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di volume del cubo',
    fragments:   ['Il volume del cubo', 'è uguale', 'al cubo', 'della lunghezza', 'del suo spigolo'],
    distractors: [
      ["Il volume del cono", "La superficie del cubo"],
      ["è proporzionale", "è minore"],
      ["al quadrato", "alla radice"],
      ["della diagonale", "del raggio"],
      ["del suo lato", "della sua altezza"]
    ]},
  { id: 'geo-09', subject: 'Matematica',    category: 'Geometria Euclidea', prompt: 'Definizione di piano cartesiano',
    fragments:   ['Il piano cartesiano', 'è un sistema di riferimento', 'formato da due assi', 'perpendicolari tra loro', "che si intersecano nell'origine"],
    distractors: [
      ["Il piano proiettivo", "Lo spazio euclideo"],
      ["è un insieme di punti", "è una griglia numerica"],
      ["formato da tre assi", "formato da due rette oblique"],
      ["paralleli tra loro", "obliqui tra loro"],
      ["che si intersecano nel fuoco", "che formano un angolo detto vertice"]
    ]},

  // ── Goniometria e Trigonometria ──────────────────────────────────────────────
  { id: 'gon-01', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di seno di un angolo',
    fragments:   ['Il seno di un angolo', 'in un triangolo rettangolo', 'è il rapporto', 'tra il cateto opposto', "e l'ipotenusa"],
    distractors: [
      ["Il coseno di un angolo", "La tangente di un angolo"],
      ["in un triangolo isoscele", "in un triangolo equilatero"],
      ["è il prodotto", "è la differenza"],
      ["tra il cateto adiacente", "tra i due cateti"],
      ["e il cateto adiacente", "e il cateto opposto"]
    ]},
  { id: 'gon-02', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di coseno di un angolo',
    fragments:   ['Il coseno di un angolo', 'in un triangolo rettangolo', 'è il rapporto', 'tra il cateto adiacente', "e l'ipotenusa"],
    distractors: [
      ["Il seno di un angolo", "La tangente di un angolo"],
      ["in un triangolo scaleno", "in un triangolo isoscele"],
      ["è il prodotto", "è la somma"],
      ["tra il cateto opposto", "tra i due cateti"],
      ["e il cateto opposto", "e il cateto adiacente"]
    ]},
  { id: 'gon-03', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di tangente di un angolo',
    fragments:   ['La tangente di un angolo', 'è il rapporto', 'tra il seno', 'e il coseno', "dello stesso angolo"],
    distractors: [
      ["La cotangente di un angolo", "Il seno di un angolo"],
      ["è il prodotto", "è la differenza"],
      ["tra il coseno", "tra l'ipotenusa"],
      ["e la tangente", "e il seno"],
      ["dell'angolo supplementare", "dell'angolo complementare"]
    ]},
  { id: 'gon-04', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Prima identità fondamentale della goniometria',
    fragments:   ['Per ogni angolo α', 'la somma', 'del quadrato del seno', 'e del quadrato del coseno', 'è uguale a 1'],
    distractors: [
      ["Per ogni angolo β", "Per ogni angolo acuto"],
      ["il prodotto", "la differenza"],
      ["del seno e del coseno", "del cubo del seno"],
      ["e del quadrato della tangente", "e del seno del coseno"],
      ["è uguale a 0", "è uguale a π"]
    ]},
  { id: 'gon-05', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di radiante',
    fragments:   ['Il radiante', 'è l\'unità di misura degli angoli', 'corrispondente', "all'angolo al centro", 'che sottende un arco uguale al raggio'],
    distractors: [
      ["Il grado sessagesimale", "Il grado centesimale"],
      ["è la misura in gradi degli angoli", "è il rapporto tra angoli"],
      ["equivalente", "proporzionale"],
      ["all'angolo inscritto", "all'angolo periferico"],
      ["che sottende un arco uguale al diametro", "che misura 180 gradi"]
    ]},
  { id: 'gon-06', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Teorema dei seni',
    fragments:   ['In un triangolo', 'il rapporto tra un lato', 'e il seno dell\'angolo opposto', 'è costante', 'ed è uguale al diametro della circonferenza circoscritta'],
    distractors: [
      ["In un quadrilatero", "In un poligono regolare"],
      ["il rapporto tra un angolo", "il prodotto tra due lati"],
      ["e il coseno dell'angolo adiacente", "e la tangente dell'angolo interno"],
      ["è variabile", "è proporzionale"],
      ["ed è uguale al raggio della circonferenza inscritta", "ed è uguale alla somma dei lati"]
    ]},
  { id: 'gon-07', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Teorema del coseno (generalizzazione di Pitagora)',
    fragments:   ['Il quadrato di un lato', 'è uguale alla somma', 'dei quadrati degli altri due lati', 'diminuita del doppio prodotto', 'dei due lati per il coseno dell\'angolo compreso'],
    distractors: [
      ["Il cubo di un lato", "La radice di un lato"],
      ["è uguale alla differenza", "è uguale al prodotto"],
      ["dei quadrati dei diagonali", "dei moduli degli altri due lati"],
      ["aumentata del doppio prodotto", "diminuita del quadruplo prodotto"],
      ["dei due lati per il seno dell'angolo opposto", "degli angoli per il coseno dell'angolo adiacente"]
    ]},
  { id: 'gon-08', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Formula di addizione del seno',
    fragments:   ['Il seno della somma di due angoli', 'α e β', 'è uguale', 'al seno di α per il coseno di β', 'più il coseno di α per il seno di β'],
    distractors: [
      ["Il coseno della somma di due angoli", "La tangente della somma di due angoli"],
      ["α e γ", "α o β"],
      ["è proporzionale", "è minore"],
      ["al seno di α per il seno di β", "al coseno di α per il coseno di β"],
      ["meno il seno di α per il coseno di β", "più il seno di α per il seno di β"]
    ]},
  { id: 'gon-09', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di angolo in posizione standard',
    fragments:   ['Un angolo è in posizione standard', 'quando il suo vertice', 'è nell\'origine', 'e il suo lato iniziale', 'coincide con il semiasse positivo delle x'],
    distractors: [
      ["Un angolo è in posizione normale", "Un angolo è orientato"],
      ["quando il suo centro", "quando il suo lato finale"],
      ["è nel punto (1,0)", "è sull'asse y"],
      ["e il suo lato finale", "e il suo vertice"],
      ["coincide con il semiasse negativo delle y", "coincide con l'asse delle y"]
    ]},
  { id: 'gon-10', subject: 'Matematica',    category: 'Goniometria e Trigonometria', prompt: 'Definizione di funzione periodica',
    fragments:   ['Una funzione è periodica', 'se esiste un valore T positivo', 'detto periodo', 'tale che f(x+T) = f(x)', 'per ogni x nel dominio'],
    distractors: [
      ["Una funzione è monotona", "Una funzione è limitata"],
      ["se esiste un valore M negativo", "se esiste un intervallo I"],
      ["detto modulo", "detto ampiezza"],
      ["tale che f(x·T) = f(x)", "tale che f(x+T) > f(x)"],
      ["per alcuni x nel codominio", "per ogni x nel codominio"]
    ]},

  // ── Goniometria: formule di somma ────────────────────────────────────────────
  { id: 'gon-11', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del seno della somma di due angoli',
    fragments:   ['La formula del seno della somma', 'afferma che sin(α+β)', 'è uguale a', 'sin α cos β', 'più cos α sin β'],
    distractors: [
      ["La formula del coseno della somma", "La formula della tangente della somma"],
      ["afferma che cos(α+β)", "afferma che tan(α+β)"],
      ["è diverso da", "è proporzionale a"],
      ["cos α cos β", "sin α sin β"],
      ["meno cos α sin β", "per cos α cos β"]
    ]},
  { id: 'gon-12', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del coseno della somma di due angoli',
    fragments:   ['La formula del coseno della somma', 'afferma che cos(α+β)', 'è uguale a', 'cos α cos β', 'meno sin α sin β'],
    distractors: [
      ["La formula del seno della somma", "La formula della tangente della somma"],
      ["afferma che sin(α+β)", "afferma che tan(α+β)"],
      ["è diverso da", "è proporzionale a"],
      ["sin α cos β", "cos α sin β"],
      ["più cos α sin β", "diviso cos α cos β"]
    ]},

  // ── Goniometria: formule di differenza ───────────────────────────────────────
  { id: 'gon-13', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del seno della differenza di due angoli',
    fragments:   ['La formula del seno della differenza', 'afferma che sin(α−β)', 'è uguale a', 'sin α cos β', 'meno cos α sin β'],
    distractors: [
      ["La formula del coseno della differenza", "La formula della cotangente della differenza"],
      ["afferma che cos(α−β)", "afferma che sin(α+β)"],
      ["è proporzionale a", "è il doppio di"],
      ["cos α cos β", "cos α sin β"],
      ["più cos α sin β", "per sin α cos β"]
    ]},
  { id: 'gon-14', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del coseno della differenza di due angoli',
    fragments:   ['La formula del coseno della differenza', 'afferma che cos(α−β)', 'è uguale a', 'cos α cos β', 'più sin α sin β'],
    distractors: [
      ["La formula del seno della differenza", "La formula della tangente della differenza"],
      ["afferma che sin(α−β)", "afferma che cos(α+β)"],
      ["è inferiore a", "è il quadrato di"],
      ["sin α cos β", "sin α sin β"],
      ["meno sin α sin β", "meno cos α cos β"]
    ]},

  // ── Goniometria: formule di duplicazione ─────────────────────────────────────
  { id: 'gon-15', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del seno dell\'angolo doppio',
    fragments:   ['La formula del seno del doppio angolo', 'afferma che sin(2α)', 'è uguale a', '2 sin α cos α'],
    distractors: [
      ["La formula del coseno del doppio angolo", "La formula della tangente del doppio angolo"],
      ["afferma che cos(2α)", "afferma che sin(α/2)"],
      ["è proporzionale a", "è uguale al quadrato di"],
      ["sin²α − cos²α", "2 cos²α − 1"]
    ]},
  { id: 'gon-16', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula del coseno dell\'angolo doppio',
    fragments:   ['La formula del coseno del doppio angolo', 'afferma che cos(2α)', 'è uguale a', 'cos²α − sin²α', 'oppure 2cos²α−1 oppure 1−2sin²α'],
    distractors: [
      ["La formula del seno del doppio angolo", "La formula della tangente del doppio angolo"],
      ["afferma che sin(2α)", "afferma che cos(α/2)"],
      ["è proporzionale a", "ha come risultato"],
      ["sin²α + cos²α", "2 sin α cos α"],
      ["oppure 2sin²α+1 oppure cos²α−1", "oppure 1+2cos²α oppure sin²α−cos²α"]
    ]},
  { id: 'gon-17', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula della tangente dell\'angolo doppio',
    fragments:   ['La formula della tangente del doppio angolo', 'afferma che tan(2α)', 'è uguale a', '2 tan α', 'diviso (1 − tan²α)'],
    distractors: [
      ["La formula della cotangente del doppio angolo", "La formula della tangente della somma"],
      ["afferma che cot(2α)", "afferma che tan(α+β)"],
      ["è proporzionale a", "vale sempre"],
      ["2 cot α", "tan²α"],
      ["per (1 + cot²α)", "più (1 + tan²α)"]
    ]},

  // ── Goniometria: formule di bisezione ────────────────────────────────────────
  { id: 'gon-18', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di bisezione del seno',
    fragments:   ['La formula di bisezione del seno', 'afferma che sin²(α/2)', 'è uguale a', '(1 − cos α)', 'diviso 2'],
    distractors: [
      ["La formula di bisezione del coseno", "La formula di duplicazione del seno"],
      ["afferma che cos²(α/2)", "afferma che sin²(2α)"],
      ["è proporzionale a", "vale come"],
      ["(1 + cos α)", "(1 − sin α)"],
      ["moltiplicato per 2", "elevato al quadrato"]
    ]},
  { id: 'gon-19', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di bisezione del coseno',
    fragments:   ['La formula di bisezione del coseno', 'afferma che cos²(α/2)', 'è uguale a', '(1 + cos α)', 'diviso 2'],
    distractors: [
      ["La formula di bisezione del seno", "La formula di duplicazione del coseno"],
      ["afferma che sin²(α/2)", "afferma che cos²(2α)"],
      ["è proporzionale a", "coincide con"],
      ["(1 − cos α)", "(1 + sin α)"],
      ["moltiplicato per 2", "più 1"]
    ]},

  // ── Goniometria: formule parametriche ────────────────────────────────────────
  { id: 'gon-20', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formule parametriche con t = tan(α/2)',
    fragments:   ['Le formule parametriche', 'usano la sostituzione t = tan(α/2)', 'per esprimere sin α', 'come 2t/(1+t²)', 'e cos α come (1−t²)/(1+t²)'],
    distractors: [
      ["Le formule di Werner", "Le formule di prostaferesi"],
      ["usano la sostituzione t = sin(α/2)", "usano la sostituzione t = cos(α)"],
      ["per calcolare tan α", "per trasformare sin(2α)"],
      ["come t²/(1+t)", "come (1+t²)/2t"],
      ["e tan α come 2t/(1−t²)", "e sin²α come t/(1+t²)"]
    ]},
  { id: 'gon-21', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula parametrica della tangente con t = tan(α/2)',
    fragments:   ['Con la sostituzione t = tan(α/2)', 'la tangente di α', 'si esprime come', '2t', 'diviso (1 − t²)'],
    distractors: [
      ["Con la sostituzione t = sin(α/2)", "Con la sostituzione t = cos(α)"],
      ["il seno di α", "il coseno di α"],
      ["si calcola come", "si riduce a"],
      ["t²", "(1 + t²)"],
      ["per (1 + t²)", "meno 2t"]
    ]},

  // ── Goniometria: formule di Werner ───────────────────────────────────────────
  { id: 'gon-22', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di Werner: prodotto sin α cos β',
    fragments:   ['Le formule di Werner', 'trasformano prodotti in somme:', 'sin α cos β', 'è uguale a ½', 'per [sin(α+β) + sin(α−β)]'],
    distractors: [
      ["Le formule di prostaferesi", "Le formule di bisezione"],
      ["trasformano somme in prodotti:", "trasformano potenze in prodotti:"],
      ["cos α cos β", "sin α sin β"],
      ["è uguale a 2", "è uguale a ¼"],
      ["per [cos(α−β) − cos(α+β)]", "per [sin(α+β) − sin(α−β)]"]
    ]},
  { id: 'gon-23', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di Werner: prodotto cos α cos β',
    fragments:   ['La formula di Werner', 'per il prodotto cos α cos β', 'dà come risultato', '½ [cos(α−β)', 'più cos(α+β)]'],
    distractors: [
      ["La formula di prostaferesi", "La formula di bisezione"],
      ["per il prodotto sin α sin β", "per la somma cos α + cos β"],
      ["vale sempre", "si semplifica in"],
      ["½ [sin(α+β)", "¼ [cos(α−β)"],
      ["meno cos(α+β)]", "meno sin(α−β)]"]
    ]},

  // ── Goniometria: formule di prostaferesi ─────────────────────────────────────
  { id: 'gon-24', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di prostaferesi: somma di seni',
    fragments:   ['La formula di prostaferesi', 'per la somma sin α + sin β', 'dà come risultato', '2 sin((α+β)/2)', 'per cos((α−β)/2)'],
    distractors: [
      ["La formula di Werner", "La formula di bisezione"],
      ["per il prodotto sin α · sin β", "per la differenza sin α − sin β"],
      ["vale uguale a", "si esprime come"],
      ["2 cos((α+β)/2)", "½ sin((α+β)/2)"],
      ["per sin((α−β)/2)", "per tan((α−β)/2)"]
    ]},
  { id: 'gon-25', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di prostaferesi: somma di coseni',
    fragments:   ['La formula di prostaferesi', 'per la somma cos α + cos β', 'dà come risultato', '2 cos((α+β)/2)', 'per cos((α−β)/2)'],
    distractors: [
      ["La formula di Werner", "La formula di duplicazione"],
      ["per il prodotto cos α · cos β", "per la differenza cos α − cos β"],
      ["vale uguale a", "si esprime come"],
      ["2 sin((α+β)/2)", "½ cos((α+β)/2)"],
      ["per sin((α−β)/2)", "per tan((α+β)/2)"]
    ]},
  { id: 'gon-26', subject: 'Matematica', category: 'Goniometria e Trigonometria', prompt: 'Formula di prostaferesi: differenza di coseni',
    fragments:   ['La formula di prostaferesi', 'per la differenza cos α − cos β', 'dà come risultato', '−2 sin((α+β)/2)', 'per sin((α−β)/2)'],
    distractors: [
      ["La formula di Werner", "La formula di bisezione"],
      ["per il prodotto sin α · cos β", "per la somma cos α + cos β"],
      ["vale uguale a", "si riduce a"],
      ["2 cos((α+β)/2)", "+2 sin((α+β)/2)"],
      ["per cos((α−β)/2)", "per cos((α+β)/2)"]
    ]},

  // ── Geometria Analitica ───────────────────────────────────────────────────────
  { id: 'ga-01', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Equazione della retta in forma esplicita',
    fragments:   ["L'equazione della retta", 'in forma esplicita', 'è y = mx + q', 'dove m è il coefficiente angolare', 'e q è l\'ordinata all\'origine'],
    distractors: [
      ["L'equazione della parabola", "L'equazione del cerchio"],
      ["in forma implicita", "in forma parametrica"],
      ["è y = ax² + bx + c", "è x² + y² = r²"],
      ["dove m è l'ascissa del vertice", "dove a è il coefficiente del termine noto"],
      ["e q è l'ascissa all'origine", "e b è il coefficiente angolare"]
    ]},
  { id: 'ga-02', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Definizione di coefficiente angolare',
    fragments:   ['Il coefficiente angolare', 'di una retta', 'è uguale alla tangente', "dell'angolo", 'che la retta forma con l\'asse x'],
    distractors: [
      ["Il termine noto", "L'ordinata all'origine"],
      ["di una curva", "di un segmento"],
      ["è uguale al seno", "è uguale al coseno"],
      ["del coefficiente", "della pendenza"],
      ["che la retta forma con l'asse y", "che la retta forma con la bisettrice"]
    ]},
  { id: 'ga-03', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Condizione di parallelismo tra due rette',
    fragments:   ['Due rette', 'sono parallele', 'se e solo se', 'hanno lo stesso coefficiente angolare', 'e termine noto diverso'],
    distractors: [
      ["Due piani", "Due curve"],
      ["sono perpendicolari", "sono coincidenti"],
      ["tranne quando", "se almeno una"],
      ["hanno coefficienti angolari opposti", "hanno coefficienti angolari reciproci"],
      ["e termine noto uguale", "e coefficiente angolare nullo"]
    ]},
  { id: 'ga-04', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Condizione di perpendicolarità tra due rette',
    fragments:   ['Due rette', 'sono perpendicolari', 'se e solo se', 'il prodotto dei loro coefficienti angolari', 'è uguale a −1'],
    distractors: [
      ["Due segmenti", "Due assi"],
      ["sono parallele", "sono incidenti"],
      ["tranne quando", "se almeno uno"],
      ["la somma dei loro coefficienti angolari", "il rapporto dei loro coefficienti angolari"],
      ["è uguale a 0", "è uguale a 1"]
    ]},
  { id: 'ga-05', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Distanza tra un punto e una retta',
    fragments:   ['La distanza', 'tra il punto P(x₀, y₀)', 'e la retta ax + by + c = 0', 'è uguale', 'a |ax₀ + by₀ + c| / √(a² + b²)'],
    distractors: [
      ["L'area", "Il perimetro"],
      ["tra il punto O(0, 0)", "tra il punto P(x₀, 0)"],
      ["e la retta y = mx + q", "e la curva ax² + by = c"],
      ["è proporzionale", "è minore"],
      ["a (ax₀ + by₀ + c) / (a + b)", "a √(ax₀² + by₀²) / (a + b)"]
    ]},
  { id: 'ga-06', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Equazione della circonferenza',
    fragments:   ["L'equazione della circonferenza", 'con centro (a, b) e raggio r', 'è', '(x − a)² + (y − b)² = r²', 'nella forma canonica'],
    distractors: [
      ["L'equazione dell'ellisse", "L'equazione della parabola"],
      ["con fuoco (a, b) e direttrice r", "con vertice (a, b) e asse r"],
      ["vale", "diventa"],
      ["(x − a)² / a² + (y − b)² / b² = 1", "y − b = (x − a)²"],
      ["nella forma parametrica", "nella forma implicita"]
    ]},
  { id: 'ga-07', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Equazione della parabola con asse verticale',
    fragments:   ["L'equazione della parabola", 'con asse verticale', 'è y = ax² + bx + c', 'dove il vertice', 'ha ascissa x = −b / (2a)'],
    distractors: [
      ["L'equazione dell'iperbole", "L'equazione dell'ellisse"],
      ["con asse orizzontale", "con asse obliquo"],
      ["è y = ax + b", "è x² / a² − y² / b² = 1"],
      ["dove il fuoco", "dove il centro"],
      ["ha ordinata y = −b / (2a)", "ha ascissa x = b / (2a)"]
    ]},
  { id: 'ga-08', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Equazione dell\'ellisse con centro nell\'origine',
    fragments:   ["L'equazione dell'ellisse", 'con centro nell\'origine', 'è x²/a² + y²/b² = 1', 'dove a e b', 'sono i semiassi'],
    distractors: [
      ["L'equazione dell'iperbole", "L'equazione della circonferenza"],
      ["con fuoco nell'origine", "con vertice nell'origine"],
      ["è x²/a² − y²/b² = 1", "è x² + y² = a²"],
      ["dove a e c", "dove r e d"],
      ["sono le distanze focali", "sono i raggi di curvatura"]
    ]},
  { id: 'ga-09', subject: 'Matematica',    category: 'Geometria Analitica', prompt: "Equazione dell'iperbole con centro nell'origine",
    fragments:   ["L'equazione dell'iperbole", 'con centro nell\'origine', 'è x²/a² − y²/b² = 1', 'dove a è il semiasse reale', 'e b il semiasse immaginario'],
    distractors: [
      ["L'equazione dell'ellisse", "L'equazione della parabola"],
      ["con fuoco nell'origine", "con vertice nell'origine"],
      ["è x²/a² + y²/b² = 1", "è (x−a)² + (y−b)² = r²"],
      ["dove a è il semiasse immaginario", "dove a è il raggio reale"],
      ["e b il semiasse reale", "e b il fuoco"]
    ]},
  { id: 'ga-10', subject: 'Matematica',    category: 'Geometria Analitica', prompt: 'Formula della distanza tra due punti',
    fragments:   ['La distanza', 'tra i punti P₁(x₁, y₁) e P₂(x₂, y₂)', 'è uguale', 'alla radice quadrata', 'di (x₂−x₁)² + (y₂−y₁)²'],
    distractors: [
      ["L'area", "Il vettore"],
      ["tra i punti O(0,0) e P(x, y)", "tra i punti P₁ e P₃"],
      ["è proporzionale", "è minore"],
      ["al quadrato", "alla metà"],
      ["di (x₂+x₁)² + (y₂+y₁)²", "di |x₂−x₁| · |y₂−y₁|"]
    ]},

  // ── Biologia ─────────────────────────────────────────────────────────────────
  { id: 'foto-01', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di fotosintesi',
    fragments:   ['La fotosintesi', 'è il processo', 'con cui le piante', 'trasformano', 'luce solare', 'in energia chimica'],
    distractors: [
      ["La respirazione", "La fermentazione"],
      ["è la reazione", "è il meccanismo"],
      ["con cui i funghi", "con cui i batteri"],
      ["assorbono", "rilasciano"],
      ["energia termica", "anidride carbonica"],
      ["in calore", "in biomassa"]
    ]},
  { id: 'cell-01', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di cellula',
    fragments:   ['La cellula', "è l'unità", 'fondamentale', 'della vita', 'che costituisce', 'ogni organismo vivente'],
    distractors: [
      ["Il nucleo", "Il tessuto"],
      ["è il componente", "è la struttura"],
      ["accessoria", "elementare"],
      ["della materia", "della chimica"],
      ["che forma", "che regola"],
      ["ogni sostanza inerte", "ogni essere pluricellulare"]
    ]},
  { id: 'bio-02', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di DNA',
    fragments:   ['Il DNA', 'è una molecola', 'a doppia elica', 'che contiene', 'le informazioni genetiche', 'di un organismo'],
    distractors: [
      ["L'RNA", "La proteina"],
      ["è un composto", "è un enzima"],
      ["a singolo filamento", "a struttura sferica"],
      ["che trasporta", "che regola"],
      ["le istruzioni metaboliche", "i segnali ormonali"],
      ["di una cellula batterica", "di un virus"]
    ]},
  { id: 'bio-03', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: "Definizione di ecosistema",
    fragments:   ["L'ecosistema", 'è un sistema', 'formato da organismi viventi', "e dal loro ambiente", 'che interagiscono tra loro'],
    distractors: [
      ["La biocenosi", "La biosfera"],
      ["è un insieme", "è una rete"],
      ["formato da sole specie animali", "formato da organismi vegetali"],
      ["e dalla loro specie", "e dalle loro caratteristiche genetiche"],
      ["che si riproducono insieme", "che competono per le risorse"]
    ]},
  { id: 'bio-04', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: "Definizione di evoluzione",
    fragments:   ["L'evoluzione", 'è il processo', 'di cambiamento', 'delle specie viventi', 'nel corso del tempo'],
    distractors: [
      ["L'adattamento", "La selezione artificiale"],
      ["è il meccanismo", "è la tendenza"],
      ["di riproduzione", "di estinzione"],
      ["degli individui isolati", "dei soli fossili"],
      ["nel corso di una generazione", "in condizioni di isolamento"]
    ]},
  { id: 'bio-05', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di catena alimentare',
    fragments:   ['La catena alimentare', 'è una sequenza', 'di organismi', 'in cui ognuno', 'si nutre del precedente'],
    distractors: [
      ["La rete trofica", "Il ciclo biogeochimico"],
      ["è un insieme", "è una gerarchia"],
      ["di cellule", "di specie vegetali"],
      ["in cui alcuni", "in cui il primo"],
      ["si riproduce con il successivo", "viene mangiato dal successivo"]
    ]},
  { id: 'bio-06', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di enzima',
    fragments:   ["L'enzima", 'è una proteina', 'che accelera', 'le reazioni chimiche', "all'interno delle cellule"],
    distractors: [
      ["L'ormone", "Il recettore"],
      ["è un lipide", "è un carboidrato"],
      ["che rallenta", "che blocca"],
      ["le divisioni cellulari", "i segnali nervosi"],
      ["nel nucleo cellulare", "fuori dalle membrane"]
    ]},
  { id: 'bio-07', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di gene',
    fragments:   ['Il gene', 'è un segmento di DNA', 'che contiene', 'le istruzioni', 'per produrre una proteina'],
    distractors: [
      ["Il cromosoma", "Il genoma"],
      ["è una molecola di RNA", "è un frammento di membrana"],
      ["che trasmette", "che regola"],
      ["le mutazioni", "i segnali chimici"],
      ["per costruire un organo", "per attivare un ormone"]
    ]},
  { id: 'bio-08', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di respirazione cellulare',
    fragments:   ['La respirazione cellulare', 'è il processo', 'con cui le cellule', 'trasformano il glucosio', 'in energia utilizzabile'],
    distractors: [
      ["La fermentazione", "La digestione cellulare"],
      ["è la reazione", "è il meccanismo"],
      ["con cui i mitocondri", "con cui i ribosomi"],
      ["scompongono le proteine", "assorbono l'ossigeno"],
      ["in calore disperso", "in molecole di scarto"]
    ]},
  { id: 'bio-09', subject: 'Biologia',      category: 'Biologia Cellulare', prompt: 'Definizione di meiosi',
    fragments:   ['La meiosi', 'è il processo', 'di divisione cellulare', 'che produce', 'quattro cellule con metà del corredo cromosomico'],
    distractors: [
      ["La mitosi", "La fissione batterica"],
      ["è il meccanismo", "è la reazione"],
      ["di fusione nucleare", "di riproduzione asessuata"],
      ["che elimina", "che duplica"],
      ["due cellule con il corredo completo", "quattro cellule identiche alla madre"]
    ]},

  // ── Educazione Civica ─────────────────────────────────────────────────────────
  { id: 'demo-01', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: 'Definizione di democrazia',
    fragments:   ['La democrazia', 'è una forma di governo', 'in cui il potere', 'appartiene', 'al popolo', 'esercitato tramite rappresentanti'],
    distractors: [
      ["La monarchia", "La teocrazia"],
      ["è un sistema economico", "è un tipo di stato"],
      ["in cui il comando", "in cui la norma"],
      ["risiede", "è concentrato"],
      ["nel sovrano", "nella chiesa"],
      ["ereditato per nascita", "imposto dalla forza"]
    ]},
  { id: 'cost-01', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: 'Definizione di Costituzione',
    fragments:   ['La Costituzione', 'è la legge', 'fondamentale', 'dello Stato', 'che definisce', 'diritti e doveri dei cittadini'],
    distractors: [
      ["Il Parlamento", "Il Codice Civile"],
      ["è la norma", "è il regolamento"],
      ["secondaria", "ordinaria"],
      ["del Comune", "della Regione"],
      ["che elenca", "che modifica"],
      ["poteri dei ministri", "obblighi dei lavoratori"]
    ]},
  { id: 'ec-02', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: 'Definizione di Repubblica',
    fragments:   ['La Repubblica', 'è una forma di governo', 'in cui il capo dello Stato', 'è eletto', 'e non eredita il potere'],
    distractors: [
      ["La monarchia", "La dittatura"],
      ["è un tipo di elezione", "è un sistema economico"],
      ["in cui il presidente", "in cui il primo ministro"],
      ["è nominato a vita", "è scelto dalla nobiltà"],
      ["e governa per nascita", "e detiene il potere assoluto"]
    ]},
  { id: 'ec-03', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: 'Definizione di Parlamento italiano',
    fragments:   ['Il Parlamento italiano', 'è il potere legislativo', 'composto da', 'Camera dei Deputati', 'e Senato della Repubblica'],
    distractors: [
      ["Il Governo italiano", "La Presidenza della Repubblica"],
      ["è il potere esecutivo", "è il potere giudiziario"],
      ["suddiviso in", "dipendente da"],
      ["Consiglio dei Ministri", "Corte Costituzionale"],
      ["e Presidenza del Consiglio", "e Consiglio di Stato"]
    ]},
  { id: 'ec-04', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: 'Definizione di separazione dei poteri',
    fragments:   ['La separazione dei poteri', 'è il principio', 'per cui i poteri', 'legislativo, esecutivo e giudiziario', 'sono affidati a organi distinti'],
    distractors: [
      ["La divisione delle competenze", "Il principio di sussidiarietà"],
      ["è la norma", "è il meccanismo"],
      ["per cui le funzioni", "per cui le leggi"],
      ["centrale e locale", "del governo e del parlamento"],
      ["sono esercitati dallo stesso organo", "sono concentrati nel capo dello Stato"]
    ]},
  { id: 'ec-05', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: "Definizione di stato di diritto",
    fragments:   ['Lo stato di diritto', 'è un sistema politico', 'in cui tutti', 'compresi i governanti', 'sono soggetti alla legge'],
    distractors: [
      ["Lo stato assoluto", "Lo stato federale"],
      ["è un sistema economico", "è un tipo di governo"],
      ["in cui solo i cittadini", "in cui le imprese"],
      ["compresi i magistrati", "compresi i partiti"],
      ["sono al di sopra della legge", "sono esenti dai tributi"]
    ]},
  { id: 'ec-06', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: "Definizione di suffragio universale",
    fragments:   ['Il suffragio universale', 'è il diritto di voto', 'garantito a tutti i cittadini', 'adulti', 'indipendentemente da reddito, sesso o ceto'],
    distractors: [
      ["Il suffragio ristretto", "Il diritto di petizione"],
      ["è il dovere civico", "è la facoltà di eleggere"],
      ["riservato ai soli proprietari", "garantito solo ai rappresentanti"],
      ["maggiorenni e istruiti", "residenti nel comune"],
      ["in base al reddito e al titolo", "secondo la residenza e la professione"]
    ]},
  { id: 'ec-07', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: "Definizione di Unione Europea",
    fragments:   ["L'Unione Europea", "è un'organizzazione", 'politica ed economica', 'formata da Stati membri', 'che condividono istituzioni e valori comuni'],
    distractors: [
      ["Il Consiglio d'Europa", "Le Nazioni Unite"],
      ["è un'alleanza", "è un accordo commerciale"],
      ["militare e diplomatica", "finanziaria e doganale"],
      ["formata da paesi alleati", "fondata da tre grandi potenze"],
      ["che mantengono piena sovranità", "che rinunciano alla propria moneta"]
    ]},
  { id: 'ec-08', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: "Definizione di referendum",
    fragments:   ['Il referendum', 'è un istituto', 'di democrazia diretta', 'con cui i cittadini', 'votano direttamente su una legge o questione'],
    distractors: [
      ["Le elezioni politiche", "La petizione popolare"],
      ["è un meccanismo", "è un procedimento"],
      ["di democrazia rappresentativa", "di partecipazione indiretta"],
      ["con cui i parlamentari", "con cui i partiti"],
      ["approvano un decreto ministeriale", "propongono una riforma costituzionale"]
    ]},
  { id: 'ec-09', subject: 'Educazione Civica', category: 'Diritto e Costituzione', prompt: "Definizione di cittadinanza",
    fragments:   ['La cittadinanza', 'è il legame giuridico', 'tra una persona', 'e uno Stato', 'che comporta diritti e doveri reciproci'],
    distractors: [
      ["La residenza", "La nazionalità culturale"],
      ["è il rapporto economico", "è il vincolo culturale"],
      ["tra uno Stato", "tra un ente locale"],
      ["e un'organizzazione", "e un territorio"],
      ["che attribuisce solo privilegi", "che genera solo obblighi fiscali"]
    ]},

  // ── Fisica ───────────────────────────────────────────────────────────────────
  { id: 'vel-01', subject: 'Fisica',        category: 'Meccanica Classica', prompt: 'Definizione di velocità',
    fragments:   ['La velocità', 'è una grandezza', 'vettoriale', 'che misura', 'lo spazio percorso', "nell'unità di tempo"],
    distractors: [
      ["L'accelerazione", "La forza"],
      ["è una quantità", "è una misura"],
      ["scalare", "tensoriale"],
      ["che calcola", "che produce"],
      ["la forza applicata", "la distanza diretta"],
      ["per unità di massa", "nel sistema di riferimento"]
    ]},
  { id: 'atom-01', subject: 'Fisica',        category: 'Meccanica Classica', prompt: 'Definizione di atomo',
    fragments:   ["L'atomo", 'è la più piccola', 'unità', 'di un elemento chimico', 'che conserva', "le proprietà dell'elemento"],
    distractors: [
      ["La molecola", "Lo ione"],
      ["è la più grande", "è la componente"],
      ["parte", "struttura"],
      ["di un composto organico", "di una molecola complessa"],
      ["che modifica", "che perde"],
      ["le leggi della chimica", "le proprietà del composto"]
    ]},
  { id: 'fis-02', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di accelerazione",
    fragments:   ["L'accelerazione", 'è una grandezza', 'vettoriale', 'che misura', 'la variazione di velocità nel tempo'],
    distractors: [
      ["La forza", "La velocità angolare"],
      ["è una misura", "è una quantità"],
      ["scalare", "tensoriale"],
      ["che calcola", "che produce"],
      ["la variazione di posizione nel tempo", "la variazione di massa nel tempo"]
    ]},
  { id: 'fis-03', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di energia potenziale gravitazionale",
    fragments:   ["L'energia potenziale gravitazionale", "è l'energia", "posseduta da un corpo", "in virtù", "della sua posizione nel campo gravitazionale"],
    distractors: [
      ["L'energia cinetica", "L'energia elastica"],
      ["è il lavoro", "è la forza"],
      ["acquistata da un sistema", "esercitata su un campo"],
      ["in base", "a causa"],
      ["della sua velocità nel campo magnetico", "della sua massa nel campo elettrico"]
    ]},
  { id: 'fis-04', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di pressione",
    fragments:   ['La pressione', 'è una grandezza', 'scalare', 'che misura', 'la forza applicata per unità di superficie'],
    distractors: [
      ["La tensione superficiale", "La densità"],
      ["è una quantità", "è una misura"],
      ["vettoriale", "tensoriale"],
      ["che calcola", "che genera"],
      ["la massa distribuita per unità di volume", "l'energia trasmessa per unità di tempo"]
    ]},
  { id: 'fis-05', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Legge di gravitazione universale",
    fragments:   ['Ogni corpo', 'attrae ogni altro corpo', 'con una forza', 'proporzionale al prodotto delle masse', 'e inversamente proporzionale', 'al quadrato della distanza'],
    distractors: [
      ["Ogni campo", "Ogni particella carica"],
      ["respinge ogni altro corpo", "interagisce con ogni onda"],
      ["con un'energia", "con un'accelerazione"],
      ["proporzionale alla somma delle masse", "proporzionale alla differenza delle cariche"],
      ["e direttamente proporzionale", "e indipendente"],
      ["alla distanza tra i corpi", "dalla composizione delle masse"]
    ]},
  { id: 'fis-06', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di calore",
    fragments:   ['Il calore', "è una forma di energia", "che si trasferisce", "tra due corpi", "a causa di una differenza di temperatura"],
    distractors: [
      ["La temperatura", "L'energia interna"],
      ["è una grandezza scalare", "è una proprietà termodinamica"],
      ["che si accumula", "che si genera"],
      ["all'interno di un corpo", "tra due campi"],
      ["a causa di una differenza di pressione", "in assenza di energia cinetica"]
    ]},
  { id: 'fis-07', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di frequenza",
    fragments:   ['La frequenza', "è il numero", "di oscillazioni complete", "compiute da un'onda", "nell'unità di tempo"],
    distractors: [
      ["Il periodo", "L'ampiezza d'onda"],
      ["è la durata", "è il valore massimo"],
      ["di vibrazioni parziali", "di impulsi elettrici"],
      ["compiute da una particella", "misurate da un sensore"],
      ["nello spazio percorso", "per unità di lunghezza d'onda"]
    ]},
  { id: 'fis-08', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di densità",
    fragments:   ['La densità', 'è il rapporto', 'tra la massa', 'e il volume', 'di un corpo o di una sostanza'],
    distractors: [
      ["La pressione", "Il peso specifico relativo"],
      ["è il prodotto", "è la differenza"],
      ["tra la forza", "tra il peso"],
      ["e la superficie", "e la lunghezza"],
      ["di un sistema o di un campo", "di un fluido o di un gas"]
    ]},
  { id: 'fis-09', subject: 'Fisica',        category: 'Meccanica Classica', prompt: "Definizione di massa",
    fragments:   ['La massa', "è una grandezza", "scalare", "che misura", "la quantità di materia contenuta in un corpo"],
    distractors: [
      ["Il peso", "Il volume"],
      ["è una proprietà", "è una misura"],
      ["vettoriale", "relativa alla posizione"],
      ["che genera", "che calcola"],
      ["la forza peso di un oggetto", "la densità di un materiale"]
    ]},

  // ── Idrostatica ───────────────────────────────────────────────────────────────
  { id: 'idr-01', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di pressione idrostatica',
    fragments:   ['La pressione idrostatica', 'è la pressione', 'esercitata da un fluido', 'in quiete', 'che aumenta con la profondità'],
    distractors: [
      ["La pressione atmosferica", "La pressione osmotica"],
      ["è la temperatura", "è il peso"],
      ["esercitata da un gas", "esercitata da un solido"],
      ["in movimento", "in equilibrio dinamico"],
      ["che diminuisce con la profondità", "che rimane costante con la profondità"]
    ]},
  { id: 'idr-02', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Principio di Pascal',
    fragments:   ['Il principio di Pascal', 'afferma che', 'la pressione applicata', 'a un fluido confinato', 'si trasmette uguale in ogni direzione'],
    distractors: [
      ["Il principio di Archimede", "Il teorema di Bernoulli"],
      ["stabilisce che", "dimostra che"],
      ["la forza applicata", "il volume applicato"],
      ["a un fluido in movimento", "a un gas comprimibile"],
      ["varia proporzionalmente con la distanza", "si annulla alle pareti del contenitore"]
    ]},
  { id: 'idr-03', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Principio di Archimede',
    fragments:   ['Il principio di Archimede', 'afferma che', 'un corpo immerso in un fluido', 'riceve una spinta verso l\'alto', 'uguale al peso del fluido spostato'],
    distractors: [
      ["Il principio di Pascal", "La legge di Stevino"],
      ["stabilisce che", "dimostra che"],
      ["un corpo galleggiante in un gas", "un corpo a contatto con un solido"],
      ["riceve una forza verso il basso", "è in equilibrio con il fluido"],
      ["uguale alla sua massa", "proporzionale alla sua densità"]
    ]},
  { id: 'idr-04', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Legge di Stevino',
    fragments:   ['La legge di Stevino', 'afferma che', 'la pressione in un fluido', 'dipende', 'dalla densità del fluido e dalla profondità'],
    distractors: [
      ["La legge di Boyle", "Il principio di Pascal"],
      ["stabilisce che", "dimostra che"],
      ["la temperatura in un gas", "la forza in un sistema"],
      ["cresce", "varia"],
      ["dalla viscosità e dalla velocità", "dalla superficie e dalla forma del contenitore"]
    ]},
  { id: 'idr-05', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di galleggiamento',
    fragments:   ['Un corpo galleggia', 'quando la forza di Archimede', 'è uguale o maggiore', 'al peso del corpo', 'immerso nel fluido'],
    distractors: [
      ["Un corpo affonda", "Un corpo è in equilibrio"],
      ["quando la pressione idrostatica", "quando la densità del fluido"],
      ["è minore", "è proporzionale"],
      ["alla spinta di Pascal", "al volume del corpo"],
      ["sommerso nell'acqua", "a contatto con le pareti"]
    ]},
  { id: 'idr-06', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di fluido',
    fragments:   ['Un fluido', 'è una sostanza', 'che non ha forma propria', 'e assume', 'la forma del contenitore'],
    distractors: [
      ["Un solido", "Un plasma"],
      ["è un materiale", "è un composto"],
      ["che ha forma rigida", "che occupa un volume fisso"],
      ["e mantiene", "e modifica"],
      ["le proprietà del gas", "la forma delle pareti"]
    ]},
  { id: 'idr-07', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di densità relativa (peso specifico)',
    fragments:   ['La densità relativa', 'è il rapporto', 'tra la densità di una sostanza', 'e la densità dell\'acqua', 'a 4 gradi Celsius'],
    distractors: [
      ["La densità assoluta", "La pressione specifica"],
      ["è il prodotto", "è la differenza"],
      ["tra la massa di una sostanza", "tra il volume di una sostanza"],
      ["e la densità dell\'aria", "e la densità del mercurio"],
      ["a 0 gradi Celsius", "a 100 gradi Celsius"]
    ]},
  { id: 'idr-08', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di vasi comunicanti',
    fragments:   ['I vasi comunicanti', 'sono contenitori collegati tra loro', 'in cui un fluido omogeneo', 'raggiunge', 'lo stesso livello in tutti i rami'],
    distractors: [
      ["I capillari", "I sifoni"],
      ["sono tubi indipendenti", "sono recipienti separati"],
      ["in cui un gas comprimibile", "in cui un fluido in moto"],
      ["supera", "mantiene"],
      ["pressioni diverse in ogni ramo", "temperature uguali in ogni sezione"]
    ]},
  { id: 'idr-09', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di viscosità',
    fragments:   ['La viscosità', 'è la proprietà', 'dei fluidi', 'che misura', 'la resistenza allo scorrimento'],
    distractors: [
      ["La densità", "La comprimibilità"],
      ["è la grandezza", "è la caratteristica"],
      ["dei solidi", "dei gas rarefatti"],
      ["che genera", "che calcola"],
      ["la capacità di espansione", "la forza di coesione molecolare"]
    ]},
  { id: 'idr-10', subject: 'Fisica',        category: 'Idrostatica', prompt: 'Definizione di pressione atmosferica',
    fragments:   ['La pressione atmosferica', 'è la pressione', 'esercitata dall\'atmosfera terrestre', 'su ogni superficie', 'a causa del peso dell\'aria sovrastante'],
    distractors: [
      ["La pressione idrostatica", "La pressione osmotica"],
      ["è la forza", "è il peso"],
      ["esercitata dai venti", "esercitata dall\'acqua marina"],
      ["su ogni volume", "su ogni massa"],
      ["a causa della densità del suolo", "a causa della rotazione terrestre"]
    ]},

  // ── Elettrostatica ────────────────────────────────────────────────────────────
  { id: 'est-01', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Legge di Coulomb',
    fragments:   ['La legge di Coulomb', 'afferma che', 'la forza tra due cariche', 'è proporzionale al prodotto delle cariche', 'e inversamente proporzionale al quadrato della distanza'],
    distractors: [
      ["La legge di Gauss", "La legge di Faraday"],
      ["stabilisce che", "dimostra che"],
      ["la forza tra due masse", "il campo tra due poli"],
      ["è proporzionale alla somma delle cariche", "è proporzionale alla differenza delle cariche"],
      ["e inversamente proporzionale alla distanza", "e direttamente proporzionale al quadrato della distanza"]
    ]},
  { id: 'est-02', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Definizione di campo elettrico',
    fragments:   ['Il campo elettrico', 'in un punto dello spazio', 'è la forza elettrica', 'che agirebbe', 'su una carica unitaria positiva posta in quel punto'],
    distractors: [
      ["Il campo magnetico", "Il campo gravitazionale"],
      ["in un punto del piano", "in un volume chiuso"],
      ["è l\'energia potenziale", "è il potenziale elettrico"],
      ["che si accumulerebbe", "che si disperde"],
      ["su una carica negativa posta in quel punto", "su una massa unitaria posta in quel punto"]
    ]},
  { id: 'est-03', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Definizione di potenziale elettrico',
    fragments:   ['Il potenziale elettrico', 'in un punto', 'è il lavoro', 'compiuto dal campo elettrico', 'per spostare una carica unitaria positiva fino a quel punto'],
    distractors: [
      ["L'energia potenziale elettrica", "La differenza di potenziale"],
      ["in un campo", "su una superficie"],
      ["è la forza", "è il flusso"],
      ["compiuto dalla forza di Coulomb", "esercitato dal campo magnetico"],
      ["per spostare una carica negativa all'infinito", "per accelerare una carica unitaria negativa"]
    ]},
  { id: 'est-04', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Teorema di Gauss per il campo elettrico',
    fragments:   ['Il flusso del campo elettrico', 'attraverso una superficie chiusa', 'è uguale', 'alla carica totale racchiusa', 'divisa per la costante dielettrica del vuoto'],
    distractors: [
      ["Il flusso del campo magnetico", "La circuitazione del campo elettrico"],
      ["attraverso una superficie aperta", "lungo una linea chiusa"],
      ["è proporzionale", "è nullo"],
      ["al potenziale totale racchiuso", "alla corrente totale racchiusa"],
      ["moltiplicata per la costante dielettrica", "divisa per la permeabilità magnetica"]
    ]},
  { id: 'est-05', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Definizione di condensatore',
    fragments:   ['Un condensatore', 'è un dispositivo', 'formato da due conduttori', 'separati da un isolante', 'capace di accumulare carica elettrica'],
    distractors: [
      ["Un resistore", "Una bobina"],
      ["è un componente", "è un circuito"],
      ["formato da due semiconduttori", "formato da due magneti"],
      ["collegati da un conduttore", "immersi in un campo magnetico"],
      ["capace di generare corrente", "capace di dissipare energia"]
    ]},
  { id: 'est-06', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Definizione di capacità elettrica',
    fragments:   ['La capacità elettrica', 'di un condensatore', 'è il rapporto', 'tra la carica accumulata', 'e la differenza di potenziale tra le armature'],
    distractors: [
      ["La resistenza elettrica", "L\'energia elettrica"],
      ["di un resistore", "di un circuito"],
      ["è il prodotto", "è la differenza"],
      ["tra la corrente che scorre", "tra il campo generato"],
      ["e la tensione applicata ai terminali", "e la forza elettromotrice del generatore"]
    ]},
  { id: 'est-07', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Definizione di conduttore in equilibrio elettrostatico',
    fragments:   ['Un conduttore in equilibrio elettrostatico', 'ha il campo elettrico interno nullo', 'le cariche libere', 'si distribuiscono sulla superficie', 'e il potenziale è costante in tutto il volume'],
    distractors: [
      ["Un isolante in equilibrio elettrostatico", "Un semiconduttore in equilibrio"],
      ["ha il campo elettrico esterno nullo", "ha il potenziale esterno nullo"],
      ["le cariche legate", "le cariche positive"],
      ["si concentrano al centro", "si distribuiscono nel volume"],
      ["e il campo è costante in tutto il volume", "e la carica è nulla sulla superficie"]
    ]},
  { id: 'est-08', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Legge di Ohm',
    fragments:   ['La legge di Ohm', 'afferma che', 'la tensione ai capi di un resistore', 'è uguale', 'al prodotto tra resistenza e corrente'],
    distractors: [
      ["La legge di Kirchhoff", "La legge di Faraday"],
      ["stabilisce che", "dimostra che"],
      ["la corrente in un resistore", "il campo in un conduttore"],
      ["è proporzionale", "è minore"],
      ["al rapporto tra tensione e resistenza", "alla somma tra resistenza e corrente"]
    ]},
  { id: 'est-09', subject: 'Fisica',        category: 'Elettrostatica', prompt: "Definizione di energia di un condensatore",
    fragments:   ["L'energia immagazzinata", 'in un condensatore', 'è uguale a metà', 'del prodotto', 'tra capacità e quadrato della tensione'],
    distractors: [
      ["La carica accumulata", "Il potenziale generato"],
      ["in una bobina", "in un resistore"],
      ["è uguale al doppio", "è uguale a un quarto"],
      ["della somma", "del rapporto"],
      ["tra resistenza e corrente al quadrato", "tra tensione e carica totale"]
    ]},
  { id: 'est-10', subject: 'Fisica',        category: 'Elettrostatica', prompt: 'Principio di sovrapposizione degli effetti',
    fragments:   ['Il principio di sovrapposizione', 'afferma che', 'il campo elettrico totale', 'generato da più cariche', 'è la somma vettoriale dei campi individuali'],
    distractors: [
      ["Il principio di induzione", "Il principio di Gauss"],
      ["stabilisce che", "implica che"],
      ["il potenziale totale", "la forza totale"],
      ["generato da una sola carica", "indotto da un campo esterno"],
      ["è il prodotto scalare dei potenziali", "è la differenza vettoriale dei campi"]
    ]},

  // ── Magnetismo ────────────────────────────────────────────────────────────────
  { id: 'mag-01', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Definizione di campo magnetico',
    fragments:   ['Il campo magnetico', 'è una grandezza vettoriale', 'che descrive', "l'effetto di forze magnetiche", 'in ogni punto dello spazio'],
    distractors: [
      ["Il campo elettrico", "Il campo gravitazionale"],
      ["è una grandezza scalare", "è una proprietà locale"],
      ["che misura", "che genera"],
      ["l\'effetto di forze elettriche", "l\'effetto di forze di contatto"],
      ["in ogni volume del sistema", "solo sulla superficie dei magneti"]
    ]},
  { id: 'mag-02', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Forza di Lorentz',
    fragments:   ['La forza di Lorentz', 'è la forza', 'che agisce su una carica in moto', 'in un campo magnetico', 'ed è perpendicolare sia alla velocità sia al campo'],
    distractors: [
      ["La forza di Coulomb", "La forza di Ampère"],
      ["è l\'energia", "è il lavoro"],
      ["che agisce su una carica ferma", "che agisce su una massa in moto"],
      ["in un campo elettrico", "in un campo gravitazionale"],
      ["ed è parallela sia alla velocità sia al campo", "ed è perpendicolare solo alla velocità"]
    ]},
  { id: 'mag-03', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Legge di Biot-Savart',
    fragments:   ['La legge di Biot-Savart', 'descrive', 'il campo magnetico', 'generato da un elemento di corrente', 'in funzione della distanza e della direzione'],
    distractors: [
      ["La legge di Ampère", "La legge di Faraday"],
      ["calcola", "misura"],
      ["il campo elettrico", "il potenziale magnetico"],
      ["generato da una carica statica", "generato da un magnete permanente"],
      ["in funzione della tensione e della resistenza", "in funzione del tempo e della frequenza"]
    ]},
  { id: 'mag-04', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Teorema di Ampère',
    fragments:   ['Il teorema di Ampère', 'afferma che', 'la circuitazione del campo magnetico', 'lungo una linea chiusa', 'è proporzionale alla corrente concatenata'],
    distractors: [
      ["Il teorema di Gauss", "Il teorema di Faraday"],
      ["stabilisce che", "dimostra che"],
      ["il flusso del campo magnetico", "la circuitazione del campo elettrico"],
      ["attraverso una superficie chiusa", "lungo una linea aperta"],
      ["è proporzionale alla carica racchiusa", "è uguale alla variazione di flusso"]
    ]},
  { id: 'mag-05', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Teorema di Gauss per il campo magnetico',
    fragments:   ['Il flusso del campo magnetico', 'attraverso qualsiasi superficie chiusa', 'è sempre uguale a zero', 'perché non esistono', 'monopoli magnetici isolati'],
    distractors: [
      ["Il flusso del campo elettrico", "La circuitazione del campo magnetico"],
      ["attraverso qualsiasi superficie aperta", "lungo qualsiasi linea chiusa"],
      ["è sempre uguale a uno", "è proporzionale alla carica"],
      ["perché esistono sempre", "tranne nel caso in cui esistano"],
      ["cariche elettriche isolate", "dipoli elettrici isolati"]
    ]},
  { id: 'mag-06', subject: 'Fisica',        category: 'Magnetismo', prompt: "Definizione di momento magnetico di una spira",
    fragments:   ['Il momento magnetico', 'di una spira percorsa da corrente', 'è uguale', 'al prodotto tra corrente e area', 'e ha direzione perpendicolare al piano della spira'],
    distractors: [
      ["L'energia magnetica", "Il flusso magnetico"],
      ["di un solenoide percorso da corrente", "di un magnete permanente"],
      ["è proporzionale", "è uguale al rapporto"],
      ["tra tensione e resistenza", "tra corrente e lunghezza"],
      ["e ha direzione parallela al piano della spira", "e ha verso opposto alla corrente"]
    ]},
  { id: 'mag-07', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Definizione di permeabilità magnetica',
    fragments:   ['La permeabilità magnetica', 'è una proprietà del mezzo', 'che misura', 'la capacità di un materiale', 'di magnetizzarsi in presenza di un campo magnetico'],
    distractors: [
      ["La permittività elettrica", "La resistività elettrica"],
      ["è una costante universale", "è una caratteristica del campo"],
      ["che genera", "che calcola"],
      ["la capacità di un conduttore", "la resistenza di un isolante"],
      ["di polarizzarsi in presenza di un campo elettrico", "di condurre corrente in un campo esterno"]
    ]},
  { id: 'mag-08', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Moto di una carica in un campo magnetico uniforme',
    fragments:   ['Una carica in moto', 'in un campo magnetico uniforme', 'descrive', 'un moto circolare uniforme', 'perché la forza di Lorentz è sempre perpendicolare alla velocità'],
    distractors: [
      ["Una massa in moto", "Un fotone in moto"],
      ["in un campo gravitazionale uniforme", "in un campo elettrico uniforme"],
      ["percorre", "subisce"],
      ["un moto parabolico uniformemente accelerato", "un moto rettilineo uniforme"],
      ["perché la forza peso è sempre parallela alla velocità", "perché la forza elettrica compie lavoro nullo"]
    ]},
  { id: 'mag-09', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Definizione di flusso del campo magnetico',
    fragments:   ['Il flusso del campo magnetico', 'attraverso una superficie', 'è uguale', 'al prodotto del campo per l\'area', 'per il coseno dell\'angolo tra il campo e la normale'],
    distractors: [
      ["La circuitazione del campo magnetico", "L'energia del campo magnetico"],
      ["lungo una linea chiusa", "all'interno di un volume"],
      ["è proporzionale", "è nullo"],
      ["al rapporto tra campo e area", "alla somma del campo e della corrente"],
      ["per il seno dell\'angolo tra il campo e la superficie", "per il quadrato dell\'angolo tra il campo e la normale"]
    ]},
  { id: 'mag-10', subject: 'Fisica',        category: 'Magnetismo', prompt: 'Definizione di induttanza',
    fragments:   ["L'induttanza", 'è una proprietà dei circuiti', 'che misura', "la capacità di un conduttore", 'di opporsi alle variazioni di corrente generando una forza elettromotrice'],
    distractors: [
      ["La capacità", "La resistenza"],
      ["è una proprietà dei materiali", "è una caratteristica dei semiconduttori"],
      ["che genera", "che calcola"],
      ["la capacità di un isolante", "la tendenza di un campo"],
      ["di favorire le variazioni di tensione amplificando il segnale", "di attirare le cariche positive verso il polo negativo"]
    ]},

  // ── Elettromagnetismo ─────────────────────────────────────────────────────────
  { id: 'em-01', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Legge di Faraday-Neumann-Lenz',
    fragments:   ['La legge di Faraday', 'afferma che', 'la forza elettromotrice indotta', 'è uguale', 'alla variazione del flusso magnetico nel tempo cambiata di segno'],
    distractors: [
      ["La legge di Ampère", "La legge di Gauss"],
      ["stabilisce che", "dimostra che"],
      ["la corrente indotta", "il campo elettrico indotto"],
      ["è proporzionale", "è opposta"],
      ["al flusso magnetico totale nel tempo", "alla variazione di corrente nel conduttore"]
    ]},
  { id: 'em-02', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Legge di Lenz',
    fragments:   ['La legge di Lenz', 'afferma che', 'la corrente indotta', 'ha verso tale da', 'opporsi alla variazione di flusso che la genera'],
    distractors: [
      ["La legge di Faraday", "La legge di Ohm"],
      ["stabilisce che", "dimostra che"],
      ["la forza elettromotrice indotta", "il campo magnetico indotto"],
      ["ha intensità tale da", "ha direzione tale da"],
      ["favorire la variazione di flusso che la genera", "mantenere costante il campo magnetico esterno"]
    ]},
  { id: 'em-03', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Equazioni di Maxwell: legge di Gauss elettrica',
    fragments:   ['La prima equazione di Maxwell', 'afferma che', 'il flusso del campo elettrico', 'attraverso una superficie chiusa', 'è proporzionale alla carica elettrica racchiusa'],
    distractors: [
      ["La seconda equazione di Maxwell", "La legge di Faraday"],
      ["stabilisce che", "implica che"],
      ["il flusso del campo magnetico", "la circuitazione del campo elettrico"],
      ["attraverso una superficie aperta", "lungo una linea chiusa"],
      ["è proporzionale alla corrente di spostamento", "è uguale alla variazione di flusso magnetico"]
    ]},
  { id: 'em-04', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Equazioni di Maxwell: assenza di monopoli magnetici',
    fragments:   ['La seconda equazione di Maxwell', 'afferma che', 'il flusso del campo magnetico', 'attraverso qualsiasi superficie chiusa', 'è uguale a zero'],
    distractors: [
      ["La prima equazione di Maxwell", "La legge di Ampère"],
      ["stabilisce che", "implica che"],
      ["il flusso del campo elettrico", "la circuitazione del campo magnetico"],
      ["attraverso qualsiasi superficie aperta", "lungo qualsiasi linea chiusa"],
      ["è proporzionale alla carica racchiusa", "è uguale alla corrente concatenata"]
    ]},
  { id: 'em-05', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Equazioni di Maxwell: legge di Faraday',
    fragments:   ['La terza equazione di Maxwell', 'afferma che', 'la circuitazione del campo elettrico', 'è uguale', 'alla variazione del flusso magnetico nel tempo cambiata di segno'],
    distractors: [
      ["La quarta equazione di Maxwell", "La legge di Gauss"],
      ["stabilisce che", "dimostra che"],
      ["la circuitazione del campo magnetico", "il flusso del campo elettrico"],
      ["è proporzionale", "è nulla"],
      ["alla variazione della carica nel tempo", "al flusso magnetico totale"]
    ]},
  { id: 'em-06', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Equazioni di Maxwell: legge di Ampère-Maxwell',
    fragments:   ['La quarta equazione di Maxwell', 'afferma che', 'la circuitazione del campo magnetico', 'dipende', 'dalla corrente di conduzione e dalla corrente di spostamento'],
    distractors: [
      ["La terza equazione di Maxwell", "La legge di Biot-Savart"],
      ["stabilisce che", "implica che"],
      ["la circuitazione del campo elettrico", "il flusso del campo magnetico"],
      ["è generata", "è proporzionale"],
      ["dalla sola corrente di conduzione", "dalla variazione del flusso elettrico nel tempo"]
    ]},
  { id: 'em-07', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Definizione di onda elettromagnetica',
    fragments:   ["Un'onda elettromagnetica", 'è una perturbazione', 'di campo elettrico e magnetico', 'che si propagano perpendicolarmente tra loro', 'e alla direzione di propagazione'],
    distractors: [
      ["Un'onda meccanica", "Un'onda sonora"],
      ["è un trasferimento di massa", "è una vibrazione"],
      ["di pressione e densità", "di temperatura e pressione"],
      ["che si propagano parallelamente tra loro", "che oscillano nella direzione di propagazione"],
      ["e nella direzione del campo gravitazionale", "e perpendicolarmente alla sorgente"]
    ]},
  { id: 'em-08', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Velocità della luce nel vuoto',
    fragments:   ['La velocità della luce nel vuoto', 'è una costante universale', 'uguale a circa 3×10⁸ m/s', 'ed è determinata', 'dalla permeabilità e dalla permittività del vuoto'],
    distractors: [
      ["La velocità del suono nell'aria", "La velocità delle onde radio"],
      ["è una grandezza variabile", "è una proprietà del mezzo"],
      ["uguale a circa 340 m/s", "uguale a circa 3×10⁶ m/s"],
      ["ed è influenzata", "ed è indipendente"],
      ["dalla temperatura e dalla pressione del mezzo", "dalla frequenza e dall'ampiezza dell'onda"]
    ]},
  { id: 'em-09', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Definizione di induzione elettromagnetica',
    fragments:   ["L'induzione elettromagnetica", 'è il fenomeno', 'per cui una variazione', 'del flusso magnetico', 'genera una forza elettromotrice in un circuito'],
    distractors: [
      ["L'autoinduzione", "La mutua induzione"],
      ["è l\'effetto", "è la proprietà"],
      ["per cui una costanza", "per cui un aumento"],
      ["del campo elettrico", "della corrente di conduzione"],
      ["genera un campo magnetico in un conduttore", "genera una differenza di potenziale statica"]
    ]},
  { id: 'em-10', subject: 'Fisica',        category: 'Elettromagnetismo', prompt: 'Definizione di spettro elettromagnetico',
    fragments:   ['Lo spettro elettromagnetico', 'è l\'insieme ordinato', 'di tutte le onde elettromagnetiche', 'classificate per frequenza', 'dalle onde radio ai raggi gamma'],
    distractors: [
      ["Lo spettro di emissione", "Lo spettro di assorbimento"],
      ["è la sequenza discreta", "è la distribuzione continua"],
      ["di tutte le onde meccaniche", "di tutte le radiazioni ionizzanti"],
      ["classificate per ampiezza", "classificate per velocità"],
      ["dagli infrarossi ai raggi X", "dalle microonde alla luce visibile"]
    ]},

  // ── Relatività Ristretta ──────────────────────────────────────────────────────
  { id: 'rel-01', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Primo postulato della relatività ristretta',
    fragments:   ['Il primo postulato', 'afferma che', 'le leggi della fisica', 'sono le stesse', 'in tutti i sistemi di riferimento inerziali'],
    distractors: [
      ["Il secondo postulato", "Il principio di equivalenza"],
      ["stabilisce che", "implica che"],
      ["le leggi della termodinamica", "le equazioni del moto"],
      ["variano", "si semplificano"],
      ["in tutti i sistemi di riferimento accelerati", "solo nei sistemi di riferimento in quiete"]
    ]},
  { id: 'rel-02', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Secondo postulato della relatività ristretta',
    fragments:   ['Il secondo postulato', 'afferma che', 'la velocità della luce nel vuoto', 'è la stessa', 'per tutti gli osservatori inerziali indipendentemente dalla sorgente'],
    distractors: [
      ["Il primo postulato", "Il principio di relatività galileiana"],
      ["stabilisce che", "implica che"],
      ["la velocità del suono nel vuoto", "la frequenza della luce nel vuoto"],
      ["varia", "dipende"],
      ["per ogni osservatore in base alla propria velocità", "solo per gli osservatori in moto relativo"]
    ]},
  { id: 'rel-03', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di dilatazione del tempo',
    fragments:   ['La dilatazione del tempo', 'è il fenomeno', 'per cui un orologio in moto', 'scorre più lentamente', 'rispetto a uno in quiete'],
    distractors: [
      ["La contrazione delle lunghezze", "La simultaneità relativa"],
      ["è l\'effetto", "è la conseguenza"],
      ["per cui un orologio in quiete", "per cui un metro in moto"],
      ["scorre più velocemente", "si dilata"],
      ["rispetto a uno in moto", "rispetto a un metro in quiete"]
    ]},
  { id: 'rel-04', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di contrazione delle lunghezze',
    fragments:   ['La contrazione delle lunghezze', 'è il fenomeno', 'per cui un oggetto in moto', 'appare più corto', 'nella direzione del moto rispetto alla misura a riposo'],
    distractors: [
      ["La dilatazione del tempo", "La massa relativistica"],
      ["è l\'effetto", "è la proprietà"],
      ["per cui un oggetto in quiete", "per cui un campo in moto"],
      ["appare più lungo", "si dilata"],
      ["nella direzione perpendicolare al moto", "rispetto alla misura in moto"]
    ]},
  { id: 'rel-05', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Equivalenza massa-energia',
    fragments:   ["L'equivalenza massa-energia", 'espressa da E = mc²', 'afferma che', 'la massa è una forma di energia', 'e le due quantità sono legate dalla velocità della luce al quadrato'],
    distractors: [
      ["L'equivalenza forza-energia", "Il principio di conservazione dell'energia"],
      ["espressa da E = mv²", "espressa da F = ma"],
      ["stabilisce che", "implica che"],
      ["l\'energia è una forma di forza", "la massa è proporzionale alla velocità"],
      ["e le due quantità sono legate dalla costante di Planck", "e le due quantità differiscono per una costante adimensionale"]
    ]},
  { id: 'rel-06', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di fattore di Lorentz (γ)',
    fragments:   ['Il fattore di Lorentz γ', 'è uguale', 'a 1 diviso la radice', 'di (1 − v²/c²)', 'e compare nelle trasformazioni relativistiche'],
    distractors: [
      ["Il fattore di Planck", "Il fattore di Doppler"],
      ["è proporzionale", "è uguale al quadrato"],
      ["a c diviso la radice", "a v diviso la costante"],
      ["di (1 + v²/c²)", "di (v² − c²)"],
      ["e compare nelle equazioni di Maxwell", "e compare nel principio di equivalenza"]
    ]},
  { id: 'rel-07', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di simultaneità relativa',
    fragments:   ['Due eventi simultanei', 'per un osservatore', 'non sono necessariamente simultanei', 'per un altro osservatore', 'in moto relativo rispetto al primo'],
    distractors: [
      ["Due eventi consecutivi", "Due eventi identici"],
      ["per un sistema inerziale", "per una sorgente luminosa"],
      ["sono sempre simultanei", "sono necessariamente consecutivi"],
      ["per qualsiasi altro osservatore", "per un osservatore accelerato"],
      ["in quiete rispetto al primo", "nello stesso sistema di riferimento"]
    ]},
  { id: 'rel-08', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di quadrivettore spazio-tempo',
    fragments:   ['Il quadrivettore spazio-tempo', 'è un vettore a quattro componenti', 'che unifica', 'le tre coordinate spaziali', 'e la coordinata temporale in un unico ente matematico'],
    distractors: [
      ["Il vettore di stato", "Il tensore di curvatura"],
      ["è un vettore a tre componenti", "è una matrice a quattro dimensioni"],
      ["che separa", "che trasforma"],
      ["le due coordinate spaziali", "le quattro coordinate energetiche"],
      ["e la coordinata di velocità in un campo scalare", "e la massa in una grandezza relativistica"]
    ]},
  { id: 'rel-09', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di energia totale relativistica',
    fragments:   ["L'energia totale relativistica", 'di una particella', 'è uguale a γmc²', 'dove γ è il fattore di Lorentz', 'e tende a mc² quando la velocità è nulla'],
    distractors: [
      ["L'energia cinetica relativistica", "L'energia potenziale relativistica"],
      ["di un campo", "di un sistema chiuso"],
      ["è uguale a ½mv²", "è uguale a pc"],
      ["dove p è la quantità di moto", "dove c è la costante di Planck"],
      ["e tende a zero quando la velocità è massima", "e tende a infinito quando la velocità è nulla"]
    ]},
  { id: 'rel-10', subject: 'Fisica',        category: 'Relatività Ristretta', prompt: 'Definizione di intervallo spazio-temporale',
    fragments:   ["L'intervallo spazio-temporale", 'tra due eventi', 'è una quantità invariante', 'uguale per tutti gli osservatori inerziali', 'ed è definito come c²Δt² − Δx²'],
    distractors: [
      ["La distanza spaziale", "Il tempo proprio"],
      ["tra due punti", "tra due sistemi di riferimento"],
      ["è una quantità relativa", "è una misura soggettiva"],
      ["che dipende dal sistema di riferimento", "uguale solo per osservatori in quiete"],
      ["ed è definito come Δx² + Δy² + Δz²", "ed è definito come c²Δt² + Δx²"]
    ]},

  // ── Dinamica ─────────────────────────────────────────────────────────────────
  { id: 'din-01', subject: 'Fisica',        category: 'Dinamica', prompt: "Prima legge di Newton (principio d'inerzia)",
    fragments:   ['Un corpo in quiete', 'o in moto rettilineo uniforme', 'rimane in tale stato', 'finché la forza netta', 'su di esso è nulla'],
    distractors: [
      ["Un sistema chiuso", "Un punto materiale"],
      ["o in moto circolare uniforme", "o in moto uniformemente accelerato"],
      ["modifica il proprio stato", "cambia velocità"],
      ["finché l'accelerazione", "finché l'impulso"],
      ["su di esso aumenta", "su di esso è costante"]
    ]},
  { id: 'din-02', subject: 'Fisica',        category: 'Dinamica', prompt: 'Seconda legge di Newton',
    fragments:   ['La forza risultante', 'agente su un corpo', 'è uguale al prodotto', 'della sua massa', "per l'accelerazione"],
    distractors: [
      ["La forza d'attrito", "La forza centripeta"],
      ["applicata a un sistema", "esercitata da un campo"],
      ["è uguale al rapporto", "è proporzionale alla somma"],
      ["del suo volume", "della sua densità"],
      ["per la velocità", "per lo spostamento"]
    ]},
  { id: 'din-03', subject: 'Fisica',        category: 'Dinamica', prompt: 'Terza legge di Newton (azione e reazione)',
    fragments:   ['Per ogni forza', 'esercitata da A su B', 'esiste una forza', 'uguale e contraria', 'esercitata da B su A'],
    distractors: [
      ["Per ogni impulso", "Per ogni pressione"],
      ["trasmessa da A a B", "applicata su un corpo"],
      ["esiste un momento", "esiste una coppia"],
      ["doppia e parallela", "uguale e parallela"],
      ["trasmessa da B su A", "esercitata da A su C"]
    ]},
  { id: 'din-04', subject: 'Fisica',        category: 'Dinamica', prompt: 'Definizione di forza peso',
    fragments:   ['La forza peso', 'è la forza gravitazionale', 'con cui la Terra', 'attrae un corpo', 'verso il suo centro'],
    distractors: [
      ["La forza elastica", "La forza normale"],
      ["è la forza magnetica", "è la forza centripeta"],
      ["con cui la Luna", "con cui il Sole"],
      ["respinge un corpo", "deflette un corpo"],
      ["verso la sua orbita", "verso la sua superficie"]
    ]},
  { id: 'din-05', subject: 'Fisica',        category: 'Dinamica', prompt: "Definizione di forza d'attrito",
    fragments:   ["La forza d'attrito", 'si oppone', 'al moto relativo', 'tra due superfici', 'a contatto'],
    distractors: [
      ["La forza elastica", "La forza viscosa"],
      ["è perpendicolare", "favorisce"],
      ["al moto assoluto", "alla velocità angolare"],
      ["tra due fluidi", "tra due campi"],
      ["in equilibrio", "in movimento relativo"]
    ]},
  { id: 'din-06', subject: 'Fisica',        category: 'Dinamica', prompt: 'Definizione di quantità di moto',
    fragments:   ['La quantità di moto', 'di un corpo', 'è il prodotto', 'della sua massa', 'per la sua velocità'],
    distractors: [
      ["L'energia cinetica", "Il momento angolare"],
      ["di un sistema", "di un punto materiale"],
      ["è il rapporto", "è la somma"],
      ["del suo peso", "del suo volume"],
      ["per la sua accelerazione", "per il suo spostamento"]
    ]},
  { id: 'din-07', subject: 'Fisica',        category: 'Dinamica', prompt: 'Definizione di lavoro meccanico',
    fragments:   ['Il lavoro di una forza', 'è uguale al prodotto', 'del modulo della forza', 'per lo spostamento', 'per il coseno', "dell'angolo tra essi"],
    distractors: [
      ["La potenza di una forza", "L'energia di un sistema"],
      ["è uguale al rapporto", "è uguale alla somma"],
      ["del modulo dell'impulso", "della componente della forza"],
      ["per la velocità", "per il tempo"],
      ["per il seno", "per la tangente"],
      ["dell'angolo d'incidenza", "dell'angolo di rifrazione"]
    ]},
  { id: 'din-08', subject: 'Fisica',        category: 'Dinamica', prompt: 'Definizione di energia cinetica',
    fragments:   ["L'energia cinetica", 'di un corpo in moto', 'è uguale a metà', 'della sua massa', 'per il quadrato', 'della sua velocità'],
    distractors: [
      ["L'energia potenziale", "L'energia meccanica"],
      ["di un sistema chiuso", "di un punto materiale"],
      ["è uguale al doppio", "è uguale a un terzo"],
      ["della sua densità", "del suo peso"],
      ["per il cubo", "per la radice quadrata"],
      ["della sua accelerazione", "del suo spostamento"]
    ]},
  { id: 'din-09', subject: 'Fisica',        category: 'Dinamica', prompt: 'Teorema lavoro-energia',
    fragments:   ['Il lavoro totale', 'compiuto su un corpo', 'è uguale', 'alla variazione', 'della sua energia cinetica'],
    distractors: [
      ["L'impulso totale", "La potenza totale"],
      ["subito da un sistema", "applicato a un fluido"],
      ["è proporzionale", "è il doppio"],
      ["alla conservazione", "all'accumulo"],
      ["della sua energia potenziale", "della sua quantità di moto"]
    ]},
  { id: 'din-10', subject: 'Fisica',        category: 'Dinamica', prompt: 'Conservazione della quantità di moto',
    fragments:   ['In assenza di forze esterne', 'la quantità di moto totale', 'di un sistema', 'rimane costante', 'nel tempo'],
    distractors: [
      ["In presenza di forze interne", "In mancanza di energia"],
      ["l'energia cinetica totale", "il momento angolare totale"],
      ["di un corpo rigido", "di un fluido ideale"],
      ["aumenta proporzionalmente", "si conserva parzialmente"],
      ["nello spazio", "durante l'urto"]
    ]},

  // ── Analisi Matematica ────────────────────────────────────────────────────────
  { id: 'ana-01', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Definizione di limite di una funzione',
    fragments:   ['Il limite di f(x)', 'per x che tende a x₀', 'è il valore L', 'a cui f(x) si avvicina', 'in modo arbitrariamente preciso'],
    distractors: [
      ["L'integrale di f(x)", "La derivata di f(x)"],
      ["per x che tende a +∞", "per x che cresce senza limite"],
      ["è il valore M", "è il massimo L"],
      ["da cui f(x) si allontana", "in cui f(x) si annulla"],
      ["in modo uniformemente distribuito", "in un solo punto del dominio"]
    ]},
  { id: 'ana-02', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Definizione di funzione continua in un punto',
    fragments:   ['Una funzione f', 'è continua in x₀', 'se il limite di f(x)', 'per x→x₀', 'coincide con f(x₀)'],
    distractors: [
      ["Una funzione g", "Una sequenza aₙ"],
      ["è derivabile in x₀", "è integrabile in x₀"],
      ["se la derivata di f(x)", "se il valore di f(x)"],
      ["per x→+∞", "per x→0"],
      ["coincide con f(a)", "tende a zero"]
    ]},
  { id: 'ana-03', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Definizione di derivata',
    fragments:   ['La derivata di f in x₀', 'è il limite', 'del rapporto incrementale', '[f(x₀+h) − f(x₀)] / h', 'per h che tende a 0'],
    distractors: [
      ["L'integrale di f in x₀", "La primitiva di f in x₀"],
      ["è la somma", "è il valore massimo"],
      ["del prodotto incrementale", "dell'area incrementale"],
      ["[f(x₀+h) + f(x₀)] · h", "[f(x₀·h) − f(x₀)] / h"],
      ["per h che tende a +∞", "per h che tende a x₀"]
    ]},
  { id: 'ana-04', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Significato geometrico della derivata',
    fragments:   ['La derivata di f in x₀', 'rappresenta', 'il coefficiente angolare', 'della retta tangente', 'al grafico di f in x₀'],
    distractors: [
      ["L'integrale di f in x₀", "La primitiva di f in x₀"],
      ["misura", "indica"],
      ["l'area sottesa", "il coefficiente direttore"],
      ["della retta secante", "dell'asse tangente"],
      ["al grafico di f in a", "alla curva in un punto generico"]
    ]},
  { id: 'ana-05', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Definizione di primitiva',
    fragments:   ['F è primitiva di f', 'in un intervallo I', 'se F è derivabile in I', "e F'(x) = f(x)", 'per ogni x in I'],
    distractors: [
      ["F è inversa di f", "G è integrale di g"],
      ["in un dominio D", "in un punto x₀"],
      ["se F è continua in I", "se F è integrabile in I"],
      ["e F(x) = f(x)", "e F''(x) = f(x)"],
      ["per alcuni x in I", "solo per x = x₀"]
    ]},
  { id: 'ana-06', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Definizione di integrale definito',
    fragments:   ["L'integrale definito di f", 'tra a e b', 'è la misura algebrica', "dell'area compresa", "tra il grafico di f", "e l'asse x in [a, b]"],
    distractors: [
      ["La derivata definita di f", "Il limite definito di f"],
      ["tra a e c", "su tutto il dominio"],
      ["è la misura geometrica", "è il valore numerico"],
      ["del volume compreso", "del perimetro compreso"],
      ["tra la tangente a f", "tra la primitiva di f"],
      ["e l'asse y in [a, b]", "e l'asse x in (a, b)"]
    ]},
  { id: 'ana-07', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Teorema fondamentale del calcolo integrale',
    fragments:   ['Se F è una primitiva di f', 'in [a, b]', "l'integrale da a a b di f(x)dx", 'è uguale a F(b) − F(a)'],
    distractors: [
      ["Se G è una derivata di f", "Se F è un limite di f"],
      ["in (a, b)", "su tutto ℝ"],
      ["il limite da a a b di f(x)", "la derivata da a a b di f(x)"],
      ["è uguale a F(a) − F(b)", "è uguale a F(b) + F(a)"]
    ]},
  { id: 'ana-08', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Teorema di Weierstrass',
    fragments:   ['Ogni funzione continua', 'su un intervallo chiuso e limitato', '[a, b]', 'assume un massimo assoluto', 'e un minimo assoluto'],
    distractors: [
      ["Ogni funzione derivabile", "Ogni funzione monotona"],
      ["su un intervallo aperto e illimitato", "su un insieme discreto"],
      ["(a, b)", "(a, +∞)"],
      ["possiede un massimo locale", "ammette un massimo relativo"],
      ["ma non un minimo assoluto", "e un minimo relativo"]
    ]},
  { id: 'ana-09', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Teorema degli zeri di Bolzano',
    fragments:   ['Se f è continua in [a, b]', 'e f(a) e f(b) hanno segno opposto', 'esiste almeno un c in (a, b)', 'tale che f(c) = 0'],
    distractors: [
      ["Se f è derivabile in (a, b)", "Se f è monotona in [a, b]"],
      ["e f(a) e f(b) hanno uguale segno", "e f(a) = f(b) = 0"],
      ["esiste un unico c in [a, b]", "esistono infiniti c in (a, b)"],
      ["tale che f(c) = 1", "tale che f'(c) = 0"]
    ]},
  { id: 'ana-10', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Teorema di Rolle',
    fragments:   ['Se f è continua in [a, b]', 'derivabile in (a, b)', 'e f(a) = f(b)', 'esiste almeno un c in (a, b)', "tale che f'(c) = 0"],
    distractors: [
      ["Se f è continua in (a, b)", "Se f è integrabile in [a, b]"],
      ["integrabile in [a, b]", "derivabile in [a, b]"],
      ["e f(a) ≠ f(b)", "e f(a) = 0"],
      ["esiste un unico c in (a, b)", "esiste almeno un c in [a, b]"],
      ["tale che f(c) = 0", "tale che f'(c) = 1"]
    ]},
  { id: 'ana-11', subject: 'Matematica',    category: 'Analisi Matematica', prompt: 'Teorema di Lagrange (valor medio)',
    fragments:   ['Se f è continua in [a, b]', 'e derivabile in (a, b)', 'esiste c in (a, b)', "tale che f'(c)", 'è uguale a [f(b) − f(a)] / (b − a)'],
    distractors: [
      ["Se f è integrabile in [a, b]", "Se f è monotona in [a, b]"],
      ["e continua in (a, b)", "e derivabile in [a, b]"],
      ["esiste c in [a, b]", "esiste un unico c in (a, b)"],
      ["tale che f(c)", "tale che f''(c)"],
      ["è uguale a [f(b) + f(a)] / (b − a)", "è uguale a [f(b) − f(a)] · (b − a)"]
    ]},
  { id: 'ana-12', subject: 'Matematica',    category: 'Analisi Matematica', prompt: "Teorema di de l'Hôpital",
    fragments:   ['Se f(x)/g(x) è una forma indeterminata', 'del tipo 0/0 o ∞/∞', 'per x→x₀', 'e il limite di f′(x)/g′(x) esiste', 'allora coincide con il limite di f(x)/g(x)'],
    distractors: [
      ["Se f(x)·g(x) è una forma determinata", "Se f(x)/g(x) è una forma determinata"],
      ["del tipo 1·∞ o 0·0", "del tipo ∞−∞ o 0·∞"],
      ["per x→+∞", "per x→0⁺"],
      ["e il limite di f′(x)·g′(x) esiste", "e la derivata di f(x)/g(x) esiste"],
      ["allora è il doppio del limite di f(x)/g(x)", "allora è opposto al limite di f(x)/g(x)"]
    ]},

  // ── Integrali ─────────────────────────────────────────────────────────────────
  { id: 'ana-13', subject: 'Matematica', category: 'Analisi Matematica', prompt: 'Definizione di integrale indefinito',
    fragments:   ["L'integrale indefinito di f", "è l'insieme", "di tutte le primitive di f", "e si indica con", "∫f(x)dx = F(x) + C", "dove C è una costante arbitraria"],
    distractors: [
      ["La derivata indefinita di f", "Il limite indefinito di f"],
      ["è la derivata", "è il grafico"],
      ["di tutte le derivate di f", "di tutti i limiti di f"],
      ["e si ottiene derivando", "e si annulla per"],
      ["∫f(x)dx = f(x) + C", "∫f(x)dx = F′(x) + C"],
      ["dove C è una costante nulla", "dove C è il termine noto"]
    ]},
  { id: 'ana-15', subject: 'Matematica', category: 'Analisi Matematica', prompt: 'Definizione di integrale improprio su intervallo illimitato',
    fragments:   ["L'integrale improprio di f su [a, +∞)", "è il limite", "per t→+∞", "dell'integrale definito di f su [a, t]", "e si dice convergente", "se tale limite esiste ed è finito"],
    distractors: [
      ["La derivata impropria di f su [a, +∞)", "Il limite improprio di f su [a, +∞)"],
      ["è la derivata", "è il massimo"],
      ["per t→a⁺", "per t→0⁺"],
      ["della primitiva di f su [a, t]", "del coefficiente angolare di f su [a, t]"],
      ["e si dice divergente", "e si dice determinato"],
      ["se tale limite è infinito", "se tale limite è nullo"]
    ]},
  { id: 'ana-16', subject: 'Matematica', category: 'Analisi Matematica', prompt: 'Definizione di integrale improprio su funzione illimitata',
    fragments:   ["L'integrale improprio di f su [a, b]", "quando f è illimitata in b", "è il limite", "per t→b⁻", "dell'integrale definito di f su [a, t]", "se tale limite esiste ed è finito"],
    distractors: [
      ["La primitiva impropria di f su [a, b]", "Il coefficiente angolare di f su [a, b]"],
      ["quando f è continua in a", "quando f è derivabile in b"],
      ["è la derivata", "è la somma"],
      ["per t→a⁺", "per t→b⁺"],
      ["dell'integrale definito di f su [t, b]", "della derivata di f su [a, t]"],
      ["se tale limite è infinito", "se tale limite non esiste"]
    ]},

  // ── Cultura Generale ──────────────────────────────────────────────────────────
  { id: 'cg-01', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è la fotosfera del Sole?',
    fragments:   ['La fotosfera', 'è lo strato visibile', 'della superficie solare', 'da cui viene emessa', 'la luce che vediamo'],
    distractors: [
      ["La cromosfera", "La corona solare"],
      ["è lo strato interno", "è il nucleo centrale"],
      ["dell'atmosfera terrestre", "della luna"],
      ["da cui viene assorbita", "in cui si produce"],
      ["il calore geotermico", "la radiazione ultravioletta"]
    ]},
  { id: 'cg-02', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Definizione di osmosi',
    fragments:   ["L'osmosi", 'è il passaggio', 'di un solvente', 'attraverso una membrana semipermeabile', 'da una soluzione meno concentrata', 'a una più concentrata'],
    distractors: [
      ["La diffusione", "La dialisi"],
      ["è il blocco", "è la separazione"],
      ["di un soluto", "di un gas"],
      ["attraverso una membrana rigida", "attraverso una parete porosa"],
      ["da una soluzione più concentrata", "da una soluzione neutra"],
      ["a una meno concentrata", "a una soluzione satura"]
    ]},
  { id: 'cg-03', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Chi era Socrate?',
    fragments:   ['Socrate', 'era un filosofo', 'dell\'Atene antica', 'che non scrisse nulla', 'e insegnava attraverso il dialogo'],
    distractors: [
      ["Platone", "Aristotele"],
      ["era uno storico", "era un matematico"],
      ["della Roma imperiale", "della Grecia ellenistica"],
      ["che scrisse molti libri", "che fondò una scuola"],
      ["e insegnava attraverso i testi", "e governava la città"]
    ]},
  { id: 'cg-04', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è il PIL (Prodotto Interno Lordo)?',
    fragments:   ['Il PIL', 'è il valore totale', 'di beni e servizi', 'prodotti in un paese', 'in un determinato periodo'],
    distractors: [
      ["Il PNL", "L'inflazione"],
      ["è la somma parziale", "è la media ponderata"],
      ["di tasse e imposte", "di importazioni ed esportazioni"],
      ["distribuiti in un paese", "consumati in un paese"],
      ["in un singolo settore", "al netto delle spese pubbliche"]
    ]},
  { id: 'cg-05', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è la mitosi?',
    fragments:   ['La mitosi', 'è il processo', 'di divisione cellulare', 'che produce', 'due cellule figlie identiche'],
    distractors: [
      ["La meiosi", "La fissione"],
      ["è il meccanismo", "è la reazione"],
      ["di riproduzione sessuata", "di fusione nucleare"],
      ["che riduce", "che duplica"],
      ["quattro cellule aploidi", "una cellula madre specializzata"]
    ]},
  { id: 'cg-06', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è la Magna Carta?',
    fragments:   ['La Magna Carta', 'è un documento', 'firmato nel 1215', 'dal re Giovanni d\'Inghilterra', 'che limitava il potere reale'],
    distractors: [
      ["La Dichiarazione d'Indipendenza", "La Costituzione americana"],
      ["è un trattato", "è una legge"],
      ["firmato nel 1789", "firmato nel 1776"],
      ["dall'imperatore romano", "dal re di Francia"],
      ["che ampliava il potere reale", "che aboliva la monarchia"]
    ]},
  { id: 'cg-07', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cosa studia l\'astronomia?',
    fragments:   ["L'astronomia", 'studia', 'i corpi celesti', 'e i fenomeni', "che avvengono nell'universo"],
    distractors: [
      ["L'astrologia", "La cosmologia"],
      ["misura", "cataloga"],
      ["i fenomeni atmosferici", "le forze magnetiche"],
      ["e le leggi", "e le onde"],
      ["che avvengono sulla Terra", "che avvengono nell'atmosfera"]
    ]},
  { id: 'cg-08', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è la Rivoluzione Industriale?',
    fragments:   ['La Rivoluzione Industriale', 'fu un periodo di trasformazione', 'che iniziò in Inghilterra', 'nel XVIII secolo', 'con la meccanizzazione della produzione'],
    distractors: [
      ["La Rivoluzione Francese", "La Rivoluzione Americana"],
      ["fu un conflitto armato", "fu un movimento artistico"],
      ["che iniziò in Francia", "che iniziò in Germania"],
      ["nel XIV secolo", "nel XX secolo"],
      ["con la nazionalizzazione delle fabbriche", "con la distribuzione delle terre"]
    ]},
  { id: 'cg-09', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cos\'è la simbiosi in biologia?',
    fragments:   ['La simbiosi', 'è una relazione', 'tra due organismi', 'di specie diverse', 'che vivono in stretto contatto'],
    distractors: [
      ["Il parassitismo", "La predazione"],
      ["è una competizione", "è un isolamento"],
      ["tra più popolazioni", "tra cellule dello stesso organismo"],
      ["della stessa specie", "di specie affini"],
      ["che si evitano a vicenda", "che si riproducono insieme"]
    ]},
  { id: 'cg-10', subject: 'Cultura Generale', category: 'Cultura Generale', prompt: 'Cosa si intende per democrazia diretta?',
    fragments:   ['La democrazia diretta', 'è una forma di governo', 'in cui i cittadini', 'partecipano direttamente', 'alle decisioni politiche'],
    distractors: [
      ["La democrazia rappresentativa", "La repubblica presidenziale"],
      ["è un sistema economico", "è un tipo di elezione"],
      ["in cui i partiti", "in cui i giudici"],
      ["delegano indirettamente", "decidono autonomamente"],
      ["le leggi del parlamento", "le nomine ministeriali"]
    ]},

  // ── Algebra ──────────────────────────────────────────────────────────────────
  { id: 'alg-01', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di numero primo',
    fragments:   ['Un numero primo', 'è un numero naturale', 'maggiore di 1', 'divisibile solo', 'per 1 e per sé stesso'],
    distractors: [
      ["Un numero intero", "Un numero razionale"],
      ["è un numero reale", "è un numero intero"],
      ["uguale a 1", "minore di 0"],
      ["moltiplicabile solo", "sommabile solo"],
      ["per i suoi multipli", "per i numeri pari"]
    ]},
  { id: 'alg-02', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di MCD (Massimo Comune Divisore)',
    fragments:   ['Il MCD', 'tra due o più numeri interi', 'è il più grande', 'dei divisori comuni', 'a tutti quei numeri'],
    distractors: [
      ["Il mcm", "La media"],
      ["tra due o più numeri reali", "tra due polinomi"],
      ["è il più piccolo", "è la somma"],
      ["dei multipli comuni", "dei resti comuni"],
      ["di uno solo di quei numeri", "ai numeri consecutivi"]
    ]},
  { id: 'alg-03', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di mcm (minimo comune multiplo)',
    fragments:   ['Il mcm', 'tra due o più numeri', 'è il più piccolo', 'dei multipli comuni', 'a tutti quei numeri'],
    distractors: [
      ["Il MCD", "La differenza"],
      ["tra due potenze", "tra due frazioni"],
      ["è il più grande", "è la media"],
      ["dei divisori comuni", "dei resti della divisione"],
      ["di uno solo di quei numeri", "di qualsiasi coppia"]
    ]},
  { id: 'alg-04', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di polinomio',
    fragments:   ['Un polinomio', 'è una somma', 'di monomi', 'ciascuno formato', 'da coefficienti e variabili'],
    distractors: [
      ["Un monomio", "Una frazione algebrica"],
      ["è un prodotto", "è una differenza"],
      ["di binomi", "di frazioni"],
      ["ciascuno composto", "ognuno contenente"],
      ["da esponenti e costanti", "da soli numeri interi"]
    ]},
  { id: 'alg-05', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di equazione di secondo grado',
    fragments:   ["Un'equazione di secondo grado", 'è un\'equazione', 'in una variabile', 'in cui il massimo grado', 'è il grado 2'],
    distractors: [
      ["Un'equazione lineare", "Un sistema di equazioni"],
      ["è una disequazione", "è una funzione"],
      ["in due variabili", "in tre variabili"],
      ["in cui il minimo grado", "in cui il grado medio"],
      ["è il grado 3", "è il grado 1"]
    ]},
  { id: 'alg-06', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di logaritmo',
    fragments:   ['Il logaritmo in base b di x', 'è l\'esponente', 'a cui bisogna elevare b', 'per ottenere x'],
    distractors: [
      ["L'esponente in base b di x", "La radice in base b di x"],
      ["è la base", "è il coefficiente"],
      ["a cui bisogna dividere b", "a cui si sottrae b"],
      ["per approssimare x", "per definire x"]
    ]},
  { id: 'alg-07', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di progressione aritmetica',
    fragments:   ['Una progressione aritmetica', 'è una successione di numeri', 'in cui ciascun termine', 'si ottiene dal precedente', 'aggiungendo una costante detta ragione'],
    distractors: [
      ["Una progressione geometrica", "Una serie numerica"],
      ["è una sequenza di lettere", "è un insieme di frazioni"],
      ["in cui ciascun esponente", "in cui ciascun indice"],
      ["si ottiene dal seguente", "si ottiene dividendo"],
      ["moltiplicando per una costante", "sottraendo una variabile"]
    ]},
  { id: 'alg-08', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di progressione geometrica',
    fragments:   ['Una progressione geometrica', 'è una successione di numeri', 'in cui ciascun termine', 'si ottiene dal precedente', 'moltiplicando per una costante detta ragione'],
    distractors: [
      ["Una progressione aritmetica", "Una serie armonica"],
      ["è un insieme finito di valori", "è una funzione periodica"],
      ["in cui ogni esponente", "in cui ogni coppia"],
      ["si ottiene dalla ragione", "si ricava dalla serie"],
      ["aggiungendo una costante", "dividendo per una variabile"]
    ]},
  { id: 'alg-09', subject: 'Matematica', category: 'Algebra', prompt: 'Definizione di valore assoluto',
    fragments:   ['Il valore assoluto di un numero', 'è la sua distanza', "dall'origine", 'sulla retta reale', 'ed è sempre non negativo'],
    distractors: [
      ["Il valore relativo di un numero", "Il modulo di un vettore"],
      ["è il suo quadrato", "è il suo contrario"],
      ["dal punto unitario", "dal punto di mezzo"],
      ["nel piano cartesiano", "nel piano complesso"],
      ["ed è sempre positivo", "ed è sempre intero"]
    ]},
  { id: 'alg-10', subject: 'Matematica', category: 'Algebra', prompt: 'Teorema fondamentale dell\'algebra',
    fragments:   ['Il teorema fondamentale dell\'algebra', 'afferma che ogni polinomio', 'di grado n ≥ 1', 'a coefficienti complessi', 'ha esattamente n radici complesse'],
    distractors: [
      ["Il teorema di Ruffini", "Il teorema di Viète"],
      ["afferma che ogni equazione", "afferma che ogni funzione"],
      ["di grado n = 0", "di grado qualsiasi"],
      ["a coefficienti reali", "a coefficienti razionali"],
      ["ha al massimo n radici reali", "ha almeno una radice intera"]
    ]},

  // ── Probabilità e Statistica ──────────────────────────────────────────────────
  { id: 'pbs-01', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione classica di probabilità',
    fragments:   ['La probabilità classica', 'di un evento', 'è il rapporto', 'tra i casi favorevoli', 'e i casi possibili'],
    distractors: [
      ["La frequenza relativa", "La distribuzione statistica"],
      ["di un esperimento", "di un campione"],
      ["è la differenza", "è il prodotto"],
      ["tra i casi certi", "tra i casi impossibili"],
      ["e i casi totali attesi", "e i casi sfavorevoli"]
    ]},
  { id: 'pbs-02', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di evento complementare',
    fragments:   ["L'evento complementare di A", 'è l\'evento', 'che si verifica', 'se e solo se', 'A non si verifica'],
    distractors: [
      ["L'evento indipendente di A", "L'evento condizionato di A"],
      ["è l'esito", "è il sottoinsieme"],
      ["che non accade mai", "che accade sempre"],
      ["ogni volta che", "solamente se"],
      ["A si verifica", "A è certo"]
    ]},
  { id: 'pbs-03', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di media aritmetica',
    fragments:   ['La media aritmetica', 'di un insieme di dati', 'è la somma', 'di tutti i valori', 'divisa per il numero dei dati'],
    distractors: [
      ["La mediana", "La moda"],
      ["di una distribuzione", "di una funzione"],
      ["è il prodotto", "è la differenza"],
      ["del valore massimo e minimo", "dei valori centrali"],
      ["divisa per la deviazione", "moltiplicata per la varianza"]
    ]},
  { id: 'pbs-04', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di mediana',
    fragments:   ['La mediana', 'è il valore centrale', 'di una serie di dati', 'ordinati in modo crescente', 'che divide il dataset a metà'],
    distractors: [
      ["La media", "La moda"],
      ["è il valore massimo", "è la somma totale"],
      ["di una funzione continua", "di una distribuzione normale"],
      ["ordinati in modo casuale", "raggruppati per frequenza"],
      ["che rappresenta il totale", "che indica la dispersione"]
    ]},
  { id: 'pbs-05', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di varianza',
    fragments:   ['La varianza', 'è la media', 'dei quadrati', 'degli scarti', 'dalla media aritmetica'],
    distractors: [
      ["La deviazione standard", "La covarianza"],
      ["è la somma", "è il massimo"],
      ["dei valori assoluti", "dei doppi prodotti"],
      ["dei massimi", "delle frequenze"],
      ["dalla moda", "dal valore centrale"]
    ]},
  { id: 'pbs-06', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di deviazione standard',
    fragments:   ['La deviazione standard', 'è la radice quadrata', 'della varianza', 'e misura', 'la dispersione dei dati attorno alla media'],
    distractors: [
      ["La varianza", "La media ponderata"],
      ["è il quadrato", "è il logaritmo"],
      ["della mediana", "della frequenza relativa"],
      ["e calcola", "e determina"],
      ["la concentrazione dei dati vicino alla moda", "il numero di valori estremi"]
    ]},
  { id: 'pbs-07', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di eventi indipendenti',
    fragments:   ['Due eventi sono indipendenti', 'se il verificarsi', 'di uno di essi', 'non influenza', 'la probabilità dell\'altro'],
    distractors: [
      ["Due eventi sono complementari", "Due eventi sono incompatibili"],
      ["se l'accadere", "se l'escludersi"],
      ["di entrambi gli eventi", "di nessun evento"],
      ["modifica sempre", "raddoppia"],
      ["la frequenza relativa del primo", "il numero di casi favorevoli"]
    ]},
  { id: 'pbs-08', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di combinazione',
    fragments:   ['Una combinazione di n elementi', 'presi a gruppi di k', 'è una selezione', 'di k elementi', 'senza considerare l\'ordine'],
    distractors: [
      ["Una permutazione di n elementi", "Una disposizione di n elementi"],
      ["presi singolarmente", "presi tutti insieme"],
      ["è un ordinamento", "è una sequenza"],
      ["di n elementi", "di tutti gli elementi"],
      ["considerando l'ordine", "con ripetizione"]
    ]},
  { id: 'pbs-09', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di permutazione',
    fragments:   ['Una permutazione di n elementi', 'è un ordinamento', 'di tutti gli elementi', "dell'insieme", 'in una sequenza ordinata'],
    distractors: [
      ["Una combinazione di n elementi", "Una disposizione di k elementi"],
      ["è una selezione", "è un raggruppamento"],
      ["di alcuni degli elementi", "di nessun elemento"],
      ["del campione", "del sottoinsieme"],
      ["senza tener conto dell'ordine", "con sostituzione dei duplicati"]
    ]},
  { id: 'pbs-10', subject: 'Matematica', category: 'Probabilità e Statistica', prompt: 'Definizione di moda',
    fragments:   ['La moda', 'è il valore', 'che compare', 'con maggiore frequenza', 'in un insieme di dati'],
    distractors: [
      ["La mediana", "La media armonica"],
      ["è il dato", "è il numero"],
      ["che non appare mai", "che si trova al centro"],
      ["con minore frequenza", "con frequenza unitaria"],
      ["in una funzione continua", "in una distribuzione uniforme"]
    ]},

  // ── Termodinamica ─────────────────────────────────────────────────────────────
  { id: 'term-01', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di temperatura',
    fragments:   ['La temperatura', 'è una grandezza fisica', 'che misura', "l'agitazione termica media", 'delle particelle di un corpo'],
    distractors: [
      ["Il calore", "La pressione"],
      ["è una grandezza vettoriale", "è una proprietà chimica"],
      ["che calcola", "che genera"],
      ["l'energia totale del sistema", "la forza tra le molecole"],
      ["dei legami chimici del corpo", "delle onde elettromagnetiche emesse"]
    ]},
  { id: 'term-02', subject: 'Fisica', category: 'Termodinamica', prompt: 'Primo principio della termodinamica',
    fragments:   ['Il primo principio', 'afferma che la variazione', "di energia interna di un sistema", 'è uguale al calore', 'assorbito meno il lavoro compiuto'],
    distractors: [
      ["Il secondo principio", "La legge di conservazione"],
      ["afferma che la produzione", "afferma che il trasferimento"],
      ["di entropia di un sistema", "di temperatura di un gas"],
      ["è uguale alla pressione", "è uguale alla massa"],
      ["moltiplicato per il volume", "diviso per il tempo trascorso"]
    ]},
  { id: 'term-03', subject: 'Fisica', category: 'Termodinamica', prompt: 'Secondo principio della termodinamica',
    fragments:   ['Il secondo principio', 'afferma che il calore', 'non può passare spontaneamente', 'da un corpo freddo', 'a un corpo più caldo'],
    distractors: [
      ["Il primo principio", "Il terzo principio"],
      ["afferma che l'energia", "afferma che il lavoro"],
      ["non può essere prodotta spontaneamente", "non può trasformarsi mai"],
      ["da un corpo caldo", "da un sistema isolato"],
      ["a un corpo più freddo", "a un sistema aperto"]
    ]},
  { id: 'term-04', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di entropia',
    fragments:   ["L'entropia", 'è una funzione di stato', 'che misura il grado', 'di disordine', 'di un sistema termodinamico'],
    distractors: [
      ["L'entalpia", "L'energia libera"],
      ["è una funzione di energia", "è una grandezza vettoriale"],
      ["che indica la quantità", "che calcola la velocità"],
      ["di ordine", "di calore"],
      ["di una reazione chimica", "di un gas ideale"]
    ]},
  { id: 'term-05', subject: 'Fisica', category: 'Termodinamica', prompt: 'Legge di Boyle',
    fragments:   ['La legge di Boyle', 'afferma che a temperatura costante', 'la pressione di un gas', 'è inversamente proporzionale', 'al suo volume'],
    distractors: [
      ["La legge di Gay-Lussac", "La legge di Charles"],
      ["afferma che a pressione costante", "afferma che a volume costante"],
      ["il volume di un gas", "la temperatura di un gas"],
      ["è direttamente proporzionale", "è indipendente"],
      ["alla sua temperatura", "alla sua densità"]
    ]},
  { id: 'term-06', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di gas ideale',
    fragments:   ['Un gas ideale', 'è un modello teorico', 'in cui le molecole', 'non interagiscono tra loro', 'e hanno volume trascurabile'],
    distractors: [
      ["Un gas reale", "Un gas perfetto"],
      ["è un esperimento pratico", "è una sostanza chimica"],
      ["in cui gli atomi", "in cui i nuclei"],
      ["interagiscono fortemente", "si respingono a distanza"],
      ["e hanno massa trascurabile", "e hanno carica elettrica"]
    ]},
  { id: 'term-07', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di calore specifico',
    fragments:   ['Il calore specifico', 'è la quantità di calore', 'necessaria per innalzare', 'di un grado Kelvin', 'la temperatura di un chilogrammo di sostanza'],
    distractors: [
      ["Il calore latente", "La capacità termica molare"],
      ["è la variazione di energia", "è la potenza termica"],
      ["necessaria per fondere", "necessaria per vaporizzare"],
      ["di dieci gradi Kelvin", "di mezzo grado Celsius"],
      ["un metro cubo di gas", "un centimetro cubo di liquido"]
    ]},
  { id: 'term-08', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di pressione di un gas',
    fragments:   ['La pressione di un gas', 'è la forza', 'esercitata dalle molecole', 'per unità di superficie', 'sulle pareti del contenitore'],
    distractors: [
      ["Il volume di un gas", "La densità di un gas"],
      ["è l'energia", "è la massa"],
      ["esercitata dagli atomi", "trasmessa dai fotoni"],
      ["per unità di volume", "per unità di massa"],
      ["all'interno del sistema", "lungo le linee di flusso"]
    ]},
  { id: 'term-09', subject: 'Fisica', category: 'Termodinamica', prompt: 'Definizione di ciclo di Carnot',
    fragments:   ['Il ciclo di Carnot', 'è un ciclo termodinamico', 'teorico reversibile', 'che rappresenta', "il massimo rendimento possibile di una macchina termica"],
    distractors: [
      ["Il ciclo di Otto", "Il ciclo di Rankine"],
      ["è un processo fisico", "è una reazione chimica"],
      ["sperimentale e irreversibile", "ciclico e spontaneo"],
      ["che misura", "che calcola"],
      ["il rendimento minimo di un motore", "la perdita di calore per irraggiamento"]
    ]},
  { id: 'term-10', subject: 'Fisica', category: 'Termodinamica', prompt: 'Legge di Gay-Lussac (prima)',
    fragments:   ['La prima legge di Gay-Lussac', 'afferma che a pressione costante', 'il volume di un gas', 'è direttamente proporzionale', 'alla sua temperatura assoluta'],
    distractors: [
      ["La legge di Boyle", "La seconda legge di Gay-Lussac"],
      ["afferma che a volume costante", "afferma che a temperatura costante"],
      ["la pressione di un gas", "l'entropia di un gas"],
      ["è inversamente proporzionale", "è indipendente"],
      ["alla sua densità", "al suo volume molare"]
    ]},

  // ── Ottica e Onde ─────────────────────────────────────────────────────────────
  { id: 'ott-01', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di onda',
    fragments:   ["Un'onda", 'è una perturbazione', 'che si propaga nello spazio', 'trasportando energia', 'senza trasporto di materia'],
    distractors: [
      ["Un raggio", "Una particella"],
      ["è una vibrazione", "è un flusso"],
      ["che rimane ferma nel tempo", "che si concentra in un punto"],
      ["trasformando calore", "riflettendo fotoni"],
      ["con trasporto di molecole", "con emissione di radiazioni"]
    ]},
  { id: 'ott-02', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di riflessione della luce',
    fragments:   ['La riflessione', 'è il fenomeno per cui', 'un raggio di luce', 'che colpisce una superficie', 'torna nel mezzo di origine'],
    distractors: [
      ["La rifrazione", "La diffrazione"],
      ["è il processo con cui", "è il meccanismo per cui"],
      ["un fascio di calore", "un raggio X"],
      ["che attraversa un prisma", "che percorre il vuoto"],
      ["si piega verso la normale", "viene assorbito dal materiale"]
    ]},
  { id: 'ott-03', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Legge di Snell (rifrazione)',
    fragments:   ['La legge di Snell', 'afferma che il rapporto', 'tra i seni degli angoli', 'di incidenza e rifrazione', 'è uguale al rapporto inverso degli indici di rifrazione'],
    distractors: [
      ["La legge di Brewster", "Il principio di Huygens"],
      ["afferma che il prodotto", "afferma che la somma"],
      ["tra i coseni degli angoli", "tra le tangenti degli angoli"],
      ["di incidenza e riflessione", "di polarizzazione e diffrazione"],
      ["è uguale al prodotto delle velocità di propagazione", "è uguale alla differenza di fase"]
    ]},
  { id: 'ott-04', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di interferenza',
    fragments:   ["L'interferenza", 'è il fenomeno', 'per cui due o più onde', 'si sovrappongono', 'sommando i propri effetti'],
    distractors: [
      ["La diffrazione", "La polarizzazione"],
      ["è il principio", "è la legge"],
      ["per cui due o più raggi", "per cui un campo elettrico"],
      ["si separano", "si annullano"],
      ["moltiplicando le intensità", "invertendo le fasi"]
    ]},
  { id: 'ott-05', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di diffrazione',
    fragments:   ['La diffrazione', 'è il fenomeno', "per cui un'onda", 'si piega attorno a un ostacolo', 'o attraverso una fenditura stretta'],
    distractors: [
      ["La rifrazione", "La dispersione"],
      ["è la proprietà", "è il principio"],
      ["per cui un raggio", "per cui una particella"],
      ["si riflette su una superficie", "si polarizza in un mezzo"],
      ["o genera un prisma spettrale", "o produce un effetto Doppler"]
    ]},
  { id: 'ott-06', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di lente convergente',
    fragments:   ['Una lente convergente', 'è una lente', 'che fa convergere', 'i raggi di luce paralleli', 'in un punto detto fuoco'],
    distractors: [
      ["Una lente divergente", "Un prisma ottico"],
      ["è uno specchio", "è un filtro"],
      ["che fa divergere", "che riflette"],
      ["i raggi di luce incidenti", "i raggi infrarossi paralleli"],
      ["in una linea detta asse", "in un piano detto diaframma"]
    ]},
  { id: 'ott-07', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Effetto Doppler',
    fragments:   ["L'effetto Doppler", 'è il fenomeno', 'per cui la frequenza percepita', "di un'onda varia", 'al variare del moto relativo tra sorgente e osservatore'],
    distractors: [
      ["L'effetto fotoelettrico", "L'effetto Compton"],
      ["è la legge", "è il principio"],
      ["per cui l'ampiezza percepita", "per cui la lunghezza d'onda emessa"],
      ["di una particella oscilla", "di un fotone aumenta"],
      ["al variare della temperatura della sorgente", "al variare della pressione del mezzo"]
    ]},
  { id: 'ott-08', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di lunghezza d\'onda',
    fragments:   ['La lunghezza d\'onda', 'è la distanza', 'tra due punti consecutivi', 'in fase', 'di un\'onda periodica'],
    distractors: [
      ["La frequenza", "Il periodo"],
      ["è il tempo", "è l'ampiezza"],
      ["tra due creste successive", "tra due nodi adiacenti"],
      ["in opposizione di fase", "fuori fase di π"],
      ["di un'onda stazionaria", "di un segnale discontinuo"]
    ]},
  { id: 'ott-09', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Definizione di frequenza di un\'onda',
    fragments:   ['La frequenza di un\'onda', 'è il numero', 'di cicli completi', 'compiuti nell\'unità di tempo', 'e si misura in Hertz'],
    distractors: [
      ["La lunghezza d'onda", "L'ampiezza di un'onda"],
      ["è la distanza", "è l'energia"],
      ["di oscillazioni parziali", "di fronti d'onda"],
      ["compiuti nello spazio percorso", "compiuti per unità di massa"],
      ["e si misura in Joule", "e si misura in Newton"]
    ]},
  { id: 'ott-10', subject: 'Fisica', category: 'Ottica e Onde', prompt: 'Principio di Huygens',
    fragments:   ['Il principio di Huygens', 'afferma che ogni punto', 'di un fronte d\'onda', 'può essere considerato', 'come sorgente di onde sferiche secondarie'],
    distractors: [
      ["Il principio di Fermat", "Il principio di sovrapposizione"],
      ["afferma che ogni raggio", "afferma che ogni fotone"],
      ["di un raggio luminoso", "di un fascio laser"],
      ["deve essere trattato", "si comporta"],
      ["come una particella puntiforme", "come un'onda piana infinita"]
    ]},

  // ── Genetica ──────────────────────────────────────────────────────────────────
  { id: 'gen-01', subject: 'Biologia', category: 'Genetica', prompt: 'Prima legge di Mendel (Legge della dominanza)',
    fragments:   ['La prima legge di Mendel', 'afferma che incrociando', 'due individui puri', 'per un carattere', 'tutti i figli mostrano il carattere dominante'],
    distractors: [
      ["La seconda legge di Mendel", "La legge di Hardy-Weinberg"],
      ["afferma che mescolando", "afferma che selezionando"],
      ["due individui ibridi", "due individui casuali"],
      ["per due caratteri", "per tre caratteri indipendenti"],
      ["metà dei figli mostra il carattere recessivo", "i figli ereditano entrambi i caratteri in ugual misura"]
    ]},
  { id: 'gen-02', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di DNA',
    fragments:   ['Il DNA', 'è una molecola', 'a doppia elica', 'che contiene', "le informazioni genetiche dell'organismo"],
    distractors: [
      ["L'RNA", "La proteina"],
      ["è una struttura", "è un enzima"],
      ["a elica singola", "a struttura globulare"],
      ["che trasmette", "che sintetizza"],
      ["le proteine strutturali del nucleo", "i lipidi della membrana cellulare"]
    ]},
  { id: 'gen-03', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di gene',
    fragments:   ['Un gene', 'è una sequenza', 'di DNA', 'che codifica', 'per una proteina o un RNA funzionale'],
    distractors: [
      ["Un allele", "Un cromosoma"],
      ["è una struttura", "è una molecola"],
      ["di RNA", "di proteine"],
      ["che replica", "che degrada"],
      ["per un lipide o un glucide", "per una membrana o un nucleo"]
    ]},
  { id: 'gen-04', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di cromosoma',
    fragments:   ['Un cromosoma', 'è una struttura', 'presente nel nucleo cellulare', 'formata da DNA', 'avvolto attorno a proteine istoniche'],
    distractors: [
      ["Un ribosoma", "Un plasmide"],
      ["è un organello", "è un enzima"],
      ["presente nel citoplasma", "presente nei mitocondri"],
      ["formata da RNA", "formata da lipidi"],
      ["avvolto attorno a membrane", "associato a zuccheri strutturali"]
    ]},
  { id: 'gen-05', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di mitosi',
    fragments:   ['La mitosi', 'è il processo', 'di divisione cellulare', 'che produce', 'due cellule figlie geneticamente identiche alla cellula madre'],
    distractors: [
      ["La meiosi", "La citodieresi"],
      ["è il meccanismo", "è il ciclo"],
      ["di replicazione del DNA", "di sintesi proteica"],
      ["che origina", "che elimina"],
      ["quattro cellule aploidi con metà cromosomi", "una cellula con DNA ricombinato"]
    ]},
  { id: 'gen-06', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di meiosi',
    fragments:   ['La meiosi', 'è il processo', 'di divisione cellulare', 'che produce', 'quattro cellule figlie aploidi'],
    distractors: [
      ["La mitosi", "La fecondazione"],
      ["è il ciclo", "è la fase"],
      ["di moltiplicazione cellulare", "di differenziazione cellulare"],
      ["che elimina", "che genera"],
      ["due cellule diploidi identiche", "una sola cellula con doppie copie"]
    ]},
  { id: 'gen-07', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di mutazione genetica',
    fragments:   ['Una mutazione genetica', 'è un cambiamento', 'nella sequenza del DNA', 'che può essere', 'ereditato dalla progenie'],
    distractors: [
      ["Una variazione fenotipica", "Una trascrizione genica"],
      ["è una modificazione", "è un trasferimento"],
      ["nella struttura delle proteine", "nella composizione dei lipidi"],
      ["che non può mai essere", "che deve sempre essere"],
      ["trasmesso alle cellule somatiche", "eliminato dalla selezione naturale"]
    ]},
  { id: 'gen-08', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di genotipo e fenotipo',
    fragments:   ['Il genotipo', 'è il patrimonio genetico', 'di un individuo', 'mentre il fenotipo', 'è il risultato visibile del genotipo e dell\'ambiente'],
    distractors: [
      ["Il fenotipo", "Il cariotipo"],
      ["è la sequenza di RNA", "è il numero di cromosomi"],
      ["di una specie", "di una popolazione"],
      ["mentre il genotipo", "mentre il cariotipo"],
      ["è l'insieme degli alleli recessivi", "è la struttura visibile dei cromosomi"]
    ]},
  { id: 'gen-09', subject: 'Biologia', category: 'Genetica', prompt: 'Definizione di allele',
    fragments:   ['Un allele', 'è una delle varianti', 'di un gene', 'che occupa', 'lo stesso locus su cromosomi omologhi'],
    distractors: [
      ["Un gene", "Un codone"],
      ["è una delle copie", "è una delle regioni"],
      ["di un cromosoma", "di un plasmide"],
      ["che contiene", "che codifica"],
      ["lo stesso esone nei ribosomi", "la stessa proteina nei mitocondri"]
    ]},
  { id: 'gen-10', subject: 'Biologia', category: 'Genetica', prompt: 'Seconda legge di Mendel (Legge della segregazione indipendente)',
    fragments:   ['La seconda legge di Mendel', 'afferma che i caratteri', 'trasmessi dai genitori', 'si assortiscono in modo indipendente', "durante la formazione dei gameti"],
    distractors: [
      ["La prima legge di Mendel", "La legge di Morgan"],
      ["afferma che gli alleli", "afferma che i geni"],
      ["acquisiti per mutazione", "determinati dall'ambiente"],
      ["si ereditano sempre insieme", "si esprimono sempre nel fenotipo"],
      ["durante la replicazione del DNA", "durante la sintesi proteica"]
    ]},

  // ── Ecologia ──────────────────────────────────────────────────────────────────
  { id: 'eco-01', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di ecosistema',
    fragments:   ['Un ecosistema', 'è un insieme', 'di organismi viventi', 'che interagiscono tra loro', 'e con il loro ambiente fisico'],
    distractors: [
      ["Una biocenosi", "Una nicchia ecologica"],
      ["è un gruppo", "è una rete"],
      ["di specie animali", "di soli microrganismi"],
      ["che competono tra loro", "che si riproducono tra loro"],
      ["ignorando l'ambiente chimico", "escludendo i fattori abiotici"]
    ]},
  { id: 'eco-02', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di catena alimentare',
    fragments:   ['La catena alimentare', 'è la sequenza', 'di organismi', 'in cui ciascuno', 'si nutre del precedente'],
    distractors: [
      ["La rete trofica", "Il ciclo biogeochimico"],
      ["è il percorso", "è la struttura"],
      ["di nutrienti", "di minerali"],
      ["in cui ogni molecola", "in cui ogni specie"],
      ["produce il successivo", "compete col successivo"]
    ]},
  { id: 'eco-03', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di biodiversità',
    fragments:   ['La biodiversità', 'è la varietà', 'di forme di vita', 'presenti sulla Terra', 'a livello di geni, specie ed ecosistemi'],
    distractors: [
      ["La biosfera", "La biomassa"],
      ["è la distribuzione", "è il numero totale"],
      ["di individui", "di popolazioni"],
      ["presenti in un'area", "presenti in un ecosistema marino"],
      ["a livello di cellule e organi", "a livello di atomi e molecole"]
    ]},
  { id: 'eco-04', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di nicchia ecologica',
    fragments:   ['La nicchia ecologica', 'è il ruolo', 'che una specie', 'svolge', "all'interno di un ecosistema"],
    distractors: [
      ["La catena trofica", "Il bioma"],
      ["è la posizione", "è il territorio"],
      ["che un individuo", "che una popolazione"],
      ["occupa fisicamente", "conquista stagionalmente"],
      ["durante la migrazione", "fuori dall'habitat di origine"]
    ]},
  { id: 'eco-05', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di simbiosi',
    fragments:   ['La simbiosi', 'è una relazione', 'tra due organismi', 'di specie diverse', 'che vivono in stretto contatto'],
    distractors: [
      ["La predazione", "La competizione"],
      ["è un conflitto", "è uno scambio"],
      ["tra più organismi", "tra un organismo e il suo ambiente"],
      ["della stessa specie", "di generi simili"],
      ["che si evitano reciprocamente", "che occupano habitat distanti"]
    ]},
  { id: 'eco-06', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di popolazione biologica',
    fragments:   ['Una popolazione', 'è un insieme', 'di individui', 'della stessa specie', 'che vivono nello stesso habitat nello stesso momento'],
    distractors: [
      ["Una comunità", "Un bioma"],
      ["è un gruppo", "è una rete"],
      ["di specie diverse", "di ecosistemi collegati"],
      ["di generi affini", "di famiglie biologiche"],
      ["che si riproducono in habitat diversi", "che migrano in periodi differenti"]
    ]},
  { id: 'eco-07', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di ciclo del carbonio',
    fragments:   ['Il ciclo del carbonio', 'è il processo', 'attraverso cui il carbonio', 'circola tra l\'atmosfera', 'la biosfera e la litosfera'],
    distractors: [
      ["Il ciclo dell'azoto", "Il ciclo dell'acqua"],
      ["è il meccanismo", "è la reazione"],
      ["attraverso cui l'ossigeno", "attraverso cui l'idrogeno"],
      ["si sposta tra l'idrosfera", "si accumula nella stratosfera"],
      ["il suolo e le rocce ignee", "i microrganismi e i sedimenti marini"]
    ]},
  { id: 'eco-08', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di predazione',
    fragments:   ['La predazione', 'è una relazione ecologica', 'in cui un organismo', 'detto predatore', 'cattura e si nutre di un altro detto preda'],
    distractors: [
      ["La competizione", "Il parassitismo"],
      ["è un fenomeno evolutivo", "è un adattamento genetico"],
      ["in cui una specie", "in cui un ecosistema"],
      ["detta parassita", "detta competitore"],
      ["si riproduce a spese di un altro detto ospite", "occupa lo stesso habitat di un altro detto rivale"]
    ]},
  { id: 'eco-09', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di produttori primari',
    fragments:   ['I produttori primari', 'sono organismi', 'che sintetizzano', 'materia organica', 'a partire da sostanze inorganiche tramite fotosintesi'],
    distractors: [
      ["I consumatori primari", "I decompositori"],
      ["sono molecole", "sono enzimi"],
      ["che degradano", "che assorbono"],
      ["materia inorganica", "energia luminosa"],
      ["a partire da sostanze organiche tramite respirazione", "attraverso la chemiosintesi batterica"]
    ]},
  { id: 'eco-10', subject: 'Biologia', category: 'Ecologia', prompt: 'Definizione di effetto serra',
    fragments:   ["L'effetto serra", 'è il fenomeno', 'per cui alcuni gas atmosferici', 'trattengono il calore', 'irradiato dalla superficie terrestre'],
    distractors: [
      ["Il buco nell'ozono", "L'inquinamento luminoso"],
      ["è il processo", "è la causa"],
      ["per cui le particelle solide", "per cui le radiazioni ultraviolette"],
      ["assorbono l'ossigeno", "riflettono la luce visibile"],
      ["proveniente dalle nuvole", "emesso dal nucleo terrestre"]
    ]},

  // ── Anatomia e Fisiologia ─────────────────────────────────────────────────────
  { id: 'anf-01', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di neurone',
    fragments:   ['Il neurone', 'è la cellula', 'del sistema nervoso', 'specializzata', 'nella trasmissione di impulsi elettrici'],
    distractors: [
      ["Il miocita", "L'eritrocita"],
      ["è l'organo", "è la molecola"],
      ["del sistema endocrino", "del sistema muscolare"],
      ["differenziata", "preposta"],
      ["nella produzione di ormoni", "nel trasporto dell'ossigeno"]
    ]},
  { id: 'anf-02', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di sinapsi',
    fragments:   ['La sinapsi', 'è la giunzione', 'tra due neuroni', 'attraverso cui', "l'impulso nervoso viene trasmesso"],
    distractors: [
      ["L'assone", "Il dendrite"],
      ["è il canale", "è il recettore"],
      ["tra un neurone e un muscolo", "tra due cellule epiteliali"],
      ["in cui", "lungo cui"],
      ["la membrana cellulare viene sintetizzata", "il segnale chimico viene degradato"]
    ]},
  { id: 'anf-03', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di ormone',
    fragments:   ['Un ormone', 'è una molecola', 'prodotta da ghiandole endocrine', 'che attraverso il sangue', 'regola le funzioni di organi bersaglio'],
    distractors: [
      ["Un enzima", "Un neurotrasmettitore"],
      ["è una proteina", "è un lipide"],
      ["prodotta dai neuroni", "prodotta dai linfociti"],
      ["che attraverso il sistema nervoso", "che attraverso il sistema linfatico"],
      ["catalizza le reazioni cellulari", "distrugge gli agenti patogeni"]
    ]},
  { id: 'anf-04', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di enzima',
    fragments:   ['Un enzima', 'è una proteina', 'che agisce da catalizzatore', 'accelerando le reazioni chimiche', 'senza essere consumata'],
    distractors: [
      ["Un ormone", "Un anticorpo"],
      ["è un lipide", "è un carboidrato"],
      ["che agisce da inibitore", "che agisce da substrato"],
      ["bloccando le reazioni chimiche", "rallentando il metabolismo"],
      ["venendo trasformata nel processo", "legandosi definitivamente al prodotto"]
    ]},
  { id: 'anf-05', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di osmosi',
    fragments:   ["L'osmosi", 'è il passaggio', 'di molecole d\'acqua', 'attraverso una membrana semipermeabile', 'da una zona a bassa concentrazione a una ad alta concentrazione di soluto'],
    distractors: [
      ["La dialisi", "La diffusione"],
      ["è il trasporto", "è il flusso"],
      ["di ioni minerali", "di proteine strutturali"],
      ["attraverso una membrana impermeabile", "lungo un gradiente di temperatura"],
      ["da una zona ricca di soluti a una povera", "in assenza di differenze di concentrazione"]
    ]},
  { id: 'anf-06', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di omeostasi',
    fragments:   ["L'omeostasi", 'è la capacità', "di un organismo", 'di mantenere', 'le proprie condizioni interne costanti'],
    distractors: [
      ["L'adattamento", "Il metabolismo"],
      ["è la tendenza", "è il meccanismo"],
      ["di un ecosistema", "di una cellula isolata"],
      ["di modificare", "di eliminare"],
      ["le condizioni esterne variabili", "i segnali ormonali in eccesso"]
    ]},
  { id: 'anf-07', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di sistema nervoso centrale',
    fragments:   ['Il sistema nervoso centrale', 'è formato', 'da encefalo e midollo spinale', 'e coordina', 'le risposte dell\'organismo agli stimoli'],
    distractors: [
      ["Il sistema nervoso periferico", "Il sistema endocrino"],
      ["è composto", "è regolato"],
      ["da nervi e gangli", "da vasi e linfonodi"],
      ["e trasmette", "e produce"],
      ["gli impulsi verso i muscoli", "gli ormoni verso il sangue"]
    ]},
  { id: 'anf-08', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di membrana cellulare',
    fragments:   ['La membrana cellulare', 'è una struttura', 'formata da un doppio strato lipidico', 'che delimita la cellula', 'e ne regola gli scambi con l\'esterno'],
    distractors: [
      ["La parete cellulare", "La membrana nucleare"],
      ["è un organello", "è un insieme di proteine"],
      ["formato da un singolo strato proteico", "formato da filamenti di actina"],
      ["che protegge il nucleo", "che circonda il ribosoma"],
      ["e ne controlla la replicazione", "e ne catalizza la sintesi proteica"]
    ]},
  { id: 'anf-09', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di mitocondrio',
    fragments:   ['Il mitocondrio', 'è un organello cellulare', 'che produce energia', 'sotto forma di ATP', 'attraverso la respirazione cellulare'],
    distractors: [
      ["Il cloroplasto", "Il lisosoma"],
      ["è una struttura nucleare", "è una membrana intracellulare"],
      ["che immagazzina energia", "che rilascia energia"],
      ["sotto forma di glucosio", "sotto forma di ADP"],
      ["attraverso la fotosintesi", "attraverso la glicolisi anaerobica"]
    ]},
  { id: 'anf-10', subject: 'Biologia', category: 'Anatomia e Fisiologia', prompt: 'Definizione di anticorpo',
    fragments:   ['Un anticorpo', 'è una proteina', 'prodotta dal sistema immunitario', 'che riconosce', 'e neutralizza antigeni specifici'],
    distractors: [
      ["Un antigene", "Un enzima digestivo"],
      ["è un lipide", "è un carboidrato"],
      ["prodotto dal sistema nervoso", "prodotto dai globuli rossi"],
      ["che produce", "che distrugge"],
      ["e sintetizza proteine del plasma", "e catalizza reazioni metaboliche"]
    ]},

  // ── Chimica Generale ──────────────────────────────────────────────────────────
  { id: 'chi-01', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Legge di conservazione della massa',
    fragments:   ['La legge di Lavoisier', 'afferma che in una reazione chimica', 'la massa totale dei reagenti', 'è uguale', 'alla massa totale dei prodotti'],
    distractors: [
      ["La legge di Dalton", "La legge di Avogadro"],
      ["afferma che in una soluzione", "afferma che in un equilibrio"],
      ["la massa dei prodotti", "l'energia dei reagenti"],
      ["è maggiore", "è minore"],
      ["alla massa degli elementi", "all'energia totale del sistema"]
    ]},
  { id: 'chi-02', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di molecola',
    fragments:   ['Una molecola', 'è il più piccolo', 'costituente di una sostanza', 'che ne conserva', 'tutte le proprietà chimiche'],
    distractors: [
      ["Un atomo", "Uno ione"],
      ["è il più grande", "è il più leggero"],
      ["componente di un elemento", "frammento di un composto"],
      ["che altera", "che moltiplica"],
      ["solo le proprietà fisiche", "alcune proprietà ottiche"]
    ]},
  { id: 'chi-03', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di legame covalente',
    fragments:   ['Il legame covalente', 'è un legame chimico', 'in cui due atomi', 'condividono', 'una o più coppie di elettroni'],
    distractors: [
      ["Il legame ionico", "Il legame metallico"],
      ["è un'attrazione elettrica", "è una repulsione nucleare"],
      ["in cui due ioni", "in cui due molecole"],
      ["si trasferiscono", "si scambiano"],
      ["protoni o neutroni", "atomi interi o radicali"]
    ]},
  { id: 'chi-04', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di legame ionico',
    fragments:   ['Il legame ionico', 'è un legame', 'tra ioni di carica opposta', 'che si attraggono', 'per forza elettrostatica'],
    distractors: [
      ["Il legame covalente", "Il legame a idrogeno"],
      ["è un'interazione", "è una repulsione"],
      ["tra atomi dello stesso elemento", "tra molecole non polari"],
      ["che si respingono", "che si legano"],
      ["per forza magnetica", "per forza di Van der Waals"]
    ]},
  { id: 'chi-05', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di acido secondo Arrhenius',
    fragments:   ['Secondo Arrhenius', 'un acido', 'è una sostanza', 'che in soluzione acquosa', 'libera ioni H⁺'],
    distractors: [
      ["Secondo Brønsted-Lowry", "Secondo Lewis"],
      ["una base", "un sale"],
      ["è un composto", "è un elemento"],
      ["in soluzione organica", "in stato solido"],
      ["libera ioni OH⁻", "acquista elettroni"]
    ]},
  { id: 'chi-06', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di base secondo Arrhenius',
    fragments:   ['Secondo Arrhenius', 'una base', 'è una sostanza', 'che in soluzione acquosa', 'libera ioni OH⁻'],
    distractors: [
      ["Secondo Lewis", "Secondo Brønsted-Lowry"],
      ["un acido", "un ossido"],
      ["è un composto", "è un elemento"],
      ["in soluzione organica", "allo stato gassoso"],
      ["acquista protoni", "libera ioni H⁺"]
    ]},
  { id: 'chi-07', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di ossidazione',
    fragments:   ["L'ossidazione", 'è il processo', 'in cui un atomo o ione', 'perde elettroni', 'aumentando il suo numero di ossidazione'],
    distractors: [
      ["La riduzione", "La neutralizzazione"],
      ["è la reazione", "è il fenomeno"],
      ["in cui una molecola intera", "in cui un nucleo"],
      ["acquista elettroni", "cede protoni"],
      ["diminuendo la sua carica nucleare", "conservando il suo numero atomico"]
    ]},
  { id: 'chi-08', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di pH',
    fragments:   ['Il pH', 'è una misura', 'della concentrazione', 'di ioni H⁺ in soluzione', 'su scala logaritmica da 0 a 14'],
    distractors: [
      ["Il pKa", "La molarità"],
      ["è un indice", "è il rapporto"],
      ["della quantità totale", "della velocità di diffusione"],
      ["di ioni OH⁻ nel solvente", "di molecole neutre in soluzione"],
      ["su scala lineare da 1 a 100", "su scala esponenziale da −7 a 7"]
    ]},
  { id: 'chi-09', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di numero di Avogadro',
    fragments:   ['Il numero di Avogadro', 'è il numero', 'di particelle', 'contenute in una mole', 'di qualsiasi sostanza (≈ 6,022 × 10²³)'],
    distractors: [
      ["Il numero di massa", "Il numero atomico"],
      ["è la quantità", "è la somma"],
      ["di atomi", "di moli"],
      ["contenute in un grammo", "contenute in un litro"],
      ["di sostanza pura (≈ 6,022 × 10²⁶)", "di gas ideale (≈ 1,38 × 10⁻²³)"]
    ]},
  { id: 'chi-10', subject: 'Chimica', category: 'Chimica Generale', prompt: 'Definizione di reazione chimica',
    fragments:   ['Una reazione chimica', 'è un processo', 'in cui le sostanze di partenza', 'dette reagenti', 'si trasformano in nuove sostanze dette prodotti'],
    distractors: [
      ["Una soluzione chimica", "Un equilibrio chimico"],
      ["è una separazione", "è uno stato"],
      ["in cui le sostanze finali", "in cui i composti intermedi"],
      ["detti prodotti", "detti catalizzatori"],
      ["tornano ai reagenti originali", "rimangono invariati nel tempo"]
    ]},

  // ── Chimica Organica ──────────────────────────────────────────────────────────
  { id: 'cor-01', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di idrocarburo',
    fragments:   ['Un idrocarburo', 'è un composto organico', 'formato esclusivamente', 'da atomi di carbonio', 'e atomi di idrogeno'],
    distractors: [
      ["Un carboidrato", "Un amminoacido"],
      ["è una molecola inorganica", "è un polimero naturale"],
      ["formato principalmente", "formato in piccola parte"],
      ["da atomi di azoto", "da atomi di ossigeno"],
      ["e atomi di zolfo", "e atomi di azoto"]
    ]},
  { id: 'cor-02', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di alcano',
    fragments:   ['Un alcano', 'è un idrocarburo', 'saturo', 'con soli legami', 'C–C singoli e C–H'],
    distractors: [
      ["Un alchene", "Un alchino"],
      ["è un composto organico", "è un idrocarburo aromatico"],
      ["insaturo", "aromatico"],
      ["con almeno un doppio legame", "con almeno un triplo legame"],
      ["C=C e C–N", "C≡C e C–O"]
    ]},
  { id: 'cor-03', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di alchene',
    fragments:   ['Un alchene', 'è un idrocarburo', 'insaturo', 'che contiene', 'almeno un doppio legame C=C'],
    distractors: [
      ["Un alcano", "Un alchino"],
      ["è un composto aromatico", "è un alcol"],
      ["saturo", "ciclico"],
      ["che possiede", "che forma"],
      ["almeno un triplo legame C≡C", "solo legami singoli C–C"]
    ]},
  { id: 'cor-04', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di benzene',
    fragments:   ['Il benzene', 'è un idrocarburo aromatico', 'ciclico', 'con sei atomi di carbonio', 'e doppi legami coniugati alternati'],
    distractors: [
      ["Il cicloesano", "Il toluene"],
      ["è un alcano ciclico", "è un composto eterociclico"],
      ["lineare", "ramificato"],
      ["con cinque atomi di carbonio", "con otto atomi di carbonio"],
      ["e soli legami singoli", "e un solo doppio legame terminale"]
    ]},
  { id: 'cor-05', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di alcol',
    fragments:   ['Un alcol', 'è un composto organico', 'che contiene', 'il gruppo funzionale', '–OH legato a un carbonio sp³'],
    distractors: [
      ["Un chetone", "Un'aldeide"],
      ["è una molecola inorganica", "è un acido organico"],
      ["che possiede", "che forma"],
      ["il gruppo carbonilico", "il gruppo carbossilico"],
      ["–C=O legato a un idrogeno", "–COOH legato a un azoto"]
    ]},
  { id: 'cor-06', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di acido carbossilico',
    fragments:   ['Un acido carbossilico', 'è un composto organico', 'che contiene', 'il gruppo funzionale', '–COOH'],
    distractors: [
      ["Un estere", "Un'ammide"],
      ["è una molecola ciclica", "è un sale organico"],
      ["che possiede", "che forma"],
      ["il gruppo ossidrile", "il gruppo amminico"],
      ["–OH", "–NH₂"]
    ]},
  { id: 'cor-07', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di amminoacido',
    fragments:   ['Un amminoacido', 'è una molecola', 'che contiene', 'un gruppo amminico –NH₂', 'e un gruppo carbossilico –COOH'],
    distractors: [
      ["Un nucleotide", "Un monosaccaride"],
      ["è un polimero", "è un enzima"],
      ["che possiede", "che porta"],
      ["un gruppo ossidrile –OH", "un gruppo estere –COO–"],
      ["e un gruppo aldeidico –CHO", "e un gruppo carbonilico –C=O"]
    ]},
  { id: 'cor-08', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di polimero',
    fragments:   ['Un polimero', 'è una macromolecola', 'formata dalla ripetizione', 'di unità strutturali', 'dette monomeri'],
    distractors: [
      ["Un oligomero", "Un copolimero"],
      ["è un composto semplice", "è un cristallo molecolare"],
      ["formata dalla somma", "formata dalla fusione"],
      ["di proprietà chimiche", "di cariche elettriche"],
      ["dette polimeri", "dette isomeri"]
    ]},
  { id: 'cor-09', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di isomeria',
    fragments:   ["L'isomeria", 'è il fenomeno', 'per cui due o più composti', 'hanno la stessa formula molecolare', 'ma struttura o configurazione diversa'],
    distractors: [
      ["La stereoisomeria", "La tautomeria"],
      ["è la proprietà", "è la reazione"],
      ["per cui due elementi", "per cui due ioni"],
      ["hanno la stessa massa atomica", "hanno lo stesso numero di ossidazione"],
      ["ma diversa formula molecolare", "ma diverso numero atomico"]
    ]},
  { id: 'cor-10', subject: 'Chimica', category: 'Chimica Organica', prompt: 'Definizione di reazione di esterificazione',
    fragments:   ["La reazione di esterificazione", 'è la reazione', 'tra un acido carbossilico', 'e un alcol', 'che produce un estere e acqua'],
    distractors: [
      ["La reazione di saponificazione", "La reazione di idrogenazione"],
      ["è il processo", "è la sintesi"],
      ["tra un aldeide", "tra una base e un sale"],
      ["e un chetone", "e un amminoacido"],
      ["che produce un alcol e anidride", "che produce un polimero e CO₂"]
    ]},

  // ── Storia Antica ─────────────────────────────────────────────────────────────
  { id: 'sant-01', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di polis greca',
    fragments:   ['La polis', 'era la città-stato', 'del mondo greco antico', 'autonoma e indipendente', 'con proprie leggi e istituzioni politiche'],
    distractors: [
      ["L'agorà", "La metropolis"],
      ["era la piazza centrale", "era la colonia"],
      ["del mondo romano antico", "del mondo egiziano"],
      ["dipendente e tributaria", "militare e sacerdotale"],
      ["con leggi imposte dall'esterno", "con istituzioni federali condivise"]
    ]},
  { id: 'sant-02', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di democrazia ateniese',
    fragments:   ['La democrazia ateniese', 'era un sistema politico', 'in cui i cittadini maschi liberi', 'partecipavano direttamente', 'alle decisioni dell\'assemblea'],
    distractors: [
      ["La tirannia spartana", "L'oligarchia corinzia"],
      ["era un regime militare", "era una forma monarchica"],
      ["in cui i nobili e i sacerdoti", "in cui i cittadini stranieri"],
      ["delegavano le decisioni", "si escludevano sempre"],
      ["al consiglio degli anziani", "alle assemblee tributarie"]
    ]},
  { id: 'sant-03', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di Repubblica romana',
    fragments:   ['La Repubblica romana', 'era la forma di governo', 'di Roma', 'basata su magistrature elettive', 'e sul Senato come organo consultivo'],
    distractors: [
      ["L'Impero romano", "La monarchia etrusca"],
      ["era il tipo di stato", "era il regime politico"],
      ["di Cartagine", "di Atene"],
      ["basata su un imperatore ereditario", "fondata su un re divino"],
      ["e sull'esercito come organo esecutivo", "e sui tribuni come organo legislativo unico"]
    ]},
  { id: 'sant-04', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di Ellenismo',
    fragments:   ["L'Ellenismo", 'è il periodo storico', 'dalla morte di Alessandro Magno', 'alla conquista romana', "caratterizzato dalla diffusione della cultura greca in Oriente"],
    distractors: [
      ["Il classicismo greco", "Il periodo arcaico"],
      ["è la fase culturale", "è l'era politica"],
      ["dalla caduta di Troia", "dalla fondazione di Roma"],
      ["alla morte di Pericle", "alla vittoria di Maratona"],
      ["caratterizzato dall'isolamento della cultura greca", "dalla nascita della filosofia presocratica"]
    ]},
  { id: 'sant-05', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di Impero Romano',
    fragments:   ["L'Impero Romano", 'era la forma di governo', 'in cui il potere', 'era concentrato', "nell'imperatore con titolo assoluto"],
    distractors: [
      ["La Repubblica Romana", "Il Senato Romano"],
      ["era il sistema politico", "era la struttura amministrativa"],
      ["in cui il diritto", "in cui la religione"],
      ["era distribuito", "era limitato"],
      ["nelle magistrature elettive", "negli organi plebeii"]
    ]},
  { id: 'sant-06', subject: 'Storia', category: 'Storia Antica', prompt: 'Chi erano i Fenici?',
    fragments:   ['I Fenici', 'erano un popolo', 'semitico del Mediterraneo orientale', 'noti per', 'i commerci marittimi e l\'invenzione dell\'alfabeto'],
    distractors: [
      ["I Greci", "Gli Etruschi"],
      ["erano una civiltà", "erano una tribù"],
      ["indoeuropea dell'Europa centrale", "nomade del Medio Oriente"],
      ["famosi per", "conosciuti per"],
      ["le conquiste militari e la filosofia", "l'architettura templare e la metallurgia"]
    ]},
  { id: 'sant-07', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di civiltà mesopotamica',
    fragments:   ['La civiltà mesopotamica', 'nacque tra i fiumi', 'Tigri ed Eufrate', 'ed è considerata', "una delle prime grandi civiltà della storia"],
    distractors: [
      ["La civiltà egizia", "La civiltà minoica"],
      ["si sviluppò lungo il fiume", "fiorì nelle pianure del"],
      ["Nilo e Indo", "Gange e Bramaputra"],
      ["ed è ritenuta", "ed è classificata"],
      ["la prima civiltà marittima", "la prima civiltà nomade documentata"]
    ]},
  { id: 'sant-08', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di dittatura romana',
    fragments:   ['La dittatura romana', 'era una magistratura straordinaria', 'a cui veniva affidato', 'il potere assoluto', 'per un massimo di sei mesi in caso di crisi'],
    distractors: [
      ["Il consolato romano", "La censura romana"],
      ["era una magistratura ordinaria", "era una carica religiosa"],
      ["a cui era concessa", "a cui era negata"],
      ["la potestà tribunizia", "l'imperium militare"],
      ["per tutta la vita senza limitazioni", "per dieci anni in tempo di guerra"]
    ]},
  { id: 'sant-09', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di Guerra del Peloponneso',
    fragments:   ['La Guerra del Peloponneso', 'fu il conflitto', 'tra Atene e Sparta', 'combattuto dal 431 al 404 a.C.', 'che si concluse con la vittoria spartana'],
    distractors: [
      ["La Guerra persiana", "La guerra punica"],
      ["fu la battaglia", "fu il trattato"],
      ["tra Roma e Cartagine", "tra Persia e Grecia"],
      ["combattuta nel 480 a.C.", "stipulato nel 338 a.C."],
      ["che si concluse con la vittoria ateniese", "che pose fine all'egemonia macedone"]
    ]},
  { id: 'sant-10', subject: 'Storia', category: 'Storia Antica', prompt: 'Definizione di Giulio Cesare',
    fragments:   ['Giulio Cesare', 'fu un generale e politico romano', 'che conquistò la Gallia', 'attraversò il Rubicone', 'e divenne dittatore perpetuo di Roma'],
    distractors: [
      ["Augusto", "Pompeo Magno"],
      ["fu un imperatore e filosofo", "fu un console e oratore"],
      ["che colonizzò la Britannia", "che pacificò la Spagna"],
      ["attraversò le Alpi", "assediò Gerusalemme"],
      ["e divenne primo imperatore di Roma", "e riformò la Repubblica senza titoli"]
    ]},

  // ── Storia Medievale ──────────────────────────────────────────────────────────
  { id: 'smed-01', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di feudalesimo',
    fragments:   ['Il feudalesimo', 'era un sistema sociale ed economico', 'basato sulla concessione di terra', 'in cambio di fedeltà e servizi militari', 'da parte dei vassalli al signore'],
    distractors: [
      ["Il mercantilismo", "Il corporativismo medievale"],
      ["era un sistema politico e religioso", "era un regime economico commerciale"],
      ["basato sulla raccolta di tasse", "basato sullo scambio di merci"],
      ["in cambio di protezione spirituale", "in cambio di privilegi commerciali"],
      ["da parte dei servi alla Chiesa", "da parte dei mercanti al re"]
    ]},
  { id: 'smed-02', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di Sacro Romano Impero',
    fragments:   ['Il Sacro Romano Impero', 'era una confederazione', 'di stati dell\'Europa centrale', 'con a capo un imperatore', 'eletto dai principi elettori'],
    distractors: [
      ["Il Sacro Collegio", "L'Impero Carolingio"],
      ["era una monarchia assoluta", "era una teocrazia"],
      ["di regni dell'Europa orientale", "di ducati dell'Europa meridionale"],
      ["con a capo un papa", "con a capo un re ereditario"],
      ["nominato dal Concilio", "scelto per diritto divino"]
    ]},
  { id: 'smed-03', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di Crociate',
    fragments:   ['Le Crociate', 'furono spedizioni militari', 'organizzate dalla Chiesa', 'con l\'obiettivo di riconquistare', 'la Terra Santa dai Musulmani'],
    distractors: [
      ["Le invasioni vichinghe", "Le guerre di religione"],
      ["furono migrazioni di popoli", "furono conflitti commerciali"],
      ["organizzate dall'Impero", "finanziate dalle città-stato"],
      ["con l'obiettivo di colonizzare", "con l'intento di evangelizzare"],
      ["le regioni pagane del Nord Europa", "le popolazioni slave dell'Est"]
    ]},
  { id: 'smed-04', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di Magna Carta',
    fragments:   ['La Magna Carta', 'fu un documento', 'firmato dal re Giovanni d\'Inghilterra nel 1215', 'che limitava il potere regio', 'e garantiva diritti ai baroni'],
    distractors: [
      ["La Bolla d'oro", "La Pace di Westfalia"],
      ["fu un trattato", "fu un decreto"],
      ["emesso dall'imperatore Federico II nel 1356", "stipulato dal papa Innocenzo III nel 1198"],
      ["che ampliava i poteri imperiali", "che sanciva l'unità della Chiesa"],
      ["e imponeva tasse ai principi", "e scomunicava i nobili ribelli"]
    ]},
  { id: 'smed-05', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di peste nera',
    fragments:   ['La peste nera', 'fu una pandemia', 'causata dal batterio Yersinia pestis', 'che tra il 1347 e il 1353', "uccise circa un terzo della popolazione europea"],
    distractors: [
      ["La febbre gialla", "Il vaiolo medievale"],
      ["fu un'epidemia", "fu una carestia"],
      ["causata dal virus dell'influenza", "causata dalla malnutrizione diffusa"],
      ["che tra il 1050 e il 1080", "che tra il 1415 e il 1430"],
      ["colpì solo le città costiere", "decimò le popolazioni asiatiche"]
    ]},
  { id: 'smed-06', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di Rinascita carolingia',
    fragments:   ['La rinascita carolingia', 'fu un periodo', 'di fioritura culturale', 'sotto Carlo Magno', 'che promosse istruzione, arte e lingua latina'],
    distractors: [
      ["La rinascita ottoniana", "Il Rinascimento italiano"],
      ["fu un'era", "fu un movimento"],
      ["di decadenza politica", "di rivoluzione religiosa"],
      ["sotto Carlo Martello", "sotto Ottone I"],
      ["che diffuse l'analfabetismo e le lingue volgari", "che impose il greco come lingua ufficiale"]
    ]},
  { id: 'smed-07', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di comune medievale',
    fragments:   ['Il comune medievale', 'era una forma di governo', 'delle città italiane', 'in cui i cittadini', 'si autogovernavano tramite proprie istituzioni'],
    distractors: [
      ["La signoria medievale", "Il principato ecclesiastico"],
      ["era un tipo di regime", "era una struttura feudale"],
      ["delle campagne feudali", "delle regioni nordiche"],
      ["in cui i nobili", "in cui i vescovi"],
      ["imponevano le leggi senza consultare i sudditi", "controllavano la giustizia e le finanze"]
    ]},
  { id: 'smed-08', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di scisma d\'Oriente (1054)',
    fragments:   ['Lo scisma d\'Oriente', 'fu la rottura', 'tra la Chiesa cattolica romana', 'e la Chiesa ortodossa', 'avvenuta nel 1054'],
    distractors: [
      ["La Riforma protestante", "Lo scisma d'Occidente"],
      ["fu la separazione", "fu il concilio"],
      ["tra la Chiesa anglicana", "tra il papato e l'impero"],
      ["e la Chiesa luterana", "e il clero francese"],
      ["avvenuta nel 1517", "proclamata nel 1309"]
    ]},
  { id: 'smed-09', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di signoria medievale',
    fragments:   ['La signoria medievale', 'era una forma di governo', 'in cui il potere', 'era concentrato', 'nelle mani di un unico signore'],
    distractors: [
      ["Il comune medievale", "Il feudo medievale"],
      ["era un sistema istituzionale", "era una struttura economica"],
      ["in cui le leggi", "in cui le risorse"],
      ["erano distribuite", "erano condivise"],
      ["tra le magistrature cittadine", "tra i ceti popolari"]
    ]},
  { id: 'smed-10', subject: 'Storia', category: 'Storia Medievale', prompt: 'Definizione di Islam e Califfato',
    fragments:   ['Il Califfato', 'era la forma di governo', 'del mondo islamico medievale', 'guidata dal califfo', 'considerato successore del profeta Maometto'],
    distractors: [
      ["Il Sultanato", "L'Emirato"],
      ["era il tipo di stato", "era la struttura religiosa"],
      ["dell'Impero Ottomano moderno", "del mondo arabo contemporaneo"],
      ["guidata dall'imam", "governata dal visir"],
      ["eletto dal popolo tramite voto", "nominato dal consiglio degli ulema"]
    ]},

  // ── Storia Moderna ────────────────────────────────────────────────────────────
  { id: 'smod-01', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Rinascimento',
    fragments:   ['Il Rinascimento', 'fu un movimento culturale', 'nato in Italia tra XIV e XVI secolo', 'che riscoprì', 'i valori della classicità greco-romana'],
    distractors: [
      ["Il Romanticismo", "Il Barocco"],
      ["fu uno stile artistico", "fu un periodo politico"],
      ["sviluppatosi in Francia tra XVII e XVIII secolo", "diffusosi in Germania tra XVI e XVII secolo"],
      ["che rifiutò", "che elaborò"],
      ["la tradizione medievale cristiana", "i canoni dell'arte islamica"]
    ]},
  { id: 'smod-02', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Riforma protestante',
    fragments:   ['La Riforma protestante', 'fu un movimento religioso', 'avviato da Martin Lutero nel 1517', 'che contestò', "l'autorità della Chiesa cattolica"],
    distractors: [
      ["La Controriforma", "La Riforma anglicana"],
      ["fu un concilio religioso", "fu una crociata spirituale"],
      ["avviato da Calvino nel 1536", "promosso da Enrico VIII nel 1534"],
      ["che sostenne", "che riformò"],
      ["il primato del papa di Roma", "la dottrina ortodossa orientale"]
    ]},
  { id: 'smod-03', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Rivoluzione scientifica',
    fragments:   ['La Rivoluzione scientifica', 'fu il processo', 'avvenuto tra XVI e XVII secolo', 'che trasformò', 'la comprensione del mondo attraverso metodo e osservazione'],
    distractors: [
      ["L'Illuminismo scientifico", "La rivoluzione industriale"],
      ["fu il fenomeno", "fu il cambiamento"],
      ["avvenuto tra XIV e XV secolo", "sviluppatosi tra XVIII e XIX secolo"],
      ["che consolidò", "che distrusse"],
      ["la tradizione aristotelico-scolastica", "le scoperte geografiche dell'epoca"]
    ]},
  { id: 'smod-04', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Illuminismo',
    fragments:   ["L'Illuminismo", 'fu un movimento intellettuale', 'del XVIII secolo', 'che esaltò', 'la ragione come guida per la società e la politica'],
    distractors: [
      ["Il Romanticismo", "Il Positivismo"],
      ["fu un corrente artistica", "fu una scuola filosofica"],
      ["del XVII secolo", "del XIX secolo"],
      ["che celebrò", "che criticò"],
      ["il sentimento e la natura come valori supremi", "la tradizione religiosa e il potere della fede"]
    ]},
  { id: 'smod-05', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Rivoluzione americana (1776)',
    fragments:   ['La Rivoluzione americana', 'fu il processo', 'con cui le tredici colonie britanniche', 'dichiararono l\'indipendenza', 'fondando gli Stati Uniti d\'America'],
    distractors: [
      ["La Rivoluzione francese", "La guerra d'indipendenza canadese"],
      ["fu il conflitto", "fu la rivolta"],
      ["con cui le colonie spagnole", "con cui le province olandesi"],
      ["conquistarono l'autonomia", "ottennero la sovranità"],
      ["fondando il Messico moderno", "unendosi all'impero britannico"]
    ]},
  { id: 'smod-06', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Rivoluzione francese (1789)',
    fragments:   ['La Rivoluzione francese', 'fu il movimento politico e sociale', 'che abbatté la monarchia assoluta', "diffuse i principi di libertà, uguaglianza e fraternità", 'trasformando la Francia in una Repubblica'],
    distractors: [
      ["La Restaurazione francese", "La Rivoluzione americana"],
      ["fu il processo diplomatico e militare", "fu la rivolta religiosa e culturale"],
      ["che rafforzò la monarchia costituzionale", "che ripristinò il potere feudale"],
      ["diffuse i principi di ordine, tradizione e gerarchia", "impose i valori del clero e della nobiltà"],
      ["trasformando la Francia in un Impero", "riportando la Francia al feudalesimo"]
    ]},
  { id: 'smod-07', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di assolutismo monarchico',
    fragments:   ["L'assolutismo", 'era un sistema di governo', 'in cui il re', 'deteneva il potere sovrano', 'senza limiti costituzionali'],
    distractors: [
      ["Il parlamentarismo", "Il federalismo"],
      ["era una forma di stato", "era un regime democratico"],
      ["in cui il parlamento", "in cui il popolo"],
      ["condivideva il potere", "eleggeva direttamente"],
      ["secondo norme costituzionali", "secondo leggi federali scritte"]
    ]},
  { id: 'smod-08', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Scoperta dell\'America (1492)',
    fragments:   ['La scoperta dell\'America', 'fu il viaggio di Cristoforo Colombo', 'del 1492', 'che aprì', 'i contatti permanenti tra Europa e Americhe'],
    distractors: [
      ["La circumnavigazione del globo", "La scoperta dell'India"],
      ["fu l'impresa di Amerigo Vespucci", "fu la spedizione di Vasco da Gama"],
      ["del 1519", "del 1498"],
      ["che stabilì", "che interruppe"],
      ["le rotte commerciali con l'Asia", "i contatti con l'Africa subsahariana"]
    ]},
  { id: 'smod-09', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di mercantilismo',
    fragments:   ['Il mercantilismo', 'era una dottrina economica', 'secondo cui la ricchezza di uno Stato', 'dipendeva dall\'accumulo', 'di metalli preziosi e dalla bilancia commerciale positiva'],
    distractors: [
      ["Il fisiocratismo", "Il liberismo"],
      ["era una teoria politica", "era un sistema tributario"],
      ["secondo cui la forza di uno Stato", "secondo cui il benessere del popolo"],
      ["dipendeva dalla produzione", "era determinato dalla terra"],
      ["di beni industriali e dalla crescita demografica", "dal libero scambio senza dazi doganali"]
    ]},
  { id: 'smod-10', subject: 'Storia', category: 'Storia Moderna', prompt: 'Definizione di Pace di Westfalia (1648)',
    fragments:   ['La Pace di Westfalia', 'fu il trattato del 1648', 'che pose fine', 'alla Guerra dei Trent\'anni', 'e sancì il principio della sovranità degli stati'],
    distractors: [
      ["La Pace di Utrecht", "Il Trattato di Vienna"],
      ["fu l'accordo del 1713", "fu la dichiarazione del 1815"],
      ["che concluse", "che avviò"],
      ["alla Guerra dei Sette anni", "alla Guerra di successione spagnola"],
      ["e stabilì il dominio coloniale europeo", "e creò la Santa Alleanza tra monarchi"]
    ]},

  // ── Storia Contemporanea ──────────────────────────────────────────────────────
  { id: 'scon-01', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di Rivoluzione industriale',
    fragments:   ['La Rivoluzione industriale', 'fu il processo', 'iniziato in Inghilterra nel XVIII secolo', 'che trasformò', "l'economia da agricola a industriale"],
    distractors: [
      ["La Rivoluzione agricola", "La Rivoluzione scientifica"],
      ["fu il fenomeno", "fu il cambiamento"],
      ["iniziato in Francia nel XIX secolo", "sviluppatosi in Germania nel XVII secolo"],
      ["che convertì", "che distrusse"],
      ["l'economia da commerciale a feudale", "la struttura sociale da urbana a rurale"]
    ]},
  { id: 'scon-02', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di Prima Guerra Mondiale',
    fragments:   ['La Prima Guerra Mondiale', 'fu un conflitto globale', 'combattuto dal 1914 al 1918', 'che coinvolse le principali potenze europee', 'e si concluse con i Trattati di pace di Parigi'],
    distractors: [
      ["La Seconda Guerra Mondiale", "La Guerra franco-prussiana"],
      ["fu una guerra regionale", "fu uno scontro diplomatico"],
      ["combattuta dal 1939 al 1945", "combattuta dal 1870 al 1871"],
      ["che opposte solo gli Imperi centrali", "che vide solo la Francia e la Germania"],
      ["e terminò con la resa di Berlino", "e portò alla nascita della Terza Repubblica"]
    ]},
  { id: 'scon-03', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di fascismo',
    fragments:   ['Il fascismo', 'fu un movimento e regime politico', 'fondato da Mussolini', 'caratterizzato da nazionalismo esasperato', 'e da un governo totalitario'],
    distractors: [
      ["Il comunismo", "Il socialismo democratico"],
      ["fu una corrente e dottrina economica", "fu un partito e ideologia liberale"],
      ["fondato da Lenin", "teorizzato da Marx"],
      ["caratterizzato dall'internazionalismo proletario", "basato sul pluralismo e le libertà civili"],
      ["e da una democrazia parlamentare", "e da un'economia pianificata"]
    ]},
  { id: 'scon-04', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di Seconda Guerra Mondiale',
    fragments:   ['La Seconda Guerra Mondiale', 'fu il conflitto globale', 'dal 1939 al 1945', 'che oppose le potenze dell\'Asse', 'agli Alleati concludendosi con la vittoria di questi ultimi'],
    distractors: [
      ["La Prima Guerra Mondiale", "La Guerra fredda"],
      ["fu lo scontro militare", "fu la crisi diplomatica"],
      ["dal 1914 al 1918", "dal 1947 al 1991"],
      ["che contrappose l'Intesa", "che divise il mondo tra USA e URSS"],
      ["ai neutri terminando con l'armistizio del 1918", "in due blocchi senza un conflitto diretto"]
    ]},
  { id: 'scon-05', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di Guerra fredda',
    fragments:   ['La Guerra fredda', 'fu il periodo di tensione', 'tra USA e URSS', 'dal 1947 al 1991', 'senza conflitto militare diretto tra i due'],
    distractors: [
      ["La Guerra calda", "La crisi di Suez"],
      ["fu l'era di collaborazione", "fu il conflitto armato"],
      ["tra NATO e ONU", "tra Europa e Giappone"],
      ["dal 1919 al 1939", "dal 1962 al 1975"],
      ["con frequenti scontri militari diretti", "con accordi commerciali bilaterali"]
    ]},
  { id: 'scon-06', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di Olocausto',
    fragments:   ["L'Olocausto", 'fu lo sterminio sistematico', 'di sei milioni di ebrei', 'perpetrato dal regime nazista', 'durante la Seconda Guerra Mondiale'],
    distractors: [
      ["Il Gulag", "Il genocidio armeno"],
      ["fu la deportazione forzata", "fu la persecuzione religiosa"],
      ["di milioni di oppositori politici", "di minoranze cristiane"],
      ["operato dal regime stalinista", "condotto dall'Impero Ottomano"],
      ["durante la Prima Guerra Mondiale", "durante la Guerra civile russa"]
    ]},
  { id: 'scon-07', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di ONU',
    fragments:   ["L'ONU", 'è un\'organizzazione internazionale', 'fondata nel 1945', 'con lo scopo', 'di mantenere la pace e la sicurezza mondiale'],
    distractors: [
      ["La NATO", "L'UE"],
      ["è un'alleanza militare", "è un'unione economica"],
      ["fondata nel 1949", "fondata nel 1957"],
      ["con l'obiettivo", "con la missione"],
      ["di difendere i paesi membri dagli attacchi", "di promuovere il commercio tra gli stati europei"]
    ]},
  { id: 'scon-08', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di decolonizzazione',
    fragments:   ['La decolonizzazione', 'fu il processo', 'con cui i popoli colonizzati', 'ottennero l\'indipendenza', 'dalle potenze europee nel dopoguerra'],
    distractors: [
      ["La colonizzazione", "La globalizzazione"],
      ["fu la politica", "fu il fenomeno"],
      ["con cui le potenze europee", "con cui le multinazionali"],
      ["imposero il loro dominio", "estesero i loro mercati"],
      ["alle nazioni asiatiche durante il Rinascimento", "ai paesi emergenti durante la Guerra fredda"]
    ]},
  { id: 'scon-09', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di caduta del Muro di Berlino (1989)',
    fragments:   ['La caduta del Muro di Berlino', 'avvenne nel 1989', 'e segnò', 'la fine della divisione della Germania', 'e il crollo del blocco comunista in Europa'],
    distractors: [
      ["La costruzione del Muro di Berlino", "La Riunificazione tedesca"],
      ["ebbe luogo nel 1961", "fu proclamata nel 1990"],
      ["e rappresentò", "e causò"],
      ["l'inizio della divisione dell'Europa", "la nascita della Repubblica Democratica Tedesca"],
      ["e il consolidamento del blocco occidentale", "e la formazione dell'Unione Europea"]
    ]},
  { id: 'scon-10', subject: 'Storia', category: 'Storia Contemporanea', prompt: 'Definizione di globalizzazione',
    fragments:   ['La globalizzazione', 'è il processo', 'di integrazione economica, culturale e politica', 'tra i paesi del mondo', 'favorito da tecnologia e commercio internazionale'],
    distractors: [
      ["Il nazionalismo", "Il protezionismo"],
      ["è il fenomeno", "è la politica"],
      ["di separazione economica e culturale", "di isolamento politico e militare"],
      ["tra le nazioni più ricche", "tra i continenti emergenti"],
      ["ostacolato da dazi doganali e barriere commerciali", "imposto da organizzazioni internazionali"]
    ]},

  // ── Scienze della Terra: Geologia ─────────────────────────────────────────────
  { id: 'geol-01', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di roccia',
    fragments:   ['Una roccia', 'è un aggregato naturale', 'di uno o più minerali', 'che costituisce', 'la crosta terrestre'],
    distractors: [
      ["Un minerale", "Un sedimento"],
      ["è un composto chimico", "è un deposito organico"],
      ["di uno o più cristalli", "di uno o più fossili"],
      ["che forma", "che ricopre"],
      ["il mantello terrestre", "il nucleo terrestre"]
    ]},
  { id: 'geol-02', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di tettonica a placche',
    fragments:   ['La tettonica a placche', 'è la teoria', 'secondo cui la litosfera', 'è divisa in grandi placche rigide', 'che si muovono lentamente sul mantello'],
    distractors: [
      ["La deriva dei continenti", "L'isostasia"],
      ["è il modello", "è l'ipotesi"],
      ["secondo cui l'astenosfera", "secondo cui il nucleo esterno"],
      ["è formata da un'unica piastra", "è suddivisa in strati paralleli"],
      ["che oscillano intorno all'asse terrestre", "che ruotano attorno al nucleo"]
    ]},
  { id: 'geol-03', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di terremoto',
    fragments:   ['Un terremoto', 'è la vibrazione', 'improvvisa e rapida', 'della crosta terrestre', 'causata dal rilascio di energia lungo una faglia'],
    distractors: [
      ["Un vulcano", "Un maremoto"],
      ["è l'eruzione", "è la deformazione"],
      ["lenta e progressiva", "continua e profonda"],
      ["del mantello terrestre", "della placca oceanica"],
      ["causata dalla risalita di magma nel condotto", "prodotta dalla rotazione delle correnti convettive"]
    ]},
  { id: 'geol-04', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di vulcano',
    fragments:   ['Un vulcano', 'è una struttura geologica', 'attraverso cui', 'il magma risale', 'dalla crosta terrestre e fuoriesce in superficie'],
    distractors: [
      ["Una faglia", "Un geyser"],
      ["è una frattura della roccia", "è una sorgente idrotermale"],
      ["tramite cui", "attraverso la quale"],
      ["il vapore acqueo sale", "l'acqua sotterranea scende"],
      ["e forma depositi salini", "e produce vibrazioni sismiche"]
    ]},
  { id: 'geol-05', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di minerale',
    fragments:   ['Un minerale', 'è una sostanza inorganica', 'naturale', 'con composizione chimica definita', 'e struttura cristallina ordinata'],
    distractors: [
      ["Una roccia", "Un fossil"],
      ["è una sostanza organica", "è un composto sintetico"],
      ["artificiale", "biologica"],
      ["con formula variabile", "con struttura amorfa"],
      ["e forma irregolare e casuale", "e composizione isotopica uniforme"]
    ]},
  { id: 'geol-06', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di ciclo delle rocce',
    fragments:   ['Il ciclo delle rocce', 'è il processo geologico', 'attraverso cui le rocce', 'si trasformano continuamente', 'tra le forme magmatica, sedimentaria e metamorfica'],
    distractors: [
      ["Il ciclo dell'acqua", "Il ciclo del carbonio"],
      ["è il percorso idrologico", "è il processo biogeochimico"],
      ["attraverso cui i minerali", "attraverso cui gli ioni"],
      ["si depositano lentamente", "si ossidano progressivamente"],
      ["tra crosta, mantello e nucleo", "tra oceano, atmosfera e biosfera"]
    ]},
  { id: 'geol-07', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di erosione',
    fragments:   ["L'erosione", 'è il processo', 'con cui agenti esterni', 'come acqua e vento', 'consumano e trasportano il materiale roccioso'],
    distractors: [
      ["La sedimentazione", "La metamorfosi"],
      ["è il fenomeno", "è il ciclo"],
      ["con cui forze interne", "con cui il calore interno"],
      ["come pressione e temperatura", "come la gravità e il vulcanismo"],
      ["depositano e compattano i sedimenti", "fondono e solidificano le rocce"]
    ]},
  { id: 'geol-08', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di faglia',
    fragments:   ['Una faglia', 'è una frattura', 'nella crosta terrestre', 'lungo la quale', 'i blocchi di roccia si spostano relativamente tra loro'],
    distractors: [
      ["Una piega", "Una dorsale"],
      ["è una deformazione", "è un sollevamento"],
      ["nel mantello terrestre", "nell'astenosfera"],
      ["in corrispondenza della quale", "attorno alla quale"],
      ["le placche ruotano senza spostarsi", "il magma fuoriesce in superficie"]
    ]},
  { id: 'geol-09', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di fossilizzazione',
    fragments:   ['La fossilizzazione', 'è il processo', 'attraverso cui i resti di organismi', 'vengono conservati', 'nelle rocce sedimentarie nel tempo'],
    distractors: [
      ["La mineralizzazione", "La cristallizzazione"],
      ["è il meccanismo", "è la reazione"],
      ["attraverso cui i minerali disciolti", "attraverso cui i gas atmosferici"],
      ["vengono precipitati", "vengono assorbiti"],
      ["nei depositi vulcanici in millenni", "nelle argille compatte per pressione"]
    ]},
  { id: 'geol-10', subject: 'Scienze della Terra', category: 'Geologia', prompt: 'Definizione di scala Richter',
    fragments:   ['La scala Richter', 'è una scala logaritmica', 'che misura', "la magnitudo di un terremoto", "in base all'ampiezza delle onde sismiche registrate"],
    distractors: [
      ["La scala Mercalli", "La scala Beaufort"],
      ["è una scala lineare", "è una scala empirica"],
      ["che valuta", "che classifica"],
      ["l'intensità percepita di un terremoto", "la velocità del vento in un uragano"],
      ["in base ai danni agli edifici", "in base alla profondità dell'ipocentro"]
    ]},

  // ── Scienze della Terra: Astronomia ───────────────────────────────────────────
  { id: 'ast-01', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di anno luce',
    fragments:   ["L'anno luce", 'è la distanza', 'percorsa dalla luce', 'in un anno', 'nel vuoto (circa 9,46 × 10¹² km)'],
    distractors: [
      ["Il parsec", "L'unità astronomica"],
      ["è il tempo", "è la velocità"],
      ["emessa da una stella", "riflessa da un pianeta"],
      ["in un secondo", "in un giorno solare"],
      ["nel mezzo interstellare (circa 3,26 al)", "nell'atmosfera terrestre (circa 300 km/s)"]
    ]},
  { id: 'ast-02', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di buco nero',
    fragments:   ['Un buco nero', 'è una regione dello spazio', 'con gravità talmente intensa', 'che nemmeno la luce', 'riesce a sfuggire dalla sua superficie'],
    distractors: [
      ["Una stella di neutroni", "Una nana bianca"],
      ["è un oggetto celeste", "è una nebulosa"],
      ["con campo magnetico estremo", "con densità insolitamente bassa"],
      ["che solo i neutrini", "che solo la materia oscura"],
      ["percorrono senza essere deflessi", "attraversa senza interagire"]
    ]},
  { id: 'ast-03', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di sistema solare',
    fragments:   ['Il sistema solare', 'è il sistema planetario', 'formato dal Sole', 'e da tutti i corpi celesti', 'che orbitano attorno ad esso per gravità'],
    distractors: [
      ["La Via Lattea", "Il sistema stellare"],
      ["è la galassia spirale", "è il gruppo di stelle"],
      ["formato da miliardi di stelle", "formato da ammassi globulari"],
      ["e da tutto ciò che orbita", "e dai pianeti extrasolari"],
      ["attorno al centro galattico", "al di fuori dell'eliosfera"]
    ]},
  { id: 'ast-04', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Prima legge di Keplero',
    fragments:   ['La prima legge di Keplero', 'afferma che i pianeti', 'orbitano attorno al Sole', 'seguendo traiettorie ellittiche', 'con il Sole in uno dei due fuochi'],
    distractors: [
      ["La seconda legge di Keplero", "La legge di gravitazione universale"],
      ["afferma che le comete", "afferma che le stelle"],
      ["ruotano intorno alla Terra", "si muovono in linea retta"],
      ["seguendo traiettorie circolari", "percorrendo orbite paraboliche"],
      ["con la Terra al centro", "con il baricentro al vertice"]
    ]},
  { id: 'ast-05', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Seconda legge di Keplero (delle aree)',
    fragments:   ['La seconda legge di Keplero', 'afferma che il raggio vettore', 'che unisce Sole e pianeta', 'spazza aree uguali', 'in tempi uguali'],
    distractors: [
      ["La prima legge di Keplero", "La terza legge di Keplero"],
      ["afferma che il vettore velocità", "afferma che la forza gravitazionale"],
      ["che unisce pianeta e Luna", "che collega Terra e Sole"],
      ["percorre angoli uguali", "compie rotazioni uguali"],
      ["in spazi uguali", "in orbite uguali"]
    ]},
  { id: 'ast-06', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Terza legge di Keplero',
    fragments:   ['La terza legge di Keplero', 'afferma che il quadrato del periodo orbitale', 'è proporzionale', 'al cubo del semiasse maggiore', "dell'orbita del pianeta"],
    distractors: [
      ["La seconda legge di Keplero", "La legge di gravitazione"],
      ["afferma che il cubo del raggio vettore", "afferma che la radice del periodo orbitale"],
      ["è inversamente proporzionale", "è uguale"],
      ["al quadrato della velocità", "alla somma dei semiassi"],
      ["dell'ellisse percorsa", "della traiettoria parabolica"]
    ]},
  { id: 'ast-07', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di galassia',
    fragments:   ['Una galassia', 'è un enorme sistema', 'di stelle, gas e polveri', 'tenuto insieme dalla gravità', 'che contiene miliardi di stelle'],
    distractors: [
      ["Una nebulosa", "Un ammasso stellare"],
      ["è una piccola nube", "è una struttura"],
      ["di pianeti e satelliti", "di soli buchi neri e quasar"],
      ["tenuta insieme dalla pressione", "attratta dalla forza magnetica"],
      ["e composta da pochi milioni di atomi", "che ospita al massimo alcune centinaia di stelle"]
    ]},
  { id: 'ast-08', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di Big Bang',
    fragments:   ['Il Big Bang', 'è il modello cosmologico', 'secondo cui l\'Universo', 'ebbe origine', 'da uno stato iniziale di densità e temperatura infinite'],
    distractors: [
      ["La teoria dello stato stazionario", "Il modello inflazionario"],
      ["è la teoria astronomica", "è l'ipotesi fisica"],
      ["secondo cui le galassie", "secondo cui la materia oscura"],
      ["si espandono uniformemente", "si contrae continuamente"],
      ["da uno stato di equilibrio eterno", "da fluttuazioni quantistiche nel vuoto"]
    ]},
  { id: 'ast-09', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di stella',
    fragments:   ['Una stella', 'è una sfera di plasma', 'tenuta insieme dalla gravità', 'al cui interno avvengono', 'reazioni di fusione nucleare'],
    distractors: [
      ["Un pianeta", "Una nebulosa"],
      ["è una massa di roccia e ghiaccio", "è una nube di gas e polvere"],
      ["trattenuta dalla pressione", "dispersa dalla forza centrifuga"],
      ["sulla cui superficie avvengono", "nella cui atmosfera si producono"],
      ["reazioni chimiche di ossidazione", "fenomeni di riflessione luminosa"]
    ]},
  { id: 'ast-10', subject: 'Scienze della Terra', category: 'Astronomia', prompt: 'Definizione di eclisse solare',
    fragments:   ["Un'eclisse solare", 'avviene quando la Luna', 'si interpone tra il Sole e la Terra', 'proiettando la sua ombra', 'su una parte della superficie terrestre'],
    distractors: [
      ["Un'eclisse lunare", "Un transito planetario"],
      ["avviene quando la Terra", "avviene quando il Sole"],
      ["si posiziona tra la Luna e Giove", "si avvicina al punto di afelio"],
      ["proiettando il suo cono d'ombra", "riflettendo la sua luce"],
      ["sulla superficie della Luna", "sull'intera emisfero notturno"]
    ]},

  // ── Educazione Civica: Economia Civica ────────────────────────────────────────
  { id: 'econ-01', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di PIL (Prodotto Interno Lordo)',
    fragments:   ['Il PIL', 'è la misura', 'del valore totale', 'di beni e servizi prodotti', 'in un paese in un anno'],
    distractors: [
      ["Il PNL", "L'inflazione"],
      ["è il calcolo", "è l'indice"],
      ["del reddito pro capite", "del deficit pubblico"],
      ["di materie prime importate", "di imposte e tasse pagate"],
      ["da un'impresa in un trimestre", "da una famiglia in un mese"]
    ]},
  { id: 'econ-02', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di inflazione',
    fragments:   ["L'inflazione", 'è l\'aumento generalizzato', 'e continuato', 'del livello dei prezzi', 'che riduce il potere d\'acquisto della moneta'],
    distractors: [
      ["La deflazione", "La stagflazione"],
      ["è la diminuzione generalizzata", "è la variazione irregolare"],
      ["e temporaneo", "e improvviso"],
      ["del costo della vita", "del tasso di interesse"],
      ["che aumenta il valore reale del risparmio", "che mantiene stabile il valore del debito"]
    ]},
  { id: 'econ-03', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di mercato',
    fragments:   ['Il mercato', 'è il luogo', 'fisico o virtuale', 'in cui domanda e offerta', 'si incontrano per determinare prezzi e quantità'],
    distractors: [
      ["La borsa valori", "Il monopolio"],
      ["è il sistema", "è il meccanismo"],
      ["economico o finanziario", "statale o privato"],
      ["in cui i produttori e lo Stato", "in cui le banche centrali"],
      ["fissano i prezzi unilateralmente", "regolano la circolazione monetaria"]
    ]},
  { id: 'econ-04', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di imposte dirette e indirette',
    fragments:   ['Le imposte dirette', 'colpiscono il reddito', 'o il patrimonio del contribuente', 'mentre le imposte indirette', 'gravano sui consumi e sugli scambi'],
    distractors: [
      ["Le imposte progressive", "Le tasse e i tributi"],
      ["colpiscono il fatturato", "sono versamenti volontari"],
      ["o la produzione industriale", "o le donazioni dei privati"],
      ["mentre le imposte proporzionali", "mentre le accise e i dazi"],
      ["aumentano al crescere del reddito", "finanziano solo i servizi locali"]
    ]},
  { id: 'econ-05', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di monopolio',
    fragments:   ['Un monopolio', 'è una struttura di mercato', 'in cui un unico venditore', 'controlla l\'intera offerta', 'di un bene o servizio'],
    distractors: [
      ["Un oligopolio", "Una concorrenza perfetta"],
      ["è una forma di governo", "è un sistema produttivo"],
      ["in cui pochi acquirenti", "in cui molti produttori"],
      ["controllano tutta la domanda", "suddividono equamente i profitti"],
      ["di un settore economico", "di materie prime strategiche"]
    ]},
  { id: 'econ-06', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di stato sociale (welfare state)',
    fragments:   ['Il welfare state', 'è il modello di Stato', 'che garantisce ai cittadini', 'servizi essenziali', 'come sanità, istruzione e previdenza sociale'],
    distractors: [
      ["Il liberismo", "Lo Stato minimo"],
      ["è il sistema economico", "è la forma di governo"],
      ["che offre alle imprese", "che concede ai comuni"],
      ["agevolazioni fiscali", "sussidi ai partiti"],
      ["come detrazioni, IVA agevolata e fondi europei", "come autonomia legislativa e finanziaria completa"]
    ]},
  { id: 'econ-07', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di debito pubblico',
    fragments:   ['Il debito pubblico', 'è il totale', 'dei prestiti contratti', 'dallo Stato', 'per finanziare le proprie spese nel tempo'],
    distractors: [
      ["Il deficit pubblico", "La spesa pubblica"],
      ["è la differenza", "è il bilancio"],
      ["degli investimenti esteri", "delle entrate tributarie"],
      ["dalle imprese private", "dagli enti locali"],
      ["in un singolo esercizio finanziario", "attraverso le privatizzazioni delle aziende pubbliche"]
    ]},
  { id: 'econ-08', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di Unione Europea',
    fragments:   ["L'Unione Europea", 'è un\'organizzazione sovranazionale', 'che riunisce', 'i paesi europei aderenti', 'in un mercato unico e una moneta comune'],
    distractors: [
      ["Il Consiglio d'Europa", "La NATO"],
      ["è un'alleanza militare", "è un'organizzazione intergovernativa"],
      ["che coordina", "che oppone"],
      ["le democrazie del mondo intero", "le nazioni non allineate"],
      ["in una difesa comune e una politica estera unificata", "in un'area di libero scambio senza integrazione politica"]
    ]},
  { id: 'econ-09', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di concorrenza di mercato',
    fragments:   ['La concorrenza di mercato', 'è la situazione', 'in cui più imprese', 'competono tra loro', 'per conquistare clienti e quote di mercato'],
    distractors: [
      ["Il monopolio di mercato", "La pianificazione economica"],
      ["è il regime", "è la condizione"],
      ["in cui un solo produttore", "in cui le imprese pubbliche"],
      ["coopera con i consumatori", "fissano accordi di prezzo"],
      ["per stabilire prezzi uniformi", "per eliminare la domanda privata"]
    ]},
  { id: 'econ-10', subject: 'Educazione Civica', category: 'Economia Civica', prompt: 'Definizione di banca centrale',
    fragments:   ['La banca centrale', 'è l\'istituzione', 'che gestisce la politica monetaria', 'controllando', 'la quantità di moneta e i tassi di interesse'],
    distractors: [
      ["La banca commerciale", "Il fondo monetario"],
      ["è l'organismo", "è l'agenzia"],
      ["che eroga crediti ai privati", "che regola il commercio estero"],
      ["distribuendo", "calcolando"],
      ["i dividendi agli azionisti", "le riserve auree degli stati membri"]
    ]},

  // ── Filosofia: Filosofia Antica e Medievale ───────────────────────────────────
  { id: 'fil-01', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di filosofia secondo Aristotele',
    fragments:   ['Secondo Aristotele', 'la filosofia', 'è la scienza', 'dell\'essere in quanto essere', 'e delle cause prime di tutta la realtà'],
    distractors: [
      ["Secondo Platone", "Secondo Socrate"],
      ["la metafisica", "la dialettica"],
      ["è la dottrina", "è il metodo"],
      ["del divenire e del cambiamento", "delle idee e delle forme"],
      ["e dei principi matematici del cosmo", "e dei miti fondativi della città"]
    ]},
  { id: 'fil-02', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di maieutica socratica',
    fragments:   ['La maieutica socratica', 'è il metodo filosofico di Socrate', 'che attraverso il dialogo', 'aiuta l\'interlocutore', 'a far emergere la verità già presente in sé'],
    distractors: [
      ["La dialettica platonica", "La retorica sofistica"],
      ["è la tecnica argomentativa di Aristotele", "è il metodo persuasivo dei sofisti"],
      ["che attraverso la dimostrazione", "che attraverso la seduzione verbale"],
      ["guida lo studente", "convince il popolo"],
      ["ad apprendere nozioni dall'esterno", "ad accettare la verità imposta dal maestro"]
    ]},
  { id: 'fil-03', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di Iperuranio platonico',
    fragments:   ["L'Iperuranio", "è il mondo delle Idee", 'nel pensiero di Platone', 'eterno e immutabile', 'di cui il mondo sensibile è semplice copia imperfetta'],
    distractors: [
      ["Il cosmo aristotelico", "Il mondo sensibile"],
      ["è la sfera dei fenomeni", "è la realtà materiale"],
      ["nel pensiero di Socrate", "nel pensiero degli Stoici"],
      ["temporaneo e mutevole", "infinito e indeterminato"],
      ["di cui le Idee sono astrazioni mentali", "di cui l'anima è manifestazione corporea"]
    ]},
  { id: 'fil-04', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di sillogismo aristotelico',
    fragments:   ['Il sillogismo', 'è un ragionamento deduttivo', 'composto da due premesse', 'da cui si ricava', 'una conclusione necessariamente vera'],
    distractors: [
      ["L'induzione", "Il paradosso"],
      ["è un ragionamento induttivo", "è un procedimento retorico"],
      ["composto da molte osservazioni particolari", "composto da due tesi opposte"],
      ["da cui si generalizza", "da cui si dimostra"],
      ["una legge empirica probabile", "una contraddizione irrisolvibile"]
    ]},
  { id: 'fil-05', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di epicureismo',
    fragments:   ["L'epicureismo", 'è la dottrina filosofica di Epicuro', 'secondo cui il fine della vita', 'è la ricerca del piacere', 'inteso come assenza di dolore e turbamento'],
    distractors: [
      ["Lo stoicismo", "Il cinismo"],
      ["è l'insegnamento filosofico di Zenone", "è la pratica filosofica di Diogene"],
      ["secondo cui lo scopo del saggio", "secondo cui il modello di vita"],
      ["è vivere secondo la virtù", "è rifiutare ogni convenzione sociale"],
      ["intesa come controllo delle passioni", "inteso come ritiro ascetico dalla realtà"]
    ]},
  { id: 'fil-06', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di stoicismo',
    fragments:   ['Lo stoicismo', 'è la filosofia fondata da Zenone di Cizio', 'che insegna a vivere', 'secondo natura e ragione', 'accettando con indifferenza ciò che non dipende da noi'],
    distractors: [
      ["L'epicureismo", "Lo scetticismo"],
      ["è la scuola ispirata da Epicuro", "è il metodo introdotto da Pirrone"],
      ["che esorta a godere", "che invita a dubitare"],
      ["secondo piacere e istinto", "di ogni certezza e verità"],
      ["rifiutando ogni forma di virtù morale", "sospendendo il giudizio su tutto"]
    ]},
  { id: 'fil-07', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di scolastica medievale',
    fragments:   ['La scolastica', 'è la corrente filosofica medievale', 'che cercava di conciliare', 'la fede cristiana', 'con la ragione filosofica aristotelica'],
    distractors: [
      ["Il misticismo", "L'umanesimo"],
      ["è la tradizione mistica medievale", "è il movimento culturale rinascimentale"],
      ["che cercava di separare", "che cercava di sostituire"],
      ["la ragione dalla rivelazione", "la filosofia con la teologia"],
      ["con il platonismo neopitagorico", "con la tradizione ebraica e islamica"]
    ]},
  { id: 'fil-08', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di cosmologia presocratica',
    fragments:   ['I filosofi presocratici', 'furono i primi pensatori greci', 'che cercarono', 'una spiegazione razionale', "dell'origine e della struttura del cosmo"],
    distractors: [
      ["I filosofi sofisti", "I filosofi ellenistici"],
      ["furono i retori greci", "furono i saggio dell'età romana"],
      ["che inventarono", "che rifiutarono"],
      ["una spiegazione mitologica", "ogni interpretazione"],
      ["della morale e del diritto", "dell'anima e della virtù"]
    ]},
  { id: 'fil-09', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di ontologia',
    fragments:   ["L'ontologia", 'è la branca della filosofia', 'che studia', "l'essere in quanto tale", 'e le categorie fondamentali della realtà'],
    distractors: [
      ["L'epistemologia", "La gnoseologia"],
      ["è la parte della filosofia", "è la disciplina filosofica"],
      ["che nega", "che misura"],
      ["la conoscenza e le sue condizioni", "il linguaggio e il significato"],
      ["e le strutture logiche del pensiero", "e i fondamenti della morale"]
    ]},
  { id: 'fil-10', subject: 'Filosofia', category: 'Filosofia Antica e Medievale', prompt: 'Definizione di etica nella filosofia antica',
    fragments:   ["L'etica", 'è la branca della filosofia', 'che si occupa', 'del comportamento morale', 'e dei criteri per distinguere il bene dal male'],
    distractors: [
      ["L'estetica", "La politica"],
      ["è la disciplina della filosofia", "è la scienza filosofica"],
      ["che ignora", "che misura"],
      ["la bellezza e l'arte", "il potere e lo Stato"],
      ["e dei canoni per giudicare il sublime", "e delle forme di governo giuste"]
    ]},

  // ── Filosofia: Filosofia Moderna e Contemporanea ──────────────────────────────
  { id: 'fim-01', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione del cogito cartesiano',
    fragments:   ['Il cogito di Cartesio', 'è il principio', '"Penso, dunque sono"', 'che fonda la certezza', "dell'esistenza del soggetto pensante"],
    distractors: [
      ["Il dubbio metodico", "Il cogito kantiano"],
      ["è la tesi", 'è il metodo'],
      ['"Agisco, dunque esisto"', '"Sento, dunque sono"'],
      ["che mette in crisi la certezza", "che dimostra la necessità"],
      ["del mondo materiale e degli altri", "dell'esistenza di Dio e dell'anima"]
    ]},
  { id: 'fim-02', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di imperativo categorico kantiano',
    fragments:   ["L'imperativo categorico di Kant", 'è il principio morale supremo', 'che impone di agire', 'solo secondo massime', 'che si possano universalizzare'],
    distractors: [
      ["L'imperativo ipotetico", "Il principio utilitaristico"],
      ["è la norma giuridica fondamentale", "è la regola morale relativa"],
      ["che suggerisce di fare", "che permette di agire"],
      ["solo secondo istinti", "solo secondo il proprio interesse"],
      ["che producano il massimo piacere individuale", "che siano condivisi dalla propria cultura"]
    ]},
  { id: 'fim-03', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di dialettica hegeliana',
    fragments:   ['La dialettica hegeliana', 'è il metodo del pensiero di Hegel', 'basato sui momenti di', 'tesi, antitesi e sintesi', 'attraverso cui lo Spirito si realizza nella storia'],
    distractors: [
      ["La dialettica marxista", "La dialettica socratica"],
      ["è la logica materialistica di Marx", "è il dialogo maieutico di Socrate"],
      ["fondata sulle fasi di", "articolata nelle tappe di"],
      ["struttura, sovrastruttura e rivoluzione", "domanda, risposta e contraddizione"],
      ["attraverso cui le classi sociali si emancipano", "attraverso cui la verità emerge dal confronto"]
    ]},
  { id: 'fim-04', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di materialismo storico di Marx',
    fragments:   ['Il materialismo storico', 'è la teoria di Marx', 'secondo cui la struttura economica', 'determina la sovrastruttura', 'politica, giuridica e culturale della società'],
    distractors: [
      ["L'idealismo storico", "Il positivismo sociale"],
      ["è la dottrina di Hegel", "è la visione di Comte"],
      ["secondo cui lo Spirito assoluto", "secondo cui la scienza"],
      ["produce la struttura", "guida la sovrastruttura"],
      ["religiosa, artistica e scientifica", "economica, tecnica e biologica"]
    ]},
  { id: 'fim-05', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di volontà di potenza in Nietzsche',
    fragments:   ['La volontà di potenza', 'è il concetto centrale di Nietzsche', 'che indica la tendenza', 'di ogni essere vivente', 'ad affermare e potenziare se stesso'],
    distractors: [
      ["La volontà di vivere", "Il principio di piacere"],
      ["è il tema fondamentale di Schopenhauer", "è il meccanismo centrale di Freud"],
      ["che descrive l'impulso", "che rappresenta il desiderio"],
      ["di ogni organismo inerte", "di ogni sistema fisico"],
      ["a conservare lo stato di quiete", "a ricercare il soddisfacimento istintuale"]
    ]},
  { id: 'fim-06', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di esistenzialismo',
    fragments:   ["L'esistenzialismo", 'è una corrente filosofica', 'che pone al centro', "l'esistenza concreta dell'individuo", 'e la sua libertà di scelta e responsabilità'],
    distractors: [
      ["Il positivismo", "Lo strutturalismo"],
      ["è una scuola scientifica", "è un metodo analitico"],
      ["che colloca al centro", "che privilegia"],
      ["le leggi universali della natura", "le strutture impersonali del linguaggio"],
      ["e la necessità deterministica dei fenomeni", "e i meccanismi inconsci della mente"]
    ]},
  { id: 'fim-07', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di utilitarismo',
    fragments:   ["L'utilitarismo", 'è la dottrina morale', 'elaborata da Bentham e Mill', 'secondo cui un\'azione è giusta', 'se produce il massimo benessere per il maggior numero'],
    distractors: [
      ["Il deontologismo", "Il contrattualismo"],
      ["è la teoria politica", "è la filosofia del diritto"],
      ["elaborata da Kant e Ross", "elaborata da Rawls e Locke"],
      ["secondo cui un'azione è corretta", "secondo cui una norma è legittima"],
      ["se rispetta un dovere morale assoluto", "se è accettata da tutti in condizioni di equità"]
    ]},
  { id: 'fim-08', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di fenomenologia husserliana',
    fragments:   ['La fenomenologia', 'è il metodo filosofico di Husserl', 'che analizza', 'i fenomeni della coscienza', 'mettendo tra parentesi il mondo esterno (epoché)'],
    distractors: [
      ["L'ermeneutica", "La filosofia analitica"],
      ["è il metodo interpretativo di Gadamer", "è il programma filosofico di Russell"],
      ["che costruisce", "che decostruisce"],
      ["i testi e la tradizione culturale", "i fondamenti del linguaggio e della logica"],
      ["riducendo il soggetto alla sua storia", "eliminando ogni riferimento alla soggettività"]
    ]},
  { id: 'fim-09', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di empirismo',
    fragments:   ["L'empirismo", 'è la corrente filosofica', 'secondo cui tutta la conoscenza', 'deriva dall\'esperienza sensibile', 'e non da principi innati della ragione'],
    distractors: [
      ["Il razionalismo", "L'idealismo"],
      ["è la tradizione filosofica", "è la scuola di pensiero"],
      ["secondo cui la conoscenza autentica", "secondo cui la realtà vera"],
      ["deriva dalla ragione pura", "è prodotto della mente"],
      ["e non dall'osservazione del mondo sensibile", "e non può essere conosciuta attraverso i sensi"]
    ]},
  { id: 'fim-10', subject: 'Filosofia', category: 'Filosofia Moderna e Contemporanea', prompt: 'Definizione di contratto sociale (Rousseau)',
    fragments:   ['Il contratto sociale', 'è il patto fondativo', 'con cui gli individui', 'cedono parte della loro libertà naturale', 'per vivere in una comunità politica organizzata'],
    distractors: [
      ["Lo stato di natura", "Il contratto originario"],
      ["è l'accordo economico", "è il vincolo giuridico"],
      ["con cui le classi sociali", "con cui i governanti"],
      ["ottengono privilegi dai sudditi", "impongono obblighi ai cittadini"],
      ["per mantenere il potere assoluto del sovrano", "per garantire i diritti della proprietà privata"]
    ]},

  // ── Letteratura Italiana: Dalle Origini al Rinascimento ───────────────────────
  { id: 'lit-01', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Dolce Stil Novo',
    fragments:   ['Il Dolce Stil Novo', 'è un movimento poetico', 'del XIII secolo', 'che celebra', "la donna come figura angelicata e via verso Dio"],
    distractors: [
      ["Il Trobar clus", "La poesia siciliana"],
      ["è una scuola letteraria", "è un genere poetico"],
      ["del XII secolo", "del XIV secolo"],
      ["che respinge", "che critica"],
      ["la guerra come prova di valore", "l'amore come passione terrena e sensuale"]
    ]},
  { id: 'lit-02', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Struttura della Divina Commedia di Dante',
    fragments:   ['La Divina Commedia', 'è un poema allegorico', 'di Dante Alighieri', 'diviso in tre cantiche', 'Inferno, Purgatorio e Paradiso'],
    distractors: [
      ["Il Decameron", "La Commedia dell'arte"],
      ["è un romanzo realistico", "è una raccolta di novelle"],
      ["di Boccaccio", "di Petrarca"],
      ["suddiviso in dieci giornate", "articolato in cinque atti"],
      ["Prologo, Svolgimento e Epilogo", "Amore, Morte e Redenzione"]
    ]},
  { id: 'lit-03', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Canzoniere di Petrarca',
    fragments:   ['Il Canzoniere', 'è la raccolta di poesie', 'di Francesco Petrarca', 'che narra', "l'amore per Laura e il conflitto tra amore terreno e aspirazione spirituale"],
    distractors: [
      ["Il Decameron", "Il Convivio"],
      ["è il trattato filosofico", "è la raccolta di novelle"],
      ["di Dante Alighieri", "di Giovanni Boccaccio"],
      ["che traduce", "che ignora"],
      ["il viaggio nell'aldilà e la redenzione dell'anima", "il valore della conoscenza contro la fortuna"]
    ]},
  { id: 'lit-04', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Decameron di Boccaccio',
    fragments:   ['Il Decameron', 'è una raccolta di cento novelle', 'di Giovanni Boccaccio', 'narrate da dieci giovani', 'in fuga dalla peste del 1348'],
    distractors: [
      ["Il Canzoniere", "Il Novellino"],
      ["è un poema di sessanta canti", "è un romanzo di tredici capitoli"],
      ["di Francesco Petrarca", "di Franco Sacchetti"],
      ["raccontate da un unico narratore", "recitate da attori di piazza"],
      ["durante una guerra civile", "in un convento durante il Giubileo"]
    ]},
  { id: 'lit-05', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di umanesimo letterario',
    fragments:   ["L'umanesimo", 'è il movimento culturale', 'tra XIV e XV secolo', 'che riscoprì', 'i testi classici latini e greci ponendo l\'uomo al centro'],
    distractors: [
      ["Il Rinascimento maturo", "La Scolastica medievale"],
      ["è la corrente artistica", "è la tradizione teologica"],
      ["tra XVI e XVII secolo", "tra XII e XIII secolo"],
      ["che inventò", "che rifiutò"],
      ["la stampa a caratteri mobili e i vernacoli", "la letteratura volgare e la filosofia pagana"]
    ]},
  { id: 'lit-06', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Orlando Furioso di Ariosto',
    fragments:   ["L'Orlando Furioso", 'è il poema cavalleresco', 'di Ludovico Ariosto', 'che narra la pazzia di Orlando', "per amore di Angelica tra battaglie e avventure fantastiche"],
    distractors: [
      ["La Gerusalemme Liberata", "Il Morgante"],
      ["è il poema epico-cristiano", "è il poema comico-burlesco"],
      ["di Torquato Tasso", "di Luigi Pulci"],
      ["che racconta la crociata per liberare il Santo Sepolcro", "che parodia le imprese di Carlo Magno"],
      ["dalla prigionia dei Saraceni a Gerusalemme", "contro i Turchi ottomani in Oriente"]
    ]},
  { id: 'lit-07', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Il Principe di Machiavelli',
    fragments:   ['Il Principe', 'è il trattato politico', 'di Niccolò Machiavelli', 'che analizza', 'come un principe deve conquistare e mantenere il potere'],
    distractors: [
      ["La Repubblica", "Il Cortegiano"],
      ["è il dialogo filosofico", "è il manuale di comportamento"],
      ["di Platone", "di Baldassarre Castiglione"],
      ["che inventa", "che ignora"],
      ["come i cittadini devono partecipare al governo", "come il perfetto gentiluomo deve comportarsi a corte"]
    ]},
  { id: 'lit-08', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di endecasillabo',
    fragments:   ["L'endecasillabo", 'è il verso', 'di undici sillabe', 'con accento obbligatorio', 'sulla decima sillaba'],
    distractors: [
      ["Il settenario", "L'ottonario"],
      ["è la strofa", "è il metro"],
      ["di sette sillabe", "di otto sillabe"],
      ["con cesura obbligatoria", "con rima alternata"],
      ["sulla quarta sillaba", "sulla quinta sillaba"]
    ]},
  { id: 'lit-09', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di terza rima dantesca',
    fragments:   ['La terza rima', 'è lo schema metrico', 'usato da Dante nella Commedia', 'in cui terzine di endecasillabi', 'si concatenano secondo lo schema ABA BCB CDC'],
    distractors: [
      ["L'ottava rima", "La canzone petrarchesca"],
      ["è il modello strofico", "è la struttura metrica"],
      ["usato da Ariosto nell'Orlando", "usata da Petrarca nel Canzoniere"],
      ["in cui ottave di endecasillabi", "in cui quartine e sestine"],
      ["si alternano secondo lo schema ABABABCC", "si compongono secondo lo schema ABBA ABBA CDE CDE"]
    ]},
  { id: 'lit-10', subject: 'Letteratura Italiana', category: 'Dalle Origini al Rinascimento', prompt: 'Definizione di Francesco Petrarca e il petrarchismo',
    fragments:   ['Il petrarchismo', 'è la corrente poetica', 'ispirata al Canzoniere di Petrarca', 'che diffuse', "il modello della lirica amorosa in tutta Europa"],
    distractors: [
      ["Il dantismo", "Il boccaccismo"],
      ["è il filone narrativo", "è la tradizione prosastica"],
      ["ispirato alla Commedia di Dante", "ispirata al Decameron di Boccaccio"],
      ["che impose", "che rifiutò"],
      ["il poema allegorico come forma dominante", "la novella come genere della modernità"]
    ]},

  // ── Letteratura Italiana: Dal Romanticismo al Novecento ───────────────────────
  { id: 'li2-01', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di Romanticismo italiano',
    fragments:   ['Il Romanticismo italiano', 'è il movimento letterario', 'del primo Ottocento', 'che esaltò', 'sentimento, patria, storia e popolo contro il classicismo'],
    distractors: [
      ["Il Verismo italiano", "Il Decadentismo italiano"],
      ["è la corrente narrativa", "è il movimento poetico"],
      ["del tardo Ottocento", "del primo Novecento"],
      ["che descrisse", "che celebrò"],
      ["la realtà degli umili in modo oggettivo", "il simbolo, il mistero e l'irrazionale"]
    ]},
  { id: 'li2-02', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di I Promessi Sposi di Manzoni',
    fragments:   ['I Promessi Sposi', 'è il romanzo storico', 'di Alessandro Manzoni', 'ambientato nel Seicento lombardo', 'che narra le vicende di Renzo e Lucia'],
    distractors: [
      ["I Malavoglia", "Le ultime lettere di Jacopo Ortis"],
      ["è il romanzo verista", "è il romanzo epistolare"],
      ["di Giovanni Verga", "di Ugo Foscolo"],
      ["ambientato in Sicilia a fine Ottocento", "ambientato a Venezia e in esilio"],
      ["che racconta la storia di 'Ntoni e la famiglia Toscano", "che esprime il dramma del patriota romantico"]
    ]},
  { id: 'li2-03', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di verismo letterario',
    fragments:   ['Il verismo', 'è la corrente letteraria', 'italiana del tardo Ottocento', 'che rappresenta', 'la realtà delle classi umili con tecnica impersonale'],
    distractors: [
      ["Il naturalismo", "Il decadentismo"],
      ["è il movimento narrativo", "è la tendenza poetica"],
      ["francese del tardo Ottocento", "europea del primo Novecento"],
      ["che inventa", "che evoca"],
      ["la realtà borghese con distacco scientifico", "stati d'animo e simboli attraverso il linguaggio musicale"]
    ]},
  { id: 'li2-04', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di I Malavoglia di Verga',
    fragments:   ['I Malavoglia', 'è il romanzo verista', 'di Giovanni Verga', 'che narra', 'la tragica lotta di una famiglia siciliana contro la povertà e il destino'],
    distractors: [
      ["Mastro-don Gesualdo", "Una vita"],
      ["è il romanzo borghese", "è il romanzo di formazione"],
      ["di Luigi Capuana", "di Italo Svevo"],
      ["che ignora", "che traduce"],
      ["l'ascesa e la caduta di un self-made man siciliano", "l'inettitudine di un intellettuale triestino moderno"]
    ]},
  { id: 'li2-05', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di decadentismo',
    fragments:   ['Il decadentismo', 'è il movimento letterario', 'di fine Ottocento e inizio Novecento', 'che celebra', 'il mistero, la bellezza malata e il simbolo contro il positivismo'],
    distractors: [
      ["Il futurismo", "Il verismo"],
      ["è la corrente artistica", "è la scuola narrativa"],
      ["degli anni Venti del Novecento", "del tardo Ottocento"],
      ["che esalta", "che riproduce"],
      ["la macchina, la velocità e la guerra", "la vita delle classi lavoratrici con fredda oggettività"]
    ]},
  { id: 'li2-06', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di Giacomo Leopardi e il pessimismo cosmico',
    fragments:   ['Il pessimismo cosmico di Leopardi', 'è la visione filosofica', 'della sua maturità', 'secondo cui', 'la sofferenza è condizione universale di tutta la natura'],
    distractors: [
      ["Il pessimismo storico di Leopardi", "Il titanismo leopardiano"],
      ["è la fase intellettuale", "è l'atteggiamento eroico"],
      ["della sua giovinezza", "degli anni della conversione"],
      ["contro cui", "grazie al quale"],
      ["i mali derivano dalla civiltà e non dalla natura", "il poeta sfida il destino con la ribellione"]
    ]},
  { id: 'li2-07', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di futurismo letterario',
    fragments:   ['Il futurismo', 'è il movimento artistico fondato da Marinetti', 'che esaltava', 'velocità, macchina e guerra', 'rifiutando la tradizione e la sintassi convenzionale'],
    distractors: [
      ["Il crepuscolarismo", "Il simbolismo"],
      ["è la corrente poetica ispirata da Gozzano", "è il movimento lirico di Baudelaire"],
      ["che celebrava", "che preferiva"],
      ["la vita grigia e quotidiana del borgo", "il sogno, il musicale e l'oscuro"],
      ["esaltando la semplicità e il pudore della parola", "usando il verso libero e le sinestesie"]
    ]},
  { id: 'li2-08', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di La coscienza di Zeno di Svevo',
    fragments:   ['La coscienza di Zeno', 'è il romanzo di Italo Svevo', 'scritto in forma di memoir psicoanalitico', 'che narra', "l'inettitudine e le autoinganni di Zeno Cosini"],
    distractors: [
      ["Il fu Mattia Pascal", "Gli indifferenti"],
      ["è il romanzo di Luigi Pirandello", "è il romanzo di Alberto Moravia"],
      ["scritto come dramma teatrale", "scritto come romanzo sociale"],
      ["che traduce", "che ignora"],
      ["la crisi d'identità di un uomo senza nome", "la borghesia romana vuota e amorale"]
    ]},
  { id: 'li2-09', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di ermetismo poetico',
    fragments:   ["L'ermetismo", 'è la corrente poetica italiana', 'degli anni Trenta del Novecento', 'caratterizzata da', 'un linguaggio oscuro, essenziale e ricco di simboli'],
    distractors: [
      ["Il crepuscolarismo", "Il neorealismo"],
      ["è il movimento narrativo italiano", "è la stagione letteraria italiana"],
      ["degli anni Cinquanta del Novecento", "del dopoguerra"],
      ["priva di", "contraria a"],
      ["uno stile colloquiale e ironico sulla quotidianità", "una narrativa semplice sulle vicende della guerra"]
    ]},
  { id: 'li2-10', subject: 'Letteratura Italiana', category: 'Dal Romanticismo al Novecento', prompt: 'Definizione di Giuseppe Ungaretti e la poesia di guerra',
    fragments:   ['Giuseppe Ungaretti', 'è il poeta italiano', 'che nella raccolta L\'Allegria', 'espresse', "il dramma della guerra con versi brevissimi e parole essenziali"],
    distractors: [
      ["Eugenio Montale", "Salvatore Quasimodo"],
      ["è il poeta ermetico", "è il poeta neorealista"],
      ["che nella raccolta Ossi di seppia", "che nella raccolta Ed è subito sera"],
      ["descrisse", "celebrò"],
      ["il paesaggio ligure con toni di aridità e assenza", "il ritorno alla semplicità classica del verso"]
    ]},

  // ── Anime e Manga ──────────────────────────────────────────────────────────

  // ── One Piece ──
  { id: 'op-01', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Monkey D. Luffy',
    fragments:   ['Monkey D. Luffy', 'è il protagonista di One Piece,', 'un pirata con il corpo elastico', 'grazie al Frutto del Diavolo Gom Gom,', 'che sogna di diventare il Re dei Pirati'],
    distractors: [
      ['Roronoa Zoro', 'Portgas D. Ace'],
      ['è il villain principale di One Piece,', 'è il capitano rivale di One Piece,'],
      ['un marine con il corpo invulnerabile', 'un samurai con il corpo di fuoco'],
      ['grazie al Frutto del Diavolo Mera Mera,', 'grazie al Frutto del Diavolo Yami Yami,'],
      ['che sogna di trovare il One Piece e ricchezze infinite', 'che sogna di diventare il più grande marine del mondo']
    ]},
  { id: 'op-02', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Roronoa Zoro',
    fragments:   ['Roronoa Zoro', 'è il vice-capitano della ciurma di Cappello di Paglia,', 'uno spadaccino che combatte', 'con lo stile Santōryū,', 'usando tre spade contemporaneamente'],
    distractors: [
      ['Trafalgar Law', 'Dracule Mihawk'],
      ['è il cuoco della ciurma di Cappello di Paglia,', 'è il medico della ciurma di Cappello di Paglia,'],
      ['un pistolero che combatte', 'un pugile che combatte'],
      ['con lo stile Nitoryu,', 'con lo stile Ittoryu,'],
      ['usando una sola spada leggendaria', 'usando un tridente sacro']
    ]},
  { id: 'op-03', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Cosa sono i Frutti del Diavolo',
    fragments:   ['I Frutti del Diavolo', 'sono frutti misteriosi nell\'universo di One Piece', 'che conferiscono poteri soprannaturali a chi li mangia,', 'privando però il mangiatore', 'della capacità di nuotare'],
    distractors: [
      ['Le Pietre Poneglyph', 'Le Armi Ancestrali'],
      ['sono oggetti leggendari nell\'universo di One Piece', 'sono gemme rare nell\'universo di One Piece'],
      ['che conferiscono immortalità a chi li mangia,', 'che conferiscono forza erculea a chi li mangia,'],
      ['trasformando però il mangiatore', 'donando però al mangiatore'],
      ['della capacità di volare', 'del senso del tatto']
    ]},
  { id: 'op-04', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Shanks il Rosso',
    fragments:   ['Shanks il Rosso', 'è uno dei Quattro Imperatori,', 'il potente pirata che da bambino', 'ispirò Luffy a diventare un pirata', 'donandogli il cappello di paglia'],
    distractors: [
      ['Barbabianca', 'Kaido'],
      ['è uno dei Sette Grandi Corsari,', 'è uno degli Ammiragli della Marina,'],
      ['il misterioso pirata che in passato', 'il celebre pirata che nel presente'],
      ['portò Rufy a temere il mare', 'portò Nami a voler navigare'],
      ['donandogli la sua spada leggendaria', 'donandogli il suo Frutto del Diavolo']
    ]},
  { id: 'op-05', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Gol D. Roger',
    fragments:   ['Gol D. Roger', 'era il Re dei Pirati,', 'l\'unico uomo che raggiunse', 'il One Piece a Raftel,', 'il cui segreto rimane ancora da scoprire'],
    distractors: [
      ['Whitebeard', 'Rocks D. Xebec'],
      ['era il primo degli Imperatori,', 'era il fondatore della Marina,'],
      ['il primo uomo che cercò', 'l\'unico uomo che ignorò'],
      ['il Frutto del Diavolo supremo,', 'la Via Poneglyph finale,'],
      ['il cui segreto è già stato svelato al pubblico', 'il cui luogo non è mai stato trovato da nessuno']
    ]},
  { id: 'op-06', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Nami',
    fragments:   ['Nami', 'è la navigatrice della ciurma di Cappello di Paglia,', 'un\'esperta di meteorologia e ladra di mappe', 'proveniente dal villaggio di Cocoyashi,', 'che sogna di cartografare tutti i mari del mondo'],
    distractors: [
      ['Robin', 'Vivi'],
      ['è l\'archeologa della ciurma di Cappello di Paglia,', 'è la dottoressa della ciurma di Cappello di Paglia,'],
      ['una cuoca con passione per la navigazione', 'una musicista con talento per le previsioni'],
      ['proveniente dall\'isola degli Uomini Pesce,', 'proveniente dal Paese dei Wano,'],
      ['che sogna di trovare il One Piece con la sua ciurma', 'che sogna di diventare la più grande pirata del mondo']
    ]},
  { id: 'op-07', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Cosa sono i Poneglyph',
    fragments:   ['I Poneglyph', 'sono antiche stele di pietra indistruttibile', 'su cui sono incise informazioni storiche segrete,', 'che solo gli archeologi di Ohara', 'erano in grado di leggere'],
    distractors: [
      ['I Seastone', 'I Log Pose'],
      ['sono antiche mappe del tesoro', 'sono antiche pergamene della Marina'],
      ['su cui sono incise profezie sul futuro,', 'su cui sono incise rotte verso isole leggendarie,'],
      ['che solo i Draghi Celesti', 'che solo gli Imperatori'],
      ['erano autorizzati a distruggere', 'erano capaci di creare']
    ]},
  { id: 'op-08', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Cos\'è l\'Haki',
    fragments:   ['L\'Haki', 'è una forza spirituale presente in ogni essere vivente,', 'di tre tipi principali:', 'Armamento, Osservazione e Conquistatore,', 'che pochi esseri umani riescono a padroneggiare'],
    distractors: [
      ['Il Seastone', 'Il Busōshoku'],
      ['è un potere fisico sviluppato solo dai pirati,', 'è una tecnica insegnata esclusivamente dalla Marina,'],
      ['di due tipi principali:', 'di cinque tipi principali:'],
      ['Attacco, Difesa e Velocità,', 'Fuoco, Acqua e Vento,'],
      ['che tutti i mangiatori di Frutti del Diavolo posseggono', 'che si ottiene mangiando un Frutto del Diavolo speciale']
    ]},
  { id: 'op-09', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Chi è Nico Robin',
    fragments:   ['Nico Robin', 'è l\'archeologa della ciurma di Cappello di Paglia,', 'l\'unica sopravvissuta alla distruzione di Ohara,', 'capace di leggere i Poneglyph', 'grazie al Frutto del Diavolo Hana Hana'],
    distractors: [
      ['Nami', 'Carrot'],
      ['è la navigatrice della ciurma di Cappello di Paglia,', 'è la storica della Marina,'],
      ['l\'unica sopravvissuta al Buster Call su Enies Lobby,', 'la prima ricercata ad aver sfidato il Governo Mondiale,'],
      ['capace di creare i Poneglyph', 'capace di distruggere i Poneglyph'],
      ['grazie al Frutto del Diavolo Yomi Yomi', 'grazie alla sua conoscenza degli antichi script']
    ]},
  { id: 'op-10', subject: 'Anime e Manga', category: 'One Piece', prompt: 'Cos\'è la Marina in One Piece',
    fragments:   ['La Marina', 'è l\'organizzazione militare navale', 'del Governo Mondiale in One Piece,', 'che ha il compito di mantenere l\'ordine', 'combattendo pirati e criminali'],
    distractors: [
      ['La Rivoluzione', 'I Corsari'],
      ['è l\'organizzazione segreta di spionaggio', 'è il governo militare terrestre'],
      ['dell\'Alleanza degli Imperatori in One Piece,', 'della Lega dei Pirati in One Piece,'],
      ['che ha il compito di trovare il One Piece', 'che ha il compito di addestrare i pirati'],
      ['proteggendo i civili dalle invasioni aliene', 'eliminando i Frutti del Diavolo pericolosi']
    ]},

  // ── Naruto ──
  { id: 'nar-01', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Chi è Naruto Uzumaki',
    fragments:   ['Naruto Uzumaki', 'è il protagonista dell\'omonimo manga,', 'un ninja del Villaggio della Foglia', 'che porta dentro di sé la Volpe a Nove Code', 'e sogna di diventare Hokage'],
    distractors: [
      ['Sasuke Uchiha', 'Rock Lee'],
      ['è il villain principale dell\'omonimo manga,', 'è il deuteragonista dell\'omonimo manga,'],
      ['un ninja del Villaggio della Sabbia', 'un ninja del Villaggio della Pioggia'],
      ['che porta dentro di sé il Drago a Otto Code', 'che porta dentro di sé il Toro a Cinque Code'],
      ['e sogna di diventare il più forte Anbu', 'e sogna di sconfiggere Sasuke definitivamente']
    ]},
  { id: 'nar-02', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Cos\'è il chakra in Naruto',
    fragments:   ['Il chakra', 'è l\'energia spirituale di base nel mondo di Naruto,', 'prodotta combinando energia fisica ed energia mentale,', 'che permette ai ninja', 'di usare le tecniche di combattimento'],
    distractors: [
      ['Il ninjutsu', 'Il Sharingan'],
      ['è l\'energia solare assorbita nel mondo di Naruto,', 'è il potere demoniaco estratto nel mondo di Naruto,'],
      ['prodotta combinando il sangue con l\'acqua,', 'prodotta dall\'Occhio di Rinnegan,'],
      ['che costringe i ninja', 'che consente solo agli Uchiha'],
      ['di trasformarsi in animali sacri', 'di volare senza strumenti']
    ]},
  { id: 'nar-03', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Cos\'è lo Sharingan',
    fragments:   ['Lo Sharingan', 'è un dōjutsu esclusivo del Clan Uchiha,', 'un occhio speciale che permette di copiare le tecniche nemiche,', 'percepire il chakra', 'e predire i movimenti dell\'avversario'],
    distractors: [
      ['Il Byakugan', 'Il Rinnegan'],
      ['è un dōjutsu esclusivo del Clan Hyuga,', 'è un dōjutsu esclusivo del Clan Senju,'],
      ['un occhio speciale che permette di creare genjutsu definitivi,', 'un occhio speciale che permette di vedere il futuro,'],
      ['amplificare il ninjutsu', 'bloccare il taijutsu avversario'],
      ['e assorbire i poteri dell\'avversario', 'e diventare immune al genjutsu altrui']
    ]},
  { id: 'nar-04', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Chi è Kakashi Hatake',
    fragments:   ['Kakashi Hatake', 'è il sensei del Team 7,', 'soprannominato "il Ninja Copiatore"', 'per la sua capacità di copiare qualsiasi tecnica', 'grazie allo Sharingan donatogli da Obito'],
    distractors: [
      ['Jiraiya', 'Iruka Umino'],
      ['è il sensei del Team 10,', 'è il comandante dell\'Anbu,'],
      ['soprannominato "il Ninja Mille Tecniche"', 'soprannominato "il Ninja dell\'Occhio Rosso"'],
      ['per la sua capacità di aprire i Cancelli Celesti', 'per la sua capacità di usare il Rasengan'],
      ['grazie al Rinnegan trasmessogli da Madara', 'grazie al Byakugan ottenuto in battaglia']
    ]},
  { id: 'nar-05', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Cos\'è l\'Akatsuki',
    fragments:   ['L\'Akatsuki', 'è un\'organizzazione di ninja criminali S-rank', 'composta da ricercati di diversi villaggi,', 'il cui obiettivo è catturare', 'le creature demoniache Bijū sigillate nei jinchūriki'],
    distractors: [
      ['L\'Anbu', 'La Guardia dello Hokage'],
      ['è un\'organizzazione di ninja d\'élite fedeli alla Foglia', 'è una squadra di jonin scelti dal Consiglio'],
      ['composta da discendenti degli Uchiha,', 'composta da studenti rinnegati dell\'Accademia,'],
      ['il cui obiettivo è distruggere', 'il cui obiettivo è addestrare'],
      ['i villaggi nascosti del mondo ninja', 'gli Hokage di tutte le nazioni']
    ]},
  { id: 'nar-06', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Chi è Sasuke Uchiha',
    fragments:   ['Sasuke Uchiha', 'è il rivale e compagno di Naruto,', 'l\'ultimo membro sopravvissuto del Clan Uchiha', 'dopo il massacro compiuto dal fratello Itachi,', 'ossessionato dalla vendetta'],
    distractors: [
      ['Neji Hyuga', 'Gaara'],
      ['è il mentore e maestro di Naruto,', 'è il migliore amico d\'infanzia di Naruto,'],
      ['l\'unico discendente potenziato del Clan Uchiha', 'il fondatore del Nuovo Clan Uchiha'],
      ['dopo l\'esilio ordinato dal quarto Hokage,', 'dopo la guerra con il Clan Senju,'],
      ['assetato di potere e fama globale', 'convinto di proteggere il villaggio nell\'ombra']
    ]},
  { id: 'nar-07', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Chi è Itachi Uchiha',
    fragments:   ['Itachi Uchiha', 'è il fratello maggiore di Sasuke,', 'colui che sterminò il Clan Uchiha', 'per ordine segreto di Konoha,', 'rivelato in seguito come eroe nascosto'],
    distractors: [
      ['Shisui Uchiha', 'Obito Uchiha'],
      ['è il cugino di Sasuke,', 'è il padre adottivo di Sasuke,'],
      ['colui che fondò l\'Akatsuki da solo', 'colui che distrusse il Villaggio della Sabbia'],
      ['per vendetta personale contro gli Uchiha,', 'per amore romantico verso una donna del clan,'],
      ['rivelato in seguito come traditore assoluto', 'rivelato in seguito come semplice assassino']
    ]},
  { id: 'nar-08', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Cos\'è il Rasengan',
    fragments:   ['Il Rasengan', 'è una tecnica del ninjutsu', 'inventata dal Quarto Hokage Minato Namikaze,', 'che consiste nel concentrare il chakra', 'in una sfera rotante nella mano'],
    distractors: [
      ['Il Chidori', 'Il Kage Bunshin'],
      ['è una tecnica del genjutsu', 'è una tecnica del taijutsu'],
      ['inventata dal Primo Hokage Hashirama Senju,', 'inventata dall\'ero-sennin Jiraiya,'],
      ['che consiste nel disperdere il chakra', 'che consiste nell\'assorbire il chakra nemico'],
      ['in un\'onda di tuono nel pugno', 'in un flusso d\'acqua attorno al corpo']
    ]},
  { id: 'nar-09', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Chi è Madara Uchiha',
    fragments:   ['Madara Uchiha', 'è il co-fondatore del Villaggio della Foglia', 'insieme a Hashirama Senju,', 'poi diventato il principale antagonista', 'che cercò di realizzare il Piano Infinito Tsukuyomi'],
    distractors: [
      ['Obito Uchiha', 'Kaguya Ōtsutsuki'],
      ['è il fondatore solitario del Villaggio della Pioggia', 'è l\'Hokage oscuro del Villaggio della Sabbia'],
      ['insieme a Tobirama Senju,', 'insieme a Hiruzen Sarutobi,'],
      ['poi diventato il guardiano eterno della Foglia', 'poi diventato il sesto Hokage'],
      ['che cercò di purificare il mondo dalla guerra', 'che cercò di distribuire il chakra a tutti gli umani']
    ]},
  { id: 'nar-10', subject: 'Anime e Manga', category: 'Naruto', prompt: 'Cos\'è l\'Hokage',
    fragments:   ['L\'Hokage', 'è il leader e ninja più forte', 'del Villaggio della Foglia,', 'un titolo assegnato', 'ai ninja di straordinario potere e saggezza'],
    distractors: [
      ['Il Kazekage', 'Il Raikage'],
      ['è l\'allenatore capo e supervisore scolastico', 'è il giudice e arbitro supremo'],
      ['del Villaggio della Sabbia,', 'del Villaggio della Nuvola,'],
      ['un titolo ereditato di padre in figlio', 'un titolo acquistato con il denaro'],
      ['ai civili di grande ricchezza e status', 'agli stranieri di provata fedeltà alla nazione']
    ]},

  // ── Bleach ──
  { id: 'ble-01', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Chi è Ichigo Kurosaki',
    fragments:   ['Ichigo Kurosaki', 'è il protagonista di Bleach,', 'uno Shinigami sostituto con poteri fuori dal comune,', 'nato da padre Shinigami e madre Quincy,', 'che difende Karakura Town dai Hollow'],
    distractors: [
      ['Rukia Kuchiki', 'Renji Abarai'],
      ['è il deuteragonista di Bleach,', 'è il villain principale di Bleach,'],
      ['uno studente comune senza poteri soprannaturali,', 'un Quincy puro con controllo totale del sangue,'],
      ['nato da due genitori Quincy,', 'nato da padre umano e madre Hollow,'],
      ['che elimina i Quincy invasori di Soul Society', 'che combatte gli Shinigami corrotti di Seireitei']
    ]},
  { id: 'ble-02', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cosa sono gli Shinigami in Bleach',
    fragments:   ['Gli Shinigami', 'sono i guardiani dell\'equilibrio tra il mondo dei vivi', 'e Soul Society nel mondo di Bleach,', 'armati di spade spirituali chiamate Zanpakutō,', 'che combattono i Hollow'],
    distractors: [
      ['I Quincy', 'I Fullbringer'],
      ['sono i distruttori dell\'equilibrio tra il mondo dei morti', 'sono i custodi del tempo tra il passato'],
      ['e l\'Hueco Mundo nel mondo di Bleach,', 'e il Mondo degli Hollow nel mondo di Bleach,'],
      ['armati di archi spirituali chiamati Heilig Bogen,', 'armati di catene spirituali chiamate Reiatsu Chains,'],
      ['che guidano le anime dei defunti al paradiso', 'che assorbono il potere dei Hollow per evolversi']
    ]},
  { id: 'ble-03', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cos\'è la Zanpakutō',
    fragments:   ['La Zanpakutō', 'è la spada spirituale degli Shinigami,', 'che ha un\'anima propria con un nome segreto', 'e può essere liberata in due forme:', 'Shikai e Bankai'],
    distractors: [
      ['La Reiryoku', 'La Sekkiseki'],
      ['è l\'arco spirituale dei Quincy,', 'è il bastone spirituale dei Fullbringer,'],
      ['che ha un potere fisso senza capacità evolutive', 'che è una semplice arma senza coscienza propria'],
      ['e può essere amplificata in tre stadi:', 'e può essere moltiplicata in quattro fasi:'],
      ['Vollständig e Letzt Stil', 'Ressurrección e Segunda Etapa']
    ]},
  { id: 'ble-04', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cosa sono i Hollow',
    fragments:   ['I Hollow', 'sono spiriti umani corrotti', 'che non sono stati guidati a Soul Society,', 'caratterizzati da una maschera bianca sul volto', 'e dalla fame di anime'],
    distractors: [
      ['I Quincy', 'I Pluses'],
      ['sono Shinigami caduti in battaglia', 'sono spiriti animali trasformati'],
      ['che non hanno completato la loro missione di guardie,', 'che hanno abbandonato la loro Zanpakutō,'],
      ['caratterizzati da catene nere al collo', 'caratterizzati da ali d\'energia blu'],
      ['e dalla sete di potere reiatsu', 'e dal desiderio di tornare in vita']
    ]},
  { id: 'ble-05', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cos\'è Soul Society',
    fragments:   ['Soul Society', 'è il regno delle anime dei defunti', 'nel mondo di Bleach,', 'divisa in Seireitei, sede degli Shinigami,', 'e nei distretti rurali chiamati Rukongai'],
    distractors: [
      ['Hueco Mundo', 'Karakura Town'],
      ['è il regno degli Hollow più potenti', 'è la dimensione parallela dei Quincy'],
      ['nel mondo di Naruto,', 'nel mondo di One Piece,'],
      ['divisa in Seireitei, sede dei Quincy,', 'divisa in Seireitei, sede dei Fullbringer,'],
      ['e nelle regioni fredde chiamate Muken', 'e nelle aree proibite chiamate Dangai']
    ]},
  { id: 'ble-06', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cos\'è il Bankai',
    fragments:   ['Il Bankai', 'è la forma finale della Zanpakutō', 'degli Shinigami di alto rango,', 'che richiede normalmente decenni di addestramento', 'per essere raggiunta e padroneggiata'],
    distractors: [
      ['Lo Shikai', 'Il Ressurrección'],
      ['è la forma iniziale della Zanpakutō', 'è la forma base della Reiryoku'],
      ['dei Quincy di sangue puro,', 'degli Hollow trasformati in Arrancar,'],
      ['che richiede normalmente poche settimane di meditazione', 'che richiede il sacrificio del proprio Reiatsu'],
      ['per essere temporaneamente presa in prestito', 'per essere trasmessa al proprio successore']
    ]},
  { id: 'ble-07', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Chi è Aizen Sōsuke',
    fragments:   ['Aizen Sōsuke', 'era il capitano della Quinta Divisione degli Shinigami,', 'il principale antagonista di Bleach', 'che aspirava a diventare il nuovo Re del Cielo', 'usando l\'Hōgyoku per creare gli Arrancar'],
    distractors: [
      ['Byakuya Kuchiki', 'Kenpachi Zaraki'],
      ['era il capitano della Prima Divisione degli Shinigami,', 'era il vice-capitano della Tredicesima Divisione,'],
      ['il deuteragonista misterioso di Bleach', 'il personaggio comico ricorrente di Bleach'],
      ['che aspirava a diventare il nuovo Re di Soul Society', 'che aspirava a diventare il più forte Hollow'],
      ['usando il Bankai per dominare tutti gli Shinigami', 'usando la Zanpakutō per aprire un portale nel vuoto']
    ]},
  { id: 'ble-08', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Chi sono i Quincy in Bleach',
    fragments:   ['I Quincy', 'sono guerrieri umani spirituali', 'discendenti dell\'antico Yhwach,', 'che assorbono il Reishi dall\'ambiente', 'per costruire armi spirituali d\'energia'],
    distractors: [
      ['I Fullbringer', 'I Vizard'],
      ['sono Shinigami ribelli di Soul Society', 'sono Hollow evoluti in forma umana'],
      ['discendenti degli antichi guardiani di Karakura,', 'discendenti degli Hollow della Luna Bianca,'],
      ['che ricavano il potere dalle proprie emozioni', 'che rubano la Zanpakutō agli Shinigami'],
      ['per trasformarsi in Hollow temporaneamente', 'per aprire portali verso l\'Hueco Mundo']
    ]},
  { id: 'ble-09', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Chi è Rukia Kuchiki',
    fragments:   ['Rukia Kuchiki', 'è la Shinigami che per prima trasferisce', 'i propri poteri a Ichigo,', 'adottata dal nobile Clan Kuchiki,', 'e divenuta in seguito Capitana della Tredicesima Divisione'],
    distractors: [
      ['Orihime Inoue', 'Yoruichi Shihōin'],
      ['è la Quincy che per prima rivela', 'è la Hollow che per prima minaccia'],
      ['il segreto di Soul Society a Ichigo,', 'la provenienza del Bankai a Ichigo,'],
      ['adottata dalla nobile famiglia Shihōin,', 'adottata dal Capitano Genryūsai,'],
      ['e divenuta in seguito vice-capitano della Prima Divisione', 'e divenuta in seguito la nuova Sovrana del Cielo']
    ]},
  { id: 'ble-10', subject: 'Anime e Manga', category: 'Bleach', prompt: 'Cos\'è il Reiatsu',
    fragments:   ['Il Reiatsu', 'è la pressione spirituale esercitata dal Reishi di un essere,', 'che negli Shinigami di alto rango', 'può essere così potente', 'da rendere immobili gli avversari più deboli'],
    distractors: [
      ['Il Reiryoku', 'Il Kido'],
      ['è il potere fisico derivato dall\'allenamento corporeo,', 'è l\'energia magica estratta dall\'Hōgyoku,'],
      ['che nei Hollow di classe Menos Grande', 'che nei Quincy di sangue misto'],
      ['può essere così sottile', 'può essere così instabile'],
      ['da potenziare temporaneamente gli alleati vicini', 'da creare una barriera invalicabile attorno al corpo']
    ]},

  // ── Hunter x Hunter ──
  { id: 'hxh-01', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi è Gon Freecss',
    fragments:   ['Gon Freecss', 'è il protagonista di Hunter x Hunter,', 'un ragazzo ingenuo ma straordinariamente dotato', 'che diventa Hunter per trovare il padre Ging,', 'famoso cacciatore scomparso'],
    distractors: [
      ['Killua Zoldyck', 'Leorio Paradinight'],
      ['è il deuteragonista di Hunter x Hunter,', 'è l\'antagonista principale di Hunter x Hunter,'],
      ['un adulto calcolatore con grande esperienza di battaglia', 'un assassino freddo con doti eccezionali'],
      ['che diventa Hunter per vendicare il fratello ucciso,', 'che diventa Hunter per sfuggire alla famiglia criminale,'],
      ['celebre guerriero e leggenda vivente', 'misterioso criminale ricercato']
    ]},
  { id: 'hxh-02', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Cos\'è il Nen',
    fragments:   ['Il Nen', 'è il sistema di poteri soprannaturali', 'in Hunter x Hunter,', 'basato sul controllo dell\'aura personale', 'suddiviso in sei categorie dette Hatsu'],
    distractors: [
      ['Il Gyo', 'Il Shu'],
      ['è il sistema di combattimento fisico puro', 'è la tecnica di respirazione segreta'],
      ['in Naruto,', 'in Bleach,'],
      ['basato sull\'assorbimento di energia cosmica', 'basato sulla manipolazione del sangue'],
      ['suddiviso in dodici categorie dette Zoldyck', 'suddiviso in quattro fasi dette Nanika']
    ]},
  { id: 'hxh-03', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi è Killua Zoldyck',
    fragments:   ['Killua Zoldyck', 'è il migliore amico di Gon,', 'proveniente dalla famiglia Zoldyck, celebri assassini,', 'con il Nen di tipo Trasmutazione', 'che trasforma la propria aura in elettricità'],
    distractors: [
      ['Gon Freecss', 'Kurapika'],
      ['è il rivale e nemico giurato di Gon,', 'è il mentore anziano di Gon,'],
      ['proveniente dalla famiglia Freecss, celebri Hunter,', 'proveniente dalla famiglia Nostrade, ricchi collezionisti,'],
      ['con il Nen di tipo Emissione', 'con il Nen di tipo Materializzazione'],
      ['che trasforma la propria aura in veleno letale', 'che trasforma la propria aura in catene d\'acciaio']
    ]},
  { id: 'hxh-04', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi sono i Phantom Troupe',
    fragments:   ['I Phantom Troupe', 'sono un gruppo criminale di tredici membri,', 'tutti con abilità Nen eccezionali,', 'fondato da Chrollo Lucilfer,', 'il cui obiettivo è il furto e il profitto personale'],
    distractors: [
      ['I Chimera Ant', 'I Zoldyck'],
      ['sono una squadra d\'élite di Hunter autorizzati,', 'sono una gilda segreta di allenatori Nen,'],
      ['tutti con abilità fisiche straordinarie e senza Nen,', 'tutti con capacità psichiche di previsione del futuro,'],
      ['fondato da Hisoka Morow,', 'fondato da Isaac Netero,'],
      ['il cui obiettivo è eliminare tutti i Five-Star Hunter', 'il cui obiettivo è liberare gli Zoldyck dalla maledizione']
    ]},
  { id: 'hxh-05', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi è Kurapika',
    fragments:   ['Kurapika', 'è l\'ultimo sopravvissuto del Clan Kurta,', 'i cui occhi color scarlatto vengono agognati dai collezionisti;', 'il suo Nen di tipo Specializzazione', 'è attivato dalla sua sete di vendetta'],
    distractors: [
      ['Leorio', 'Gon'],
      ['è il discendente del fondatore del Clan Zoldyck,', 'è il guardiano sopravvissuto del Clan Nostrade,'],
      ['il cui sangue color oro viene ricercato dagli Hunter;', 'le cui ossa vengono vendute sul mercato nero;'],
      ['il suo Nen di tipo Emissione', 'il suo Nen di tipo Materializzazione'],
      ['è potenziato dalla gioia della vittoria', 'è limitato dal suo passato pacifico']
    ]},
  { id: 'hxh-06', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi è Hisoka',
    fragments:   ['Hisoka', 'è un Hunter solitario e antagonista ricorrente,', 'con una personalità sadica che cerca scontri eccitanti,', 'il cui Nen è il Bungee Gum,', 'una gomma elastica e adesiva invisibile'],
    distractors: [
      ['Illumi Zoldyck', 'Chrollo Lucilfer'],
      ['è un leader della Phantom Troupe,', 'è un membro del Consiglio degli Hunter,'],
      ['con una personalità fredda che cerca la perfezione assoluta,', 'con una personalità timida che evita ogni scontro,'],
      ['il cui Nen è il Texture Surprise,', 'il cui Nen è lo Shalnark,'],
      ['un campo elettrico che paralizza i nemici', 'uno scudo di vento che respinge i proiettili']
    ]},
  { id: 'hxh-07', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Cosa sono i Chimera Ant',
    fragments:   ['I Chimera Ant', 'sono insetti della specie Fanteria Chimera', 'capaci di assorbire e riprodurre', 'le caratteristiche genetiche delle prede,', 'guidati dal loro Re Meruem'],
    distractors: [
      ['I Kurta', 'I Nostrade'],
      ['sono insetti artificiali creati dagli Zoldyck', 'sono demoni alieni venuti da una dimensione parallela'],
      ['capaci di comunicare telepaticamente con', 'capaci di annullare il Nen di'],
      ['i propri cacciatori tramite feromoni,', 'le altre specie animali della foresta,'],
      ['guidati dalla loro Regina senza nome', 'guidati dal General Neferpitou']
    ]},
  { id: 'hxh-08', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Chi è Isaac Netero',
    fragments:   ['Isaac Netero', 'era il Presidente dell\'Associazione Hunter,', 'considerato il più forte Hunter del mondo vivente,', 'noto per la sua tecnica di preghiera', 'che invoca un Buddha di cento metri'],
    distractors: [
      ['Ging Freecss', 'Pariston Hill'],
      ['era il Fondatore dell\'Accademia Nen,', 'era il Vice-Presidente del Consiglio Hunter,'],
      ['considerato il più anziano e saggio diplomatico,', 'considerato il più ricco mecenate delle arti,'],
      ['noto per la sua tecnica di volo mistico', 'noto per la sua tecnica di clonazione del corpo'],
      ['che trafigge il nemico con lame di luce', 'che crea un\'armatura indistruttibile d\'aura']
    ]},
  { id: 'hxh-09', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Cos\'è lo Jajanken di Gon',
    fragments:   ['Lo Jajanken di Gon', 'è la tecnica Nen personale del protagonista,', 'un sistema simile alla morra cinese', 'con tre attacchi distinti:', 'Sasso, Forbici e Carta'],
    distractors: [
      ['Lo Godspeed di Killua', 'Il Bungee Gum di Hisoka'],
      ['è la tecnica Nen segreta dell\'antagonista,', 'è la difesa Nen finale del maestro Wing,'],
      ['un sistema simile agli scacchi e alla strategia', 'un sistema simile al gioco dei dadi'],
      ['con due attacchi base e uno finale:', 'con quattro attacchi in sequenza obbligata:'],
      ['Lancia, Scudo e Cura', 'Fuoco, Acqua e Terra']
    ]},
  { id: 'hxh-10', subject: 'Anime e Manga', category: 'Hunter x Hunter', prompt: 'Cos\'è la Licenza Hunter',
    fragments:   ['La Licenza Hunter', 'è la qualifica rilasciata dall\'Associazione Hunter', 'agli individui che superano l\'Hunter Exam,', 'uno dei documenti più preziosi al mondo,', 'praticamente impossibile da ottenere o falsificare'],
    distractors: [
      ['La Tessera Zoldyck', 'Il Pass d\'Onore Gon'],
      ['è il titolo nobiliare assegnato dai Re del Continente', 'è la medaglia militare conferita dai Generali'],
      ['agli individui selezionati dal Consiglio dei Sette,', 'agli individui nati con abilità Nen naturali,'],
      ['uno dei certificati più comuni in circolazione,', 'uno degli amuleti più potenti conosciuti,'],
      ['facile da copiare con le tecniche di stampa moderne', 'riservato esclusivamente ai cacciatori di grado A']
    ]},

  // ── Jujutsu Kaisen ──
  { id: 'jjk-01', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Yuji Itadori',
    fragments:   ['Yuji Itadori', 'è il protagonista di Jujutsu Kaisen,', 'uno studente di Jujutsu', 'che diventa il contenitore di Ryomen Sukuna', 'dopo aver ingerito un dito maledetto'],
    distractors: [
      ['Megumi Fushiguro', 'Nobara Kugisaki'],
      ['è il deuteragonista di Jujutsu Kaisen,', 'è il villain principale di Jujutsu Kaisen,'],
      ['uno stregone di grado speciale', 'un esorcista di famiglia nobile'],
      ['che diventa il custode del Talismano Infinito di Gojo', 'che diventa l\'allievo del Grande Stregone Tengen'],
      ['dopo aver rubato un manufatto proibito', 'dopo aver firmato un contratto con uno spirito']
    ]},
  { id: 'jjk-02', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Cos\'è l\'energia maledetta',
    fragments:   ['L\'energia maledetta', 'è la forza negativa generata dalle emozioni umane negative,', 'alla base di tutta la magia in Jujutsu Kaisen,', 'usata dagli stregoni per combattere', 'gli spiriti maledetti'],
    distractors: [
      ['L\'estensione del territorio', 'Il dominio assoluto'],
      ['è la forza positiva generata dalla felicità umana,', 'è il potere ancestrale estratto dai manufatti antichi,'],
      ['alla base di tutta la tecnologia in Jujutsu Kaisen,', 'alla base di tutti i contratti spirituali in Jujutsu Kaisen,'],
      ['usata dai sacerdoti shintoisti per pregare', 'usata dagli spiriti maledetti per nascondersi'],
      ['i mostri del mare profondo', 'i demoni del mondo sotterraneo']
    ]},
  { id: 'jjk-03', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Satoru Gojo',
    fragments:   ['Satoru Gojo', 'è il più forte stregone in vita nel mondo di JJK,', 'insegnante alla Tokyo Jujutsu High,', 'noto per la tecnica Infinito', 'e gli occhi dell\'Esagono Celeste'],
    distractors: [
      ['Suguru Geto', 'Kento Nanami'],
      ['è il più debole stregone di grado speciale in vita,', 'è il Rettore fondatore della Tokyo Jujutsu High,'],
      ['insegnante alla Kyoto Jujutsu High,', 'direttore dell\'Accademia di Arti Occulte,'],
      ['noto per la tecnica Smembramento', 'noto per la tecnica Fiamme Rosse'],
      ['e la capacità di fermare il tempo', 'e il controllo totale degli spiriti maledetti']
    ]},
  { id: 'jjk-04', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Ryomen Sukuna',
    fragments:   ['Ryomen Sukuna', 'è il Re delle Maledizioni nell\'universo di JJK,', 'uno stregone maledetto vissuto oltre mille anni fa', 'i cui venti dita sono rimaste indistruttibili', 'dopo la sua morte'],
    distractors: [
      ['Mahito', 'Kenjaku'],
      ['è il Guardiano delle Anime nell\'universo di JJK,', 'è il Signore dei Demoni nell\'universo di JJK,'],
      ['uno spirito maledetto nato cento anni fa', 'un esorcista rinnegato di origini sconosciute'],
      ['le cui ossa sono rimaste incorruttibili', 'la cui tomba è rimasta segreta'],
      ['dopo la sua prigionia', 'dopo il suo esilio']
    ]},
  { id: 'jjk-05', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Cos\'è il Dominio Assoluto',
    fragments:   ['Il Dominio Assoluto', 'è la tecnica suprema in Jujutsu Kaisen,', 'che crea un territorio chiuso', 'all\'interno del quale la tecnica personale', 'colpisce infallibilmente l\'avversario'],
    distractors: [
      ['L\'Inversione Maledetta', 'Il Corpo Maledetto'],
      ['è la tecnica base insegnata ai principianti,', 'è la difesa finale degli stregoni di grado tre,'],
      ['che crea un campo aperto', 'che distrugge lo spazio circostante'],
      ['all\'interno del quale la forza fisica', 'all\'interno del quale il tempo si ferma'],
      ['viene automaticamente potenziata al massimo', 'viene trasferita all\'alleato più vicino']
    ]},
  { id: 'jjk-06', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Nobara Kugisaki',
    fragments:   ['Nobara Kugisaki', 'è una dei tre protagonisti di JJK,', 'stregona di grado tre', 'che usa la tecnica Strega:', 'chiodi e martello per evocare maledizioni a distanza'],
    distractors: [
      ['Maki Zenin', 'Mai Zenin'],
      ['è uno dei cinque antagonisti principali di JJK,', 'è la mentore principale dei tre protagonisti,'],
      ['stregona di grado speciale', 'stregona di grado uno'],
      ['che usa la tecnica Vuoto Mentale:', 'che usa la tecnica Amplificazione:'],
      ['spade e scudo per bloccare le maledizioni fisicamente', 'canti e rune per sigillare gli spiriti lontani']
    ]},
  { id: 'jjk-07', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Megumi Fushiguro',
    fragments:   ['Megumi Fushiguro', 'è il compagno di squadra di Itadori,', 'discendente del Clan Zenin,', 'con la tecnica delle Ombre dei Dieci Stili', 'che evoca shikigami da ombre animate'],
    distractors: [
      ['Toge Inumaki', 'Aoi Todo'],
      ['è il rivale principale di Itadori,', 'è il mentore anziano di Itadori,'],
      ['discendente del Clan Gojo,', 'discendente del Clan Kamo,'],
      ['con la tecnica del Dominio della Luce', 'con la tecnica dell\'Esplosione Maledetta'],
      ['che controlla il vento tramite gesti rituali', 'che trasforma il proprio corpo in un\'arma maledetta']
    ]},
  { id: 'jjk-08', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Mahito',
    fragments:   ['Mahito', 'è uno degli spiriti maledetti antagonisti di JJK,', 'nato dall\'odio degli uomini verso gli altri uomini,', 'con la tecnica Trasfigurazione Oziosa', 'che manipola l\'anima per distorcere i corpi'],
    distractors: [
      ['Hanami', 'Jogo'],
      ['è uno degli stregoni rinnegati antagonisti di JJK,', 'è uno degli spiriti protettivi dello Jujutsu di JJK,'],
      ['nato dall\'amore degli dei verso gli esseri umani,', 'nato dalla fusione tra uno stregone e un manufatto,'],
      ['con la tecnica Estensione del Terrore', 'con la tecnica Combustione Diretta'],
      ['che brucia il corpo dell\'avversario dall\'interno', 'che congela il tempo nell\'area del dominio']
    ]},
  { id: 'jjk-09', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Chi è Suguru Geto',
    fragments:   ['Suguru Geto', 'era il migliore amico di Gojo al Jujutsu High,', 'poi diventato stregone rinnegato', 'con l\'ideologia di un mondo', 'per soli stregoni, privo di non-stregoni'],
    distractors: [
      ['Kento Nanami', 'Haibara'],
      ['era il mentore segreto di Itadori al Jujutsu High,', 'era il rettore fondatore del Jujutsu High,'],
      ['poi diventato guardiano di Sukuna', 'poi diventato alleato del governo'],
      ['con l\'ideologia di una terra', 'con l\'ideologia di un tempo'],
      ['per soli umani privi di poteri soprannaturali', 'per sole maledizioni liberate dalle catene degli stregoni']
    ]},
  { id: 'jjk-10', subject: 'Anime e Manga', category: 'Jujutsu Kaisen', prompt: 'Cosa sono i Manufatti Maledetti',
    fragments:   ['I Manufatti Maledetti', 'sono oggetti imbevuti di energia maledetta', 'nel mondo di Jujutsu Kaisen,', 'classificati per grado di pericolosità,', 'e spesso usati come armi dagli stregoni'],
    distractors: [
      ['I Talismani Protettivi', 'I Sigilli di Gojo'],
      ['sono luoghi fisici infestati da energia maledetta', 'sono esseri viventi trasformati in spiriti'],
      ['nel mondo di Hunter x Hunter,', 'nel mondo di Bleach,'],
      ['classificati per provenienza geografica,', 'classificati per colore e dimensione,'],
      ['e completamente inutilizzabili senza un manufatto master', 'e solitamente distrutti e mai conservati']
    ]},

  // ── My Hero Academia ──
  { id: 'mha-01', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Chi è Izuku Midoriya',
    fragments:   ['Izuku Midoriya', 'è il protagonista di My Hero Academia,', 'nato senza un Quirk in un mondo di superpoteri,', 'poi diventato portatore del Quirk One For All', 'trasmessogli dal suo eroe All Might'],
    distractors: [
      ['Katsuki Bakugo', 'Shoto Todoroki'],
      ['è il deuteragonista di My Hero Academia,', 'è il villain principale di My Hero Academia,'],
      ['nato con il Quirk più potente al mondo,', 'nato con due Quirk incompatibili tra loro,'],
      ['poi diventato portatore del Quirk Explosion', 'poi diventato portatore del Quirk Half-Cold Half-Hot'],
      ['trasmessogli dal villain All For One', 'trasmessogli dal suo amico d\'infanzia Bakugo']
    ]},
  { id: 'mha-02', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Cos\'è un Quirk',
    fragments:   ['Il Quirk', 'è il termine usato in My Hero Academia', 'per indicare un\'abilità soprannaturale individuale,', 'presente nell\'80% della popolazione mondiale,', 'e unica per ogni persona'],
    distractors: [
      ['Il Nindō', 'L\'Haki'],
      ['è il termine usato in Dragon Ball', 'è il termine usato in Bleach'],
      ['per indicare una tecnica di combattimento appresa,', 'per indicare un potere acquisito tramite addestramento,'],
      ['presente nel 10% della popolazione mondiale,', 'presente nel 100% degli eroi professionisti,'],
      ['e condivisibile tra parenti di primo grado', 'e trasmissibile tramite contatto fisico prolungato']
    ]},
  { id: 'mha-03', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Chi è All Might',
    fragments:   ['All Might', 'è il più grande eroe del mondo in My Hero Academia,', 'chiamato "il Simbolo della Pace",', 'portatore del Quirk One For All', 'che trasmette a Deku prima del suo ritiro'],
    distractors: [
      ['Endeavor', 'Gran Torino'],
      ['è il più pericoloso villain del mondo in My Hero Academia,', 'è il fondatore dell\'Accademia U.A. in My Hero Academia,'],
      ['"il Simbolo del Male",', '"il Simbolo del Fuoco",'],
      ['portatore del Quirk All For One', 'portatore del Quirk United States of Smash'],
      ['che insegna a Bakugo dopo la sconfitta finale', 'che distribuisce a tutti gli allievi dell\'U.A.']
    ]},
  { id: 'mha-04', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Cos\'è il Quirk All For One',
    fragments:   ['All For One', 'è il Quirk del principale antagonista di MHA,', 'che permette di rubare i Quirk altrui', 'e trasferirli a chiunque,', 'rendendolo praticamente invincibile'],
    distractors: [
      ['One For All', 'Decay'],
      ['è il Quirk del protagonista di MHA,', 'è il Quirk del personaggio neutrale di MHA,'],
      ['che permette di copiare i Quirk altrui', 'che permette di creare nuovi Quirk dal nulla'],
      ['e accumularli senza limiti in riserva,', 'e potenziare i propri alleati nelle vicinanze,'],
      ['rendendolo immune a tutti i Quirk di tipo fisico', 'rendendolo in grado di volare senza limiti']
    ]},
  { id: 'mha-05', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Cos\'è la UA High School',
    fragments:   ['La UA High School', 'è la scuola per eroi più prestigiosa in MHA,', 'suddivisa in corsi specializzati,', 'il cui corso Eroi', 'prepara i futuri eroi professionisti'],
    distractors: [
      ['La Shiketsu High School', 'La Ketsubutsu Academy'],
      ['è la scuola per villain più segreta in MHA,', 'è l\'accademia di polizia nazionale in MHA,'],
      ['suddivisa in livelli di pericolo,', 'suddivisa in classi per tipo di Quirk,'],
      ['il cui corso Combattimento', 'il cui corso Scientifico'],
      ['addestra le forze dell\'ordine speciali', 'produce ricercatori di Quirk rari']
    ]},
  { id: 'mha-06', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Chi è Tomura Shigaraki',
    fragments:   ['Tomura Shigaraki', 'è il leader della League of Villains,', 'con il Quirk Decay che dissolve', 'qualsiasi cosa tocchi con tutte le dita,', 'nipote del villain All For One'],
    distractors: [
      ['Dabi', 'Himiko Toga'],
      ['è il fondatore dell\'Hero Public Safety Commission,', 'è il vice-leader della Hero Association,'],
      ['con il Quirk Explosion che genera', 'con il Quirk Cremation che brucia'],
      ['qualsiasi cosa veda a distanza,', 'qualsiasi cosa assorba tramite il suo corpo,'],
      ['pupillo dell\'eroe All Might', 'erede del Quirk One For All']
    ]},
  { id: 'mha-07', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Chi è Katsuki Bakugo',
    fragments:   ['Katsuki Bakugo', 'è il rivale di Deku,', 'con un Quirk di tipo Esplosione', 'che genera nitroglicerina dal sudore delle mani', 'per creare potenti esplosioni controllate'],
    distractors: [
      ['Shoto Todoroki', 'Eijiro Kirishima'],
      ['è il migliore amico di Deku,', 'è il mentore segreto di Deku,'],
      ['con un Quirk di tipo Fuoco', 'con un Quirk di tipo Velocità'],
      ['che genera ghiaccio dal freddo del corpo', 'che genera vento dalla velocità dei pugni'],
      ['per creare scudi difensivi inesorabili', 'per volare a grande velocità senza limiti']
    ]},
  { id: 'mha-08', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Chi è Eraser Head',
    fragments:   ['Eraser Head, Shota Aizawa,', 'è un insegnante della Classe 1-A alla UA,', 'con il Quirk Cancellazione', 'che azzera i Quirk degli avversari', 'finché li guarda senza battere le palpebre'],
    distractors: [
      ['Present Mic', 'Midnight'],
      ['è un membro dell\'Hero Public Safety Commission,', 'è il preside della UA High School,'],
      ['con il Quirk Amplificazione', 'con il Quirk Trasparenza'],
      ['che potenzia i Quirk degli alleati', 'che copia i Quirk degli avversari'],
      ['finché li tocca con la mano sinistra', 'finché si trova nel loro campo visivo']
    ]},
  { id: 'mha-09', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Cos\'è il Quirk One For All',
    fragments:   ['One For All', 'è il Quirk accumulato trasmesso di generazione in generazione,', 'che riunisce la forza di tutti i precedenti portatori', 'e conferisce un potenziamento fisico enorme', 'al suo attuale utilizzatore'],
    distractors: [
      ['All For One', 'Black Whip'],
      ['è il Quirk distruttivo usato solo una volta per poi scomparire,', 'è il Quirk duplicativo che si divide tra più persone,'],
      ['che disperde il potere tra tutti i discendenti', 'che trasferisce la memoria del passato'],
      ['e infligge danno progressivo al corpo', 'e trasforma il portatore in energia pura'],
      ['del suo prossimo avversario', 'dei suoi alleati nell\'area']
    ]},
  { id: 'mha-10', subject: 'Anime e Manga', category: 'My Hero Academia', prompt: 'Cosa sono i Pro Hero',
    fragments:   ['I Pro Hero', 'sono eroi con licenza ufficiale in My Hero Academia,', 'che operano pubblicamente per proteggere i civili,', 'guadagnando tramite sponsorizzazioni e ricompense,', 'sotto il controllo dell\'Hero Public Safety Commission'],
    distractors: [
      ['I Vigilante', 'I Student Hero'],
      ['sono eroi segreti senza licenza in My Hero Academia,', 'sono villain riformati con licenza speciale in My Hero Academia,'],
      ['che operano in incognito come agenti governativi,', 'che operano nelle zone di guerra come soldati speciali,'],
      ['guadagnando tramite furto e estorsione,', 'guadagnando tramite addestramento di nuovi allievi,'],
      ['senza alcun controllo da parte del governo', 'sotto il controllo diretto del Primo Ministro']
    ]},

  // ── Dragon Ball ──
  { id: 'drb-01', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Son Goku',
    fragments:   ['Son Goku', 'è il protagonista di Dragon Ball,', 'un guerriero Saiyan nato sul pianeta Vegeta', 'ed inviato sulla Terra da bambino,', 'noto per la trasformazione Super Saiyan'],
    distractors: [
      ['Vegeta', 'Piccolo'],
      ['è l\'antagonista principale di Dragon Ball,', 'è il deuteragonista di Dragon Ball,'],
      ['un guerriero Namecciano nato sul pianeta Namek', 'un cyborg creato dal Dottor Gero'],
      ['ed abbandonato sulla Luna per errore,', 'ed allevato dai Namecciani come guerriero,'],
      ['noto per la trasformazione Grande Scimmia', 'noto per la trasformazione Ozaru Dorato']
    ]},
  { id: 'drb-02', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Cosa sono le Dragon Ball',
    fragments:   ['Le Dragon Ball', 'sono sette sfere magiche sparse nel mondo,', 'che quando riunite convocano il drago Shenron,', 'il quale esaudisce', 'qualsiasi desiderio di chi le ha raccolte'],
    distractors: [
      ['Le Pietre del Potere', 'I Cristalli Namecciani'],
      ['sono sette artefatti nascosti nell\'universo,', 'sono sette gemme create dagli dei,'],
      ['che quando riunite aprono un portale temporale,', 'che quando riunite concedono immortalità diretta,'],
      ['il quale combatte', 'il quale distrugge'],
      ['il nemico più potente del mondo', 'l\'intero universo nemico']
    ]},
  { id: 'drb-03', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Cos\'è la trasformazione Super Saiyan',
    fragments:   ['La trasformazione Super Saiyan', 'è una forma potenziata dei guerrieri Saiyan,', 'raggiungibile attraverso un intenso dolore emotivo,', 'che moltiplica la forza combattiva del Saiyan', 'e trasforma i capelli in color oro'],
    distractors: [
      ['La trasformazione Grande Scimmia', 'La trasformazione Ultra Istinto'],
      ['è una forma indebolita dei guerrieri Saiyan,', 'è la forma base non trasformata dei guerrieri Saiyan,'],
      ['raggiungibile attraverso una lunga meditazione spirituale,', 'raggiungibile attraverso il consumo di un frutto divino,'],
      ['che dimezza la resistenza al danno del Saiyan', 'che trasferisce la forza agli alleati nelle vicinanze'],
      ['e trasforma la pelle in color bronzo', 'e trasforma gli occhi in color rosso sangue']
    ]},
  { id: 'drb-04', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Vegeta',
    fragments:   ['Vegeta', 'è il principe del popolo Saiyan,', 'inizialmente antagonista di Goku,', 'poi diventato suo alleato e rivale costante,', 'ossessionato dal superare Goku in potenza'],
    distractors: [
      ['Nappa', 'Raditz'],
      ['è il re supremo del popolo Saiyan,', 'è il generale militare del popolo Saiyan,'],
      ['inizialmente alleato e compagno di Goku,', 'inizialmente mentore e maestro di Goku,'],
      ['poi diventato suo nemico giurato definitivo,', 'poi diventato il custode delle Dragon Ball,'],
      ['determinato a proteggere i suoi cari dalla violenza', 'convinto di essere già il più forte dell\'universo']
    ]},
  { id: 'drb-05', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Frieza',
    fragments:   ['Frieza', 'è uno dei principali antagonisti di Dragon Ball Z,', 'un tiranno galattico che governa un esercito spaziale,', 'che distrusse il pianeta Vegeta', 'e sterminò quasi tutti i Saiyan'],
    distractors: [
      ['Cell', 'Majin Bu'],
      ['è uno dei principali eroi di Dragon Ball Z,', 'è il principale antagonista di Dragon Ball GT,'],
      ['un guerriero solitario privo di seguaci,', 'un bioandroide creato da un genio scienziato,'],
      ['che conquistò il pianeta Namek', 'che creò il pianeta artificiale'],
      ['e offrì la pace all\'intero universo', 'e liberò i prigionieri delle colonie spaziali']
    ]},
  { id: 'drb-06', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Cos\'è il Kamehameha',
    fragments:   ['Il Kamehameha', 'è la tecnica iconica di Son Goku,', 'un\'onda energetica blu concentrata nelle mani', 'inventata dal Maestro Roshi,', 'uno dei più potenti attacchi della serie'],
    distractors: [
      ['Il Final Flash', 'Il Galick Gun'],
      ['è la tecnica principale di Vegeta,', 'è la tecnica segreta di Piccolo,'],
      ['un\'onda energetica rossa lanciata con un pugno', 'un fascio di luce viola generato con un urlo'],
      ['inventata da Son Gohan,', 'inventata dal Dottor Gero,'],
      ['uno degli attacchi più deboli della serie', 'uno dei movimenti difensivi esclusivi dei Namecciani']
    ]},
  { id: 'drb-07', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Piccolo',
    fragments:   ['Piccolo', 'è un guerriero Namecciano,', 'inizialmente il grande antagonista di Son Goku,', 'poi diventato il mentore e figura paterna di Gohan,', 'alleato fondamentale nella lotta contro Frieza'],
    distractors: [
      ['Tien Shinhan', 'Krillin'],
      ['è un guerriero Saiyan di origini sconosciute,', 'è un guerriero terrestre senza poteri soprannaturali,'],
      ['inizialmente il migliore amico di Son Goku,', 'inizialmente il discepolo prediletto di Son Goku,'],
      ['poi diventato il rivale eterno di Vegeta,', 'poi diventato il custode delle Dragon Ball,'],
      ['nemico dichiarato nella guerra contro i Cyborg', 'ostacolo nella ricerca delle Sfere dei Draghi']
    ]},
  { id: 'drb-08', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Majin Buu',
    fragments:   ['Majin Buu', 'è l\'antagonista finale di Dragon Ball Z,', 'una creatura magica dai poteri immensi', 'risvegliata dal mago Babidi,', 'in grado di trasformare gli esseri viventi in dolci'],
    distractors: [
      ['Cell', 'Janemba'],
      ['è il primo antagonista di Dragon Ball Z,', 'è il personaggio comico di Dragon Ball Super,'],
      ['una macchina bioandroide costruita da Cell,', 'un semidio immortale discendente degli dei,'],
      ['risvegliata dal Dio della Distruzione Beerus,', 'risvegliata dall\'antico sigillo di Frieza,'],
      ['in grado di assorbire i poteri dei Saiyan nemici', 'in grado di viaggiare nel tempo senza limiti']
    ]},
  { id: 'drb-09', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Cos\'è il Torneo del Potere',
    fragments:   ['Il Torneo del Potere', 'è il torneo multiuniversale di Dragon Ball Super', 'tra dodici universi,', 'il cui universo perdente viene annientato dagli Dei,', 'vinto infine dall\'Universo 7 grazie ad Android 17'],
    distractors: [
      ['Il Torneo Cell', 'Il Grande Torneo delle Arti Marziali'],
      ['è il torneo di sopravvivenza di Dragon Ball Z', 'è il torneo annuale di Dragon Ball GT'],
      ['tra sette pianeti,', 'tra cinque razze galattiche,'],
      ['il cui universo vincente riceve le Super Dragon Ball,', 'il cui universo perdente viene esiliato in una dimensione,'],
      ['vinto infine dall\'Universo 6 grazie a Cabba', 'vinto infine dall\'Universo 11 grazie a Jiren']
    ]},
  { id: 'drb-10', subject: 'Anime e Manga', category: 'Dragon Ball', prompt: 'Chi è Son Gohan',
    fragments:   ['Son Gohan', 'è il figlio di Goku e Chi-Chi,', 'il primo personaggio a raggiungere il Super Saiyan 2,', 'durante il combattimento contro Cell,', 'poi orientatosi verso la vita da studioso in tempo di pace'],
    distractors: [
      ['Son Goten', 'Trunks'],
      ['è il figlio di Goku e Bulma,', 'è il figlio di Vegeta e Chi-Chi,'],
      ['il primo personaggio a raggiungere l\'Ultra Istinto,', 'il primo personaggio a raggiungere il Super Saiyan 4,'],
      ['durante il combattimento contro Frieza,', 'durante il combattimento contro Majin Buu,'],
      ['poi dedicatosi all\'addestramento dei giovani Saiyan', 'poi diventato capo militare della Terra']
    ]},

  // ── Attack on Titan ──
  { id: 'aot-01', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Chi è Eren Yeager',
    fragments:   ['Eren Yeager', 'è il protagonista di Attack on Titan,', 'un ragazzo che sogna la libertà oltre le mura,', 'poi diventato portatore del Titan Attaccante e del Fondatore,', 'il cui piano finale è il Rumbling'],
    distractors: [
      ['Mikasa Ackerman', 'Armin Arlert'],
      ['è il deuteragonista di Attack on Titan,', 'è l\'antagonista principale di Attack on Titan,'],
      ['un soldato che vuole proteggere la famiglia entro le mura,', 'uno scienziato ossessionato dalla storia dei Titan,'],
      ['poi diventato portatore del Titan Corazzato e del Martello da Guerra,', 'poi diventato portatore del Titan Bestia e del Titan Carro,'],
      ['il cui piano finale è la Rivoluzione', 'il cui piano finale è il Sacrificio']
    ]},
  { id: 'aot-02', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Cosa sono i Titan',
    fragments:   ['I Titan', 'sono gigantesche creature umanoidi', 'nel mondo di Attack on Titan,', 'creati dalla forza del Fondatore,', 'che si nutrono di esseri umani'],
    distractors: [
      ['I Giganti di Reiss', 'I Guerrieri di Marley'],
      ['sono creature acquatiche mutate', 'sono robot biomeccanici di origine sconosciuta'],
      ['nel mondo di Bleach,', 'nel mondo di Hunter x Hunter,'],
      ['creati dall\'esperimento scientifico di Marley,', 'creati dall\'evoluzione naturale della specie,'],
      ['che proteggono i villaggi umani dai predatori', 'che costruiscono le mura di protezione']
    ]},
  { id: 'aot-03', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Cosa sono le Tre Mura',
    fragments:   ['Le Tre Mura, Maria, Rosa e Sina,', 'sono le immense barriere circolari', 'che proteggono l\'umanità superstite in AoT,', 'costruite dal Fondatore Ymir,', 'in realtà formate da milioni di Colossal Titan'],
    distractors: [
      ['Le Due Fortezze di Marley', 'Le Quattro Cittadelle dell\'interno'],
      ['sono le fortezze militari sotterranee', 'sono le rotte di fuga nascoste'],
      ['che segregano i Titan entro i loro confini,', 'che separano le classi sociali nell\'isola,'],
      ['costruite dai Guerrieri di Marley come prigione,', 'costruite dagli Ackerman come ultima difesa,'],
      ['in realtà semplici strutture di pietra calcarea', 'in realtà generatori di energia geotermica']
    ]},
  { id: 'aot-04', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Cos\'è il Survey Corps',
    fragments:   ['Il Survey Corps, i Ricognitori,', 'è il ramo militare di AoT', 'che si avventura oltre le mura per esplorare e combattere,', 'usando i Dispositivi di Manovra Omni-Direzionali', 'per muoversi tra gli edifici e colpire i Titan'],
    distractors: [
      ['La Guarnigione', 'La Polizia Militare'],
      ['è il ramo diplomatico di AoT', 'è il ramo scientifico di AoT'],
      ['che difende le città interne senza mai uscire,', 'che sorveglia le mura in pattuglie notturne,'],
      ['usando le Spade Tridimensionali Stabili', 'usando i Cannoni Anti-Titan ad Alta Potenza'],
      ['per volare direttamente sopra le teste dei Titan', 'per scavare tunnel sotto i piedi dei Titan']
    ]},
  { id: 'aot-05', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Chi è Levi Ackerman',
    fragments:   ['Levi Ackerman', 'è il capitano del Survey Corps,', 'considerato il soldato più forte dell\'umanità,', 'un Ackerman con forza fisica soprannaturale,', 'noto per il suo stile di combattimento coi coltelli invertiti'],
    distractors: [
      ['Hange Zoë', 'Erwin Smith'],
      ['è il comandante supremo del Survey Corps,', 'è l\'addestratore reclute del Survey Corps,'],
      ['considerato il soldato più anziano del corpo,', 'considerato il soldato più intelligente della storia,'],
      ['un Yeager con poteri di trasformazione titánica,', 'un Marleiano con tecnologia militare avanzata,'],
      ['noto per la sua diplomazia nei negoziati con Marley', 'noto per la sua capacità di comandare i Titan']
    ]},
  { id: 'aot-06', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Cos\'è il Titan Fondatore',
    fragments:   ['Il Titan Fondatore', 'è il potere supremo nell\'universo di AoT,', 'che permette di controllare tutti i Titan', 'e modificare la memoria dei Sudditi di Ymir,', 'posseduto originariamente da Ymir Fritz'],
    distractors: [
      ['Il Titan Attaccante', 'Il Titan Bestia'],
      ['è il potere più debole nell\'universo di AoT,', 'è il potere condiviso tra tutti i nove Titan,'],
      ['che permette di trasformarsi in Titan corazzato', 'che permette di vedere i ricordi dei Titan mangiati'],
      ['e risvegliare la potenza dormiente nei guerrieri,', 'e cancellare permanentemente i Titan puri,'],
      ['posseduto originariamente da Reiss Fritz', 'posseduto originariamente da Marley Fritz']
    ]},
  { id: 'aot-07', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Chi è Armin Arlert',
    fragments:   ['Armin Arlert', 'è il migliore amico di Eren e Mikasa,', 'genio tattico e strategico del Survey Corps,', 'poi diventato portatore del Titan Colossale', 'dopo la morte di Bertholdt Hoover'],
    distractors: [
      ['Connie Springer', 'Jean Kirstein'],
      ['è il principale rivale di Eren nel Survey Corps,', 'è il comandante supremo del Survey Corps,'],
      ['impetuoso guerriero fisico del Survey Corps,', 'abile cecchino a lunga distanza del Survey Corps,'],
      ['poi diventato portatore del Titan Corazzato', 'poi diventato portatore del Titan Attaccante'],
      ['dopo la morte di Reiner Braun', 'dopo la morte di Ymir']
    ]},
  { id: 'aot-08', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Chi sono i Guerrieri di Marley',
    fragments:   ['I Guerrieri di Marley', 'sono Eldiani selezionati tra i bambini', 'per ereditare uno dei Nove Titan,', 'addestrati per combattere per la nazione di Marley', 'contro i propri connazionali sull\'Isola Paradis'],
    distractors: [
      ['I Ricognitori di Paradis', 'I Titolari di Shiganshina'],
      ['sono Marleiani puri reclutati tra gli adulti', 'sono Ackerman selezionati tra gli anziani'],
      ['per creare nuove forme di armi biologiche,', 'per difendere le proprie famiglie nelle zone di guerra,'],
      ['addestrati per proteggere la nazione di Marley', 'addestrati per fuggire dalla nazione di Marley'],
      ['dai Titan puri dell\'Isola Paradis', 'dagli stessi Guerrieri che li hanno preceduti']
    ]},
  { id: 'aot-09', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Cos\'è il Rumbling',
    fragments:   ['Il Rumbling', 'è il piano finale di Eren in AoT,', 'che consiste nel liberare i Titan Colossali dalle mura', 'per distruggere il mondo al di fuori dell\'Isola,', 'nel tentativo di proteggere i Paradisiani'],
    distractors: [
      ['Il Grande Sacrificio', 'La Rivoluzione di Marley'],
      ['è il piano iniziale di Zeke in AoT,', 'è il piano segreto del Clan Reiss in AoT,'],
      ['che consiste nel sigillare tutti i Titan puri nelle mura', 'che consiste nel trasportare l\'Isola in un altro oceano'],
      ['per negoziare la pace con tutte le nazioni,', 'per conquistare progressivamente i territori vicini,'],
      ['nel tentativo di sterminare i Sudditi di Ymir', 'nel tentativo di ottenere le risorse del continente']
    ]},
  { id: 'aot-10', subject: 'Anime e Manga', category: 'Attack on Titan', prompt: 'Chi è Zeke Yeager',
    fragments:   ['Zeke Yeager', 'è il fratellastro di Eren,', 'figlio di Grisha Yeager e di una nobile Marleiana,', 'portatore del Titan Bestia,', 'il cui piano è sterilizzare i Sudditi di Ymir con il Fondatore'],
    distractors: [
      ['Reiner Braun', 'Bertholdt Hoover'],
      ['è il padre di Eren,', 'è il cugino di Eren,'],
      ['figlio di Grisha Yeager e di un\'Ackerman,', 'figlio di Carla Yeager e di un nobile Paradisiano,'],
      ['portatore del Titan Colossale,', 'portatore del Titan Corazzato,'],
      ['il cui piano è distruggere Marley con i Titan puri', 'il cui piano è liberare tutti i Sudditi di Ymir dalle mura']
    ]},

  // ── Demon Slayer ──
  { id: 'ds-01', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Tanjiro Kamado',
    fragments:   ['Tanjiro Kamado', 'è il protagonista di Demon Slayer,', 'un giovane Ammazzademoni', 'che cerca di riportare allo stato umano la sorella Nezuko,', 'trasformata in demone da Muzan'],
    distractors: [
      ['Zenitsu Agatsuma', 'Inosuke Hashibira'],
      ['è il deuteragonista di Demon Slayer,', 'è l\'antagonista principale di Demon Slayer,'],
      ['un anziano maestro di respirazione', 'un membro del Consiglio dei Pilastri'],
      ['che cerca di trovare e sconfiggere il Re dei Demoni,', 'che cerca di scoprire il segreto delle respirazioni,'],
      ['trasformata in fantasma da Kibutsuji', 'trasformata in spirito dal Consiglio dei Pilastri']
    ]},
  { id: 'ds-02', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Cosa sono le Tecniche di Respirazione',
    fragments:   ['Le Tecniche di Respirazione', 'sono gli stili di combattimento degli Ammazzademoni,', 'basati sul controllo della respirazione', 'per aumentare la forza e la velocità del corpo,', 'imitando i movimenti degli elementi naturali'],
    distractors: [
      ['Le Forme Solari', 'I Marchi del Demone'],
      ['sono le tecniche magiche dei demoni più potenti,', 'sono i poteri ancestrali dei Pilastri,'],
      ['basati sulla meditazione profonda', 'basati sul controllo del battito cardiaco'],
      ['per accedere al Sangue Arancione Demoniaco,', 'per comunicare con gli spiriti della foresta,'],
      ['imitando i movimenti dei demoni superiori', 'imitando le posture rituali degli antenati']
    ]},
  { id: 'ds-03', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Muzan Kibutsuji',
    fragments:   ['Muzan Kibutsuji', 'è il primo e più potente demone di Demon Slayer,', 'creatore di tutti gli altri demoni,', 'in grado di uccidere i propri servitori a distanza', 'con il sangue che ha infuso in loro'],
    distractors: [
      ['Doma', 'Akaza'],
      ['è il primo e più antico umano di Demon Slayer,', 'è il più potente Pilastro di Demon Slayer,'],
      ['trasformato in demone suo malgrado,', 'liberato dalla maledizione dell\'immortalità,'],
      ['in grado di curare i propri servitori a distanza', 'in grado di comunicare telepaticamente coi propri servitori'],
      ['con la luce solare che emana dal suo corpo', 'con la mappa del mondo demoniaco che porta con sé']
    ]},
  { id: 'ds-04', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Cosa sono le Lune Demoniache',
    fragments:   ['Le Lune Demoniache', 'sono i dodici demoni più potenti al servizio di Muzan,', 'divisi in Lune Superiori e Lune Inferiori,', 'così forti da poter uccidere', 'anche i Pilastri degli Ammazzademoni'],
    distractors: [
      ['I Pilastri Hashira', 'I Demoni Rinnegati'],
      ['sono i dodici umani più forti selezionati da Kagaya,', 'sono i nove spiriti antichi che precedono Muzan,'],
      ['divisi in Anziani e Giovani,', 'divisi in Demoni del Giorno e della Notte,'],
      ['così forti da resistere alla luce solare', 'così forti da rompere le Katane Ammazzademoni'],
      ['senza ricevere alcun danno', 'purché rimangano nell\'ombra protettiva']
    ]},
  { id: 'ds-05', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Nezuko Kamado',
    fragments:   ['Nezuko Kamado', 'è la sorella di Tanjiro,', 'trasformata in demone da Muzan,', 'ma capace di combattere a fianco degli umani', 'e di resistere alla luce solare senza incenerirsi'],
    distractors: [
      ['Kanao Tsuyuri', 'Aoi Kanzaki'],
      ['è la madre di Tanjiro,', 'è la maestra di Tanjiro,'],
      ['trasformata in fantasma da Akaza,', 'trasformata in spirito dal Pilastro del Fuoco,'],
      ['ma costretta a divorare anime umane per sopravvivere', 'ma gradualmente riportata allo stato umano'],
      ['e di diventare più forte di notte grazie alla luna', 'e di assumere una forma umana a volontà']
    ]},
  { id: 'ds-06', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi sono i Pilastri Hashira',
    fragments:   ['I Pilastri, o Hashira,', 'sono i nove combattenti più forti del Corpo degli Ammazzademoni,', 'ognuno maestro di uno stile di respirazione specifico,', 'che sacrificano la propria vita', 'per difendere l\'umanità dai demoni'],
    distractors: [
      ['Le Lune Demoniache', 'I Maestri di Ubuyashiki'],
      ['sono i tre fondatori del Corpo degli Ammazzademoni,', 'sono i dodici anziani del Consiglio Ubuyashiki,'],
      ['ognuno portatore di un Marchio del Demone,', 'ognuno discendente diretto del fondatore Yoriichi,'],
      ['che accumulano potere', 'che nascondono il proprio stile'],
      ['per diventare immortali come i demoni', 'per trasmettere la tecnica ai propri successori']
    ]},
  { id: 'ds-07', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Rengoku Kyōjurō',
    fragments:   ['Rengoku Kyōjurō', 'è il Pilastro delle Fiamme,', 'un guerriero appassionato e leale', 'che combatte contro Akaza sul treno Mugen,', 'sacrificandosi per proteggere i passeggeri'],
    distractors: [
      ['Tengen Uzui', 'Giyu Tomioka'],
      ['è il Pilastro dell\'Acqua,', 'è il Pilastro del Vento,'],
      ['un guerriero freddo e calcolatore', 'un guerriero timido e riflessivo'],
      ['che combatte contro Doma sulle montagne innevate', 'che combatte contro Muzan nel palazzo finale'],
      ['sopravvivendo con gravi ferite permanenti', 'scomparendo nel nulla senza lasciare tracce']
    ]},
  { id: 'ds-08', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Cos\'è il Marchio del Demone',
    fragments:   ['Il Marchio del Demone', 'è un sigillo fisico che compare sul corpo', 'degli Ammazzademoni durante uno scontro intenso,', 'che amplifica grandemente le loro capacità,', 'ma riduce la vita del portatore a soli 25 anni'],
    distractors: [
      ['Il Marchio della Luna', 'Il Segno dei Pilastri'],
      ['è un sigillo magico inciso volontariamente sul corpo', 'è un tatuaggio rituale donato dal maestro Ubuyashiki'],
      ['dei demoni durante la loro corruzione,', 'dei Pilastri durante la cerimonia di investitura,'],
      ['che indebolisce temporaneamente le loro capacità,', 'che trasforma temporaneamente il loro corpo in demone,'],
      ['ma garantisce l\'immortalità al portatore a vita', 'ma dona al portatore il potere di rinascere dopo la morte']
    ]},
  { id: 'ds-09', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Giyu Tomioka',
    fragments:   ['Giyu Tomioka', 'è il Pilastro dell\'Acqua,', 'il primo Pilastro che Tanjiro incontra,', 'noto per il suo stile silenzioso e distaccato,', 'che risparmia Nezuko nonostante sia un demone'],
    distractors: [
      ['Sanemi Shinazugawa', 'Iguro Obanai'],
      ['è il Pilastro del Vento,', 'è il Pilastro della Pietra,'],
      ['l\'ultimo Pilastro che Tanjiro incontra,', 'il Pilastro che inizia l\'addestramento di Tanjiro,'],
      ['noto per il suo stile aggressivo e rumoroso,', 'noto per il suo stile elaborato e decorativo,'],
      ['che attacca subito Nezuko per eliminare il pericolo', 'che cattura Nezuko per consegnarla a Muzan']
    ]},
  { id: 'ds-10', subject: 'Anime e Manga', category: 'Demon Slayer', prompt: 'Chi è Yoriichi Tsugikuni',
    fragments:   ['Yoriichi Tsugikuni', 'è il più forte Ammazzademoni della storia,', 'inventore della Respirazione del Sole,', 'l\'unico uomo che mise in fuga Muzan,', 'da cui derivano tutte le altre tecniche di respirazione'],
    distractors: [
      ['Kokushibo', 'Michikatsu Tsugikuni'],
      ['è il più anziano Pilastro della storia,', 'è il fondatore del Corpo degli Ammazzademoni,'],
      ['inventore della Respirazione della Luna,', 'inventore della Respirazione del Fulmine,'],
      ['l\'unico uomo che sconfisse definitivamente Muzan,', 'l\'unico uomo che parlò da pari a pari con Muzan,'],
      ['da cui deriva solo il Respiro del Sole originale', 'da cui deriva esclusivamente il Respiro dell\'Acqua']
    ]},

  // ── Death Note ──
  { id: 'dn-01', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è Light Yagami',
    fragments:   ['Light Yagami', 'è il protagonista di Death Note,', 'uno studente brillante che trova il Death Note,', 'con cui decide di eliminare i criminali', 'assumendo l\'identità segreta di Kira'],
    distractors: [
      ['L Lawliet', 'Near'],
      ['è il deuteragonista di Death Note,', 'è l\'antagonista oscuro di Death Note,'],
      ['uno shinigami che porta il Death Note sulla Terra,', 'uno studente mediocre che ruba il Death Note,'],
      ['con cui decide di proteggere i criminali dall\'ingiustizia', 'con cui decide di rivelare la propria identità al mondo'],
      ['assumendo l\'identità segreta di L', 'assumendo l\'identità segreta di Near']
    ]},
  { id: 'dn-02', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Cos\'è il Death Note',
    fragments:   ['Il Death Note', 'è un quaderno soprannaturale', 'in cui chi scrive il nome di una persona,', 'purché ne visualizzi il volto,', 'la causa la morte entro 40 secondi di arresto cardiaco'],
    distractors: [
      ['Il Life Note', 'Il Black Book'],
      ['è un quaderno comune rubato a uno shinigami', 'è un oggetto maledetto di origine sconosciuta'],
      ['in cui chi pronuncia il nome di una persona,', 'in cui chi tocca il nome di una persona,'],
      ['purché ne conosca la data di nascita,', 'purché ne abbia una foto recente,'],
      ['la causa la morte entro 24 ore di infarto', 'la causa la morte entro 7 giorni di malattia']
    ]},
  { id: 'dn-03', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è Ryuk',
    fragments:   ['Ryuk', 'è lo shinigami che lascia cadere il Death Note nel mondo umano,', 'per pura curiosità e noia,', 'che segue Light come osservatore indifferente', 'senza mai intervenire nelle sue azioni'],
    distractors: [
      ['Rem', 'Gelus'],
      ['è lo shinigami che ruba il Death Note a Light,', 'è lo shinigami che insegna a Light le regole del Death Note,'],
      ['per salvare l\'umanità dalla corruzione,', 'per testare la reazione degli umani ai poteri soprannaturali,'],
      ['che segue Light come alleato fidato e protettore', 'che segue Light come controllore e censore'],
      ['intervenendo spesso per guidare le sue scelte', 'intervenendo solo per proteggere il quaderno']
    ]},
  { id: 'dn-04', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è L Lawliet',
    fragments:   ['L Lawliet', 'è il detective più brillante del mondo in Death Note,', 'con metodi non convenzionali e un\'ossessione per i dolci,', 'il principale avversario di Kira,', 'che alla fine soccombe alla sua intelligenza'],
    distractors: [
      ['Near', 'Mello'],
      ['è il detective più anziano e cauto del mondo in Death Note,', 'è il criminale più ricercato del mondo in Death Note,'],
      ['con metodi tradizionali e un\'ossessione per il caffè,', 'con metodi brutali e un\'ossessione per la perfezione,'],
      ['il principale alleato di Kira,', 'il principale successore di Kira,'],
      ['che alla fine sfugge grazie alla sua velocità', 'che alla fine rivela la sua identità al mondo']
    ]},
  { id: 'dn-05', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Cosa stabiliscono le Regole del Death Note',
    fragments:   ['Le Regole del Death Note', 'specificano che il nome scritto deve corrispondere a quello reale,', 'che il possessore deve visualizzare il volto della vittima,', 'e che la causa della morte può essere specificata,', 'altrimenti si verifica un arresto cardiaco'],
    distractors: [
      ['Le Leggi degli Shinigami', 'Le Istruzioni di Ryuk'],
      ['specificano che il nome può essere un soprannome,', 'specificano che il nome scritto deve essere in giapponese,'],
      ['che il possessore deve conoscere la data di nascita,', 'che il possessore deve avere contatto fisico con la vittima,'],
      ['e che il luogo della morte può essere specificato solo da Ryuk,', 'e che la causa della morte non può essere una malattia,'],
      ['altrimenti il Death Note si autodistrugge', 'altrimenti la morte non ha effetto']
    ]},
  { id: 'dn-06', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è Near',
    fragments:   ['Near', 'è l\'erede di L,', 'un giovane genio che indaga su Kira dall\'SPK,', 'il cui metodo analitico freddo e distaccato', 'porta alla fine allo smascheramento di Light'],
    distractors: [
      ['Mello', 'Matt'],
      ['è il rivale di L,', 'è il discepolo rifiutato di L,'],
      ['un detective veterano che indaga su Kira dall\'Interpol,', 'un agente segreto che protegge Kira dal governo,'],
      ['il cui metodo emotivo e aggressivo', 'il cui metodo intuitivo e artistico'],
      ['porta alla fine all\'alleanza con Kira', 'porta alla fine all\'evasione di Kira']
    ]},
  { id: 'dn-07', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è Misa Amane',
    fragments:   ['Misa Amane', 'è una idol giapponese che possiede il secondo Death Note,', 'con gli occhi della morte che le permettono di vedere i nomi,', 'follemente innamorata di Kira', 'e disposta a rinunciare alla metà della propria vita per lui'],
    distractors: [
      ['Takada Kiyomi', 'Sayu Yagami'],
      ['è una detective che sequestra il secondo Death Note,', 'è una shinigami che consegna il secondo Death Note,'],
      ['con gli occhi della morte che le permettono di volare,', 'con gli occhi della morte che le permettono di vedere il futuro,'],
      ['timorosa di Light e decisa a consegnarlo alla polizia', 'indifferente a Kira e concentrata sulla propria carriera'],
      ['e disposta a rinunciare all\'immortalità per lui', 'e disposta a rivelare la sua identità al mondo per lui']
    ]},
  { id: 'dn-08', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Chi è Kira',
    fragments:   ['Kira', 'è il nome con cui i media e il pubblico chiamano', 'il misterioso giustiziere che usa il Death Note,', 'inizialmente visto come un vigilante da molti civili,', 'e come un criminale dalle forze dell\'ordine'],
    distractors: [
      ['Near', 'Watari'],
      ['è il nome con cui L chiama privatamente', 'è il nome con cui gli shinigami chiamano'],
      ['il misterioso detective che indaga sul Death Note,', 'il misterioso hacker che falsifica il Death Note,'],
      ['inizialmente ignorato dalla stampa internazionale,', 'inizialmente ricercato da tutte le nazioni simultaneamente,'],
      ['e come un eroe dalle forze dell\'ordine', 'e come uno strumento di giustizia dalle organizzazioni criminali']
    ]},
  { id: 'dn-09', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Cosa sono gli Shinigami in Death Note',
    fragments:   ['Gli Shinigami in Death Note', 'sono divinità della morte', 'che posseggono Death Note e aggiungono anni alla propria vita', 'uccidendo gli umani,', 'vivendo in un regno buio e separato'],
    distractors: [
      ['I Demoni in Death Note', 'Gli Angeli in Death Note'],
      ['sono spiriti umani defunti', 'sono creature magiche create dai Death Note'],
      ['che trovano anime perdute e le guidano nell\'aldilà', 'che raccolgono l\'energia dei morti per sopravvivere'],
      ['proteggendo i destinatari dalla morte prematura,', 'scrivendo i loro nomi nei registri celesti,'],
      ['vivendo invisibili tra gli umani', 'vivendo nel mondo umano in forma umana']
    ]},
  { id: 'dn-10', subject: 'Anime e Manga', category: 'Death Note', prompt: 'Cos\'è la Task Force Kira',
    fragments:   ['La Task Force Kira', 'è il gruppo investigativo segreto', 'guidato da Soichiro Yagami,', 'creata per collaborare con L', 'nell\'indagine per catturare Kira'],
    distractors: [
      ['L\'SPK di Near', 'Il NPA Regolare'],
      ['è il gruppo paramilitare ufficiale', 'è il team mediatico di copertura'],
      ['guidato da L Lawliet,', 'guidato da Near,'],
      ['creata per contrastare L', 'creata per proteggere Kira'],
      ['nell\'indagine per trovare il Death Note originale', 'nell\'indagine per eliminare gli shinigami dalla Terra']
    ]},

  // ── JoJo's Bizarre Adventure ──
  { id: 'jojo-01', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è Giorno Giovanna',
    fragments:   ['Giorno Giovanna', 'è il protagonista di JoJo Part 5 Golden Wind,', 'figlio di DIO e discendente degli Joestar,', 'con lo Stand Gold Experience', 'che dà vita a oggetti inanimati'],
    distractors: [
      ['Jonathan Joestar', 'Josuke Higashikata'],
      ['è il protagonista di JoJo Part 3 Stardust Crusaders,', 'è il protagonista di JoJo Part 4 Diamond is Unbreakable,'],
      ['figlio di Yoshikage Kira e discendente degli Zeppeli,', 'figlio di Joseph Joestar e discendente dei Brando,'],
      ['con lo Stand Crazy Diamond', 'con lo Stand The World'],
      ['che ferma il tempo per qualche secondo', 'che ripara oggetti rotti e ferite']
    ]},
  { id: 'jojo-02', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Cosa sono gli Stand in JoJo',
    fragments:   ['Gli Stand', 'sono manifestazioni del potere spirituale degli utenti', 'in JoJo\'s Bizarre Adventure,', 'entità invisibili ai non-utenti', 'che combattono per conto del proprio utilizzatore'],
    distractors: [
      ['Gli Hamon', 'Le Frecce Rosse'],
      ['sono manifestazioni del potere fisico degli umani', 'sono manifestazioni del potere vampirico degli utenti'],
      ['in Naruto,', 'in Bleach,'],
      ['entità visibili a chiunque nella zona', 'entità di fuoco visibili solo di notte'],
      ['che si fondono col corpo del proprio utilizzatore', 'che proteggono il proprio utilizzatore a distanza automaticamente']
    ]},
  { id: 'jojo-03', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è DIO',
    fragments:   ['DIO', 'è il principale antagonista di JoJo Part 1 e Part 3,', 'un vampiro che divenne immortale usando la Maschera di Pietra,', 'con lo Stand The World', 'che ferma il tempo'],
    distractors: [
      ['Yoshikage Kira', 'Diavolo'],
      ['è il principale antagonista di JoJo Part 2 e Part 4,', 'è il principale antagonista di JoJo Part 5 e Part 6,'],
      ['un fantasma che ottenne poteri usando la Freccia Stand,', 'un guerriero che diventò invincibile usando l\'Hamon,'],
      ['con lo Stand Gold Experience Requiem', 'con lo Stand Star Platinum'],
      ['che dà vita agli oggetti inanimati', 'che azzera tutti gli avvenimenti futuri']
    ]},
  { id: 'jojo-04', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è Jotaro Kujo',
    fragments:   ['Jotaro Kujo', 'è il protagonista di JoJo Part 3 Stardust Crusaders,', 'nipote di Joseph Joestar,', 'con lo Stand Star Platinum', 'capace di fermare il tempo per qualche secondo'],
    distractors: [
      ['Giorno Giovanna', 'Josuke Higashikata'],
      ['è il protagonista di JoJo Part 4 Diamond is Unbreakable,', 'è il protagonista di JoJo Part 2 Battle Tendency,'],
      ['nipote di Jonathan Joestar,', 'figlio di DIO e discendente degli Joestar,'],
      ['con lo Stand The World', 'con lo Stand Crazy Diamond'],
      ['capace di dare vita agli oggetti inanimati', 'capace di riparare oggetti rotti e ferite']
    ]},
  { id: 'jojo-05', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Cos\'è lo Stand Star Platinum',
    fragments:   ['Star Platinum', 'è lo Stand di Jotaro Kujo,', 'un essere umanoide di forza e velocità straordinarie,', 'la cui abilità speciale è il Time Stop,', 'che congela il tempo per qualche secondo'],
    distractors: [
      ['The World', 'Gold Experience'],
      ['è lo Stand di DIO,', 'è lo Stand di Giorno Giovanna,'],
      ['una creatura animale di dimensioni enormi,', 'un essere spettrale privo di forma fisica,'],
      ['la cui abilità speciale è il Life Giver,', 'la cui abilità speciale è il King Crimson,'],
      ['che azzera tutti gli avvenimenti futuri', 'che dà vita a qualsiasi oggetto toccato']
    ]},
  { id: 'jojo-06', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è Yoshikage Kira',
    fragments:   ['Yoshikage Kira', 'è il villain principale di JoJo Part 4 Diamond is Unbreakable,', 'un serial killer ossessionato per le mani femminili,', 'con lo Stand Killer Queen', 'che trasforma qualsiasi oggetto in una bomba'],
    distractors: [
      ['Diavolo', 'Enrico Pucci'],
      ['è il villain principale di JoJo Part 3 Stardust Crusaders,', 'è il villain principale di JoJo Part 5 Golden Wind,'],
      ['un vampiro ossessionato per il dominio del mondo,', 'un boss mafioso ossessionato per il controllo assoluto,'],
      ['con lo Stand Made in Heaven', 'con lo Stand Dirty Deeds Done Dirt Cheap'],
      ['che ferma il tempo all\'infinito', 'che cancella un intervallo di tempo']
    ]},
  { id: 'jojo-07', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è Jonathan Joestar',
    fragments:   ['Jonathan Joestar', 'è il protagonista di JoJo Part 1 Phantom Blood,', 'un gentiluomo inglese dell\'Ottocento', 'che usa l\'Hamon per combattere i vampiri,', 'rivale e vittima del traditore Dio Brando'],
    distractors: [
      ['Joseph Joestar', 'Giorno Giovanna'],
      ['è il protagonista di JoJo Part 2 Battle Tendency,', 'è il protagonista di JoJo Part 3 Stardust Crusaders,'],
      ['un samurai giapponese del Seicento', 'un pirata americano del Settecento'],
      ['che usa gli Stand per combattere i vampiri,', 'che usa la forza fisica pura per combattere i vampiri,'],
      ['rivale e vittima del traditore Yoshikage Kira', 'rivale e vittima del traditore Diavolo']
    ]},
  { id: 'jojo-08', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Cos\'è l\'Hamon',
    fragments:   ['L\'Hamon', 'è una tecnica di respirazione usata nelle prime parti di JoJo,', 'che genera un\'energia simile ai raggi solari,', 'efficace contro vampiri e Uomini della Colonna,', 'insegnata dai maestri Zeppeli alla famiglia Joestar'],
    distractors: [
      ['Il Nen', 'Il Chakra'],
      ['è una tecnica di meditazione usata nelle parti con gli Stand,', 'è un potere vampirico usato nelle prime parti di JoJo,'],
      ['che genera un\'energia oscura simile ai fulmini,', 'che genera un\'energia cinetica simile alle esplosioni,'],
      ['efficace contro gli Stand di alto livello,', 'efficace contro i portatori di Frecce Stand,'],
      ['insegnata da DIO ai propri servitori vampiri', 'insegnata dagli shinigami ai guerrieri di Soul Society']
    ]},
  { id: 'jojo-09', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Cos\'è la Freccia Stand',
    fragments:   ['La Freccia Stand', 'è un artefatto misterioso in JoJo\'s Bizarre Adventure', 'che, colpendo qualcuno con abbastanza forza vitale,', 'risveglia in lui uno Stand,', 'ricavata da frammenti del meteorite di Aja'],
    distractors: [
      ['La Maschera di Pietra', 'Il Requiem Stand'],
      ['è un\'arma militare comune in JoJo\'s Bizarre Adventure', 'è un artefatto magico rarissimo in JoJo\'s Bizarre Adventure'],
      ['che, colpendo qualcuno con forza bruta,', 'che, colpendo qualcuno con energia Hamon,'],
      ['risveglia in lui il potere dei vampiri,', 'risveglia in lui la tecnica dell\'Hamon,'],
      ['ricavata da frammenti del cranio di Kars', 'ricavata dai residui della Maschera di Pietra']
    ]},
  { id: 'jojo-10', subject: 'Anime e Manga', category: 'JoJo\'s Bizarre Adventure', prompt: 'Chi è Diavolo e cos\'è King Crimson',
    fragments:   ['Diavolo', 'è il boss mafioso antagonista di JoJo Part 5,', 'con lo Stand King Crimson', 'che cancella un intervallo di tempo,', 'permettendogli di vedere e reagire al futuro prossimo'],
    distractors: [
      ['Enrico Pucci', 'Yoshikage Kira'],
      ['è il capo politico antagonista di JoJo Part 6,', 'è il capo religioso antagonista di JoJo Part 4,'],
      ['con lo Stand Made in Heaven', 'con lo Stand Whitesnake'],
      ['che accelera il tempo all\'infinito,', 'che ferma il tempo per qualche secondo,'],
      ['permettendogli di copiare qualsiasi Stand avversario', 'permettendogli di tornare indietro nel tempo']
    ]},
  // ── Studio di Funzioni ──────────────────────────────────────────────────────
  { id: 'sf-01', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Fasi dello studio di funzione",
    fragments:   ["Si determina il dominio", "si studiano simmetrie e segno", "si calcolano limiti e asintoti", "si studia la derivata prima", "poi la derivata seconda", "e si traccia il grafico"],
    distractors: [
      ["Si determina il codominio", "Si traccia il grafico"],
      ["si studiano integrali e aree", "si calcolano le primitive"],
      ["si calcolano aree e volumi", "si calcolano le radici complesse"],
      ["si studia l'integrale definito", "si studia la funzione inversa"],
      ["poi l'integrale indefinito", "poi il codominio"],
      ["e si calcola l'area", "e si cerca la primitiva"]
    ]},
  { id: 'sf-02', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di dominio di una funzione",
    fragments:   ["Il dominio di una funzione", "è l'insieme", "dei valori di x", "per cui l'espressione", "ha significato"],
    distractors: [
      ["Il codominio di una funzione", "Il grafico di una funzione"],
      ["è il valore massimo", "è il punto"],
      ["dei valori di y", "delle radici"],
      ["per cui la derivata", "per cui il limite"],
      ["è positiva", "vale zero"]
    ]},
  { id: 'sf-03', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di funzione pari",
    fragments:   ["Una funzione è pari", "se f(−x) = f(x)", "per ogni x del dominio", "e il suo grafico", "è simmetrico rispetto all'asse y"],
    distractors: [
      ["Una funzione è dispari", "Una funzione è crescente"],
      ["se f(−x) = −f(x)", "se f(x) = 0"],
      ["per un solo x del dominio", "per ogni x positivo"],
      ["e la sua derivata", "e il suo dominio"],
      ["è simmetrico rispetto all'origine", "è simmetrico rispetto all'asse x"]
    ]},
  { id: 'sf-04', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di funzione dispari",
    fragments:   ["Una funzione è dispari", "se f(−x) = −f(x)", "per ogni x del dominio", "e il suo grafico", "è simmetrico rispetto all'origine"],
    distractors: [
      ["Una funzione è pari", "Una funzione è periodica"],
      ["se f(−x) = f(x)", "se f(x) = x"],
      ["per un solo x del dominio", "per ogni x negativo"],
      ["e la sua derivata seconda", "e il suo codominio"],
      ["è simmetrico rispetto all'asse y", "è simmetrico rispetto alla retta y = x"]
    ]},
  { id: 'sf-05', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di asintoto verticale",
    fragments:   ["La retta x = x₀", "è un asintoto verticale", "se il limite di f(x)", "per x che tende a x₀", "è infinito"],
    distractors: [
      ["La retta y = y₀", "La retta y = mx + q"],
      ["è un asintoto orizzontale", "è una retta tangente"],
      ["se il valore di f(x)", "se la derivata di f(x)"],
      ["per x che tende a infinito", "per x uguale a zero"],
      ["è zero", "è un numero finito"]
    ]},
  { id: 'sf-06', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di asintoto orizzontale",
    fragments:   ["La retta y = l", "è un asintoto orizzontale", "se il limite di f(x)", "per x che tende a infinito", "è il numero finito l"],
    distractors: [
      ["La retta x = l", "La retta y = mx"],
      ["è un asintoto verticale", "è un asintoto obliquo"],
      ["se la derivata di f(x)", "se il valore f(l)"],
      ["per x che tende a zero", "per x che tende a l"],
      ["è infinito", "è sempre zero"]
    ]},
  { id: 'sf-07', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di asintoto obliquo",
    fragments:   ["Per x che tende a infinito", "la retta y = mx + q", "è un asintoto obliquo", "se f(x)/x tende a m ≠ 0", "e f(x) − mx tende a q"],
    distractors: [
      ["Per x che tende a zero", "Per x che tende a x₀"],
      ["la retta x = q", "la retta y = q"],
      ["è un asintoto verticale", "è una retta tangente"],
      ["se f(x)/x tende a infinito", "se f(x) tende a m ≠ 0"],
      ["e f(x) + mx tende a q", "e f(x) − mx tende a infinito"]
    ]},
  { id: 'sf-08', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Crescenza e segno della derivata prima",
    fragments:   ["Se la derivata prima", "è positiva", "in un intervallo", "la funzione è crescente", "in quell'intervallo"],
    distractors: [
      ["Se la derivata seconda", "Se la funzione"],
      ["è negativa", "è nulla"],
      ["in un solo punto", "in un asintoto"],
      ["la funzione è decrescente", "la funzione è concava"],
      ["in tutto il piano", "sull'asse y"]
    ]},
  { id: 'sf-09', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di punto di massimo relativo",
    fragments:   ["x₀ è un punto di massimo relativo", "se esiste un intorno di x₀", "in cui f(x) ≤ f(x₀)", "per ogni x dell'intorno"],
    distractors: [
      ["x₀ è un punto di minimo relativo", "x₀ è un punto di flesso"],
      ["se esiste un asintoto in x₀", "se la derivata seconda esiste in x₀"],
      ["in cui f(x) ≥ f(x₀)", "in cui f(x) = 0"],
      ["per un solo x dell'intorno", "per ogni x del codominio"]
    ]},
  { id: 'sf-10', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di punto stazionario",
    fragments:   ["Un punto stazionario", "è un punto", "in cui la derivata prima", "si annulla", "e la tangente è orizzontale"],
    distractors: [
      ["Un punto di discontinuità", "Un asintoto"],
      ["è una retta", "è un intervallo"],
      ["in cui la funzione", "in cui la derivata seconda"],
      ["diverge", "è positiva"],
      ["e la tangente è verticale", "e la funzione è discontinua"]
    ]},
  { id: 'sf-11', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Concavità e segno della derivata seconda",
    fragments:   ["Se la derivata seconda", "è positiva in un intervallo", "il grafico della funzione", "volge la concavità verso l'alto"],
    distractors: [
      ["Se la derivata prima", "Se il dominio"],
      ["è negativa in un intervallo", "è nulla in un punto"],
      ["l'asintoto della funzione", "il dominio della funzione"],
      ["volge la concavità verso il basso", "è sempre decrescente"]
    ]},
  { id: 'sf-12', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di punto di flesso",
    fragments:   ["Un punto di flesso", "è un punto del grafico", "in cui la funzione", "cambia concavità", "e ammette retta tangente"],
    distractors: [
      ["Un punto di massimo", "Un punto angoloso"],
      ["è una retta del piano", "è un intervallo del dominio"],
      ["in cui il dominio", "in cui l'asintoto"],
      ["cambia segno", "raggiunge il massimo"],
      ["e non è continua", "e ha un asintoto verticale"]
    ]},
  { id: 'sf-13', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Intersezioni con l'asse x",
    fragments:   ["Le intersezioni con l'asse x", "si trovano risolvendo", "l'equazione f(x) = 0", "nel dominio della funzione"],
    distractors: [
      ["Le intersezioni con l'asse y", "Gli asintoti orizzontali"],
      ["si trovano derivando", "si trovano integrando"],
      ["l'equazione f(0) = y", "la disequazione f(x) > 0"],
      ["nel codominio della funzione", "fuori dal dominio"]
    ]},
  { id: 'sf-14', subject: 'Matematica', category: 'Studio di Funzioni', prompt: "Definizione di punto angoloso",
    fragments:   ["Un punto angoloso", "è un punto in cui f è continua", "e le derivate destra e sinistra", "sono finite ma diverse"],
    distractors: [
      ["Una cuspide", "Un flesso a tangente orizzontale"],
      ["è un punto in cui f è discontinua", "è un punto in cui f non è definita"],
      ["e le derivate seconde", "e i limiti destro e sinistro"],
      ["sono infinite e di segno opposto", "sono uguali e nulle"]
    ]},

  // ── Patente: Segnaletica e precedenze ───────────────────────────────────────
  { id: 'pat-01', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "Il segnale di STOP",
    fragments:   ["Il segnale di STOP", "impone di fermarsi", "all'incrocio", "e di dare precedenza", "a tutti i veicoli in arrivo"],
    distractors: [
      ["Il segnale di dare precedenza", "La luce gialla del semaforo"],
      ["consente di rallentare", "impone di accelerare"],
      ["solo di notte", "dopo l'incrocio"],
      ["e di chiedere precedenza", "e di suonare il clacson"],
      ["solo ai veicoli da sinistra", "solo ai mezzi pesanti"]
    ]},
  { id: 'pat-02', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "Il segnale di dare precedenza",
    fragments:   ["Il segnale di dare precedenza", "è un triangolo con il vertice in basso", "e obbliga a dare precedenza", "ai veicoli", "che arrivano da destra e da sinistra"],
    distractors: [
      ["Il segnale di STOP", "Il segnale di pericolo generico"],
      ["è un ottagono rosso", "è un triangolo con il vertice in alto"],
      ["e obbliga a fermarsi sempre", "e vieta di svoltare"],
      ["ai soli pedoni", "ai soli ciclisti"],
      ["che arrivano solo da destra", "che arrivano da dietro"]
    ]},
  { id: 'pat-03', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "Precedenza agli incroci senza segnali",
    fragments:   ["In assenza di segnaletica", "agli incroci", "si deve dare precedenza", "ai veicoli che arrivano da destra"],
    distractors: [
      ["Con il semaforo verde", "In autostrada"],
      ["sui rettilinei", "nelle gallerie"],
      ["si deve chiedere precedenza", "si può sorpassare"],
      ["ai veicoli che arrivano da sinistra", "ai veicoli più lenti"]
    ]},
  { id: 'pat-04', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "I segnali di pericolo",
    fragments:   ["I segnali di pericolo", "sono triangolari con bordo rosso", "e sono posti di norma", "150 metri prima del pericolo"],
    distractors: [
      ["I segnali di obbligo", "I segnali di indicazione"],
      ["sono circolari con bordo rosso", "sono quadrati a fondo blu"],
      ["e sono rimossi di norma", "e sono illuminati di norma"],
      ["50 metri dopo il pericolo", "1 chilometro prima del pericolo"]
    ]},
  { id: 'pat-05', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "I segnali di divieto",
    fragments:   ["I segnali di divieto", "sono circolari con bordo rosso", "e indicano ciò che non si può fare", "dal punto in cui sono posti"],
    distractors: [
      ["I segnali di obbligo", "I segnali di pericolo"],
      ["sono circolari a fondo blu", "sono triangolari con bordo rosso"],
      ["e indicano ciò che si deve fare", "e indicano un pericolo vicino"],
      ["solo nei giorni festivi", "a 150 metri di distanza"]
    ]},
  { id: 'pat-06', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "I segnali di obbligo",
    fragments:   ["I segnali di obbligo", "sono circolari a fondo blu", "e indicano un comportamento", "che si deve tenere"],
    distractors: [
      ["I segnali di divieto", "I segnali di pericolo"],
      ["sono triangolari con bordo rosso", "sono ottagonali rossi"],
      ["e indicano un consiglio", "e indicano un servizio"],
      ["che è vietato", "che è facoltativo"]
    ]},
  { id: 'pat-07', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "La luce gialla fissa del semaforo",
    fragments:   ["La luce gialla fissa", "impone di fermarsi", "a meno che", "si sia così vicini all'incrocio", "da non poterlo fare in sicurezza"],
    distractors: [
      ["La luce verde", "La luce gialla lampeggiante"],
      ["impone di accelerare", "consente sempre di passare"],
      ["anche se", "perché"],
      ["si sia così lontani dall'incrocio", "non ci siano pedoni sull'incrocio"],
      ["da poterlo attraversare di corsa", "da non vedere il semaforo"]
    ]},
  { id: 'pat-08', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "La luce gialla lampeggiante",
    fragments:   ["La luce gialla lampeggiante", "invita a moderare la velocità", "e a rispettare", "le normali regole di precedenza"],
    distractors: [
      ["La luce rossa fissa", "La luce verde fissa"],
      ["impone di fermarsi sempre", "invita ad accelerare"],
      ["e a ignorare", "e a invertire"],
      ["la precedenza ai soli tram", "il limite dell'autostrada"]
    ]},
  { id: 'pat-09', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "Gli attraversamenti pedonali",
    fragments:   ["Sugli attraversamenti pedonali", "i conducenti devono fermarsi", "e dare la precedenza", "ai pedoni che attraversano", "o stanno per farlo"],
    distractors: [
      ["Sulle piste ciclabili", "Ai passaggi a livello"],
      ["i conducenti possono suonare", "i conducenti devono accelerare"],
      ["e chiedere la precedenza", "e superare i veicoli fermi"],
      ["ai veicoli che seguono", "ai soli ciclisti"],
      ["o sono già passati", "o aspettano l'autobus"]
    ]},
  { id: 'pat-10', subject: 'Patente', category: 'Segnaletica e precedenze', prompt: "La striscia longitudinale continua",
    fragments:   ["La striscia continua", "non deve essere superata", "né calpestata", "dai veicoli"],
    distractors: [
      ["La striscia discontinua", "La striscia di arresto"],
      ["può essere superata", "deve essere superata"],
      ["ma può essere calpestata", "solo di notte"],
      ["solo dai pedoni", "solo dai mezzi pesanti"]
    ]},

  // ── Patente: Norme di comportamento ─────────────────────────────────────────
  { id: 'pat-11', subject: 'Patente', category: 'Norme di comportamento', prompt: "Limite di velocità in autostrada",
    fragments:   ["Sulle autostrade", "il limite di velocità", "per le autovetture", "è di 130 km/h"],
    distractors: [
      ["Sulle strade urbane", "Sulle extraurbane secondarie"],
      ["il limite di peso", "il limite di sorpasso"],
      ["per i ciclomotori", "per i neopatentati"],
      ["è di 110 km/h", "è di 90 km/h"]
    ]},
  { id: 'pat-12', subject: 'Patente', category: 'Norme di comportamento', prompt: "Limite di velocità nei centri abitati",
    fragments:   ["Nei centri abitati", "il limite massimo di velocità", "è di 50 km/h", "salvo diversa segnalazione"],
    distractors: [
      ["In autostrada", "Sulle extraurbane principali"],
      ["il limite minimo di velocità", "il limite di rumore"],
      ["è di 70 km/h", "è di 90 km/h"],
      ["anche con diversa segnalazione", "solo di notte"]
    ]},
  { id: 'pat-13', subject: 'Patente', category: 'Norme di comportamento', prompt: "Limiti per i neopatentati",
    fragments:   ["Nei primi tre anni di patente", "non si possono superare", "i 100 km/h in autostrada", "e i 90 km/h sulle extraurbane principali"],
    distractors: [
      ["Nel primo mese di patente", "Nei primi dieci anni di patente"],
      ["si devono superare", "si possono superare"],
      ["i 130 km/h in autostrada", "i 70 km/h in autostrada"],
      ["e i 110 km/h sulle extraurbane principali", "e i 50 km/h sulle extraurbane principali"]
    ]},
  { id: 'pat-14', subject: 'Patente', category: 'Norme di comportamento', prompt: "Definizione di distanza di sicurezza",
    fragments:   ["La distanza di sicurezza", "è lo spazio da mantenere", "dal veicolo che precede", "per potersi fermare in tempo", "in caso di frenata improvvisa"],
    distractors: [
      ["La distanza di sorpasso", "La lunghezza del veicolo"],
      ["è il tempo da attendere", "è lo spazio da percorrere"],
      ["dal veicolo che segue", "dal marciapiede"],
      ["per poterlo sorpassare", "per poter parcheggiare"],
      ["in caso di sosta vietata", "in caso di sorpasso"]
    ]},
  { id: 'pat-15', subject: 'Patente', category: 'Norme di comportamento', prompt: "Definizione di spazio di arresto",
    fragments:   ["Lo spazio di arresto", "è la somma", "dello spazio percorso nel tempo di reazione", "e dello spazio di frenatura"],
    distractors: [
      ["La distanza di sicurezza", "Lo spazio di sorpasso"],
      ["è la differenza", "è il prodotto"],
      ["dello spazio percorso in retromarcia", "della lunghezza del veicolo"],
      ["e della distanza dal marciapiede", "e dello spazio di sorpasso"]
    ]},
  { id: 'pat-16', subject: 'Patente', category: 'Norme di comportamento', prompt: "Le cinture di sicurezza",
    fragments:   ["Le cinture di sicurezza", "devono essere allacciate", "da tutti gli occupanti", "anche sui sedili posteriori"],
    distractors: [
      ["Le luci di posizione", "Le portiere"],
      ["possono essere slacciate", "devono essere tolte"],
      ["dal solo conducente", "dai soli bambini"],
      ["tranne sui sedili posteriori", "solo in autostrada"]
    ]},
  { id: 'pat-17', subject: 'Patente', category: 'Norme di comportamento', prompt: "Come si effettua il sorpasso",
    fragments:   ["Il sorpasso", "si effettua a sinistra", "dopo aver verificato", "che la corsia sia libera", "e aver segnalato la manovra"],
    distractors: [
      ["La retromarcia", "La sosta"],
      ["si effettua a destra", "si effettua in curva"],
      ["senza aver verificato", "prima di aver frenato"],
      ["che la corsia sia occupata", "che il veicolo davanti acceleri"],
      ["e aver spento le luci", "e aver suonato a lungo"]
    ]},
  { id: 'pat-18', subject: 'Patente', category: 'Norme di comportamento', prompt: "Alcol alla guida per i neopatentati",
    fragments:   ["Per i neopatentati", "e i conducenti professionali", "il tasso alcolemico consentito", "è pari a zero"],
    distractors: [
      ["Per i pedoni", "Per i passeggeri"],
      ["e i conducenti con più di 40 anni", "e i ciclisti"],
      ["il numero di passeggeri consentito", "il limite di velocità consentito"],
      ["è pari a 0,5 g/l", "è pari a 0,8 g/l"]
    ]},
  { id: 'pat-19', subject: 'Patente', category: 'Norme di comportamento', prompt: "Comportamento in caso di incidente",
    fragments:   ["In caso di incidente", "si deve proteggere la zona", "avvertire i soccorsi", "e soccorrere i feriti"],
    distractors: [
      ["In caso di sorpasso", "In caso di nebbia"],
      ["si deve lasciare la zona", "si deve fotografare la zona"],
      ["spostare subito i feriti", "nascondere i veicoli"],
      ["e lasciare il luogo", "e togliere il casco ai motociclisti"]
    ]},
  { id: 'pat-20', subject: 'Patente', category: 'Norme di comportamento', prompt: "Il triangolo di emergenza",
    fragments:   ["Il segnale mobile di pericolo", "va posto ad almeno 50 metri", "dal veicolo fermo", "e deve essere visibile", "da almeno 100 metri"],
    distractors: [
      ["Il segnale di STOP", "Il giubbotto retroriflettente"],
      ["va posto a 5 metri", "va posto sul tetto"],
      ["dal veicolo che precede", "dal centro abitato"],
      ["e deve essere coperto", "e deve essere acceso"],
      ["da almeno 10 metri", "da almeno 1 chilometro"]
    ]},
  { id: 'pat-21', subject: 'Patente', category: 'Norme di comportamento', prompt: "Uso dei fari abbaglianti",
    fragments:   ["Gli abbaglianti", "vanno spenti", "quando si incrociano altri veicoli", "per non abbagliare i conducenti"],
    distractors: [
      ["Le luci di posizione", "Gli indicatori di direzione"],
      ["vanno accesi", "vanno lampeggiati"],
      ["quando si è fermi al semaforo", "quando si supera un pedone"],
      ["per vedere meglio la strada", "per segnalare un guasto"]
    ]}
];

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Logical (CSS-pixel) viewport size; the backing store is VW·DPR × VH·DPR
// so text and shapes stay sharp on phone screens.
let VW  = window.innerWidth;
let VH  = window.innerHeight;
let DPR = 1;

const FONT_UI      = "'Nunito', 'Segoe UI', system-ui, sans-serif";
const FONT_DISPLAY = "'Fredoka', 'Nunito', 'Segoe UI', system-ui, sans-serif";
const CLOUD_FONT   = `800 13px ${FONT_UI}`;

// ── World geometry ────────────────────────────────────────────────────────────
// worldY increases downward (standard canvas convention).
// def 0 = BOTTOM of world (first to complete), def N-1 = TOP.
// Each definition occupies VH of world space.
// sectionTop(defIndex) = worldY of the top of that definition's section.

function totalWorldH() { return state.activeDefinitions.length * VH * SECTION_H_FACTOR; }

function sectionTop(defIndex) {
  const n = state.activeDefinitions.length;
  return (n - 1 - defIndex) * VH * SECTION_H_FACTOR;
}

function rowWorldY(defIndex, rowIndex, totalRows) {
  const sh  = VH * SECTION_H_FACTOR;
  const st  = sectionTop(defIndex);
  const top = sh * 0.17;   // topmost row: 17% from section top — clears the prompt panel
  const bot = sh * 0.78;   // bottommost row: 78% — leaves gap above ground
  const t   = totalRows === 1 ? 0.5 : rowIndex / (totalRows - 1);
  return st + bot - t * (bot - top);
}

function groundSurfaceY()     { return totalWorldH() - VH * 0.18; }
function dropletStartWorldY() { return groundSurfaceY() - DROPLET_R; }
function toScreenY(wy)        { return wy - state.cameraY; }

// ── Canvas resize ─────────────────────────────────────────────────────────────
function resizeCanvas() {
  const prevW = VW || window.innerWidth;
  const prevH = VH || window.innerHeight;
  VW  = window.innerWidth;
  VH  = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width  = Math.round(VW * DPR);
  canvas.height = Math.round(VH * DPR);

  if (state && state.phase !== 'menu' && state.clouds.length > 0) {
    const sx = VW / prevW;
    const sy = VH / prevH;
    state.clouds.forEach(c => { c.x *= sx; c.worldY *= sy; if (c.vx) c.vx *= sx; });
    state.birds.forEach(b  => { b.x *= sx; b.worldY *= sy; });
    state.bgElements.forEach(el => { if (el.x !== undefined) el.x *= sx; el.worldY *= sy; });
    state.trail.forEach(p => { p.x *= sx; p.worldY *= sy; });
    state.droplet.x     *= sx;
    state.droplet.worldY *= sy;
    state.cameraY        *= sy;
  }
}

window.addEventListener('resize',            resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  phase: 'menu',
  definitions:       [...DEFINITIONS],
  selectedIds:       new Set(),
  activeDefinitions: [],

  cameraY:              0,
  currentDefIndex:      0,
  currentFragmentIndex: 0,

  droplet:     { x: 0, worldY: 0, vx: 0, vy: 0, scaleX: 1, scaleY: 1, squashTimer: 0 },
  clouds:      [],
  bgElements:  [],
  birds:       [],
  particles:   [],
  ripples:     [],
  trail:       [],
  launches:    0,
  hudH:        0,     // height of the prompt panel, set while drawing
  flash:       0,     // storm flash, 1 → 0
  drag:     { active: false, startX: 0, startScreenY: 0, currentX: 0, currentScreenY: 0 },
  shakeTimer: 0,
  winTimer:   0,

  lastRestingCloud:   null,
  flightPeakWorldY:   Infinity,   // lowest worldY (= highest altitude) reached this flight
  inputLocked:        false,      // true during UFO animation
  ufo: {
    active: false, x: 0, worldY: 0, phase: 'idle',
    timer: 0, duration: 0,
    startX: 0, targetX: 0,
    enterStartWorldY: 0, enterEndWorldY: 0,
    snapDropletWorldY: 0,
    releaseWorldY: 0,
    dropCloud: null, beamAlpha: 0,
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function lerpVal(a, b, t) { return a + (b - a) * t; }

function getAltitude() {
  if (state.phase === 'menu' || state.activeDefinitions.length === 0) return 0;
  const maxCam = Math.max(1, totalWorldH() - VH);
  return 1 - state.cameraY / maxCam;   // 0 = bottom of world, 1 = top
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function easeOut(t)   { return 1 - (1 - t) * (1 - t); }
function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - (-2*t+2)**2/2; }

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ── World building ────────────────────────────────────────────────────────────
const CLOUD_MARGIN = 12;   // px from the screen edges
const CLOUD_GAP    = 8;    // minimum px between two clouds in a row
const CLOUD_PAD    = 24;   // horizontal text padding inside a cloud
const CLOUD_LINE_H = 15;

// Lays the fragment out on as few lines as fit the slot: one, a balanced
// two-line split, or a greedy wrap for long fragments in narrow slots.
// Returns { w, h, lines } — h grows by one line height per extra line.
function cloudLayoutForText(text, maxW) {
  ctx.font = CLOUD_FONT;
  const minW    = Math.min(CLOUD_W, maxW);
  const textW   = maxW - CLOUD_PAD;
  const measure = s => ctx.measureText(s).width;
  const fit     = (lines) => {
    const wMax = Math.max(...lines.map(measure));
    return { w: Math.min(maxW, Math.max(minW, wMax + CLOUD_PAD)),
             h: CLOUD_H + (lines.length - 1) * CLOUD_LINE_H, lines };
  };
  if (measure(text) <= textW || !text.includes(' ')) return fit([text]);

  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const wMax = Math.max(...pair.map(measure));
    if (!best || wMax < best.wMax) best = { pair, wMax };
  }
  if (best.wMax <= textW) return fit(best.pair);
  return fit(wrapText(ctx, text, textW));
}

// Random but never overlapping: the free space is split into count+1 gaps.
function randomHorizontalPositions(count, widths) {
  const usable = VW - CLOUD_MARGIN * 2;
  const free   = Math.max(0, usable - widths.reduce((s, w) => s + w, 0) - CLOUD_GAP * (count - 1));
  const weights = Array.from({ length: count + 1 }, () => 0.4 + Math.random());
  const wSum    = weights.reduce((s, w) => s + w, 0);
  let x = CLOUD_MARGIN;
  return widths.map((w, i) => {
    x += free * weights[i] / wSum + (i > 0 ? CLOUD_GAP : 0);
    const cx = x + w / 2;
    x += w;
    return cx;
  });
}

function buildWorld() {
  state.clouds = [];
  state.activeDefinitions.forEach((def, defIndex) => {
    const totalRows = def.fragments.length;
    const isPerRow  = Array.isArray(def.distractors[0]);
    const distPool  = isPerRow ? null : shuffleArray([...def.distractors]);
    for (let row = 0; row < totalRows; row++) {
      buildRow(defIndex, row, totalRows, def, distPool);
    }
  });
  buildBgElements();
  buildBirds();
}

function buildBirds() {
  state.birds = [];
  const n = state.activeDefinitions.length;
  for (let defIdx = 1; defIdx < n; defIdx++) {
    const count  = Math.min(1 + Math.floor(defIdx / 2), 6);
    const speed  = 0.075 + defIdx * 0.025;
    const radius = 10 + defIdx * 1.8;
    const sh     = VH * SECTION_H_FACTOR;
    const st     = sectionTop(defIdx);
    for (let i = 0; i < count; i++) {
      state.birds.push({
        x:         VW * (0.05 + Math.random() * 0.90),
        worldY:    st + sh * (0.18 + Math.random() * 0.58),
        vx:        (Math.random() < 0.5 ? 1 : -1) * speed * (0.8 + Math.random() * 0.4),
        r:         radius * (0.85 + Math.random() * 0.30),
        wingPhase: Math.random() * Math.PI * 2
      });
    }
  }
}

function buildBgElements() {
  state.bgElements = [];
  const twh = totalWorldH();
  const n   = state.activeDefinitions.length;

  // Misty background clouds — throughout
  for (let i = 0; i < n; i++) {
    const sh = VH * SECTION_H_FACTOR;
    const st = sectionTop(i);
    for (let k = 0; k < 2; k++) {
      state.bgElements.push({
        type:   'cloud',
        x:      VW * (0.04 + Math.random() * 0.92),
        worldY: st + sh * (0.08 + Math.random() * 0.80),
        w:      80 + Math.random() * 120,
        alpha:  0.06 + Math.random() * 0.06
      });
    }
  }

  // Trees — rooted at grass surface
  const groundY = groundSurfaceY();
  // Two depth layers: hazy back row first, saturated front row on top
  state.bgElements.push({ type: 'hills', worldY: groundY, seed: Math.random() * 100 });
  [[0, 7, 30, 34], [1, 5, 36, 38]].forEach(([depth, count, hMin, hVar]) => {
    for (let i = 0; i < count; i++) {
      state.bgElements.push({
        type:    'tree',
        depth,
        x:       VW * ((i + 0.2 + Math.random() * 0.6) / count),
        worldY:  groundY - (depth === 0 ? 6 : 0),
        h:       hMin + Math.random() * hVar,
        variant: Math.random() < 0.6 ? 'pine' : 'round',
        green:   100 + Math.floor(Math.random() * 40)
      });
    }
  });

  // Mountains — lower 50–90 % of world height
  for (let i = 0; i < 5; i++) {
    const side = Math.random() < 0.5;
    state.bgElements.push({
      type:   'mountain',
      x:      VW * (side ? 0.04 + Math.random() * 0.22 : 0.74 + Math.random() * 0.22),
      worldY: twh * (0.50 + Math.random() * 0.38),
      w:      130 + Math.random() * 150,
      snow:   Math.random() < 0.55,
      tint:   ['#8D9DAE', '#7986CB', '#90A4AE'][Math.floor(Math.random() * 3)]
    });
  }

  // Birds (seagulls) — lower-middle altitude
  for (let i = 0; i < 8; i++) {
    state.bgElements.push({
      type:   'bird',
      x:      VW * (0.06 + Math.random() * 0.88),
      worldY: twh * (0.25 + Math.random() * 0.45),
      size:   4 + Math.random() * 6
    });
  }

  // Hot air balloons — middle altitude
  const balloonPalette = ['#E53935','#F57C00','#7B1FA2','#00897B','#1565C0','#F9A825'];
  for (let i = 0; i < 3; i++) {
    state.bgElements.push({
      type:   'balloon',
      x:      VW * (0.12 + Math.random() * 0.76),
      worldY: twh * (0.15 + Math.random() * 0.38),
      color:  balloonPalette[Math.floor(Math.random() * balloonPalette.length)],
      r:      26 + Math.random() * 20
    });
  }

  // Airplanes — upper altitude
  for (let i = 0; i < 3; i++) {
    state.bgElements.push({
      type:   'airplane',
      x:      VW * (0.05 + Math.random() * 0.82),
      worldY: twh * (0.04 + Math.random() * 0.22),
      dir:    Math.random() < 0.5 ? 1 : -1,
      scale:  0.7 + Math.random() * 0.55
    });
  }
}

function buildRow(defIndex, row, totalRows, def, distPool) {
  const wy          = rowWorldY(defIndex, row, totalRows);
  const correctFrag = def.fragments[row];
  const cloudsInRow = row % 2 === 0 ? 3 : 2;
  const correctSlot = Math.floor(Math.random() * cloudsInRow);
  const frags       = [];

  const rowDist    = distPool === null ? shuffleArray([...def.distractors[row]]) : null;
  let   rowDistIdx = 0;

  for (let i = 0; i < cloudsInRow; i++) {
    if (i === correctSlot) {
      frags.push({ text: correctFrag, isCorrect: true });
    } else if (rowDist !== null) {
      frags.push({ text: rowDist[rowDistIdx++ % rowDist.length], isCorrect: false });
    } else {
      if (distPool.length === 0) distPool.push(...shuffleArray([...def.distractors]));
      frags.push({ text: distPool.pop(), isCorrect: false });
    }
  }

  const slotW     = (VW - CLOUD_MARGIN * 2 - CLOUD_GAP * (cloudsInRow - 1)) / cloudsInRow;
  const layouts   = frags.map(f => cloudLayoutForText(f.text, cloudsInRow === 2 ? slotW * 0.92 : slotW));
  const positions = randomHorizontalPositions(cloudsInRow, layouts.map(l => l.w));

  frags.forEach((f, i) => {
    state.clouds.push({
      defIndex, row,
      x: positions[i], worldY: wy,
      w: layouts[i].w, h: layouts[i].h,
      lines:             layouts[i].lines,
      seed:              Math.random() * 1000,
      fragment:          f.text,
      isCorrect:         f.isCorrect,
      cleared:           false,
      clearedThisSession: false,   // visual-only: gold shown only when both flags are true
      stormActive:       false,
      stormTimer:        0,
      vx:                0
    });
  });

  // Moving clouds: from defIndex 3 onward, some clouds drift horizontally.
  // Distractors are always prioritised — the correct cloud moves only if
  // there are more movers than distractors in the row.
  const MOVE_FROM = 3;
  if (defIndex >= MOVE_FROM) {
    const intensity     = defIndex - MOVE_FROM;
    const baseSpeed     = 0.030 + intensity * 0.008;
    const numMoving     = Math.min(cloudsInRow, 1 + Math.floor(intensity / 2));
    const rowStart      = state.clouds.length - cloudsInRow;
    const allIdx        = [...Array(cloudsInRow).keys()];
    const distractorIdx = shuffleArray(allIdx.filter(i => i !== correctSlot));
    // correct cloud goes last so it only moves when numMoving > #distractors
    const idxList       = [...distractorIdx, correctSlot];
    idxList.slice(0, numMoving).forEach(ci => {
      const spd = baseSpeed * (0.7 + Math.random() * 0.6);
      state.clouds[rowStart + ci].vx = (Math.random() < 0.5 ? 1 : -1) * spd;
    });
  }
}

// ── Palette (see DESIGN.md) ───────────────────────────────────────────────────
const COL = {
  ink:    '#17324F',   // text
  stilla: '#1F8FD6',   // droplet, primary action, progress
  gold:   '#F2C14E',   // cleared cloud, max power
  storm:  '#4A5868',   // wrong cloud
};

// Deterministic pseudo-random (Park–Miller) for decorations that must not flicker
function seeded(seed) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

// Sky colours by altitude: day → afternoon → sunset → night
const SKY_KEYS = [
  { a: 0.00, top: [110, 198, 240], mid: [168, 221, 245], bot: [230, 246, 253] },
  { a: 0.40, top: [ 79, 155, 224], mid: [142, 197, 238], bot: [247, 227, 196] },
  { a: 0.70, top: [ 46,  79, 158], mid: [108, 127, 196], bot: [242, 165, 126] },
  { a: 1.00, top: [ 13,  27,  62], mid: [ 30,  53, 112], bot: [ 60,  92, 156] },
];

function skyAt(alt) {
  let i = 0;
  while (i < SKY_KEYS.length - 2 && alt > SKY_KEYS[i + 1].a) i++;
  const k0 = SKY_KEYS[i], k1 = SKY_KEYS[i + 1];
  const t  = Math.min(1, Math.max(0, (alt - k0.a) / (k1.a - k0.a)));
  const mix = (c0, c1) => `rgb(${c0.map((v, j) => Math.round(lerpVal(v, c1[j], t))).join(',')})`;
  return { top: mix(k0.top, k1.top), mid: mix(k0.mid, k1.mid), bot: mix(k0.bot, k1.bot) };
}

const STARS = (() => {
  const r = seeded(7);
  return Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.85, s: 0.6 + r() * 1.3, p: r() * Math.PI * 2 }));
})();

// Teardrop centred on the round part; the tip points up and reaches y - 1.6r
function teardropPath(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.bezierCurveTo(x + r * 0.3, y - r * 1.15, x + r, y - r * 0.62, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI, false);
  ctx.bezierCurveTo(x - r, y - r * 0.62, x - r * 0.3, y - r * 1.15, x, y - r * 1.6);
  ctx.closePath();
}

// Puffy cloud outline: a flat base plus a row of bumps, tallest in the middle.
// All sub-paths wind the same way, so one fill gives their union.
function cloudPath(cx, cy, w, h, seed = 0) {
  const hw = w / 2, hh = h / 2;
  const n  = Math.max(3, Math.round(w / 34));
  ctx.beginPath();
  ctx.ellipse(cx, cy + hh * 0.28, hw, hh * 0.62, 0, 0, Math.PI * 2);
  for (let i = 0; i < n; i++) {
    const t    = i / (n - 1);
    const px   = cx - hw * 0.68 + t * hw * 1.36;
    const arch = Math.sin(t * Math.PI);
    const jit  = Math.sin(seed * 3.1 + i * 2.17) * 0.12;
    const pr   = Math.min(hh * (0.5 + arch * 0.32 + jit), hw - Math.abs(px - cx));   // never wider than w
    const py   = cy + hh * 0.12 - arch * hh * 0.42 + jit * hh * 0.3;
    ctx.moveTo(px + pr, py);
    ctx.arc(px, py, pr, 0, Math.PI * 2);
  }
}

const CLOUD_STYLES = {
  normal:  { top: '#FFFFFF', bot: '#DCEAF6', edge: 'rgba(70,110,150,0.35)', text: COL.ink },
  cleared: { top: '#FFF6D2', bot: '#F5D27A', edge: 'rgba(190,130,30,0.60)', text: '#5A3A00' },
  storm:   { top: '#7A8896', bot: '#3C4753', edge: 'rgba(20,28,36,0.60)',   text: 'rgba(235,242,250,0.78)' },
};

function paintCloud(cx, sy, w, h, seed, style, glow) {
  // soft shadow cast on the haze below
  ctx.fillStyle = 'rgba(20,50,90,0.07)';
  ctx.beginPath(); ctx.ellipse(cx, sy + h * 0.58, w * 0.36, h * 0.09, 0, 0, Math.PI * 2); ctx.fill();

  cloudPath(cx, sy, w, h, seed);
  ctx.save();
  if (glow) { ctx.shadowColor = 'rgba(255,200,60,0.95)'; ctx.shadowBlur = 18; }
  ctx.lineWidth   = 3;
  ctx.strokeStyle = style.edge;
  ctx.stroke();                       // the fill below hides the inner half of the stroke
  ctx.restore();
  const g = ctx.createLinearGradient(0, sy - h * 0.6, 0, sy + h * 0.5);
  g.addColorStop(0, style.top);
  g.addColorStop(1, style.bot);
  ctx.fillStyle = g;
  ctx.fill();
}

function drawBgHills(el, sy) {
  const layers = [
    { h: 118, amp: 24, f: 0.011, col: 'rgba(128,176,206,0.60)' },
    { h:  74, amp: 16, f: 0.018, col: 'rgba(104,166,124,0.90)' },
  ];
  layers.forEach((L, li) => {
    ctx.fillStyle = L.col;
    ctx.beginPath();
    ctx.moveTo(0, sy + 2);
    for (let x = 0; x <= VW + 8; x += 8) {
      const y = sy - L.h
              + Math.sin(x * L.f + el.seed + li * 2) * L.amp
              + Math.sin(x * L.f * 2.3 + el.seed * 1.7) * L.amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, sy + 2);
    ctx.closePath();
    ctx.fill();
  });
}

function drawTrail() {
  const n = state.trail.length;
  state.trail.forEach((p, i) => {
    const a = (i + 1) / n;
    ctx.fillStyle = `rgba(205,240,255,${0.45 * a * p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, toScreenY(p.worldY), DROPLET_R * 0.28 * a + 1, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMiniDropMarker(x, y) {
  teardropPath(x, y, 6);
  ctx.fillStyle = COL.stilla; ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function drawBackground() {
  const alt = getAltitude();
  const sky = skyAt(alt);
  const grad = ctx.createLinearGradient(0, 0, 0, VH);
  grad.addColorStop(0,    sky.top);
  grad.addColorStop(0.55, sky.mid);
  grad.addColorStop(1,    sky.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VW, VH);

  const now = performance.now();

  // Sun sinks and fades as Stilla climbs
  if (alt < 0.72) {
    const t  = alt / 0.72;
    const sx = VW * 0.8, sy = VH * (0.13 + t * 0.5), a = 1 - t;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 110);
    halo.addColorStop(0, `rgba(255,236,170,${0.55 * a})`);
    halo.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sx, sy, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,${Math.round(lerpVal(240, 170, t))},${Math.round(lerpVal(150, 90, t))},${0.95 * a})`;
    ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill();
  }

  // Stars twinkle in at night
  if (alt > 0.45) {
    const a = Math.min(1, (alt - 0.45) * 2.4);
    ctx.fillStyle = '#FFFFFF';
    STARS.forEach(st => {
      ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(now / 700 + st.p));
      ctx.beginPath(); ctx.arc(st.x * VW, st.y * VH, st.s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Moon near the top of the world
  if (alt > 0.7) {
    const a  = Math.min(1, (alt - 0.7) * 3.3);
    const mx = VW * 0.22, my = VH * 0.24, mr = 19;
    ctx.save();
    ctx.globalAlpha = a;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3.4);
    halo.addColorStop(0, 'rgba(225,236,255,0.35)');
    halo.addColorStop(1, 'rgba(225,236,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(mx, my, mr * 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F1F5FF';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,175,205,0.35)';
    [[-6, -4, 4], [5, 3, 5.5], [-2, 8, 2.5]].forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
}

function drawBgElements() {
  state.bgElements.forEach(el => {
    const sy = toScreenY(el.worldY);
    if (sy < -250 || sy > VH + 250) return;
    ctx.save();
    switch (el.type) {
      case 'cloud':    drawBgCloud(el, sy);    break;
      case 'hills':    drawBgHills(el, sy);    break;
      case 'tree':     drawBgTree(el, sy);     break;
      case 'mountain': drawBgMountain(el, sy); break;
      case 'bird':     drawBgBird(el, sy);     break;
      case 'balloon':  drawBgBalloon(el, sy);  break;
      case 'airplane': drawBgAirplane(el, sy); break;
    }
    ctx.restore();
  });
}

function drawBgCloud(el, sy) {
  ctx.globalAlpha = el.alpha * 2.2;
  cloudPath(el.x, sy, el.w, el.w * 0.42, el.x);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
}

function drawBgTree(el, sy) {
  const h    = el.h;
  const back = el.depth === 0;
  const tw   = Math.max(4, h * 0.1);
  const th   = h * 0.26;
  const sat  = back ? 22 : 46;
  const lum  = back ? 50 : 32;
  const dark = `hsl(${el.green},${sat}%,${lum - 7}%)`;
  const lite = `hsl(${el.green - 12},${sat + 8}%,${lum + 10}%)`;

  ctx.fillStyle = back ? '#8A9A92' : '#5D4037';
  ctx.fillRect(el.x - tw / 2, sy - th, tw, th + 2);

  if (el.variant === 'pine') {
    // three tiers, sunlit on the right
    for (let i = 0; i < 3; i++) {
      const base = sy - th - i * h * 0.2;
      const apex = base - h * 0.42;
      const half = h * (0.3 - i * 0.06);
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(el.x, apex); ctx.lineTo(el.x - half, base); ctx.lineTo(el.x + half, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = lite;
      ctx.beginPath();
      ctx.moveTo(el.x, apex); ctx.lineTo(el.x, base); ctx.lineTo(el.x + half, base);
      ctx.closePath(); ctx.fill();
    }
  } else {
    const cy = sy - th - h * 0.34, r = h * 0.38;
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(el.x, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lite;
    ctx.beginPath(); ctx.arc(el.x + r * 0.28, cy - r * 0.22, r * 0.62, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBgMountain(el, sy) {
  ctx.globalAlpha = 0.5;
  const w = el.w, h = w * 0.7, x = el.x;
  const g = ctx.createLinearGradient(0, sy - h, 0, sy);
  g.addColorStop(0, el.tint);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, sy);
  ctx.lineTo(x - w * 0.12, sy - h * 0.82);
  ctx.lineTo(x, sy - h);
  ctx.lineTo(x + w * 0.18, sy - h * 0.74);
  ctx.lineTo(x + w / 2, sy);
  ctx.closePath(); ctx.fill();
  if (el.snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(x, sy - h);
    ctx.lineTo(x + w * 0.09, sy - h * 0.87);
    ctx.lineTo(x + w * 0.03, sy - h * 0.81);
    ctx.lineTo(x - w * 0.03, sy - h * 0.86);
    ctx.lineTo(x - w * 0.1,  sy - h * 0.85);
    ctx.closePath(); ctx.fill();
  }
}

function drawBgBird(el, sy) {
  ctx.globalAlpha = 0.48;
  ctx.strokeStyle = 'rgba(20,20,50,0.75)';
  ctx.lineWidth   = 1.6;
  ctx.lineCap     = 'round';
  const s = el.size;
  ctx.beginPath();
  ctx.moveTo(el.x - s * 1.5, sy - s * 0.25);
  ctx.quadraticCurveTo(el.x - s * 0.75, sy - s * 0.95, el.x, sy - s * 0.25);
  ctx.quadraticCurveTo(el.x + s * 0.75, sy - s * 0.95, el.x + s * 1.5, sy - s * 0.25);
  ctx.stroke();
}

function drawBgBalloon(el, sy) {
  ctx.globalAlpha = 0.58;
  const r = el.r;
  ctx.fillStyle = el.color;
  ctx.beginPath();
  ctx.ellipse(el.x, sy - r * 0.5, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath();
  ctx.ellipse(el.x - r * 0.28, sy - r * 0.95, r * 0.30, r * 0.42, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth   = 1.5;
  [-0.5, 0, 0.5].forEach(f => {
    ctx.beginPath();
    ctx.moveTo(el.x + f * r * 0.9,  sy + r * 0.65);
    ctx.lineTo(el.x + f * r * 0.75, sy - r * 1.65);
    ctx.stroke();
  });
  const bW = r * 0.52, bH = r * 0.34;
  ctx.strokeStyle = 'rgba(80,50,10,0.50)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(el.x - r * 0.42, sy + r * 0.65); ctx.lineTo(el.x - bW / 2, sy + r * 0.65);
  ctx.moveTo(el.x + r * 0.42, sy + r * 0.65); ctx.lineTo(el.x + bW / 2, sy + r * 0.65);
  ctx.stroke();
  ctx.fillStyle = '#795548';
  ctx.fillRect(el.x - bW / 2, sy + r * 0.65, bW, bH);
}

function drawBgAirplane(el, sy) {
  ctx.globalAlpha = 0.40;
  ctx.save();
  ctx.translate(el.x, sy);
  if (el.dir < 0) ctx.scale(-1, 1);
  const s = (el.scale || 1) * 20;
  // Contrail
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth   = 3;
  ctx.lineCap     = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(-s * 3.8, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 7;
  ctx.beginPath(); ctx.moveTo(-s * 1.2, 0); ctx.lineTo(-s * 5.0, 0); ctx.stroke();
  // Fuselage
  ctx.fillStyle = '#ECEFF1';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 1.05, s * 0.20, 0, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#CFD8DC';
  ctx.beginPath();
  ctx.moveTo(s * 1.05, 0);
  ctx.quadraticCurveTo(s * 1.55, -s * 0.07, s * 1.65, 0);
  ctx.quadraticCurveTo(s * 1.55,  s * 0.07, s * 1.05, 0);
  ctx.fill();
  // Wings
  ctx.fillStyle = '#B0BEC5';
  [[-1], [1]].forEach(([sign]) => {
    ctx.beginPath();
    ctx.moveTo( s * 0.15, sign * s * 0.05);
    ctx.lineTo( s * 0.15 - s * 0.55, sign * s * 0.88);
    ctx.lineTo(-s * 0.8,              sign * s * 0.88);
    ctx.lineTo(-s * 0.8,              0);
    ctx.closePath(); ctx.fill();
  });
  // Tail fin
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.moveTo(-s * 0.72, 0);
  ctx.lineTo(-s * 1.08, -s * 0.50);
  ctx.lineTo(-s * 1.08, 0);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSectionMarkers() {
  const n = state.activeDefinitions.length;
  for (let i = 0; i < n - 1; i++) {
    const sy = toScreenY(sectionTop(i));   // boundary: top of def i = bottom of def i+1
    if (sy < -40 || sy > VH + 40) continue;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.setLineDash([1, 9]);
    ctx.beginPath(); ctx.moveTo(10, sy); ctx.lineTo(VW - 10, sy); ctx.stroke();
    ctx.setLineDash([]);

    const label = `Livello ${i + 2}`;
    ctx.font = `800 11px ${FONT_UI}`;
    const lw = ctx.measureText(label).width + 18;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundRect(VW / 2 - lw / 2, sy - 11, lw, 22, 11); ctx.fill();
    ctx.fillStyle    = 'rgba(255,255,255,0.95)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, VW / 2, sy + 0.5);
    ctx.restore();
  }
}

function drawAltitudeBar() {
  if (state.activeDefinitions.length === 0) return;
  const alt = getAltitude();
  const n   = state.activeDefinitions.length;

  const bW = 4;
  const bX = VW - 7;
  const bY = (state.hudH || 100) + 28;
  const bH = Math.max(60, VH - bY - 48);

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(bX, bY, bW, bH, 2); ctx.fill();

  const fillH = bH * alt;
  if (fillH > 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    roundRect(bX, bY + bH - fillH, bW, fillH, 2); ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 1; i < n && n <= 60; i++) {
    ctx.fillRect(bX - 2, bY + bH * (1 - i / n) - 0.75, bW + 4, 1.5);
  }

  drawMiniDropMarker(bX + bW / 2, bY + bH * (1 - alt));
  ctx.restore();
}

function drawGrassStrip(gy) {
  if (gy > VH + 2) return;
  const top = Math.max(0, gy);

  // Soil fill
  const soil = ctx.createLinearGradient(0, gy, 0, gy + 70);
  soil.addColorStop(0,   '#4E7C2F');
  soil.addColorStop(0.18,'#7B5E3A');
  soil.addColorStop(1,   '#5D4427');
  ctx.fillStyle = soil;
  ctx.fillRect(0, top, VW, VH - top + 2);

  // Flat grass band
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, gy - 5, VW, 9);

  // Blade layer 1 (light green)
  ctx.fillStyle = '#66BB6A';
  for (let x = 0; x < VW; x += 9) {
    const bh = 7 + Math.sin(x * 0.31 + 0.5) * 2.5 + Math.sin(x * 0.17) * 2;
    ctx.beginPath();
    ctx.moveTo(x,     gy - 4);
    ctx.lineTo(x + 4, gy - 4 - bh);
    ctx.lineTo(x + 9, gy - 4);
    ctx.fill();
  }
  // Blade layer 2 (dark accent)
  ctx.fillStyle = '#388E3C';
  for (let x = 4; x < VW; x += 13) {
    const bh = 5 + Math.sin(x * 0.45) * 2;
    ctx.beginPath();
    ctx.moveTo(x,     gy - 3);
    ctx.lineTo(x + 3, gy - 3 - bh);
    ctx.lineTo(x + 7, gy - 3);
    ctx.fill();
  }
}

function drawGround() {
  drawGrassStrip(toScreenY(groundSurfaceY()));
}

function drawDroplet(sx, sy, scaleX, scaleY) {
  const d   = state.droplet;
  const r   = DROPLET_R;
  const now = performance.now();

  // Where the eyes look: launch direction while aiming, velocity in flight
  let lx = 0, ly = 0.3;
  if (state.phase === 'aiming' && state.drag.active) {
    const v = computeLaunchVelocity(), m = Math.hypot(v.vx, v.vy);
    if (m > 0.01) { lx = v.vx / m; ly = v.vy / m; }
  } else if (state.phase === 'flying' || state.phase === 'ufo') {
    const m = Math.hypot(d.vx, d.vy);
    if (m > 0.02) { lx = d.vx / m; ly = d.vy / m; }
  }
  const blink   = (now % 3700) < 110;
  const falling = state.phase === 'flying' && d.vy > 0.35;
  const splat   = state.phase === 'gameover';

  ctx.save();
  ctx.translate(sx, sy);
  // Stretch with vertical speed (never rotates)
  let kx = scaleX, ky = scaleY;
  if (state.phase === 'flying') {
    const k = Math.min(0.14, Math.abs(d.vy) * 0.12);
    kx *= 1 - k; ky *= 1 + k;
  }
  ctx.scale(kx, ky);

  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.15, 0, 0, r * 1.35);
  g.addColorStop(0,    '#C8F1FF');
  g.addColorStop(0.45, '#4EC0F2');
  g.addColorStop(1,    '#1673C4');
  teardropPath(0, 0, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth   = 1.6;
  ctx.strokeStyle = 'rgba(10,70,130,0.75)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.15, r * 0.27, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.98, r * 0.07, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,135,165,0.38)';
  ctx.beginPath(); ctx.ellipse(-r * 0.56, r * 0.26, r * 0.17, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r * 0.56, r * 0.26, r * 0.17, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();

  const ey = -r * 0.05;
  [-1, 1].forEach(side => {
    const cx = side * r * 0.32;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(cx, ey, 4.4, blink ? 0.8 : (splat ? 5.4 : 4.9), 0, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      const px = cx + lx * 1.7, py = ey + ly * 1.9;
      ctx.fillStyle = COL.ink;
      ctx.beginPath(); ctx.arc(px, py, splat ? 1.6 : 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(px - 0.8, py - 0.9, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  });

  ctx.strokeStyle = COL.ink;
  ctx.fillStyle   = COL.ink;
  ctx.lineWidth   = 1.7;
  ctx.lineCap     = 'round';
  if (falling || splat) {
    ctx.beginPath(); ctx.ellipse(0, r * 0.38, 2.6, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.26, 0.35, Math.PI - 0.35); ctx.stroke();
  }
  ctx.restore();
}

function drawCloudShape(cx, sy, w, h, fill, seed = 0) {
  cloudPath(cx, sy, w, h, seed);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawCloud(cloud) {
  const sy = toScreenY(cloud.worldY);
  if (sy < -cloud.h - 30 || sy > VH + cloud.h + 30) return; // cull off-screen

  const showGold = cloud.cleared && cloud.clearedThisSession;
  const style    = showGold ? CLOUD_STYLES.cleared
                 : cloud.stormActive ? CLOUD_STYLES.storm
                 : CLOUD_STYLES.normal;

  let cx = cloud.x;
  if (cloud.stormActive) cx += Math.sin(performance.now() / 28) * 1.6 * Math.min(1, cloud.stormTimer / STORM_MS);

  paintCloud(cx, sy, cloud.w, cloud.h, cloud.seed || 0, style, showGold);

  const lines = cloud.lines || [cloud.fragment];
  ctx.font         = CLOUD_FONT;
  ctx.fillStyle    = style.text;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const y0 = sy + 3 - (lines.length - 1) * CLOUD_LINE_H / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, y0 + i * CLOUD_LINE_H, cloud.w - 14));

  // Moving cloud indicator: small arrow on the leading edge
  if (cloud.vx && !showGold && !cloud.stormActive) {
    const dir  = cloud.vx > 0 ? 1 : -1;
    const ax   = cx + dir * (cloud.w / 2 + 7);
    const ay   = sy + 4;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth   = 2.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(ax - dir * 4, ay - 4);
    ctx.lineTo(ax,           ay);
    ctx.lineTo(ax - dir * 4, ay + 4);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLightningBolt(cloud) {
  const sy  = toScreenY(cloud.worldY);
  const k   = cloud.stormTimer / STORM_MS;     // 1 → 0
  const now = performance.now();
  ctx.save();

  // rain
  ctx.strokeStyle = `rgba(170,200,230,${0.75 * k})`;
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  const n = Math.max(4, Math.round(cloud.w / 14));
  for (let i = 0; i < n; i++) {
    const x = cloud.x - cloud.w * 0.38 + (i + 0.5) * cloud.w * 0.76 / n;
    const y = sy + cloud.h * 0.45 + ((now / 4 + i * 37) % 30);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 7); ctx.stroke();
  }

  // bolt: bright at first, flickering
  if (k > 0.45 && Math.sin(now / 45) > -0.3) {
    ctx.translate(cloud.x + cloud.w * 0.12, sy + cloud.h * 0.38);
    ctx.shadowColor = '#FFE066';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#FFE066';
    ctx.beginPath();
    ctx.moveTo( 4,  0); ctx.lineTo(-4, 13); ctx.lineTo( 1, 13);
    ctx.lineTo(-5, 28); ctx.lineTo(10,  9); ctx.lineTo( 4,  9);
    ctx.lineTo( 9,  0); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBirds() {
  state.birds.forEach(bird => {
    const sy = toScreenY(bird.worldY);
    if (sy < -bird.r * 4 || sy > VH + bird.r * 4) return;

    const lift   = Math.sin(bird.wingPhase);          // +1 wings up, -1 wings down
    const facing = bird.vx >= 0 ? 1 : -1;
    const r      = bird.r;

    ctx.save();
    // Local frame: unit = r, facing right; the body bobs up on the downstroke
    ctx.translate(bird.x, sy - lift * r * 0.06);
    ctx.scale(facing * r, r);
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    const rim = 'rgba(255,255,255,0.22)';             // keeps the crow readable on the night sky

    // Wing: broad arm from the shoulder, four splayed primaries at the tip,
    // then a curved trailing edge back to the root
    function wing(l, size, fill, outline) {
      const sx = 0.22, sy0 = -0.14;                   // shoulder
      const rx = -0.32, ry = 0.06;                    // trailing root
      const tx = -0.5 * size, ty = -0.1 - l * 0.85 * size;
      const tipA   = Math.atan2(ty - sy0, tx - sx);   // shoulder → tip
      const trailA = Math.atan2(ry - ty, rx - tx);    // tip → root
      let turn = trailA - tipA;
      while (turn >  Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;

      function shape() {
        ctx.beginPath();
        ctx.moveTo(sx, sy0);
        ctx.quadraticCurveTo(0.02, sy0 + (ty - sy0) * 0.85 - 0.12 * size, tx, ty);
        ctx.quadraticCurveTo(lerpVal(tx, rx, 0.6), lerpVal(ty, ry, 0.6) + 0.1, rx, ry);
        ctx.closePath();
        // primaries: a fan of long feathers spreading from the tip toward the trailing edge
        for (let k = 0; k < 4; k++) {
          const t  = 0.04 + k * 0.12;
          const bx = lerpVal(tx, rx, t), by = lerpVal(ty, ry, t);
          const a  = tipA + turn * (0.08 + k * 0.16);
          const L  = (0.36 - k * 0.05) * size;
          const ex = bx + Math.cos(a) * L * 0.5, ey = by + Math.sin(a) * L * 0.5;
          ctx.moveTo(ex + Math.cos(a) * L * 0.55, ey + Math.sin(a) * L * 0.55);
          ctx.ellipse(ex, ey, L * 0.55, 0.06 * size, a, 0, Math.PI * 2);
        }
      }
      if (outline) {                                  // outline under the fill: only the silhouette shows
        shape();
        ctx.lineWidth   = 0.09;
        ctx.strokeStyle = rim;
        ctx.stroke();
      }
      shape();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    // far wing, slightly behind in phase
    wing(Math.sin(bird.wingPhase - 0.5) * 0.85, 0.82, '#10141A', true);

    // tail fan
    ctx.beginPath();
    ctx.moveTo(-0.38, -0.08);
    ctx.lineTo(-0.98, -0.2);
    ctx.quadraticCurveTo(-1.08, 0.0, -0.98, 0.16);
    ctx.lineTo(-0.38, 0.1);
    ctx.closePath();
    ctx.lineWidth = 0.09; ctx.strokeStyle = rim; ctx.stroke();
    ctx.fillStyle = '#161B22';
    ctx.fill();

    // body with a blue-violet sheen on the back
    const g = ctx.createLinearGradient(0, -0.32, 0, 0.3);
    g.addColorStop(0, '#3B4758');
    g.addColorStop(1, '#0E1217');
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.52, 0.29, -0.08, 0, Math.PI * 2);
    ctx.moveTo(0.74, -0.18);
    ctx.arc(0.5, -0.18, 0.24, 0, Math.PI * 2);
    ctx.lineWidth = 0.09; ctx.strokeStyle = rim; ctx.stroke();   // under the fill: silhouette only
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(120,150,215,0.30)';
    ctx.beginPath(); ctx.ellipse(-0.05, -0.15, 0.32, 0.08, -0.12, 0, Math.PI * 2); ctx.fill();

    // beak: heavy and slightly hooked
    ctx.beginPath();
    ctx.moveTo(0.68, -0.27);
    ctx.quadraticCurveTo(0.9, -0.26, 1.02, -0.13);
    ctx.quadraticCurveTo(0.88, -0.1, 0.7, -0.09);
    ctx.closePath();
    ctx.fillStyle = '#2C323A';
    ctx.fill();
    ctx.lineWidth = 0.035; ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(0.72, -0.24); ctx.quadraticCurveTo(0.88, -0.22, 0.98, -0.14); ctx.stroke();

    // eye
    ctx.fillStyle = '#E9EEF4';
    ctx.beginPath(); ctx.arc(0.56, -0.25, 0.075, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0B0E12';
    ctx.beginPath(); ctx.arc(0.575, -0.25, 0.045, 0, Math.PI * 2); ctx.fill();

    // near wing, over the body
    wing(lift, 1, '#2A3340', lift > 0.25 || lift < -0.25);

    ctx.restore();
  });
}

function drawArcPreview() {
  if (state.phase !== 'aiming' || !state.drag.active) return;
  const { vx, vy } = computeLaunchVelocity();
  if (Math.hypot(vx, vy) < 0.01) return;

  // Simulate full trajectory in world coords until Stilla hits the grass
  const DT = 14;
  const groundWY = groundSurfaceY() - DROPLET_R;
  const points = [];
  let px = state.droplet.x, pwy = state.droplet.worldY;
  let pvx = vx, pvy = vy;
  for (let s = 0; s < 500; s++) {
    pvy += GRAVITY * DT;
    px  += pvx * DT;
    pwy += pvy * DT;
    if (px < DROPLET_R)                { px = DROPLET_R;                pvx =  Math.abs(pvx) * 0.85; }
    if (px > VW - DROPLET_R) { px = VW - DROPLET_R; pvx = -Math.abs(pvx) * 0.85; }
    points.push({ x: px, wy: pwy });
    if (pwy >= groundWY) break;
  }

  // Level 1 → 100% visible; from level 2 onward shrink linearly toward 15%
  const n = state.activeDefinitions.length;
  let fraction = 1.0;
  if (state.currentDefIndex > 0 && n > 1) {
    const totalShrink   = state.activeDefinitions.slice(1).reduce((s, d) => s + d.fragments.length, 0);
    const clearedShrink = state.activeDefinitions.slice(1, state.currentDefIndex)
      .reduce((s, d) => s + d.fragments.length, 0) + state.currentFragmentIndex;
    fraction = Math.max(0.15, 1.0 - (clearedShrink / Math.max(1, totalShrink)) * 0.85);
  }

  const visibleCount = Math.min(points.length, Math.max(2, Math.round(points.length * fraction)));
  const NDOTS = 30;
  const step  = Math.max(1, Math.ceil(visibleCount / NDOTS));

  for (let i = step; i < visibleCount; i += step) {
    const p  = points[i];
    const sy = toScreenY(p.wy);
    const t  = i / visibleCount;
    const a  = Math.max(0.15, 0.90 * (1 - t * 0.65));
    // dark halo for contrast against any sky colour
    ctx.beginPath();
    ctx.arc(p.x, sy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,60,120,${a * 0.55})`;
    ctx.fill();
    // white dot
    ctx.beginPath();
    ctx.arc(p.x, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  }
}

function drawVelocityVector() {
  if (state.phase !== 'aiming' || !state.drag.active) return;
  const sx = state.droplet.x, sy = toScreenY(state.droplet.worldY);
  const px = state.drag.currentX, py = state.drag.currentScreenY;
  const pull = Math.hypot(px - sx, py - sy);
  if (pull < 2) return;
  const power = Math.min(1, pull / MAX_PULL);
  const ringR = DROPLET_R + 11;

  ctx.save();
  // elastic toward the finger
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth   = 3 - power * 1.4;
  ctx.lineCap     = 'round';
  ctx.setLineDash([1, 6]);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

  // power ring: fills clockwise, turns gold at full power
  ctx.lineWidth   = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.arc(sx, sy, ringR, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = power > 0.97 ? COL.gold : '#FFFFFF';
  ctx.beginPath(); ctx.arc(sx, sy, ringR, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawPromptBar() {
  if (state.currentDefIndex >= state.activeDefinitions.length) { state.hudH = 0; return; }
  const def   = state.activeDefinitions[state.currentDefIndex];
  const total = def.fragments.length;
  const done  = state.currentFragmentIndex;
  const assembled = def.fragments.slice(0, done).join(' ');

  const x = 60, y = 8, w = VW - x - 8, pad = 12;
  const counter = `${state.currentDefIndex + 1}/${state.activeDefinitions.length}`;
  ctx.font = `800 12px ${FONT_UI}`;
  const counterW = ctx.measureText(counter).width;

  ctx.font = `600 16px ${FONT_DISPLAY}`;
  const qLines = wrapText(ctx, def.prompt, w - pad * 2 - counterW - 10).slice(0, 2);
  ctx.font = `italic 700 13px ${FONT_UI}`;
  const aLines = assembled ? wrapText(ctx, assembled, w - pad * 2).slice(-2) : [];

  const qH  = qLines.length * 20;
  const aH  = aLines.length ? aLines.length * 17 + 4 : 0;
  const h   = pad + qH + 18 + aH + pad - 2;
  state.hudH = y + h;

  ctx.save();
  ctx.shadowColor   = 'rgba(15,45,80,0.22)';
  ctx.shadowBlur    = 14;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle     = 'rgba(255,255,255,0.95)';
  roundRect(x, y, w, h, 16); ctx.fill();
  ctx.restore();

  ctx.textBaseline = 'top';
  ctx.font      = `800 12px ${FONT_UI}`;
  ctx.fillStyle = COL.stilla;
  ctx.textAlign = 'right';
  ctx.fillText(counter, x + w - pad, y + pad + 3);

  ctx.font      = `600 16px ${FONT_DISPLAY}`;
  ctx.fillStyle = COL.ink;
  ctx.textAlign = 'left';
  qLines.forEach((ln, i) => ctx.fillText(ln, x + pad, y + pad + i * 20));

  // one drop per fragment: filled = placed, outlined = next target
  const pipY = y + pad + qH + 11;
  for (let i = 0; i < total; i++) {
    const px = x + pad + 5 + i * 15;
    teardropPath(px, pipY, 4.5);
    if (i < done) {
      ctx.fillStyle = COL.stilla; ctx.fill();
    } else if (i === done) {
      ctx.fillStyle = 'rgba(31,143,214,0.15)'; ctx.fill();
      ctx.strokeStyle = COL.stilla; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(23,50,79,0.14)'; ctx.fill();
    }
  }

  if (aLines.length) {
    ctx.font      = `italic 700 13px ${FONT_UI}`;
    ctx.fillStyle = '#2C5A86';
    aLines.forEach((ln, i) => ctx.fillText(ln, x + pad, pipY + 10 + i * 17));
  }
}

function drawRipples() {
  state.ripples.forEach(r => {
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, r.alpha)})`;
    ctx.lineWidth   = 2;
    ctx.stroke();
  });
}

function drawParticles() {
  state.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    if (p.kind === 'spark') {
      ctx.fillStyle = COL.gold;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    } else {
      teardropPath(p.x, p.y, p.r);
      ctx.fillStyle = p.color || '#4EC0F2';
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function drawWinBanner() {
  const t  = Math.min(1, state.winTimer / 500);
  const bW = Math.min(VW - 32, 360);
  const bH = 156;
  const bX = (VW - bW) / 2;
  const bY = VH * 0.4 - bH / 2 + (1 - easeOut(t)) * 30;
  const n  = state.activeDefinitions.length;
  const l  = state.launches;

  ctx.save();
  ctx.globalAlpha   = t;
  ctx.shadowColor   = 'rgba(10,25,60,0.35)';
  ctx.shadowBlur    = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle     = 'rgba(255,255,255,0.97)';
  roundRect(bX, bY, bW, bH, 22); ctx.fill();
  ctx.shadowColor = 'transparent';

  teardropPath(VW / 2, bY + 38, 11);
  ctx.fillStyle = COL.stilla; ctx.fill();

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = COL.ink;
  ctx.font         = `600 23px ${FONT_DISPLAY}`;
  ctx.fillText('Cima raggiunta', VW / 2, bY + 74);
  ctx.fillStyle = '#3D5F80';
  ctx.font      = `700 14px ${FONT_UI}`;
  ctx.fillText(`${n} ${n === 1 ? 'definizione ricostruita' : 'definizioni ricostruite'} in ${l} ${l === 1 ? 'lancio' : 'lanci'}`,
               VW / 2, bY + 102, bW - 24);
  if (state.winTimer > 1200) {
    ctx.fillStyle = COL.stilla;
    ctx.font      = `800 13px ${FONT_UI}`;
    ctx.fillText('Tocca per tornare al menu', VW / 2, bY + 132);
  }
  ctx.restore();
}

function drawGameoverText() {
  const a = Math.min(1, (GAMEOVER_MS - state.shakeTimer) / 200);
  ctx.save();
  ctx.globalAlpha  = a;
  ctx.font         = `600 26px ${FONT_DISPLAY}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth    = 6;
  ctx.lineJoin     = 'round';
  ctx.strokeStyle  = 'rgba(23,50,79,0.55)';
  ctx.strokeText('Di nuovo da terra', VW / 2, VH * 0.45);
  ctx.fillStyle    = '#FFFFFF';
  ctx.fillText('Di nuovo da terra', VW / 2, VH * 0.45);
  ctx.restore();
}

function drawMenuScene() {
  const gy  = VH * 0.9;
  const now = performance.now();
  drawBgHills({ seed: 3 }, gy);
  [[0.12, 50, 0], [0.3, 64, 1], [0.7, 58, 0], [0.88, 70, 1]].forEach(([fx, h, depth], i) => {
    drawBgTree({ x: VW * fx, h, depth, variant: i % 2 ? 'pine' : 'round', green: 118 }, gy - (depth ? 0 : 6));
  });
  drawGrassStrip(gy);
  // idle hop: shows that Stilla jumps
  const ph  = (now % 1400) / 1400;
  const hop = Math.sin(ph * Math.PI);
  const sq  = ph > 0.92 || ph < 0.04 ? 0.82 : 1;
  drawDroplet(VW / 2, gy - DROPLET_R - hop * 26, 2 - sq, sq);
}

// ── Input ─────────────────────────────────────────────────────────────────────
function getEventXY(e) {
  if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function onDragStart(e) {
  if (state.phase === 'win' && state.winTimer > 1200) { goToMenu(); return; }
  if (state.phase !== 'aiming' || state.inputLocked) return;
  if (e.cancelable) e.preventDefault();
  const { x, y } = getEventXY(e);
  state.drag.active       = true;
  state.drag.startX       = state.droplet.x;
  state.drag.startScreenY = toScreenY(state.droplet.worldY);
  state.drag.currentX     = x;
  state.drag.currentScreenY = y;
}

function onDragMove(e) {
  if (!state.drag.active) return;
  if (e.cancelable) e.preventDefault();
  const { x, y } = getEventXY(e);
  let dx = x - state.drag.startX;
  let dy = y - state.drag.startScreenY;
  const dist = Math.hypot(dx, dy);
  if (dist > MAX_PULL) {
    const a = Math.atan2(dy, dx);
    dx = Math.cos(a) * MAX_PULL;
    dy = Math.sin(a) * MAX_PULL;
  }
  state.drag.currentX       = state.drag.startX       + dx;
  state.drag.currentScreenY = state.drag.startScreenY + dy;
}

function computeLaunchVelocity() {
  const pullX = state.drag.currentX       - state.drag.startX;
  const pullY = state.drag.currentScreenY - state.drag.startScreenY;
  return { vx: -pullX * LAUNCH_SCALE, vy: -pullY * LAUNCH_SCALE };
}

function onDragEnd(e) {
  if (!state.drag.active) return;
  if (e.cancelable) e.preventDefault();
  state.drag.active = false;
  const { vx, vy } = computeLaunchVelocity();
  if (Math.hypot(vx, vy) < 0.02) return;
  state.droplet.vx      = vx;
  state.droplet.vy      = vy;
  state.flightPeakWorldY = state.droplet.worldY;   // reset peak tracker
  state.launches++;
  state.phase           = 'flying';
}

canvas.addEventListener('touchstart',  onDragStart, { passive: false });
canvas.addEventListener('touchmove',   onDragMove,  { passive: false });
canvas.addEventListener('touchend',    onDragEnd,   { passive: false });
canvas.addEventListener('touchcancel', onDragEnd,   { passive: false });
canvas.addEventListener('mousedown',   onDragStart);
canvas.addEventListener('mousemove',   onDragMove);
canvas.addEventListener('mouseup',     onDragEnd);

// ── Collision ─────────────────────────────────────────────────────────────────
function overlapsWith(droplet, cloud) {
  const csy = toScreenY(cloud.worldY);
  const dsy = toScreenY(droplet.worldY);
  return (
    droplet.x + DROPLET_R * 0.8 > cloud.x - cloud.w / 2 &&
    droplet.x - DROPLET_R * 0.8 < cloud.x + cloud.w / 2 &&
    dsy + DROPLET_R * 0.8 > csy - cloud.h / 2 &&
    dsy - DROPLET_R * 0.8 < csy + cloud.h / 2
  );
}

function isSolid(cloud) {
  if (!cloud.isCorrect) return false;
  if (cloud.cleared)    return true;   // cleared clouds: always solid (fall recovery)
  // Only the exact current target row in the current definition is a landing spot
  return cloud.defIndex === state.currentDefIndex &&
         cloud.row      === state.currentFragmentIndex;
}

function handleCloudCollisions() {
  for (const cloud of state.clouds) {
    if (!overlapsWith(state.droplet, cloud)) continue;
    if (isSolid(cloud)) {
      if (state.droplet.vy > 0) { landOnCloud(cloud); return; }
    } else {
      triggerStorm(cloud);   // vx/vy/worldY intentionally untouched
    }
  }
}

function handleBirdCollisions() {
  const d = state.droplet;
  for (const bird of state.birds) {
    const dx   = d.x - bird.x;
    const dy   = d.worldY - bird.worldY;
    const dist = Math.hypot(dx, dy);
    const minD = DROPLET_R + bird.r;
    if (dist >= minD || dist === 0) continue;
    const nx  = dx / dist;
    const ny  = dy / dist;
    const dvn = d.vx * nx + d.vy * ny;
    if (dvn >= 0) continue;          // already separating
    d.vx -= 1.85 * dvn * nx;
    d.vy -= 1.85 * dvn * ny;
    const overlap = minD - dist;     // push droplet out of the bird
    d.x      += nx * overlap;
    d.worldY += ny * overlap;
  }
}

// ── Game logic ────────────────────────────────────────────────────────────────
function landOnCloud(cloud) {
  const d = state.droplet;
  d.worldY = cloud.worldY - cloud.h / 2 - DROPLET_R * 1.05;
  d.vx = 0;
  d.vy = 0;

  if (cloud.cleared) {
    // Fell back onto the SAME cloud we just launched from → UFO rescue
    // (only if the jump actually reached the next row of clouds)
    if (cloud === state.lastRestingCloud && jumpReachedNextRow(cloud)) {
      startUFO(cloud);
      return;
    }
    // Fall recovery on a different cleared cloud
    cloud.clearedThisSession   = true;
    resetProgressAbove(cloud.defIndex, cloud.row);
    reshuffleAbove(cloud.defIndex);
    state.currentDefIndex      = cloud.defIndex;
    state.currentFragmentIndex = cloud.row + 1;

    const totalRows = state.activeDefinitions[cloud.defIndex].fragments.length;
    if (state.currentFragmentIndex >= totalRows) {
      state.currentDefIndex++;
      state.currentFragmentIndex = 0;
    }
    startSquash();
    state.lastRestingCloud = cloud;
    state.phase = 'resting';
    return;
  }

  // Normal correct landing (new cloud cleared for the first time)
  spawnLandSparks(cloud);
  cloud.cleared              = true;
  cloud.clearedThisSession   = true;
  state.currentFragmentIndex = cloud.row + 1;
  state.lastRestingCloud     = cloud;

  const totalRows = state.activeDefinitions[state.currentDefIndex].fragments.length;
  if (state.currentFragmentIndex >= totalRows) {
    state.currentDefIndex++;
    state.currentFragmentIndex = 0;
    if (state.currentDefIndex >= state.activeDefinitions.length) {
      startSquash();
      state.phase    = 'win';
      state.winTimer = 0;
      spawnWinParticles();
      return;
    }
  }

  startSquash();
  state.phase = 'resting';
}

function resetProgressAbove(defIndex, row) {
  // Clear progress for any cloud strictly above the landing point
  state.clouds.forEach(c => {
    if (c.defIndex > defIndex || (c.defIndex === defIndex && c.row > row)) {
      c.cleared            = false;
      c.clearedThisSession = false;
      c.stormActive        = false;
      c.stormTimer         = 0;
    }
  });
}

// Shuffle content AND rebuild cloud layouts for all definitions strictly above
// landingDefIndex. Definitions at or below landingDefIndex stay unchanged.
// Pass -1 to reshuffle everything (used when landing on the ground).
function reshuffleAbove(landingDefIndex) {
  const n     = state.activeDefinitions.length;
  const start = landingDefIndex + 1;           // first index to reshuffle
  if (start >= n) return;

  // Shuffle the definition objects in the upper slots
  const upper   = state.activeDefinitions.slice(start);
  const shuffled = shuffleArray(upper);
  for (let i = 0; i < shuffled.length; i++) {
    state.activeDefinitions[start + i] = shuffled[i];
  }

  // Remove old clouds for those slots and rebuild with new layouts
  state.clouds = state.clouds.filter(c => c.defIndex < start);
  for (let defIdx = start; defIdx < n; defIdx++) {
    const def      = state.activeDefinitions[defIdx];
    const totalRows = def.fragments.length;
    const isPerRow  = Array.isArray(def.distractors[0]);
    const distPool  = isPerRow ? null : shuffleArray([...def.distractors]);
    for (let row = 0; row < totalRows; row++) {
      buildRow(defIdx, row, totalRows, def, distPool);
    }
  }
}

function triggerStorm(cloud) {
  if (!cloud.stormActive) state.flash = 1;
  cloud.stormActive = true;
  cloud.stormTimer  = STORM_MS;
}

function startSquash() {
  state.droplet.squashTimer = SQUASH_MS;
  state.droplet.scaleX      = 1.4;
  state.droplet.scaleY      = 0.6;
}

function spawnWinParticles() {
  const sx = state.droplet.x;
  const sy = toScreenY(state.droplet.worldY);
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    state.particles.push({
      x: sx, y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      alpha: 1, r: 4 + Math.random() * 5
    });
  }
}

function spawnLandSparks(cloud) {
  const sy = toScreenY(cloud.worldY) - cloud.h * 0.45;
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + 0.8 * (i / 11));
    state.particles.push({
      kind: 'spark',
      x: cloud.x + Math.cos(a) * cloud.w * 0.3, y: sy,
      vx: Math.cos(a) * (0.8 + Math.random()),
      vy: Math.sin(a) * (1.2 + Math.random()) - 0.6,
      alpha: 1, r: 2 + Math.random() * 2
    });
  }
}

function spawnSplash() {
  const sx = state.droplet.x;
  const sy = toScreenY(groundSurfaceY()) - 4;
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * (0.08 + 0.84 * Math.random());
    const s = 1.5 + Math.random() * 2.5;
    state.particles.push({
      x: sx, y: sy,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.2,
      alpha: 0.95, r: 2.5 + Math.random() * 3
    });
  }
}

function updateTrail(dt) {
  if (state.phase === 'flying') {
    state.trail.push({ x: state.droplet.x, worldY: state.droplet.worldY, life: 1 });
    if (state.trail.length > 16) state.trail.shift();
  } else if (state.trail.length) {
    state.trail.forEach(p => { p.life -= dt / 250; });
    state.trail = state.trail.filter(p => p.life > 0);
  }
}

function spawnRipple(x, y) {
  state.ripples.push({ x, y, radius: DROPLET_R, alpha: 0.7 });
}

function resetDropletToStart() {
  const d    = state.droplet;
  d.x        = VW / 2;
  d.worldY   = dropletStartWorldY();
  d.vx       = 0;
  d.vy       = 0;
  d.scaleX   = 1;
  d.scaleY   = 1;
  d.squashTimer = 0;
}

// Follows the droplet, but rises further when needed so the row to reach next
// sits below the prompt panel instead of under it. The droplet stays on screen.
function cameraTarget() {
  const d = state.droplet;
  let cam = d.worldY - VH * 0.65;
  if (state.phase !== 'win' && state.phase !== 'ufo') {
    const next = state.clouds.filter(c =>
      c.defIndex === state.currentDefIndex && c.row === state.currentFragmentIndex);
    if (next.length) {
      const top = Math.min(...next.map(c => c.worldY - c.h * 0.75));
      const hud = (state.hudH || 110) + 14;
      cam = Math.min(cam, top - hud);
      cam = Math.max(cam, d.worldY + DROPLET_R + 70 - VH);
    }
  }
  return Math.max(0, Math.min(cam, totalWorldH() - VH));
}

function snapCameraToDroplet() {
  state.cameraY = cameraTarget();
}

function fullReset() {
  // Hitting the ground is a hard reset to definition 0 (the ground-level def).
  // The definition text of def 0 is preserved, but its clouds are repositioned
  // at new random horizontal positions; definitions 1..n-1 are reshuffled above.
  state.currentDefIndex      = 0;
  state.currentFragmentIndex = 0;
  state.shakeTimer           = 0;
  state.particles            = [];
  state.lastRestingCloud     = null;
  state.flightPeakWorldY     = Infinity;
  state.inputLocked          = false;

  // Wipe visual state from all clouds (storms, gold highlights).
  state.clouds.forEach(c => {
    c.clearedThisSession = false;
    c.stormActive        = false;
    c.stormTimer         = 0;
  });

  // Drop def 0's clouds so we can rebuild them with new random positions.
  // reshuffleAbove(0) will later drop defIndex >= 1 and rebuild those too.
  state.clouds = state.clouds.filter(c => c.defIndex !== 0);

  // Rebuild def 0 rows — same definition content, fresh random x positions.
  const def0       = state.activeDefinitions[0];
  const totalRows0 = def0.fragments.length;
  const isPerRow0  = Array.isArray(def0.distractors[0]);
  const distPool0  = isPerRow0 ? null : shuffleArray([...def0.distractors]);
  for (let row = 0; row < totalRows0; row++) {
    buildRow(0, row, totalRows0, def0, distPool0);
  }

  // Reshuffle everything above def 0 (defs 1..n-1).
  reshuffleAbove(0);

  const d = state.droplet;
  d.worldY = groundSurfaceY() - DROPLET_R;
  d.x = VW / 2;
  d.vx = 0; d.vy = 0; d.scaleX = 1; d.scaleY = 1; d.squashTimer = 0;
  snapCameraToDroplet();
  state.phase = 'aiming';
}

// ── Update ────────────────────────────────────────────────────────────────────
function updateCamera(dt) {
  const target = cameraTarget();
  const lerpK  = Math.min(1, 0.006 * dt);
  state.cameraY += (target - state.cameraY) * lerpK;
}

function updateFlying(dt) {
  const d = state.droplet;
  d.vy     += GRAVITY * dt;
  d.x      += d.vx * dt;
  d.worldY += d.vy * dt;
  // Track the highest point reached (min worldY = highest altitude)
  if (d.worldY < state.flightPeakWorldY) state.flightPeakWorldY = d.worldY;

  if (d.x - DROPLET_R < 0) {
    d.x  = DROPLET_R;
    d.vx = Math.abs(d.vx) * 0.85;
    spawnRipple(0, toScreenY(d.worldY));
  }
  if (d.x + DROPLET_R > VW) {
    d.x  = VW - DROPLET_R;
    d.vx = -Math.abs(d.vx) * 0.85;
    spawnRipple(VW, toScreenY(d.worldY));
  }
  if (d.worldY >= groundSurfaceY() - DROPLET_R) {
    d.worldY         = groundSurfaceY() - DROPLET_R * 0.45;
    d.vx             = 0;
    d.vy             = 0;
    d.scaleX         = 1.7;   // puddle
    d.scaleY         = 0.45;
    spawnSplash();
    state.phase      = 'gameover';
    state.shakeTimer = GAMEOVER_MS;
    return;
  }

  handleBirdCollisions();
  handleCloudCollisions();
}

function updateResting(dt) {
  const d = state.droplet;
  d.squashTimer -= dt;
  const half = SQUASH_MS / 2;

  if (d.squashTimer > half) {
    const t  = 1 - (d.squashTimer - half) / half;
    d.scaleX = 1 + 0.4 * (1 - t);
    d.scaleY = 1 - 0.4 * (1 - t);
  } else if (d.squashTimer > 0) {
    const t  = d.squashTimer / half;
    d.scaleX = 1 + 0.4 * t;
    d.scaleY = 1 - 0.4 * t;
  } else {
    d.scaleX = 1;
    d.scaleY = 1;
    if (state.phase === 'resting') state.phase = 'aiming';
  }
}

function updateWin(dt) {
  if (state.droplet.squashTimer > 0) {
    const d    = state.droplet;
    const half = SQUASH_MS / 2;
    d.squashTimer -= dt;
    if (d.squashTimer > half) {
      const t = 1 - (d.squashTimer - half) / half;
      d.scaleX = 1 + 0.4 * (1 - t); d.scaleY = 1 - 0.4 * (1 - t);
    } else if (d.squashTimer > 0) {
      const t = d.squashTimer / half;
      d.scaleX = 1 + 0.4 * t; d.scaleY = 1 - 0.4 * t;
    } else {
      d.scaleX = 1; d.scaleY = 1;
    }
  }
  // a light shower of drops for the first seconds
  if (state.winTimer < 4000 && Math.random() < dt / 90) {
    state.particles.push({
      x: Math.random() * VW, y: -10,
      vx: (Math.random() - 0.5) * 0.4, vy: 1 + Math.random(),
      alpha: 2.5, r: 3 + Math.random() * 3
    });
  }
  state.winTimer += dt;
}

function updateGameover(dt) {
  state.shakeTimer -= dt;
  if (state.shakeTimer <= 0) fullReset();
}

function updateStormTimers(dt) {
  state.clouds.forEach(c => {
    if (!c.stormActive) return;
    c.stormTimer -= dt;
    if (c.stormTimer <= 0) { c.stormActive = false; c.stormTimer = 0; }
  });
}

function updateParticles(dt) {
  state.particles = state.particles.filter(p => p.alpha > 0);
  state.particles.forEach(p => {
    p.vy    += GRAVITY * dt * 0.5;
    p.x     += p.vx * dt * 0.08;
    p.y     += p.vy * dt * 0.08;
    p.alpha -= dt / 1000;
  });
}

function updateRipples(dt) {
  state.ripples = state.ripples.filter(r => r.alpha > 0);
  state.ripples.forEach(r => { r.radius += 0.18 * dt; r.alpha -= 0.0025 * dt; });
}

function updateBirds(dt) {
  state.birds.forEach(bird => {
    bird.x        += bird.vx * dt;
    bird.wingPhase = (bird.wingPhase + dt * 0.006) % (Math.PI * 2);
    if (bird.x - bird.r < 0) {
      bird.x  = bird.r;
      bird.vx = Math.abs(bird.vx);
    } else if (bird.x + bird.r > VW) {
      bird.x  = VW - bird.r;
      bird.vx = -Math.abs(bird.vx);
    }
  });
}

// ── Game loop ─────────────────────────────────────────────────────────────────
let lastTime = 0;

// Returns true if the last flight peaked at or above the worldY of the row
// immediately above the given cloud (i.e., the next target row).
function jumpReachedNextRow(cloud) {
  // The next target after this cloud is (row + 1) in the same def,
  // or (defIndex + 1, row 0) if this was the last row in the def.
  const def       = state.activeDefinitions[cloud.defIndex];
  const nextRow   = cloud.row + 1;
  let   nextCloud;

  if (nextRow < def.fragments.length) {
    nextCloud = state.clouds.find(c =>
      c.defIndex === cloud.defIndex && c.row === nextRow && c.isCorrect);
  } else if (cloud.defIndex + 1 < state.activeDefinitions.length) {
    nextCloud = state.clouds.find(c =>
      c.defIndex === cloud.defIndex + 1 && c.row === 0 && c.isCorrect);
  }

  if (!nextCloud) return false;   // no next cloud found → don't trigger
  // Jump is "high enough" if peak reached at least the bottom edge of that cloud
  return state.flightPeakWorldY <= nextCloud.worldY + CLOUD_H;
}

// ── UFO rescue ────────────────────────────────────────────────────────────────
function startUFO(cloud) {
  const d   = state.droplet;
  // Direction toward canvas centre so the droplet clears the cloud edge
  const dir     = (VW / 2 >= cloud.x) ? 1 : -1;
  const targetX = cloud.x + dir * (cloud.w / 2 + DROPLET_R + UFO_SIDE_PAD);

  const ufo = state.ufo;
  ufo.active           = true;
  ufo.x                = d.x;
  ufo.enterStartWorldY = state.cameraY - 90;   // just above top screen edge (world coords)
  ufo.enterEndWorldY   = d.worldY - UFO_HOVER_GAP;
  ufo.worldY           = ufo.enterStartWorldY;
  ufo.phase            = 'entering';
  ufo.timer            = UFO_ENTER_MS;
  ufo.duration         = UFO_ENTER_MS;
  ufo.startX           = d.x;
  ufo.targetX          = targetX;
  ufo.dropCloud        = cloud;
  ufo.beamAlpha        = 0;
  ufo.snapDropletWorldY = 0;
  ufo.releaseWorldY    = 0;

  d.vx = 0;
  d.vy = 0;
  state.inputLocked = true;    // disable controls during animation
  state.phase = 'ufo';
}

function _ufoNext(phase, duration) {
  state.ufo.phase    = phase;
  state.ufo.timer    = duration;
  state.ufo.duration = duration;
}

function updateUFO(dt) {
  const ufo = state.ufo;
  const d   = state.droplet;

  ufo.timer -= dt;
  const raw = ufo.duration > 0 ? Math.max(0, 1 - ufo.timer / ufo.duration) : 1;

  switch (ufo.phase) {

    case 'entering': {
      // Descend from off-screen to hover above droplet
      ufo.worldY = ufo.enterStartWorldY +
                   (ufo.enterEndWorldY - ufo.enterStartWorldY) * easeOut(raw);
      if (ufo.timer <= 0) {
        ufo.worldY = ufo.enterEndWorldY;
        _ufoNext('beaming', UFO_BEAM_MS);
      }
      break;
    }

    case 'beaming': {
      // Tractor beam ramps up
      ufo.beamAlpha = Math.min(1, ufo.beamAlpha + dt / 160);
      if (ufo.timer <= 0) {
        ufo.snapDropletWorldY = d.worldY;
        _ufoNext('lifting', UFO_LIFT_MS);
      }
      break;
    }

    case 'lifting': {
      // Droplet rises into beam
      d.worldY = ufo.snapDropletWorldY - UFO_LIFT_PX * easeOut(raw);
      // UFO stays at same worldY (gap shrinks as droplet rises)
      if (ufo.timer <= 0) {
        d.worldY     = ufo.snapDropletWorldY - UFO_LIFT_PX;
        ufo.startX   = ufo.x;
        _ufoNext('moving', UFO_MOVE_MS);
      }
      break;
    }

    case 'moving': {
      // UFO + droplet glide sideways, clearing the cloud edge
      const t = easeInOut(raw);
      ufo.x   = ufo.startX  + (ufo.targetX - ufo.startX)  * t;
      d.x     = ufo.x;
      if (ufo.timer <= 0) {
        ufo.x  = ufo.targetX;
        d.x    = ufo.targetX;
        ufo.releaseWorldY = ufo.worldY;
        _ufoNext('releasing', UFO_RELEASE_MS);
      }
      break;
    }

    case 'releasing': {
      // Beam fades; UFO drifts upward
      ufo.beamAlpha = Math.max(0, 1 - raw * 2.2);
      ufo.worldY    = ufo.releaseWorldY - 80 * raw;
      if (ufo.timer <= 0) {
        ufo.beamAlpha = 0;
        ufo.active    = false;
        ufo.phase     = 'idle';

        // Apply fall-recovery (same logic as landOnCloud cleared-path),
        // but skip UFO re-trigger by clearing lastRestingCloud first.
        state.lastRestingCloud = null;
        const cloud = ufo.dropCloud;
        cloud.clearedThisSession = true;
        resetProgressAbove(cloud.defIndex, cloud.row);
        reshuffleAbove(cloud.defIndex);
        state.currentDefIndex      = cloud.defIndex;
        state.currentFragmentIndex = cloud.row + 1;
        const totalRows = state.activeDefinitions[cloud.defIndex].fragments.length;
        if (state.currentFragmentIndex >= totalRows) {
          state.currentDefIndex++;
          state.currentFragmentIndex = 0;
        }

        // Release: droplet falls straight down (vx=0, vy=0 → gravity in 'flying')
        d.vx = 0;
        d.vy = 0;
        state.inputLocked = false;   // re-enable controls
        state.phase = 'flying';
      }
      break;
    }
  }
}

// ── Draw the tractor beam only (call BEFORE drawDroplet for correct layering)
function drawUFOBeam() {
  const ufo = state.ufo;
  if (!ufo.active || ufo.beamAlpha <= 0) return;

  const now   = performance.now();
  const ux    = ufo.x;
  const by    = toScreenY(ufo.worldY) + 14;          // emitter under the hull
  const dx    = state.droplet.x;
  const dy    = toScreenY(state.droplet.worldY) + DROPLET_R * 0.9;
  const a     = ufo.beamAlpha * (0.85 + 0.15 * Math.sin(now / 90));
  const topW  = 13, botW = DROPLET_R * 1.7;

  ctx.save();
  // cone
  ctx.beginPath();
  ctx.moveTo(ux - topW, by);
  ctx.lineTo(ux + topW, by);
  ctx.lineTo(dx + botW, dy);
  ctx.lineTo(dx - botW, dy);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, by, 0, dy);
  g.addColorStop(0, `rgba(150,255,190,${0.55 * a})`);
  g.addColorStop(1, `rgba(150,255,190,${0.12 * a})`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // bright edges
  ctx.strokeStyle = `rgba(210,255,225,${0.55 * a})`;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(ux - topW, by); ctx.lineTo(dx - botW, dy);
  ctx.moveTo(ux + topW, by); ctx.lineTo(dx + botW, dy);
  ctx.stroke();
  // rings travelling up the beam
  const len = dy - by;
  for (let k = 0; k < 4; k++) {
    const t  = 1 - ((now / 900 + k / 4) % 1);
    const y  = by + len * t;
    const cx = lerpVal(ux, dx, t);
    const hw = lerpVal(topW, botW, t);
    ctx.strokeStyle = `rgba(230,255,235,${0.6 * a * Math.sin(t * Math.PI)})`;
    ctx.lineWidth   = 1.6;
    ctx.beginPath(); ctx.ellipse(cx, y, hw, hw * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // motes rising
  for (let k = 0; k < 7; k++) {
    const t  = 1 - ((now / 1300 + k * 0.137) % 1);
    const cx = lerpVal(ux, dx, t) + Math.sin(k * 2.3 + now / 400) * lerpVal(topW, botW, t) * 0.6;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * a * Math.sin(t * Math.PI)})`;
    ctx.beginPath(); ctx.arc(cx, by + len * t, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // glow hugging the droplet
  const halo = ctx.createRadialGradient(state.droplet.x, dy - DROPLET_R, DROPLET_R * 0.6,
                                        state.droplet.x, dy - DROPLET_R, DROPLET_R * 2);
  halo.addColorStop(0, `rgba(150,255,190,${0.35 * a})`);
  halo.addColorStop(1, 'rgba(150,255,190,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(state.droplet.x, dy - DROPLET_R, DROPLET_R * 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Draw the UFO disc + dome only (call AFTER drawDroplet so it sits on top)
function drawUFOBody() {
  const ufo = state.ufo;
  if (!ufo.active) return;

  const now = performance.now();
  const ux  = ufo.x;
  const uy  = toScreenY(ufo.worldY) + Math.sin(now / 260) * 2;   // hover bob

  // banks into the sideways glide
  let tilt = 0;
  if (ufo.phase === 'moving' && ufo.duration > 0) {
    const p = 1 - ufo.timer / ufo.duration;
    tilt = Math.sin(p * Math.PI) * 0.16 * Math.sign(ufo.targetX - ufo.startX);
  }

  ctx.save();
  ctx.translate(ux, uy);
  ctx.rotate(tilt);

  // glass dome, with the pilot inside
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -6, 23, 25, 0, Math.PI, 0);
  ctx.closePath();
  const glass = ctx.createLinearGradient(0, -31, 0, -6);
  glass.addColorStop(0, 'rgba(190,235,255,0.85)');
  glass.addColorStop(1, 'rgba(90,170,220,0.75)');
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.clip();
  // pilot: round green head with two big eyes, looking down at Stilla
  const look = Math.max(-1, Math.min(1, (state.droplet.x - ux) / 40));
  ctx.fillStyle = '#7ED957';
  ctx.beginPath(); ctx.ellipse(0, -16, 9.5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-3.5, -9, 7, 4);
  ctx.strokeStyle = '#5DB33A'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -23); ctx.lineTo(-6, -27); ctx.moveTo(3, -23); ctx.lineTo(6, -27); ctx.stroke();
  ctx.fillStyle = '#5DB33A';
  ctx.beginPath(); ctx.moveTo(-4.2, -27.5); ctx.arc(-6, -27.5, 1.8, 0, Math.PI * 2); ctx.moveTo(7.8, -27.5); ctx.arc(6, -27.5, 1.8, 0, Math.PI * 2); ctx.fill();
  const blink = (now % 2900) < 120;
  [-1, 1].forEach(s => {
    ctx.fillStyle = '#10202C';
    ctx.beginPath(); ctx.ellipse(s * 4 + look, -15.5, 3, blink ? 0.5 : 3.8, s * 0.25, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(s * 4 + look - 1, -17, 1, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.restore();
  // dome glare and rim
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(-10, -20, 6, 3, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(40,90,130,0.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(0, -6, 23, 25, 0, Math.PI, 0); ctx.stroke();

  // hull: upper deck (light) and lower belly (darker), metallic
  const hull = ctx.createLinearGradient(0, -9, 0, 13);
  hull.addColorStop(0,    '#F2F6FA');
  hull.addColorStop(0.45, '#B9C6D2');
  hull.addColorStop(0.55, '#8A9AAA');
  hull.addColorStop(1,    '#5D6B79');
  ctx.beginPath();
  ctx.ellipse(0, 2, 48, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = hull;
  ctx.fill();
  ctx.strokeStyle = '#4A5866'; ctx.lineWidth = 1.5; ctx.stroke();
  // deck seam
  ctx.strokeStyle = 'rgba(70,85,100,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, 40, 6, 0, 0, Math.PI); ctx.stroke();
  // highlight along the top edge
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 2, 44, 9.5, 0, Math.PI * 1.12, Math.PI * 1.55); ctx.stroke();

  // running lights chasing around the rim
  const N = 9;
  for (let i = 0; i < N; i++) {
    const ang = Math.PI * (0.08 + 0.84 * i / (N - 1));     // front half of the rim
    const lx  = Math.cos(ang) * 40, ly = 3 + Math.sin(ang) * 6.5;
    const on  = ((Math.floor(now / 110) - i) % N + N) % N < 2;
    ctx.fillStyle = on ? '#FFE680' : '#6E5A2A';
    ctx.beginPath(); ctx.arc(lx, ly, on ? 2.6 : 2, 0, Math.PI * 2); ctx.fill();
    if (on) {
      ctx.fillStyle = 'rgba(255,230,128,0.35)';
      ctx.beginPath(); ctx.arc(lx, ly, 5.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // emitter under the belly, glowing while the beam is on
  const e = ufo.beamAlpha;
  ctx.fillStyle = '#3E4A56';
  ctx.beginPath(); ctx.ellipse(0, 13, 13, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  if (e > 0) {
    ctx.fillStyle = `rgba(170,255,200,${0.9 * e})`;
    ctx.beginPath(); ctx.ellipse(0, 13.5, 10, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function updateClouds(dt) {
  // 1. Move each cloud and bounce off walls
  state.clouds.forEach(cloud => {
    if (!cloud.vx || cloud.cleared) return;
    cloud.x += cloud.vx * dt;
    const halfW = cloud.w / 2 + 6;
    if (cloud.x - halfW < 0) {
      cloud.x = halfW;
      cloud.vx = Math.abs(cloud.vx);
    } else if (cloud.x + halfW > VW) {
      cloud.x = VW - halfW;
      cloud.vx = -Math.abs(cloud.vx);
    }
  });

  // 2. Cloud-cloud collisions: one pass over every pair in the same row.
  //    Cleared (golden) clouds are IMMOVABLE WALLS — moving clouds bounce off them.
  for (let i = 0; i < state.clouds.length; i++) {
    const a    = state.clouds[i];
    // Effective velocity: cleared clouds are frozen (their stored vx is ignored)
    const aVx  = a.cleared ? 0 : a.vx;

    for (let j = i + 1; j < state.clouds.length; j++) {
      const b   = state.clouds[j];
      const bVx = b.cleared ? 0 : b.vx;

      if (!aVx && !bVx) continue;             // both static: nothing to do
      if (b.defIndex !== a.defIndex || b.row !== a.row) continue;

      const gap = (a.w + b.w) / 2 + 4;       // minimum centre-to-centre distance
      const dx  = b.x - a.x;
      if (Math.abs(dx) >= gap) continue;      // no overlap

      const overlap = gap - Math.abs(dx);
      const dir     = dx >= 0 ? 1 : -1;      // unit direction a → b

      if (!aVx) {
        // A is immovable (static or golden): push B away, don't touch A
        if (!b.cleared) {
          b.x  += dir * overlap;
          b.vx  = dir * Math.abs(b.vx);
        }
      } else if (!bVx) {
        // B is immovable (static or golden): push A away, don't touch B
        if (!a.cleared) {
          a.x  -= dir * overlap;
          a.vx  = -dir * Math.abs(a.vx);
        }
      } else {
        // Both moving (neither cleared): 1D elastic collision, split push
        a.x -= dir * overlap * 0.5;
        b.x += dir * overlap * 0.5;
        const tmp = a.vx;
        a.vx = b.vx;
        b.vx = tmp;
      }
    }
  }
}

function gameLoop(ts) {
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  if (state.phase === 'flying' || state.phase === 'resting' ||
      state.phase === 'win'    || state.phase === 'gameover' ||
      state.phase === 'ufo'    || (state.phase === 'aiming' && !state.drag.active)) {
    updateCamera(dt);
  }

  switch (state.phase) {
    case 'flying':   updateFlying(dt);   break;
    case 'resting':  updateResting(dt);  break;
    case 'win':      updateWin(dt);      break;
    case 'gameover': updateGameover(dt); break;
    case 'ufo':      updateUFO(dt);      break;
  }

  updateStormTimers(dt);
  updateTrail(dt);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt / 180);
  updateParticles(dt);
  updateRipples(dt);
  if (state.phase !== 'menu') { updateBirds(dt); updateClouds(dt); }

  draw();
  requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save();

  if (state.shakeTimer > 0 && state.phase === 'gameover') {
    const i = 7 * (state.shakeTimer / GAMEOVER_MS);
    ctx.translate((Math.random() - 0.5) * i, (Math.random() - 0.5) * i);
  }

  drawBackground();

  if (state.phase === 'menu') {
    drawMenuScene();
  } else {
    drawBgElements();
    drawSectionMarkers();
    drawGround();
    state.clouds.forEach(c => drawCloud(c));
    state.clouds.forEach(c => { if (c.stormActive) drawLightningBolt(c); });
    drawBirds();
    drawRipples();
    drawTrail();
    drawArcPreview();
    drawVelocityVector();
    drawUFOBeam();    // beam BEHIND la goccia
    drawDroplet(state.droplet.x, toScreenY(state.droplet.worldY),
                state.droplet.scaleX, state.droplet.scaleY);
    drawUFOBody();    // disco/cupola SOPRA la goccia
    drawParticles();
    drawPromptBar();
    drawAltitudeBar();
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,250,220,${state.flash * 0.22})`;
    ctx.fillRect(-10, -10, VW + 20, VH + 20);
  }

  if (state.phase === 'win')      drawWinBanner();
  if (state.phase === 'gameover') drawGameoverText();

  ctx.restore();
}

// ── Menu / DOM ────────────────────────────────────────────────────────────────
let toastTimeout = null;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.add('hidden'), 3000);
}

function syncStartButton() {
  const btn  = document.getElementById('btn-start');
  const hint = document.getElementById('start-hint');
  const empty = state.selectedIds.size === 0;
  const n = state.selectedIds.size;
  btn.disabled    = empty;
  btn.textContent = empty ? 'Inizia' : `Inizia con ${n} ${n === 1 ? 'definizione' : 'definizioni'}`;
  hint.classList.toggle('hidden', !empty);
}

// Canonical subject order for the menu
const SUBJECT_ORDER = [
  'Matematica', 'Fisica', 'Chimica', 'Biologia',
  'Scienze della Terra', 'Storia', 'Filosofia',
  'Letteratura Italiana', 'Educazione Civica', 'Patente',
  'Cultura Generale', 'Anime e Manga',
];

function makeToggleable(header, body, chevron) {
  function toggle() {
    const open = !body.classList.contains('collapsed');
    body.classList.toggle('collapsed', open);
    chevron.classList.toggle('open', !open);
  }
  header.addEventListener('click', e => {
    if (e.target.type === 'checkbox') return;   // let checkbox handle itself
    toggle();
  });
}

function updateGroupCheckbox(groupCb, container) {
  const cbs     = Array.from(container.querySelectorAll('.def-cb'));
  const checked = cbs.filter(c => c.checked).length;
  groupCb.checked       = checked > 0 && checked === cbs.length;
  groupCb.indeterminate = checked > 0 && checked < cbs.length;
}

function buildSelectionUI() {
  const screen = document.getElementById('selection-screen');
  screen.innerHTML = '';

  // ── Group definitions by subject then category ──────────────────────────────
  const subjects = {};   // subject → { catName → [def, …] }
  state.definitions.forEach(def => {
    const subj = def.subject  || 'Personalizzate';
    const cat  = def.category || 'Personalizzate';
    if (!subjects[subj]) subjects[subj] = {};
    if (!subjects[subj][cat]) subjects[subj][cat] = [];
    subjects[subj][cat].push(def);
  });

  // ── Ordered subject list (known subjects first, then any extras) ────────────
  const orderedSubjects = [
    ...SUBJECT_ORDER.filter(s => subjects[s]),
    ...Object.keys(subjects).filter(s => !SUBJECT_ORDER.includes(s)),
  ];

  orderedSubjects.forEach(subjName => {
    const catMap = subjects[subjName];

    // ── Subject block ──────────────────────────────────────────────────────────
    const subjSection = document.createElement('div');
    subjSection.className = 'subject-section';

    const subjHeader = document.createElement('div');
    subjHeader.className = 'subject-header';

    const subjCb = document.createElement('input');
    subjCb.type  = 'checkbox';
    subjCb.className = 'group-cb subject-cb';

    const subjName_ = document.createElement('span');
    subjName_.className   = 'subject-name';
    subjName_.textContent = subjName;

    const subjCount = document.createElement('span');
    subjCount.className   = 'reader-count';
    subjCount.textContent = Object.values(catMap).reduce((a, d) => a + d.length, 0);

    const subjChevron = document.createElement('span');
    subjChevron.className   = 'category-chevron';
    subjChevron.textContent = '▶';

    subjHeader.appendChild(subjCb);
    subjHeader.appendChild(subjName_);
    subjHeader.appendChild(subjCount);
    subjHeader.appendChild(subjChevron);

    const subjBody = document.createElement('div');
    subjBody.className = 'subject-body collapsed';

    makeToggleable(subjHeader, subjBody, subjChevron);

    // ── Category sub-blocks ────────────────────────────────────────────────────
    const catCbList = [];
    Object.entries(catMap).forEach(([catName, defs]) => {
      const catSection = document.createElement('div');
      catSection.className = 'category-section';

      const catHeader = document.createElement('div');
      catHeader.className = 'category-header';

      const catCb = document.createElement('input');
      catCb.type  = 'checkbox';
      catCb.className = 'group-cb cat-cb';
      catCbList.push(catCb);

      const catName_ = document.createElement('span');
      catName_.className   = 'category-name';
      catName_.textContent = catName;

      const catChevron = document.createElement('span');
      catChevron.className   = 'category-chevron';
      catChevron.textContent = '▶';

      catHeader.appendChild(catCb);
      catHeader.appendChild(catName_);
      catHeader.appendChild(catChevron);

      const catBody = document.createElement('div');
      catBody.className = 'category-body collapsed';

      makeToggleable(catHeader, catBody, catChevron);

      // ── Individual definition rows ───────────────────────────────────────────
      defs.forEach(def => {
        const row = document.createElement('div');
        row.className = 'def-row';
        const cb = document.createElement('input');
        cb.type  = 'checkbox';
        cb.className = 'def-cb';
        cb.id    = `cb-${def.id}`;
        cb.dataset.id = def.id;
        cb.checked    = state.selectedIds.has(def.id);
        const lbl = document.createElement('label');
        lbl.htmlFor     = `cb-${def.id}`;
        lbl.textContent = def.prompt;
        row.appendChild(cb);
        row.appendChild(lbl);
        catBody.appendChild(row);

        cb.addEventListener('change', () => {
          if (cb.checked) state.selectedIds.add(def.id);
          else            state.selectedIds.delete(def.id);
          updateGroupCheckbox(catCb,  catBody);
          updateGroupCheckbox(subjCb, subjBody);
          syncStartButton();
        });
      });

      catSection.appendChild(catHeader);
      catSection.appendChild(catBody);
      subjBody.appendChild(catSection);

      // Category checkbox: toggle all defs in this category
      catCb.addEventListener('change', () => {
        catBody.querySelectorAll('.def-cb').forEach(c => {
          c.checked = catCb.checked;
          if (catCb.checked) state.selectedIds.add(c.dataset.id);
          else               state.selectedIds.delete(c.dataset.id);
        });
        updateGroupCheckbox(subjCb, subjBody);
        syncStartButton();
      });

      updateGroupCheckbox(catCb, catBody);
    });

    // Subject checkbox: toggle all defs in all categories
    subjCb.addEventListener('change', () => {
      subjBody.querySelectorAll('.def-cb').forEach(c => {
        c.checked = subjCb.checked;
        if (subjCb.checked) state.selectedIds.add(c.dataset.id);
        else                state.selectedIds.delete(c.dataset.id);
      });
      catCbList.forEach(c => {
        c.checked       = subjCb.checked;
        c.indeterminate = false;
      });
      syncStartButton();
    });

    updateGroupCheckbox(subjCb, subjBody);

    subjSection.appendChild(subjHeader);
    subjSection.appendChild(subjBody);
    screen.appendChild(subjSection);
  });

  syncStartButton();
}

function buildReaderUI() {
  const content = document.getElementById('reader-content');
  content.innerHTML = '';

  // Group definitions by subject → category (same logic as buildSelectionUI)
  const subjects = {};
  state.definitions.forEach(def => {
    const subj = def.subject  || 'Personalizzate';
    const cat  = def.category || 'Personalizzate';
    if (!subjects[subj]) subjects[subj] = {};
    if (!subjects[subj][cat]) subjects[subj][cat] = [];
    subjects[subj][cat].push(def);
  });

  const orderedSubjects = [
    ...SUBJECT_ORDER.filter(s => subjects[s]),
    ...Object.keys(subjects).filter(s => !SUBJECT_ORDER.includes(s)),
  ];

  orderedSubjects.forEach(subjName => {
    const catMap = subjects[subjName];

    const subjSection = document.createElement('div');
    subjSection.className = 'subject-section';

    const subjHeader = document.createElement('div');
    subjHeader.className = 'subject-header';

    const subjNameEl = document.createElement('span');
    subjNameEl.className   = 'subject-name';
    subjNameEl.textContent = subjName;

    const totalCount = Object.values(catMap).reduce((a, d) => a + d.length, 0);
    const countEl = document.createElement('span');
    countEl.className   = 'reader-count';
    countEl.textContent = totalCount;

    const chevron = document.createElement('span');
    chevron.className   = 'category-chevron';
    chevron.textContent = '▶';

    subjHeader.appendChild(subjNameEl);
    subjHeader.appendChild(countEl);
    subjHeader.appendChild(chevron);

    const subjBody = document.createElement('div');
    subjBody.className = 'subject-body collapsed';

    makeToggleable(subjHeader, subjBody, chevron);

    Object.entries(catMap).forEach(([catName, defs]) => {
      const catSection = document.createElement('div');
      catSection.className = 'category-section';

      const catHeader = document.createElement('div');
      catHeader.className = 'category-header';

      const catNameEl = document.createElement('span');
      catNameEl.className   = 'category-name';
      catNameEl.textContent = catName;

      const catCount = document.createElement('span');
      catCount.className   = 'reader-count';
      catCount.textContent = defs.length;

      const catChevron = document.createElement('span');
      catChevron.className   = 'category-chevron';
      catChevron.textContent = '▶';

      catHeader.appendChild(catNameEl);
      catHeader.appendChild(catCount);
      catHeader.appendChild(catChevron);

      const catBody = document.createElement('div');
      catBody.className = 'category-body collapsed';

      makeToggleable(catHeader, catBody, catChevron);

      defs.forEach(def => {
        const card = document.createElement('div');
        card.className = 'reader-def-card';

        const prompt = document.createElement('div');
        prompt.className   = 'reader-def-prompt';
        prompt.textContent = def.prompt;

        const text = document.createElement('div');
        text.className   = 'reader-def-text';
        text.textContent = def.fragments.join(' ');

        card.appendChild(prompt);
        card.appendChild(text);
        catBody.appendChild(card);
      });

      catSection.appendChild(catHeader);
      catSection.appendChild(catBody);
      subjBody.appendChild(catSection);
    });

    subjSection.appendChild(subjHeader);
    subjSection.appendChild(subjBody);
    content.appendChild(subjSection);
  });
}

function validateDefinitions(data) {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(d =>
    typeof d.prompt === 'string' && d.prompt.length > 0 &&
    Array.isArray(d.fragments)   && d.fragments.length >= 2 &&
    Array.isArray(d.distractors) && d.distractors.length >= 2
  );
}

document.getElementById('json-import').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    let parsed;
    try { parsed = JSON.parse(ev.target.result); }
    catch { showToast('File non letto: deve essere un elenco di definizioni con prompt, fragments e distractors'); return; }
    if (!validateDefinitions(parsed)) { showToast('File non letto: deve essere un elenco di definizioni con prompt, fragments e distractors'); return; }
    parsed.forEach(d => {
      if (!d.subject)  d.subject  = 'Personalizzate';
      if (!d.category) d.category = 'Personalizzate';
    });
    state.definitions = parsed;
    state.selectedIds.clear();
    buildSelectionUI();
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btn-select-all').addEventListener('click', () => {
  state.definitions.forEach(d => state.selectedIds.add(d.id));
  buildSelectionUI();
});

document.getElementById('btn-deselect-all').addEventListener('click', () => {
  state.selectedIds.clear();
  buildSelectionUI();
});

document.getElementById('btn-start').addEventListener('click', async () => {
  if (state.selectedIds.size === 0) return;
  // cloud widths are measured with the cloud font: wait until it is loaded
  try { await document.fonts.load(CLOUD_FONT); } catch (e) { /* offline: system font */ }
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('btn-settings').classList.remove('hidden');

  // Definitions ordered from first to last (def 0 = bottom of world, last = top)
  state.activeDefinitions      = shuffleArray(state.definitions.filter(d => state.selectedIds.has(d.id)));
  state.currentDefIndex        = 0;
  state.currentFragmentIndex   = 0;
  state.particles              = [];
  state.ripples                = [];
  state.trail                  = [];
  state.launches               = 0;
  state.lastRestingCloud       = null;
  state.flightPeakWorldY       = Infinity;
  state.inputLocked            = false;
  state.ufo.active             = false;
  state.ufo.phase              = 'idle';

  buildWorld();
  resetDropletToStart();
  snapCameraToDroplet();
  state.phase = 'aiming';
});

function goToMenu() {
  document.getElementById('menu').classList.remove('hidden');
  if (state.phase === 'win') {
    state.phase     = 'menu';
    state.particles = [];
    document.getElementById('btn-settings').classList.add('hidden');
  }
}

document.getElementById('btn-settings').addEventListener('click', goToMenu);

document.getElementById('btn-browse').addEventListener('click', () => {
  buildReaderUI();
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('reader').classList.remove('hidden');
});

document.getElementById('btn-reader-close').addEventListener('click', () => {
  document.getElementById('reader').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
});

// ── Boot ──────────────────────────────────────────────────────────────────────
resizeCanvas();
buildSelectionUI();
requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });
