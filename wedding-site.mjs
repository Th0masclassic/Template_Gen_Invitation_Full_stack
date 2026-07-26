import crypto from "node:crypto";

export const SUPPORTED_LOCALES = Object.freeze(["pt", "en", "es", "fr", "de"]);

const COUNTRY_LOCALE = Object.freeze({
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  GW: "pt",
  ST: "pt",
  TL: "pt",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  UY: "es",
  PY: "es",
  BO: "es",
  CR: "es",
  DO: "es",
  GT: "es",
  HN: "es",
  NI: "es",
  PA: "es",
  SV: "es",
  CU: "es",
  FR: "fr",
  BE: "fr",
  CH: "fr",
  LU: "fr",
  MC: "fr",
  CA: "en",
  DE: "de",
  AT: "de",
  LI: "de",
});

const SITE_COPY = Object.freeze({
  pt: {
    saveDate: "Reserva a data",
    invitation: "Convite de casamento",
    celebrate: "Vamos celebrar juntos",
    details: "Detalhes do dia",
    date: "Data",
    time: "Hora",
    venue: "Local",
    location: "Ver localização",
    calendar: "Adicionar ao calendário",
    calendarFile: "Descarregar calendário",
    rsvp: "Confirmar presença",
    rsvpIntro: "Diz-nos se vais estar presente. A confirmação é feita de forma segura através da Youform.",
    openRsvp: "Abrir formulário de confirmação",
    gift: "Presente",
    holder: "Titular",
    reference: "Referência",
    days: "dias",
    hours: "horas",
    minutes: "minutos",
    language: "Idioma",
    footer: "Criado com Atelier Vow",
  },
  en: {
    saveDate: "Save the date",
    invitation: "Wedding invitation",
    celebrate: "Let us celebrate together",
    details: "The day",
    date: "Date",
    time: "Time",
    venue: "Venue",
    location: "View location",
    calendar: "Add to Google Calendar",
    calendarFile: "Download calendar file",
    rsvp: "RSVP",
    rsvpIntro: "Let us know whether you will be joining us. Responses are securely collected through Youform.",
    openRsvp: "Open RSVP form",
    gift: "Gift details",
    holder: "Account holder",
    reference: "Reference",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    language: "Language",
    footer: "Created with Atelier Vow",
  },
  es: {
    saveDate: "Reserva la fecha",
    invitation: "Invitación de boda",
    celebrate: "Celebremos juntos",
    details: "Detalles del día",
    date: "Fecha",
    time: "Hora",
    venue: "Lugar",
    location: "Ver ubicación",
    calendar: "Añadir a Google Calendar",
    calendarFile: "Descargar calendario",
    rsvp: "Confirmar asistencia",
    rsvpIntro: "Cuéntanos si podrás acompañarnos. La confirmación se realiza de forma segura a través de Youform.",
    openRsvp: "Abrir formulario",
    gift: "Regalo",
    holder: "Titular",
    reference: "Referencia",
    days: "días",
    hours: "horas",
    minutes: "minutos",
    language: "Idioma",
    footer: "Creado con Atelier Vow",
  },
  fr: {
    saveDate: "Réservez la date",
    invitation: "Invitation de mariage",
    celebrate: "Célébrons ensemble",
    details: "Le grand jour",
    date: "Date",
    time: "Heure",
    venue: "Lieu",
    location: "Voir le lieu",
    calendar: "Ajouter à Google Agenda",
    calendarFile: "Télécharger le calendrier",
    rsvp: "Confirmer votre présence",
    rsvpIntro: "Dites-nous si vous serez des nôtres. La réponse est recueillie de façon sécurisée via Youform.",
    openRsvp: "Ouvrir le formulaire",
    gift: "Cadeau",
    holder: "Titulaire",
    reference: "Référence",
    days: "jours",
    hours: "heures",
    minutes: "minutes",
    language: "Langue",
    footer: "Créé avec Atelier Vow",
  },
  de: {
    saveDate: "Termin vormerken",
    invitation: "Hochzeitseinladung",
    celebrate: "Feiert mit uns",
    details: "Unser Hochzeitstag",
    date: "Datum",
    time: "Uhrzeit",
    venue: "Ort",
    location: "Ort ansehen",
    calendar: "Zu Google Kalender hinzufügen",
    calendarFile: "Kalenderdatei herunterladen",
    rsvp: "Teilnahme bestätigen",
    rsvpIntro: "Bitte teilt uns mit, ob ihr dabei seid. Die Antwort wird sicher über Youform erfasst.",
    openRsvp: "Formular öffnen",
    gift: "Geschenk",
    holder: "Kontoinhaber",
    reference: "Verwendungszweck",
    days: "Tage",
    hours: "Stunden",
    minutes: "Minuten",
    language: "Sprache",
    footer: "Erstellt mit Atelier Vow",
  },
});

const EVENT_COPY = Object.freeze({
  wedding: Object.freeze({
    pt: {
      openingFrom: "Tens um convite de",
      openInvitation: "Abrir convite",
      openingHint: "Toca no selo para descobrir o dia",
      navStory: "A nossa história",
      navGallery: "Momentos",
      navDetails: "O dia",
      navRsvp: "Presença",
      heroKicker: "Juntamente com as suas famílias",
      storyKicker: "Uma celebração de amor",
      storyTitle: "O nosso para sempre começa aqui",
      storyFallback: "Convidamos-te a celebrar connosco um dia cheio de afeto, alegria e memórias bonitas.",
      galleryKicker: "Memórias que guardamos",
      galleryTitle: "A nossa história em imagens",
      galleryIntro: "Pequenos instantes que nos trouxeram até este dia.",
      photoAlt: "Fotografia do casal",
      venueKicker: "Onde nos encontramos",
      eventDetailsTitle: "Cerimónia & receção",
      primaryEvent: "Cerimónia",
      primaryEventText: "O momento em que trocamos os nossos votos, rodeados das pessoas de quem mais gostamos.",
      secondaryEvent: "Receção",
      secondaryEventText: "Depois da cerimónia, juntamo-nos à mesa para brindar, jantar e dançar.",
      countdownKicker: "A contagem decrescente",
      countdownTitle: "Falta tão pouco",
      seconds: "segundos",
      today: "Hoje é o grande dia.",
      timelineKicker: "O ritmo da celebração",
      timelineTitle: "Programa do dia",
      timelineArrival: "Chegada dos convidados",
      timelineMain: "Início da cerimónia",
      timelineGathering: "Cocktail & receção",
      timelineFinale: "Jantar, brindes & dança",
      rsvpKicker: "Esperamos por ti",
      giftIntro: "A tua presença é o melhor presente. Para quem quiser contribuir, deixamos estes dados.",
    },
    en: {
      openingFrom: "You have an invitation from",
      openInvitation: "Open invitation",
      openingHint: "Touch the seal to discover the day",
      navStory: "Our story",
      navGallery: "Moments",
      navDetails: "The day",
      navRsvp: "RSVP",
      heroKicker: "Together with their families",
      storyKicker: "A celebration of love",
      storyTitle: "Our forever begins here",
      storyFallback: "We invite you to share a day filled with affection, joy and beautiful memories.",
      galleryKicker: "Memories we treasure",
      galleryTitle: "Our story in pictures",
      galleryIntro: "The little moments that brought us to this day.",
      photoAlt: "Photo of the couple",
      venueKicker: "Where we gather",
      eventDetailsTitle: "Ceremony & reception",
      primaryEvent: "Ceremony",
      primaryEventText: "The moment we exchange our vows, surrounded by the people we love most.",
      secondaryEvent: "Reception",
      secondaryEventText: "After the ceremony, join us for dinner, toasts and dancing.",
      countdownKicker: "The countdown",
      countdownTitle: "Not long to go",
      seconds: "seconds",
      today: "Today is the day.",
      timelineKicker: "The rhythm of our celebration",
      timelineTitle: "Order of the day",
      timelineArrival: "Guest arrival",
      timelineMain: "Ceremony begins",
      timelineGathering: "Cocktails & reception",
      timelineFinale: "Dinner, toasts & dancing",
      rsvpKicker: "We hope you can join us",
      giftIntro: "Your presence is the greatest gift. For anyone wishing to contribute, the details are below.",
    },
    es: {
      openingFrom: "Tienes una invitación de",
      openInvitation: "Abrir invitación",
      openingHint: "Toca el sello para descubrir el día",
      navStory: "Nuestra historia",
      navGallery: "Momentos",
      navDetails: "El día",
      navRsvp: "Asistencia",
      heroKicker: "Junto con sus familias",
      storyKicker: "Una celebración de amor",
      storyTitle: "Nuestro para siempre empieza aquí",
      storyFallback: "Te invitamos a compartir un día lleno de cariño, alegría y recuerdos inolvidables.",
      galleryKicker: "Recuerdos que guardamos",
      galleryTitle: "Nuestra historia en imágenes",
      galleryIntro: "Los pequeños momentos que nos trajeron hasta este día.",
      photoAlt: "Fotografía de la pareja",
      venueKicker: "Donde nos reunimos",
      eventDetailsTitle: "Ceremonia y recepción",
      primaryEvent: "Ceremonia",
      primaryEventText: "El momento en que intercambiamos nuestros votos, rodeados de quienes más queremos.",
      secondaryEvent: "Recepción",
      secondaryEventText: "Después de la ceremonia nos reuniremos para brindar, cenar y bailar.",
      countdownKicker: "La cuenta atrás",
      countdownTitle: "Ya falta muy poco",
      seconds: "segundos",
      today: "Hoy es el gran día.",
      timelineKicker: "El ritmo de la celebración",
      timelineTitle: "Programa del día",
      timelineArrival: "Llegada de invitados",
      timelineMain: "Inicio de la ceremonia",
      timelineGathering: "Cóctel y recepción",
      timelineFinale: "Cena, brindis y baile",
      rsvpKicker: "Te esperamos",
      giftIntro: "Tu presencia es el mejor regalo. Para quien quiera contribuir, dejamos estos datos.",
    },
    fr: {
      openingFrom: "Vous avez une invitation de",
      openInvitation: "Ouvrir l’invitation",
      openingHint: "Touchez le sceau pour découvrir cette journée",
      navStory: "Notre histoire",
      navGallery: "Moments",
      navDetails: "La journée",
      navRsvp: "Présence",
      heroKicker: "Entourés de leurs familles",
      storyKicker: "Une célébration de l’amour",
      storyTitle: "Notre pour toujours commence ici",
      storyFallback: "Nous vous invitons à partager une journée pleine de tendresse, de joie et de beaux souvenirs.",
      galleryKicker: "Nos précieux souvenirs",
      galleryTitle: "Notre histoire en images",
      galleryIntro: "Les petits instants qui nous ont conduits jusqu’à ce jour.",
      photoAlt: "Photographie du couple",
      venueKicker: "Là où nous nous retrouvons",
      eventDetailsTitle: "Cérémonie & réception",
      primaryEvent: "Cérémonie",
      primaryEventText: "Le moment où nous échangerons nos vœux, entourés de ceux que nous aimons.",
      secondaryEvent: "Réception",
      secondaryEventText: "Après la cérémonie, retrouvons-nous pour dîner, porter un toast et danser.",
      countdownKicker: "Le compte à rebours",
      countdownTitle: "Plus que quelques instants",
      seconds: "secondes",
      today: "Le grand jour est arrivé.",
      timelineKicker: "Le rythme de la célébration",
      timelineTitle: "Programme de la journée",
      timelineArrival: "Arrivée des invités",
      timelineMain: "Début de la cérémonie",
      timelineGathering: "Cocktail & réception",
      timelineFinale: "Dîner, toasts & danse",
      rsvpKicker: "Nous espérons vous voir",
      giftIntro: "Votre présence est notre plus beau cadeau. Pour ceux qui le souhaitent, voici les informations.",
    },
    de: {
      openingFrom: "Ihr habt eine Einladung von",
      openInvitation: "Einladung öffnen",
      openingHint: "Berührt das Siegel und entdeckt unseren Tag",
      navStory: "Unsere Geschichte",
      navGallery: "Momente",
      navDetails: "Der Tag",
      navRsvp: "Zusage",
      heroKicker: "Gemeinsam mit ihren Familien",
      storyKicker: "Ein Fest der Liebe",
      storyTitle: "Unser Für-immer beginnt hier",
      storyFallback: "Wir laden euch zu einem Tag voller Liebe, Freude und unvergesslicher Erinnerungen ein.",
      galleryKicker: "Erinnerungen, die bleiben",
      galleryTitle: "Unsere Geschichte in Bildern",
      galleryIntro: "Die kleinen Augenblicke, die uns zu diesem Tag geführt haben.",
      photoAlt: "Foto des Paares",
      venueKicker: "Wo wir zusammenkommen",
      eventDetailsTitle: "Trauung & Empfang",
      primaryEvent: "Trauung",
      primaryEventText: "Der Moment, in dem wir im Kreis unserer Liebsten unsere Versprechen austauschen.",
      secondaryEvent: "Empfang",
      secondaryEventText: "Nach der Trauung feiern wir gemeinsam bei Abendessen, Toasts und Tanz.",
      countdownKicker: "Der Countdown",
      countdownTitle: "Bald ist es so weit",
      seconds: "Sekunden",
      today: "Heute ist unser großer Tag.",
      timelineKicker: "Der Ablauf unserer Feier",
      timelineTitle: "Tagesprogramm",
      timelineArrival: "Ankunft der Gäste",
      timelineMain: "Beginn der Trauung",
      timelineGathering: "Cocktail & Empfang",
      timelineFinale: "Dinner, Toasts & Tanz",
      rsvpKicker: "Wir freuen uns auf euch",
      giftIntro: "Eure Anwesenheit ist das schönste Geschenk. Wer etwas beitragen möchte, findet hier die Angaben.",
    },
  }),
  baby_shower: Object.freeze({
    pt: {
      saveDate: "Um bebé está a chegar",
      invitation: "Convite de baby shower",
      celebrate: "Vamos celebrar esta doce espera",
      details: "Detalhes da celebração",
      openingFrom: "Tens um convite especial de",
      openInvitation: "Abrir convite",
      openingHint: "Toca no círculo para descobrir a surpresa",
      navStory: "A espera",
      navGallery: "Momentos",
      navDetails: "A festa",
      navRsvp: "Presença",
      heroKicker: "Uma pequena grande alegria está a caminho",
      storyKicker: "Uma história que está a começar",
      storyTitle: "Já te esperamos com todo o amor",
      storyFallback: "Junta-te a nós para celebrar a chegada de uma nova vida, entre sorrisos, carinho e bons desejos.",
      galleryKicker: "A doce espera",
      galleryTitle: "Momentos antes de te conhecer",
      galleryIntro: "Memórias cheias de ternura para guardar para sempre.",
      photoAlt: "Fotografia da família",
      venueKicker: "Onde celebramos",
      eventDetailsTitle: "Receção & baby shower",
      primaryEvent: "Boas-vindas",
      primaryEventText: "Recebemos família e amigos para uma tarde leve, bonita e cheia de carinho.",
      secondaryEvent: "Baby shower",
      secondaryEventText: "Partilhamos histórias, mimos e desejos felizes para o bebé que está a chegar.",
      countdownKicker: "A contagem decrescente",
      countdownTitle: "A festa aproxima-se",
      seconds: "segundos",
      today: "Hoje celebramos o bebé.",
      timelineKicker: "Uma tarde especial",
      timelineTitle: "Programa da festa",
      timelineArrival: "Chegada & boas-vindas",
      timelineMain: "Início do baby shower",
      timelineGathering: "Lanche & jogos",
      timelineFinale: "Bolo, fotografias & desejos",
      rsvpKicker: "Vem celebrar connosco",
      giftIntro: "A tua presença é o mais importante. Para quem quiser mimar o bebé, deixamos estes dados.",
    },
    en: {
      saveDate: "A little one is on the way",
      invitation: "Baby shower invitation",
      celebrate: "Let us celebrate this sweet wait",
      details: "Celebration details",
      openingFrom: "You have a special invitation from",
      openInvitation: "Open invitation",
      openingHint: "Touch the circle to discover the surprise",
      navStory: "The wait",
      navGallery: "Moments",
      navDetails: "The party",
      navRsvp: "RSVP",
      heroKicker: "A little bundle of joy is on the way",
      storyKicker: "A story just beginning",
      storyTitle: "Already loved beyond words",
      storyFallback: "Join us to celebrate a new life with smiles, tenderness and happy wishes.",
      galleryKicker: "The sweetest wait",
      galleryTitle: "Moments before we meet",
      galleryIntro: "Tender memories to keep forever.",
      photoAlt: "Family photograph",
      venueKicker: "Where we celebrate",
      eventDetailsTitle: "Welcome & baby shower",
      primaryEvent: "Welcome",
      primaryEventText: "Family and friends gather for a light-filled afternoon full of affection.",
      secondaryEvent: "Baby shower",
      secondaryEventText: "We will share stories, treats and joyful wishes for the little one on the way.",
      countdownKicker: "The countdown",
      countdownTitle: "The party is getting closer",
      seconds: "seconds",
      today: "Today we celebrate the baby.",
      timelineKicker: "A special afternoon",
      timelineTitle: "Party schedule",
      timelineArrival: "Arrival & welcome",
      timelineMain: "Baby shower begins",
      timelineGathering: "Treats & games",
      timelineFinale: "Cake, photographs & wishes",
      rsvpKicker: "Come celebrate with us",
      giftIntro: "Your presence matters most. For anyone wishing to spoil the baby, the details are below.",
    },
    es: {
      saveDate: "Un bebé está en camino",
      invitation: "Invitación de baby shower",
      celebrate: "Celebremos esta dulce espera",
      details: "Detalles de la celebración",
      openingFrom: "Tienes una invitación especial de",
      openInvitation: "Abrir invitación",
      openingHint: "Toca el círculo para descubrir la sorpresa",
      navStory: "La espera",
      navGallery: "Momentos",
      navDetails: "La fiesta",
      navRsvp: "Asistencia",
      heroKicker: "Una pequeña gran alegría está en camino",
      storyKicker: "Una historia que comienza",
      storyTitle: "Ya te esperamos con todo nuestro amor",
      storyFallback: "Acompáñanos a celebrar una nueva vida entre sonrisas, cariño y buenos deseos.",
      galleryKicker: "La dulce espera",
      galleryTitle: "Momentos antes de conocerte",
      galleryIntro: "Recuerdos llenos de ternura para guardar siempre.",
      photoAlt: "Fotografía de la familia",
      venueKicker: "Donde celebramos",
      eventDetailsTitle: "Bienvenida y baby shower",
      primaryEvent: "Bienvenida",
      primaryEventText: "Familia y amigos se reúnen para una tarde luminosa y llena de cariño.",
      secondaryEvent: "Baby shower",
      secondaryEventText: "Compartiremos historias, dulces y felices deseos para el bebé que viene en camino.",
      countdownKicker: "La cuenta atrás",
      countdownTitle: "La fiesta se acerca",
      seconds: "segundos",
      today: "Hoy celebramos al bebé.",
      timelineKicker: "Una tarde especial",
      timelineTitle: "Programa de la fiesta",
      timelineArrival: "Llegada y bienvenida",
      timelineMain: "Comienza el baby shower",
      timelineGathering: "Merienda y juegos",
      timelineFinale: "Tarta, fotos y deseos",
      rsvpKicker: "Ven a celebrar con nosotros",
      giftIntro: "Tu presencia es lo más importante. Para quien quiera mimar al bebé, dejamos estos datos.",
    },
    fr: {
      saveDate: "Un bébé est en chemin",
      invitation: "Invitation à la baby shower",
      celebrate: "Célébrons cette douce attente",
      details: "Détails de la fête",
      openingFrom: "Vous avez une invitation spéciale de",
      openInvitation: "Ouvrir l’invitation",
      openingHint: "Touchez le cercle pour découvrir la surprise",
      navStory: "L’attente",
      navGallery: "Moments",
      navDetails: "La fête",
      navRsvp: "Présence",
      heroKicker: "Un petit bonheur est en chemin",
      storyKicker: "Une histoire qui commence",
      storyTitle: "Déjà aimé plus que tout",
      storyFallback: "Rejoignez-nous pour célébrer une nouvelle vie, avec des sourires, de la tendresse et de doux souhaits.",
      galleryKicker: "La douce attente",
      galleryTitle: "Avant notre rencontre",
      galleryIntro: "De tendres souvenirs à garder pour toujours.",
      photoAlt: "Photographie de la famille",
      venueKicker: "Là où nous célébrons",
      eventDetailsTitle: "Accueil & baby shower",
      primaryEvent: "Bienvenue",
      primaryEventText: "Famille et amis se retrouvent pour un après-midi lumineux et plein de tendresse.",
      secondaryEvent: "Baby shower",
      secondaryEventText: "Nous partagerons histoires, douceurs et beaux souhaits pour le bébé à venir.",
      countdownKicker: "Le compte à rebours",
      countdownTitle: "La fête approche",
      seconds: "secondes",
      today: "Aujourd’hui, nous célébrons le bébé.",
      timelineKicker: "Un après-midi spécial",
      timelineTitle: "Programme de la fête",
      timelineArrival: "Arrivée & bienvenue",
      timelineMain: "Début de la baby shower",
      timelineGathering: "Goûter & jeux",
      timelineFinale: "Gâteau, photos & vœux",
      rsvpKicker: "Venez célébrer avec nous",
      giftIntro: "Votre présence compte le plus. Pour ceux qui souhaitent gâter le bébé, voici les informations.",
    },
    de: {
      saveDate: "Ein kleines Wunder ist unterwegs",
      invitation: "Einladung zur Babyparty",
      celebrate: "Feiert mit uns diese besondere Vorfreude",
      details: "Details zur Feier",
      openingFrom: "Ihr habt eine besondere Einladung von",
      openInvitation: "Einladung öffnen",
      openingHint: "Berührt den Kreis und entdeckt die Überraschung",
      navStory: "Die Vorfreude",
      navGallery: "Momente",
      navDetails: "Die Feier",
      navRsvp: "Zusage",
      heroKicker: "Ein kleines großes Glück ist unterwegs",
      storyKicker: "Eine Geschichte beginnt",
      storyTitle: "Schon jetzt unendlich geliebt",
      storyFallback: "Feiert mit uns neues Leben, liebevolle Augenblicke und die schönsten Wünsche.",
      galleryKicker: "Die schönste Vorfreude",
      galleryTitle: "Momente vor unserem Kennenlernen",
      galleryIntro: "Zarte Erinnerungen, die für immer bleiben.",
      photoAlt: "Familienfoto",
      venueKicker: "Wo wir feiern",
      eventDetailsTitle: "Willkommen & Babyparty",
      primaryEvent: "Willkommen",
      primaryEventText: "Familie und Freunde treffen sich zu einem hellen, liebevollen Nachmittag.",
      secondaryEvent: "Babyparty",
      secondaryEventText: "Wir teilen Geschichten, Leckereien und gute Wünsche für das kleine Wunder.",
      countdownKicker: "Der Countdown",
      countdownTitle: "Die Feier rückt näher",
      seconds: "Sekunden",
      today: "Heute feiern wir das Baby.",
      timelineKicker: "Ein besonderer Nachmittag",
      timelineTitle: "Ablauf der Feier",
      timelineArrival: "Ankunft & Willkommen",
      timelineMain: "Beginn der Babyparty",
      timelineGathering: "Leckereien & Spiele",
      timelineFinale: "Kuchen, Fotos & Wünsche",
      rsvpKicker: "Feiert mit uns",
      giftIntro: "Eure Anwesenheit ist das Wichtigste. Wer das Baby beschenken möchte, findet hier die Angaben.",
    },
  }),
});

const LANGUAGE_NAMES = Object.freeze({
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
});

export function normalizeLocale(value, fallback = "en") {
  const locale = String(value || "").trim().toLowerCase().replace("_", "-").split("-")[0];
  return SUPPORTED_LOCALES.includes(locale) ? locale : fallback;
}

export function detectLocale({ explicitLocale, countryCode, acceptLanguage } = {}) {
  if (explicitLocale) return normalizeLocale(explicitLocale);
  const country = String(countryCode || "").trim().toUpperCase();
  if (COUNTRY_LOCALE[country]) return COUNTRY_LOCALE[country];
  const requested = String(acceptLanguage || "")
    .split(",")
    .map((entry) => entry.trim().split(";")[0])
    .filter(Boolean);
  for (const entry of requested) {
    const locale = normalizeLocale(entry, "");
    if (locale) return locale;
  }
  return "en";
}

export function appendYouformParams(formUrl, params = {}) {
  const url = new URL(formUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value) !== "") {
      url.searchParams.set(key, String(value).slice(0, 300));
    }
  }
  return url.toString();
}

export function extractYouformFormId(formUrl) {
  try {
    const url = new URL(formUrl);
    const host = url.hostname.toLowerCase();
    if (host !== "youform.com" && !host.endsWith(".youform.com")) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const formsIndex = parts.findIndex((part) => part.toLowerCase() === "forms");
    const candidate = formsIndex >= 0 ? parts[formsIndex + 1] : parts[0];
    return /^[a-z0-9_-]{3,100}$/i.test(candidate || "") ? candidate : "";
  } catch {
    return "";
  }
}

export function verifyYouformSignature(rawBody, secret, signatureHeader) {
  if (!Buffer.isBuffer(rawBody) || !secret || !signatureHeader) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = String(signatureHeader).trim().toLowerCase().replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(received, "hex"));
}

export function extractDeploymentUrl(value) {
  const preferredKeys = ["production_url", "productionUrl", "deployment_url", "deploymentUrl", "url"];
  const parseHttps = (node) => {
    if (typeof node !== "string") return "";
    try {
      const url = new URL(node);
      return url.protocol === "https:" ? url.toString() : "";
    } catch {
      return "";
    }
  };
  const visit = (node, acceptString = false) => {
    if (!node) return "";
    if (typeof node === "string") return acceptString ? parseHttps(node) : "";
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return "";
    }
    if (typeof node === "object") {
      for (const key of preferredKeys) {
        const found = visit(node[key], true);
        if (found) return found;
      }
      for (const item of Object.values(node)) {
        if (!item || typeof item !== "object") continue;
        const found = visit(item);
        if (found) return found;
      }
    }
    return "";
  };
  return visit(value);
}

export function renderCalendarIcs(project) {
  const dateValue = String(project.invitation.date || "");
  const timeValue = String(project.invitation.time || "12:00");
  const startDate = new Date(`${dateValue}T${timeValue}:00Z`);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
  const toIcsDate = (value) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
  const start = toIcsDate(startDate);
  const end = toIcsDate(endDate);
  const escapeIcs = (value) => String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Atelier Vow//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@atelier-vow`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(`${project.couple.person1} & ${project.couple.person2}`)}`,
    `LOCATION:${escapeIcs(project.invitation.location)}`,
    `DESCRIPTION:${escapeIcs(project.invitation.message)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function renderWeddingWebsite({
  project,
  requestId,
  imageFileName = "invitation.png",
  galleryImages = [],
}) {
  const eventType = project?.eventType === "baby_shower" ? "baby_shower" : "wedding";
  const locale = normalizeLocale(project?.language, "pt");
  const translations = Object.fromEntries(SUPPORTED_LOCALES.map((item) => [
    item,
    { ...SITE_COPY[item], ...EVENT_COPY[eventType][item] },
  ]));
  const copy = translations[locale];
  const couple = project?.couple || {};
  const invitation = project?.invitation || {};
  const links = project?.links || {};
  const names = `${String(couple.person1 || "").trim()} & ${String(couple.person2 || "").trim()}`;
  const location = String(invitation.location || "").trim();
  const message = String(invitation.message || "").trim() || copy.storyFallback;
  const eventDate = normalizeEventDate(invitation.date);
  const eventTime = normalizeClock(invitation.time);
  const target = eventDate ? `${eventDate}T${eventTime}:00` : "";
  const safeInvitationImage = normalizeSiteImagePath(imageFileName) || "invitation.png";
  const safeGallery = normalizeGalleryImagePaths(galleryImages);
  const photos = safeGallery.length ? safeGallery : [safeInvitationImage];
  const hasUploadedGallery = safeGallery.length > 0;
  const heroImage = photos[0];
  const storyImage = photos[1] || photos[0];
  const detailImage = photos[2] || photos[0];
  const mapsUrl = safeHttpsUrl(links.mapsUrl);
  const safeFormUrl = safeYouformUrl(project?.attendance?.formUrl);
  const attendanceEnabled = Boolean(project?.attendance?.enabled && safeFormUrl);
  const rsvpUrl = attendanceEnabled
    ? appendYouformParams(safeFormUrl, {
      request_id: requestId,
      language: locale,
      couple: names,
    })
    : "";
  const formId = attendanceEnabled ? extractYouformFormId(safeFormUrl) : "";
  const embedParams = new URLSearchParams({
    request_id: String(requestId || "").slice(0, 200),
    language: locale,
    couple: names.slice(0, 300),
  }).toString();
  const gift = project?.gift || {};
  const giftEnabled = Boolean(gift.enabled && String(gift.iban || "").trim());
  const localeTags = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" };
  const localizedDates = Object.fromEntries(SUPPORTED_LOCALES.map((item) => [
    item,
    formatLocalizedEventDate(eventDate, localeTags[item]),
  ]));
  const date = localizedDates[locale];
  const calendarUrl = eventDate ? new URL("https://calendar.google.com/calendar/render") : null;
  if (calendarUrl) {
    calendarUrl.searchParams.set("action", "TEMPLATE");
    calendarUrl.searchParams.set("text", names);
    calendarUrl.searchParams.set("dates", googleCalendarDates(eventDate, eventTime));
    calendarUrl.searchParams.set("details", message);
    calendarUrl.searchParams.set("location", location);
  }
  const scheduleOffsets = eventType === "baby_shower" ? [-30, 0, 75, 150] : [-30, 0, 90, 240];
  const schedule = [
    ["timelineArrival", addMinutesToClock(eventTime, scheduleOffsets[0])],
    ["timelineMain", addMinutesToClock(eventTime, scheduleOffsets[1])],
    ["timelineGathering", addMinutesToClock(eventTime, scheduleOffsets[2])],
    ["timelineFinale", addMinutesToClock(eventTime, scheduleOffsets[3])],
  ];
  const secondaryTime = addMinutesToClock(eventTime, eventType === "baby_shower" ? 45 : 90);
  const translationsJson = safeJsonForHtml(translations);
  const localizedDatesJson = safeJsonForHtml(localizedDates);
  const themeColor = eventType === "baby_shower" ? "#dceef7" : "#eef0e8";
  const galleryMarkup = photos.map((fileName, index) => `<figure class="gallery-item reveal" style="--delay:${Math.min(index, 5) * 70}ms">
        <img src="${escapeHtml(fileName)}" alt="${escapeHtml(`${copy.photoAlt} ${index + 1}`)}" loading="lazy" decoding="async">
      </figure>`).join("");

  return `<!doctype html>
<html lang="${locale}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="${themeColor}">
  <meta name="description" content="${escapeHtml(`${copy.invitation}: ${names}`)}">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: https://app.youform.com; script-src 'self' 'unsafe-inline' https://app.youform.com; style-src 'self' 'unsafe-inline'; frame-src https://app.youform.com https://youform.com https://*.youform.com; connect-src 'self' https://app.youform.com https://youform.com https://*.youform.com; base-uri 'self'; object-src 'none'; form-action 'self' https://youform.com https://*.youform.com">
  <title>${escapeHtml(names)} | ${escapeHtml(copy.invitation)}</title>
  <script>document.documentElement.classList.replace("no-js","js")</script>
  <style>
    :root{--ink:#26312a;--muted:#69736c;--accent:#66765d;--accent-deep:#4e6048;--accent-soft:#dfe5d8;--highlight:#a98b54;--wash:#f5f4ef;--paper:#fffefb;--white:#fff;--line:rgba(65,78,67,.18);--shadow:0 24px 70px rgba(57,67,56,.13);--soft-glow:rgba(223,229,216,.68);--soft-glow-2:rgba(223,229,216,.55);--soft-leaf:rgba(223,229,216,.48);--accent-faint:rgba(102,118,93,.18);--focus:#c7b17f;--seal-border:#cbb88f;--countdown-muted:#e6ecdf;--serif:Georgia,"Times New Roman",serif;--sans:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    body[data-event="baby_shower"]{--ink:#24455b;--muted:#5e7481;--accent:#4b86a7;--accent-deep:#316b8d;--accent-soft:#d7edf7;--highlight:#6ea9c6;--wash:#f1f8fb;--paper:#ffffff;--line:rgba(51,107,141,.17);--shadow:0 24px 70px rgba(52,112,145,.13);--soft-glow:rgba(215,237,247,.72);--soft-glow-2:rgba(215,237,247,.58);--soft-leaf:rgba(215,237,247,.5);--accent-faint:rgba(75,134,167,.18);--focus:#87bad2;--seal-border:#9bc6da;--countdown-muted:#e0f2fa}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth;background:var(--paper)}
    body{margin:0;min-width:320px;background:
      radial-gradient(ellipse at 5% 8%,var(--soft-glow) 0 8rem,transparent 18rem),
      radial-gradient(ellipse at 97% 28%,var(--soft-glow-2) 0 7rem,transparent 19rem),
      linear-gradient(180deg,var(--paper),var(--wash) 48%,var(--paper));
      color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
    html.js body.is-locked{overflow:hidden}
    a{color:inherit}button,select{font:inherit}img{display:block;max-width:100%}
    :focus-visible{outline:3px solid var(--focus);outline-offset:4px}
    .botanical-field{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;opacity:.54}
    .botanical-field::before,.botanical-field::after{content:"";position:absolute;width:260px;height:560px;border:1px solid var(--accent-faint);border-radius:52% 48% 58% 42%;background:
      radial-gradient(ellipse at 44% 13%,var(--soft-leaf) 0 18px,transparent 19px),
      radial-gradient(ellipse at 67% 25%,var(--soft-leaf) 0 25px,transparent 26px),
      radial-gradient(ellipse at 31% 39%,var(--soft-leaf) 0 30px,transparent 31px),
      radial-gradient(ellipse at 68% 54%,var(--soft-leaf) 0 24px,transparent 25px);
      filter:blur(.1px)}
    .botanical-field::before{left:-145px;top:18vh;transform:rotate(-22deg)}
    .botanical-field::after{right:-155px;bottom:-120px;transform:rotate(26deg)}
    body[data-event="baby_shower"] .botanical-field::before,body[data-event="baby_shower"] .botanical-field::after{width:360px;height:360px;border:0;border-radius:50%;background:
      radial-gradient(circle at 34% 42%,rgba(196,228,243,.72) 0 18%,transparent 19%),
      radial-gradient(circle at 58% 34%,rgba(216,239,249,.78) 0 22%,transparent 23%),
      radial-gradient(circle at 68% 60%,rgba(196,228,243,.6) 0 20%,transparent 21%)}
    .opening{position:relative;z-index:100;display:grid;min-height:100vh;min-height:100svh;place-items:center;padding:28px 18px;background:linear-gradient(145deg,var(--paper),var(--wash));transition:opacity .65s ease,visibility .65s ease}
    html.js .opening{position:fixed;inset:0}
    .opening[hidden]{display:none}
    .opening-inner{width:min(92vw,390px);text-align:center}
    .opening-kicker,.kicker{margin:0 0 13px;color:var(--accent-deep);font-size:.7rem;font-weight:760;letter-spacing:.23em;text-transform:uppercase}
    .opening-title{margin:0 0 22px;font-family:var(--serif);font-size:clamp(2.25rem,10vw,4.25rem);font-weight:400;line-height:.94;letter-spacing:-.04em}
    .amp{display:inline-block;margin:0 .08em;color:var(--highlight);font-size:.62em;font-style:italic;vertical-align:.18em}
    .invitation-card{position:relative;width:min(100%,300px);margin:auto;padding:10px;background:var(--white);border:1px solid var(--line);box-shadow:var(--shadow);transform:rotate(-1.2deg);transition:transform .65s ease}
    .invitation-card::before,.invitation-card::after{content:"";position:absolute;z-index:-1;width:82px;height:142px;border-radius:100% 0 100% 0;background:linear-gradient(145deg,var(--accent-soft),transparent)}
    .invitation-card::before{left:-45px;top:-35px;transform:rotate(-28deg)}
    .invitation-card::after{right:-44px;bottom:-42px;transform:rotate(150deg)}
    .cover-art{width:100%;aspect-ratio:4/5;object-fit:cover;background:var(--wash)}
    .seal-button{position:absolute;left:50%;bottom:-29px;display:grid;width:68px;height:68px;place-items:center;transform:translateX(-50%);border:6px double var(--seal-border);border-radius:50%;background:var(--accent-deep);box-shadow:0 12px 30px rgba(31,45,34,.26);color:#fff;cursor:pointer;font-family:var(--serif);font-size:1.08rem;transition:transform .25s ease,filter .25s ease}
    .seal-button:hover{transform:translateX(-50%) scale(1.05);filter:brightness(1.08)}
    .opening-hint{margin:52px 0 0;color:var(--muted);font-size:.78rem;letter-spacing:.08em}
    html.js .site-shell{opacity:0;transform:translateY(14px);transition:opacity .75s ease,transform .75s ease}
    html.js body.invitation-open .site-shell{opacity:1;transform:none}
    body.invitation-open .opening{opacity:0;visibility:hidden;pointer-events:none}
    .topbar{position:sticky;top:0;z-index:30;display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:20px;padding:10px clamp(18px,4vw,56px);border-bottom:1px solid var(--line);background:rgba(255,254,251,.88);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
    body[data-event="baby_shower"] .topbar{background:rgba(255,255,255,.9)}
    .brand{font-family:var(--serif);font-size:1.06rem;letter-spacing:.04em}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{color:var(--muted);font-size:.76rem;font-weight:680;text-decoration:none}
    .language{display:flex;align-items:center;gap:8px}.language>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}select{min-height:42px;border:1px solid var(--line);border-radius:999px;background:var(--white);color:var(--ink);padding:7px 32px 7px 13px}
    .hero{position:relative;display:grid;min-height:calc(100vh - 64px);min-height:calc(100svh - 64px);align-items:end;overflow:hidden;background:var(--accent-deep)}
    .hero-media{position:absolute;inset:0}.hero-media img{width:100%;height:100%;object-fit:cover;object-position:center 35%;transform:scale(1.025);transition:transform 6s ease}
    body.invitation-open .hero-media img{transform:scale(1)}
    .hero.fallback-art .hero-media{display:grid;place-items:center;background:var(--wash)}.hero.fallback-art .hero-media img{width:min(100%,660px);object-fit:contain}
    .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,28,20,.05) 20%,rgba(18,28,20,.26) 58%,rgba(18,28,20,.82) 100%)}
    body[data-event="baby_shower"] .hero::after{background:linear-gradient(180deg,rgba(19,64,88,.03) 15%,rgba(19,64,88,.23) 60%,rgba(23,64,86,.76) 100%)}
    .hero-content{position:relative;z-index:2;width:min(960px,100%);margin:auto;padding:110px 22px max(62px,env(safe-area-inset-bottom));color:#fff;text-align:center;text-shadow:0 10px 35px rgba(0,0,0,.3)}
    .hero-content .kicker{color:#fff}.hero h1{margin:0;font-family:var(--serif);font-size:clamp(3.1rem,12vw,7.6rem);font-weight:400;line-height:.86;letter-spacing:-.055em}
    .date-pill{display:inline-flex;align-items:center;gap:14px;margin-top:25px;padding:12px 20px;border:1px solid rgba(255,255,255,.52);border-radius:999px;background:rgba(22,34,25,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:var(--serif);font-size:clamp(.78rem,2.6vw,1rem);letter-spacing:.09em}
    .section{position:relative;width:min(1120px,100%);margin:auto;padding:clamp(76px,10vw,124px) clamp(20px,5vw,62px)}
    .section.wide{width:min(1280px,100%)}.section-heading{max-width:760px;margin:0 auto 44px;text-align:center}.section-title{margin:0;font-family:var(--serif);font-size:clamp(2.4rem,7vw,5.5rem);font-weight:400;line-height:.98;letter-spacing:-.04em}.section-intro{max-width:620px;margin:18px auto 0;color:var(--muted);font-size:clamp(1rem,2vw,1.14rem);line-height:1.8}
    .story-card{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(320px,.94fr);min-height:620px;border:1px solid var(--line);background:var(--white);box-shadow:var(--shadow)}
    .story-photo{min-height:440px;overflow:hidden}.story-photo img{width:100%;height:100%;object-fit:cover}.story-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(38px,6vw,78px);background:
      radial-gradient(ellipse at 100% 0,var(--soft-glow-2),transparent 48%),var(--paper)}
    .story-copy h2{margin:0;font-family:var(--serif);font-size:clamp(2.5rem,5vw,4.5rem);font-weight:400;line-height:1.02}.story-copy p:last-child{margin:24px 0 0;color:var(--muted);font-family:var(--serif);font-size:clamp(1.05rem,2.2vw,1.35rem);line-height:1.85}
    .gallery-section{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.62)}.gallery-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:118px;gap:14px}.gallery-item{grid-column:span 4;grid-row:span 3;margin:0;overflow:hidden;background:var(--accent-soft)}.gallery-item:first-child{grid-column:span 7;grid-row:span 5}.gallery-item:nth-child(2){grid-column:span 5;grid-row:span 3}.gallery-item:nth-child(3){grid-column:span 5;grid-row:span 2}.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .55s ease}.gallery-item:hover img{transform:scale(1.025)}
    .event-layout{display:grid;grid-template-columns:minmax(0,.9fr) minmax(360px,1.1fr);gap:clamp(30px,6vw,80px);align-items:stretch}.event-photo{min-height:680px;overflow:hidden;border-radius:52% 52% 2px 2px;background:var(--accent-soft)}.event-photo img{width:100%;height:100%;object-fit:cover}.event-copy{display:flex;flex-direction:column;justify-content:center}.event-copy h2{margin:0 0 34px;font-family:var(--serif);font-size:clamp(2.6rem,6vw,5rem);font-weight:400;line-height:.98}.event-card{padding:26px 0;border-top:1px solid var(--line)}.event-card:last-of-type{border-bottom:1px solid var(--line)}.event-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:18px}.event-card h3{margin:0;font-family:var(--serif);font-size:clamp(1.7rem,3vw,2.4rem);font-weight:400}.event-card time{color:var(--accent-deep);font-size:.78rem;font-weight:760;letter-spacing:.14em}.event-card p{margin:12px 0 0;color:var(--muted);line-height:1.75}.venue-line{margin-top:28px;color:var(--ink);font-weight:680}
    .countdown-section{width:auto;max-width:none;background:var(--accent-deep);color:#fff}.countdown-section .kicker{color:var(--countdown-muted)}.countdown-section .section-heading{margin-bottom:36px}.countdown{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-width:850px;margin:auto;border-top:1px solid rgba(255,255,255,.28);border-bottom:1px solid rgba(255,255,255,.28)}.countdown-item{position:relative;padding:28px 10px;text-align:center}.countdown-item+.countdown-item::before{content:"";position:absolute;left:0;top:22%;bottom:22%;width:1px;background:rgba(255,255,255,.25)}.countdown strong{display:block;font-family:var(--serif);font-size:clamp(2.4rem,7vw,4.8rem);font-weight:400;font-variant-numeric:tabular-nums}.countdown span{font-size:.66rem;letter-spacing:.15em;text-transform:uppercase}.countdown-done{display:none;margin:0;text-align:center;font-family:var(--serif);font-size:2rem}
    .timeline{position:relative;max-width:820px;margin:54px auto 0}.timeline::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--line)}.timeline-item{position:relative;display:grid;grid-template-columns:1fr 58px 1fr;min-height:122px;align-items:center}.timeline-copy{padding:14px 26px}.timeline-item:nth-child(odd) .timeline-copy{grid-column:1;text-align:right}.timeline-item:nth-child(even) .timeline-copy{grid-column:3;text-align:left}.timeline-dot{grid-column:2;grid-row:1;display:grid;width:44px;height:44px;place-items:center;justify-self:center;border:1px solid var(--highlight);border-radius:50%;background:var(--paper);box-shadow:0 0 0 8px var(--paper);color:var(--accent-deep);font-family:var(--serif)}.timeline-time{margin:0 0 5px;color:var(--accent-deep);font-size:.72rem;font-weight:780;letter-spacing:.14em}.timeline-label{margin:0;font-family:var(--serif);font-size:clamp(1.25rem,3vw,1.75rem);font-weight:400}
    .action-panel{padding:clamp(34px,5vw,58px);border:1px solid var(--line);background:var(--white);box-shadow:var(--shadow);text-align:center}.action-panel h2{margin:0;font-family:var(--serif);font-size:clamp(2.3rem,6vw,4.7rem);font-weight:400}.action-panel .location-name{margin:18px auto 0;color:var(--muted);font-size:1.08rem;line-height:1.7}.actions{display:flex;flex-wrap:wrap;justify-content:center;gap:11px;margin-top:30px}.button{display:inline-flex;min-height:50px;align-items:center;justify-content:center;padding:0 21px;border:1px solid var(--accent-deep);border-radius:999px;background:var(--accent-deep);color:#fff;text-decoration:none;font-size:.83rem;font-weight:750;transition:transform .2s ease,filter .2s ease}.button.secondary{background:transparent;color:var(--ink)}.button:hover{transform:translateY(-2px);filter:brightness(1.06)}
    .rsvp-section{width:auto;max-width:none;background:var(--wash)}.rsvp-grid{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:clamp(34px,6vw,74px);align-items:start}.rsvp-copy{position:sticky;top:104px}.rsvp-copy h2{margin:0;font-family:var(--serif);font-size:clamp(3rem,8vw,6rem);font-weight:400}.rsvp-copy p{color:var(--muted);line-height:1.8}.youform{min-height:660px;overflow:hidden;border:1px solid var(--line);background:var(--white);box-shadow:var(--shadow)}
    .gift-panel{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.3fr);gap:clamp(32px,7vw,90px);align-items:start}.gift-copy h2{margin:0;font-family:var(--serif);font-size:clamp(2.5rem,6vw,4.8rem);font-weight:400}.gift-copy p{color:var(--muted);line-height:1.8}.gift{display:grid}.gift-row{padding:19px 0;border-bottom:1px solid var(--line)}.gift-row:first-child{border-top:1px solid var(--line)}.gift-row span{display:block;color:var(--muted);font-size:.67rem;font-weight:760;letter-spacing:.15em;text-transform:uppercase}.gift-row strong{display:block;margin-top:8px;font-family:var(--serif);font-size:clamp(1.3rem,3vw,1.8rem);font-weight:400;overflow-wrap:anywhere}
    footer{padding:38px 20px;background:var(--ink);color:#fff;text-align:center;font-family:var(--serif);font-size:.95rem;letter-spacing:.06em}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease var(--delay,0ms),transform .7s ease var(--delay,0ms)}.reveal.visible{opacity:1;transform:none}
    @media(max-width:900px){.nav-links{display:none}.story-card,.event-layout,.gift-panel{grid-template-columns:1fr}.story-card{min-height:0}.story-photo{min-height:65vh}.event-photo{min-height:62vh;order:2}.event-copy{order:1}.gallery-grid{grid-auto-rows:92px}.rsvp-grid{grid-template-columns:1fr}.rsvp-copy{position:static}.youform{min-height:720px}}
    @media(max-width:640px){.topbar{min-height:58px;padding-inline:14px}.brand{font-size:.94rem}.hero{min-height:calc(100vh - 58px);min-height:calc(100svh - 58px)}.date-pill{gap:7px;padding-inline:13px}.section{padding:68px 18px}.story-photo{min-height:460px}.story-copy{padding:40px 25px}.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:190px;gap:8px}.gallery-item,.gallery-item:first-child,.gallery-item:nth-child(2),.gallery-item:nth-child(3){grid-column:span 1;grid-row:span 1}.gallery-item:first-child{grid-column:1/-1;grid-row:span 2}.event-photo{min-height:520px}.event-card-head{display:block}.event-card time{display:block;margin-top:8px}.countdown{grid-template-columns:repeat(2,minmax(0,1fr))}.countdown-item:nth-child(3)::before{display:none}.timeline::before{left:23px}.timeline-item{grid-template-columns:48px 1fr;min-height:112px}.timeline-dot{grid-column:1;width:40px;height:40px;box-shadow:0 0 0 6px var(--paper)}.timeline-copy,.timeline-item:nth-child(odd) .timeline-copy,.timeline-item:nth-child(even) .timeline-copy{grid-column:2;padding:12px;text-align:left}.actions{display:grid}.button{width:100%}.opening-title{font-size:clamp(2.1rem,12vw,3.2rem)}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.reveal,.site-shell{opacity:1!important;transform:none!important}.hero-media img{transform:none!important}}
  </style>
</head>
<body class="is-locked" data-event="${eventType}">
  <div class="opening" id="opening" role="dialog" aria-modal="true" aria-labelledby="openingTitle">
    <div class="opening-inner">
      <p class="opening-kicker" data-copy="openingFrom">${escapeHtml(copy.openingFrom)}</p>
      <h1 class="opening-title" id="openingTitle">${escapeHtml(couple.person1)} <span class="amp" aria-hidden="true">&amp;</span> ${escapeHtml(couple.person2)}</h1>
      <div class="invitation-card">
        <img class="cover-art" src="${escapeHtml(safeInvitationImage)}" alt="${escapeHtml(`${copy.invitation}: ${names}`)}" decoding="async">
        <button class="seal-button" id="openInvitation" type="button" aria-label="${escapeHtml(copy.openInvitation)}"><span aria-hidden="true">V</span></button>
      </div>
      <p class="opening-hint" data-copy="openingHint">${escapeHtml(copy.openingHint)}</p>
    </div>
  </div>

  <div class="site-shell" id="content">
    <div class="botanical-field" aria-hidden="true"></div>
    <header class="topbar">
      <a class="brand" href="#top">${escapeHtml(names)}</a>
      <nav class="nav-links" aria-label="Sections">
        <a href="#story" data-copy="navStory">${escapeHtml(copy.navStory)}</a>
        <a href="#gallery" data-copy="navGallery">${escapeHtml(copy.navGallery)}</a>
        <a href="#details" data-copy="navDetails">${escapeHtml(copy.navDetails)}</a>
        ${attendanceEnabled ? `<a href="#rsvp" data-copy="navRsvp">${escapeHtml(copy.navRsvp)}</a>` : ""}
      </nav>
      <label class="language"><span data-copy="language">${escapeHtml(copy.language)}</span><select id="language" aria-label="${escapeHtml(copy.language)}">${SUPPORTED_LOCALES.map((item) => `<option value="${item}"${item === locale ? " selected" : ""}>${escapeHtml(LANGUAGE_NAMES[item])}</option>`).join("")}</select></label>
    </header>

    <main>
      <section class="hero${hasUploadedGallery ? "" : " fallback-art"}" id="top" tabindex="-1">
        <div class="hero-media"><img src="${escapeHtml(heroImage)}" alt="${escapeHtml(copy.photoAlt)}" fetchpriority="high" decoding="async"></div>
        <div class="hero-content">
          <p class="kicker" data-copy="heroKicker">${escapeHtml(copy.heroKicker)}</p>
          <h1>${escapeHtml(couple.person1)} <span class="amp" aria-hidden="true">&amp;</span> ${escapeHtml(couple.person2)}</h1>
          <div class="date-pill"><span id="heroDate" data-local-date>${escapeHtml(date)}</span><span aria-hidden="true">·</span><span>${escapeHtml(eventTime)}</span></div>
        </div>
      </section>

      <section class="section" id="story">
        <article class="story-card">
          <div class="story-photo reveal"><img src="${escapeHtml(storyImage)}" alt="${escapeHtml(copy.photoAlt)}" loading="lazy" decoding="async"></div>
          <div class="story-copy reveal" style="--delay:100ms">
            <p class="kicker" data-copy="storyKicker">${escapeHtml(copy.storyKicker)}</p>
            <h2 data-copy="storyTitle">${escapeHtml(copy.storyTitle)}</h2>
            <p>${escapeHtml(message)}</p>
          </div>
        </article>
      </section>

      <section class="gallery-section" id="gallery">
        <div class="section wide">
          <div class="section-heading">
            <p class="kicker reveal" data-copy="galleryKicker">${escapeHtml(copy.galleryKicker)}</p>
            <h2 class="section-title reveal" data-copy="galleryTitle">${escapeHtml(copy.galleryTitle)}</h2>
            <p class="section-intro reveal" data-copy="galleryIntro">${escapeHtml(copy.galleryIntro)}</p>
          </div>
          <div class="gallery-grid">${galleryMarkup}</div>
        </div>
      </section>

      <section class="section" id="details">
        <div class="event-layout">
          <div class="event-photo reveal"><img src="${escapeHtml(detailImage)}" alt="${escapeHtml(copy.photoAlt)}" loading="lazy" decoding="async"></div>
          <div class="event-copy">
            <p class="kicker reveal" data-copy="venueKicker">${escapeHtml(copy.venueKicker)}</p>
            <h2 class="reveal" data-copy="eventDetailsTitle">${escapeHtml(copy.eventDetailsTitle)}</h2>
            <article class="event-card reveal">
              <div class="event-card-head"><h3 data-copy="primaryEvent">${escapeHtml(copy.primaryEvent)}</h3><time datetime="${escapeHtml(`${eventDate || ""}T${eventTime}`)}">${escapeHtml(eventTime)}</time></div>
              <p data-copy="primaryEventText">${escapeHtml(copy.primaryEventText)}</p>
            </article>
            <article class="event-card reveal" style="--delay:80ms">
              <div class="event-card-head"><h3 data-copy="secondaryEvent">${escapeHtml(copy.secondaryEvent)}</h3><time datetime="${escapeHtml(`${eventDate || ""}T${secondaryTime}`)}">${escapeHtml(secondaryTime)}</time></div>
              <p data-copy="secondaryEventText">${escapeHtml(copy.secondaryEventText)}</p>
            </article>
            <p class="venue-line">${escapeHtml(location)}</p>
          </div>
        </div>
      </section>

      <section class="section countdown-section">
        <div class="section-heading">
          <p class="kicker" data-copy="countdownKicker">${escapeHtml(copy.countdownKicker)}</p>
          <h2 class="section-title" data-copy="countdownTitle">${escapeHtml(copy.countdownTitle)}</h2>
        </div>
        <div class="countdown" id="countdown" aria-label="${escapeHtml(copy.countdownTitle)}">
          <div class="countdown-item"><strong id="days">---</strong><span data-copy="days">${escapeHtml(copy.days)}</span></div>
          <div class="countdown-item"><strong id="hours">--</strong><span data-copy="hours">${escapeHtml(copy.hours)}</span></div>
          <div class="countdown-item"><strong id="minutes">--</strong><span data-copy="minutes">${escapeHtml(copy.minutes)}</span></div>
          <div class="countdown-item"><strong id="seconds">--</strong><span data-copy="seconds">${escapeHtml(copy.seconds)}</span></div>
        </div>
        <p class="countdown-done" id="countdownDone" data-copy="today">${escapeHtml(copy.today)}</p>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="kicker reveal" data-copy="timelineKicker">${escapeHtml(copy.timelineKicker)}</p>
          <h2 class="section-title reveal" data-copy="timelineTitle">${escapeHtml(copy.timelineTitle)}</h2>
        </div>
        <div class="timeline">${schedule.map(([key, time], index) => `<article class="timeline-item reveal" style="--delay:${index * 70}ms">
          <div class="timeline-copy"><p class="timeline-time">${escapeHtml(time)}</p><h3 class="timeline-label" data-copy="${key}">${escapeHtml(copy[key])}</h3></div>
          <div class="timeline-dot" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
        </article>`).join("")}</div>
      </section>

      <section class="section">
        <div class="action-panel reveal">
          <p class="kicker" data-copy="venueKicker">${escapeHtml(copy.venueKicker)}</p>
          <h2>${escapeHtml(location)}</h2>
          <p class="location-name"><span data-local-date>${escapeHtml(date)}</span> · ${escapeHtml(eventTime)}</p>
          <div class="actions">
            ${mapsUrl ? `<a class="button" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer" data-copy="location">${escapeHtml(copy.location)}</a>` : ""}
            ${calendarUrl ? `<a class="button secondary" href="${escapeHtml(calendarUrl.toString())}" target="_blank" rel="noopener noreferrer" data-copy="calendar">${escapeHtml(copy.calendar)}</a>` : ""}
            ${eventDate ? `<a class="button secondary" href="wedding.ics" download data-copy="calendarFile">${escapeHtml(copy.calendarFile)}</a>` : ""}
          </div>
        </div>
      </section>

      ${attendanceEnabled ? `<section class="section rsvp-section" id="rsvp"><div class="section rsvp-grid">
        <div class="rsvp-copy">
          <p class="kicker" data-copy="rsvpKicker">${escapeHtml(copy.rsvpKicker)}</p>
          <h2 data-copy="rsvp">${escapeHtml(copy.rsvp)}</h2>
          <p data-copy="rsvpIntro">${escapeHtml(copy.rsvpIntro)}</p>
          <a class="button secondary" href="${escapeHtml(rsvpUrl)}" target="_blank" rel="noopener noreferrer" data-copy="openRsvp">${escapeHtml(copy.openRsvp)}</a>
        </div>
        ${formId ? `<div class="youform"><div data-youform-embed data-form="${escapeHtml(formId)}" data-width="100%" data-height="700" data-params="${escapeHtml(embedParams)}"></div></div>` : ""}
      </div></section>` : ""}

      ${giftEnabled ? `<section class="section"><div class="gift-panel">
        <div class="gift-copy"><p class="kicker" data-copy="gift">${escapeHtml(copy.gift)}</p><h2 data-copy="gift">${escapeHtml(copy.gift)}</h2><p data-copy="giftIntro">${escapeHtml(copy.giftIntro)}</p></div>
        <div class="gift">
          <div class="gift-row"><span>IBAN</span><strong>${escapeHtml(gift.iban)}</strong></div>
          <div class="gift-row"><span data-copy="holder">${escapeHtml(copy.holder)}</span><strong>${escapeHtml(gift.accountHolder || names)}</strong></div>
          ${gift.paymentReference ? `<div class="gift-row"><span data-copy="reference">${escapeHtml(copy.reference)}</span><strong>${escapeHtml(gift.paymentReference)}</strong></div>` : ""}
        </div>
      </div></section>` : ""}
    </main>

    <footer>${escapeHtml(names)} · ${escapeHtml(eventDate ? eventDate.slice(0, 4) : "")} · <span data-copy="footer">${escapeHtml(copy.footer)}</span></footer>
  </div>

  ${formId ? '<script src="https://app.youform.com/embed.js" async></script>' : ""}
  <script>
    const COPY=${translationsJson};
    const DATES=${localizedDatesJson};
    const TARGET=${JSON.stringify(target)};
    const localeSelect=document.getElementById("language");
    function applyLanguage(locale){
      const dictionary=COPY[locale]||COPY.en;
      document.documentElement.lang=locale;
      document.querySelectorAll("[data-copy]").forEach(function(node){
        const key=node.dataset.copy;
        if(dictionary[key])node.textContent=dictionary[key];
      });
      document.querySelectorAll("[data-local-date]").forEach(function(node){
        node.textContent=DATES[locale]||DATES.en;
      });
      try{localStorage.setItem("wedding-site-language",locale)}catch{}
    }
    localeSelect.addEventListener("change",function(){applyLanguage(localeSelect.value)});
    try{
      const saved=localStorage.getItem("wedding-site-language");
      if(COPY[saved]){localeSelect.value=saved;applyLanguage(saved)}
    }catch{}

    const opening=document.getElementById("opening");
    const openButton=document.getElementById("openInvitation");
    const hero=document.getElementById("top");
    let opened=false;
    function openInvitation(){
      if(opened)return;
      opened=true;
      document.body.classList.add("invitation-open");
      document.body.classList.remove("is-locked");
      opening.setAttribute("aria-hidden","true");
      const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(function(){
        opening.hidden=true;
        try{hero.focus({preventScroll:true})}catch{hero.focus()}
      },reduced?0:680);
    }
    openButton.addEventListener("click",openInvitation);

    const revealNodes=document.querySelectorAll(".reveal");
    const reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reducedMotion||!("IntersectionObserver" in window)){
      revealNodes.forEach(function(node){node.classList.add("visible")});
    }else{
      const observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}
        });
      },{rootMargin:"0px 0px -8% 0px",threshold:.08});
      revealNodes.forEach(function(node){observer.observe(node)});
    }

    const targetTime=TARGET?new Date(TARGET).getTime():NaN;
    const countdown=document.getElementById("countdown");
    const countdownDone=document.getElementById("countdownDone");
    let countdownTimer=null;
    function tick(){
      const remaining=targetTime-Date.now();
      if(!Number.isFinite(targetTime)||remaining<=0){
        countdown.style.display="none";
        countdownDone.style.display="block";
        if(countdownTimer)window.clearInterval(countdownTimer);
        return;
      }
      const totalSeconds=Math.floor(remaining/1000);
      document.getElementById("days").textContent=String(Math.floor(totalSeconds/86400)).padStart(3,"0");
      document.getElementById("hours").textContent=String(Math.floor((totalSeconds%86400)/3600)).padStart(2,"0");
      document.getElementById("minutes").textContent=String(Math.floor((totalSeconds%3600)/60)).padStart(2,"0");
      document.getElementById("seconds").textContent=String(totalSeconds%60).padStart(2,"0");
    }
    tick();
    if(Number.isFinite(targetTime)&&targetTime>Date.now())countdownTimer=window.setInterval(tick,1000);
  </script>
</body>
</html>`;
}

function normalizeSiteImagePath(value) {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  if (
    !candidate
    || candidate.length > 200
    || candidate.startsWith("/")
    || candidate.includes("\\")
    || candidate.includes("%")
    || candidate.includes("?")
    || candidate.includes("#")
    || /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "";
  }
  const segments = candidate.split("/");
  if (
    segments.length > 4
    || segments.some((segment) => (
      !segment
      || segment === "."
      || segment === ".."
      || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,90}$/.test(segment)
    ))
    || !/\.(?:avif|jpe?g|png|webp)$/i.test(segments.at(-1))
  ) {
    return "";
  }
  return segments.join("/");
}

function normalizeGalleryImagePaths(values) {
  if (!Array.isArray(values)) return [];
  const unique = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalizeSiteImagePath(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length === 6) break;
  }
  return unique;
}

function safeHttpsUrl(value) {
  try {
    if (typeof value !== "string" || !value.trim()) return "";
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || (url.port && url.port !== "443")
    ) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function safeYouformUrl(value) {
  const safeUrl = safeHttpsUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  const host = url.hostname.toLowerCase();
  return host === "youform.com" || host.endsWith(".youform.com") ? url.toString() : "";
}

function normalizeEventDate(value) {
  const candidate = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return "";
  const parsed = new Date(`${candidate}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate
    ? candidate
    : "";
}

function normalizeClock(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "12:00";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "12:00";
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutesToClock(value, minutesToAdd) {
  const [hour, minute] = normalizeClock(value).split(":").map(Number);
  const total = ((hour * 60 + minute + Number(minutesToAdd || 0)) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatLocalizedEventDate(dateValue, localeTag) {
  if (!dateValue) return "—";
  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T12:00:00Z`));
}

function googleCalendarDates(date, time) {
  const safeDate = normalizeEventDate(date);
  const safeTime = normalizeClock(time);
  if (!safeDate) return "";
  const start = new Date(`${safeDate}T${safeTime}:00Z`);
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
  const compact = (value) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
  return `${compact(start)}/${compact(end)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
