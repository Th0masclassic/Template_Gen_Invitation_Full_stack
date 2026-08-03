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
    days: "dias",
    hours: "horas",
    minutes: "minutos",
    language: "Idioma",
    footer: "Criado com InviteLab",
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
    days: "days",
    hours: "hours",
    minutes: "minutes",
    language: "Language",
    footer: "Created with InviteLab",
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
    days: "días",
    hours: "horas",
    minutes: "minutos",
    language: "Idioma",
    footer: "Creado con InviteLab",
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
    days: "jours",
    hours: "heures",
    minutes: "minutes",
    language: "Langue",
    footer: "Créé avec InviteLab",
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
    days: "Tage",
    hours: "Stunden",
    minutes: "Minuten",
    language: "Sprache",
    footer: "Erstellt mit InviteLab",
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
    "PRODID:-//InviteLab//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@invitelab-invites`,
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

function renderLegacyEventWebsite({
  project,
  requestId,
  imageFileName = "invitation.png",
  galleryImages = [],
}) {
  const eventType = project?.eventType === "baby_shower" ? "baby_shower" : "wedding";
  const locale = normalizeLocale(project?.language, "en");
  const translations = Object.fromEntries(SUPPORTED_LOCALES.map((item) => [
    item,
    { ...SITE_COPY[item], ...EVENT_COPY[eventType][item] },
  ]));
  const copy = translations[locale];
  const couple = project?.couple || {};
  const invitation = project?.invitation || {};
  const links = project?.links || {};
  const websiteDetails = project?.website?.details || {};
  const names = `${String(couple.person1 || "").trim()} & ${String(couple.person2 || "").trim()}`;
  const location = String(invitation.location || "").trim();
  const message = String(websiteDetails.story || invitation.message || "").trim() || copy.storyFallback;
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
  const ceremonyTime = normalizeClock(websiteDetails.ceremonyTime || eventTime);
  const secondaryTime = normalizeClock(websiteDetails.receptionTime || addMinutesToClock(ceremonyTime, eventType === "baby_shower" ? 45 : 90));
  const arrivalTime = normalizeClock(websiteDetails.arrivalTime || addMinutesToClock(ceremonyTime, scheduleOffsets[0]));
  const partyTime = normalizeClock(websiteDetails.partyTime || addMinutesToClock(ceremonyTime, scheduleOffsets[3]));
  const schedule = [
    ["timelineArrival", arrivalTime],
    ["timelineMain", ceremonyTime],
    ["timelineGathering", secondaryTime],
    ["timelineFinale", partyTime],
  ];
  const ceremonyDescription = String(websiteDetails.ceremonyDescription || copy.primaryEventText).trim();
  const receptionDescription = String(websiteDetails.receptionDescription || copy.secondaryEventText).trim();
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
    html{width:100%;max-width:100%;scroll-behavior:smooth;overflow-x:hidden;overflow-x:clip;background:var(--paper)}
    body{position:relative;width:100%;max-width:100%;min-width:0;margin:0;overflow-x:hidden;overflow-x:clip;overscroll-behavior-x:none;touch-action:pan-y;background:
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
    footer{padding:38px 20px;background:var(--ink);color:#fff;text-align:center;font-family:var(--serif);font-size:.95rem;letter-spacing:.06em}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease var(--delay,0ms),transform .7s ease var(--delay,0ms)}.reveal.visible{opacity:1;transform:none}
    @media(max-width:900px){.nav-links{display:none}.story-card,.event-layout{grid-template-columns:1fr}.story-card{min-height:0}.story-photo{min-height:65vh}.event-photo{min-height:62vh;order:2}.event-copy{order:1}.gallery-grid{grid-auto-rows:92px}.rsvp-grid{grid-template-columns:1fr}.rsvp-copy{position:static}.youform{min-height:720px}}
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
              <div class="event-card-head"><h3 data-copy="primaryEvent">${escapeHtml(copy.primaryEvent)}</h3><time datetime="${escapeHtml(`${eventDate || ""}T${ceremonyTime}`)}">${escapeHtml(ceremonyTime)}</time></div>
              <p${websiteDetails.ceremonyDescription ? "" : ' data-copy="primaryEventText"'}>${escapeHtml(ceremonyDescription)}</p>
            </article>
            <article class="event-card reveal" style="--delay:80ms">
              <div class="event-card-head"><h3 data-copy="secondaryEvent">${escapeHtml(copy.secondaryEvent)}</h3><time datetime="${escapeHtml(`${eventDate || ""}T${secondaryTime}`)}">${escapeHtml(secondaryTime)}</time></div>
              <p${websiteDetails.receptionDescription ? "" : ' data-copy="secondaryEventText"'}>${escapeHtml(receptionDescription)}</p>
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


export function renderWeddingWebsite({
  project,
  requestId,
  imageFileName = "invitation.png",
  envelopeSealFileName = "assets/mobile-envelope-layer-seal.webp",
  galleryImages = [],
  websiteImages = {},
  musicFileName = "",
  theme = null,
  rsvpSubmitUrl = "",
}) {
  if (project?.eventType === "baby_shower") {
    return renderLegacyEventWebsite({ project, requestId, imageFileName, galleryImages });
  }
  const locale = normalizeLocale(project?.language, "en");
  const copy = editorialSiteCopy(locale);
  const couple = project?.couple || {};
  const invitation = project?.invitation || {};
  const details = project?.website?.details || {};
  const names = `${String(couple.person1 || "").trim()} & ${String(couple.person2 || "").trim()}`;
  const initials = `${String(couple.person1 || "").trim().slice(0, 1)} | ${String(couple.person2 || "").trim().slice(0, 1)}`.toUpperCase();
  const compactInitials = `${String(couple.person1 || "").trim().slice(0, 1)} & ${String(couple.person2 || "").trim().slice(0, 1)}`.toUpperCase();
  const eventDate = normalizeEventDate(invitation.date);
  const eventTime = normalizeClock(invitation.time || details.ceremonyTime);
  const localizedDate = formatLocalizedEventDate(eventDate, { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" }[locale] || "en-GB");
  const shortDate = eventDate ? eventDate.split("-").reverse().join(" · ") : "";
  const location = String(invitation.location || "").trim();
  const locationParts = location.split(",").map((item) => item.trim()).filter(Boolean);
  const venueName = locationParts[0] || location;
  const venueArea = locationParts.slice(1).join(", ") || location;
  const safeInvitationImage = normalizeSiteImagePath(imageFileName) || "invitation.png";
  const safeGallery = normalizeGalleryImagePaths(galleryImages);
  const safeWebsiteImages = websiteImages && typeof websiteImages === "object" && !Array.isArray(websiteImages)
    ? websiteImages
    : {};
  const safeTheme = normalizeWeddingTheme(theme);
  const selectedEnvelopeColor = /^#[0-9A-Fa-f]{6}$/.test(String(details.envelopeColor || ""))
    ? String(details.envelopeColor).toUpperCase()
    : "";
  // The website colour picker is the source of truth for the envelope and the
  // template's primary green surface. Keep the image-derived palette for the
  // remaining accents so the site retains its contrast and typography tuning.
  const effectiveTheme = selectedEnvelopeColor
    ? { ...safeTheme, themeColor: selectedEnvelopeColor, primary: selectedEnvelopeColor }
    : safeTheme;
  const themeColor = effectiveTheme.themeColor || effectiveTheme.primary || "#30382c";
  const themeStyle = renderWeddingThemeStyle(effectiveTheme);
  const uploadedIntroCandidates = [];
  const uploadedIntroSeen = new Set();
  for (const candidate of [
    safeWebsiteImages.hero,
    safeWebsiteImages.story1,
    safeWebsiteImages.story2,
    safeWebsiteImages.venue,
    safeWebsiteImages.stay,
    ...safeGallery,
  ]) {
    const normalized = normalizeSiteImagePath(candidate);
    if (!normalized || uploadedIntroSeen.has(normalized)) continue;
    uploadedIntroSeen.add(normalized);
    uploadedIntroCandidates.push(normalized);
    if (uploadedIntroCandidates.length === 3) break;
  }
  const introPhotos = [0, 1, 2].map((index) => uploadedIntroCandidates[index] || safeInvitationImage);
  const heroImage = normalizeSiteImagePath(safeWebsiteImages.hero) || safeGallery[0] || safeInvitationImage;
  const storyImage1 = normalizeSiteImagePath(safeWebsiteImages.story1) || safeGallery[1] || heroImage;
  const storyImage2 = normalizeSiteImagePath(safeWebsiteImages.story2) || safeGallery[2] || storyImage1;
  const venueImage = normalizeSiteImagePath(safeWebsiteImages.venue) || safeGallery[3] || heroImage;
  const stayImage = normalizeSiteImagePath(safeWebsiteImages.stay) || safeGallery[4] || storyImage2;
  // Keep the opening focused on the couple: their names sit immediately above
  // the envelope rather than a long translated "wedding of" heading.
  const introTitle = names;
  const introEyebrow = weddingIntroEyebrow(locale);
  const introScrollHint = weddingIntroScrollHint(locale);
  // Keep the supplied artwork untouched unless the visitor explicitly chooses
  // an envelope colour. The colour picker is opt-in; its absence must not tint
  // the white reference envelope.
  const mobileEnvelopeColor = selectedEnvelopeColor || "transparent";
  const musicUrl = normalizeSiteAudioPath(musicFileName) || safeHttpsUrl(details.musicUrl);
  const musicTitle = String(details.musicTitle || (locale === "pt" ? "A nossa música" : "Our song")).trim();
  const musicArtist = String(details.musicArtist || names).trim();
  const waxInitials = `${String(couple.person1 || "").trim().slice(0, 1)}${String(couple.person2 || "").trim().slice(0, 1)}`.toUpperCase();
  const mapsUrl = safeHttpsUrl(project?.links?.mapsUrl) || "#";
  const sections = normalizeWebsiteSections(details.sections);
  const attendanceEnabled = Boolean(project?.attendance?.enabled);
  const target = eventDate ? `${eventDate}T${eventTime}:00` : "";
  const ceremonyTime = normalizeClock(details.ceremonyTime || eventTime);
  const receptionTime = normalizeClock(details.receptionTime || addMinutesToClock(ceremonyTime, 60));
  const arrivalTime = normalizeClock(details.arrivalTime || addMinutesToClock(ceremonyTime, -30));
  const mealTime = normalizeClock(details.mealTime || addMinutesToClock(ceremonyTime, 150));
  const cakeTime = normalizeClock(details.cakeTime || addMinutesToClock(ceremonyTime, 330));
  const partyTime = normalizeClock(details.partyTime || addMinutesToClock(ceremonyTime, 360));
  const rsvpDeadline = normalizeEventDate(details.rsvpDeadline) || defaultRsvpDeadline(eventDate);
  const localizedRsvpDeadline = formatLocalizedEventDate(rsvpDeadline, { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" }[locale] || "en-GB");
  const heroIntro = String(details.heroIntro || invitation.message || copy.heroIntro).trim();
  const storyIntro = String(details.storyIntro || details.story || copy.storyIntro).trim();
  const venueTitle = String(details.venueTitle || copy.venueTitle).trim();
  const venueDescription = String(details.venueDescription || copy.venueDescription.replace("{venue}", venueName)).trim();
  const calendarUrl = eventDate ? new URL("https://calendar.google.com/calendar/render") : null;
  if (calendarUrl) {
    calendarUrl.searchParams.set("action", "TEMPLATE");
    calendarUrl.searchParams.set("text", names);
    calendarUrl.searchParams.set("dates", googleCalendarDates(eventDate, eventTime));
    calendarUrl.searchParams.set("details", heroIntro);
    calendarUrl.searchParams.set("location", location);
  }
  const siteConfig = safeJsonForHtml({
    countdownTarget: target,
    rsvpSubmitUrl: rsvpSubmitUrl || `/api/public/rsvp/${encodeURIComponent(String(requestId || ""))}`,
    sections,
    music: musicUrl ? { title: musicTitle, artist: musicArtist } : null,
    labels: {
      openMenu: copy.openMenu,
      closeMenu: copy.closeMenu,
      rsvpThanks: copy.rsvpThanks,
      rsvpError: locale === "pt" ? "Não foi possível enviar a resposta. Tenta novamente." : "We could not send your response. Please try again.",
      playMusic: locale === "pt" ? "Reproduzir música" : "Play music",
      pauseMusic: locale === "pt" ? "Pausar música" : "Pause music",
    },
  });
  const image = (src, alt, className = "") => `<img${className ? ` class="${className}"` : ""} src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
  const youformMarkup = attendanceEnabled
    ? `<form id="rsvpForm" class="rsvp-form">
        <div class="rsvp-form-lead">
          <span class="rsvp-form-kicker">A little note from us</span>
          <p>Please share your details below so we can prepare for you.</p>
        </div>
        <div class="rsvp-fields">
          <div class="rsvp-field rsvp-field-wide">
            <label for="guestName">What's your name?</label>
            <input id="guestName" name="guestName" type="text" autocomplete="name" required>
          </div>
          <div class="rsvp-field rsvp-field-wide">
            <label for="guestEmail">What's your email?</label>
            <input id="guestEmail" name="email" type="email" autocomplete="email" required>
          </div>
          <fieldset class="rsvp-choice rsvp-field-wide">
            <legend>Are you going?</legend>
            <div class="rsvp-choice-options">
              <label class="rsvp-choice-card">
                <input type="radio" name="attendance" value="yes" required>
                <span class="rsvp-choice-card-copy"><strong>Yes, I'll be there</strong><small>Can't wait to celebrate together.</small></span>
                <span class="rsvp-choice-mark" aria-hidden="true">✓</span>
              </label>
              <label class="rsvp-choice-card">
                <input type="radio" name="attendance" value="no" required>
                <span class="rsvp-choice-card-copy"><strong>No, I can't make it</strong><small>We'll be thinking of you.</small></span>
                <span class="rsvp-choice-mark" aria-hidden="true">×</span>
              </label>
            </div>
          </fieldset>
          <div class="rsvp-field rsvp-field-wide">
            <label for="guestContact">Cellphone number (optional)</label>
            <input id="guestContact" name="contact" type="tel" autocomplete="tel" inputmode="tel">
          </div>
          <div class="rsvp-field rsvp-field-wide">
            <label for="guestMessage">Message for Couple (optional)</label>
            <textarea id="guestMessage" name="message" rows="4" maxlength="2000"></textarea>
          </div>
        </div>
        <div class="rsvp-form-actions">
          <p class="rsvp-form-note">Your details are only used to organise the celebration.</p>
          <button class="rsvp-submit" type="submit">${escapeHtml(copy.sendResponse)} <span aria-hidden="true">↗</span></button>
        </div>
        <p class="rsvp-status" id="rsvpStatus" role="status" aria-live="polite"></p>
      </form>`
    : "";

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${escapeHtml(names)} — ${escapeHtml(copy.weddingWebsite)}</title>
  <meta name="description" content="${escapeHtml(heroIntro)}">
  <meta name="theme-color" content="${themeColor}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&family=Italianno&display=swap" rel="stylesheet">
  <script>document.documentElement.classList.add("js");window.INVITELAB_SITE=${siteConfig}</script>
  <link rel="stylesheet" href="styles.css">
  ${themeStyle}
  <style id="open-envelope-intro-style">
    .envelope-intro{position:relative;isolation:isolate;display:grid;width:100%;max-width:100%;min-height:100vh;min-height:100svh;place-items:center;overflow:hidden;overflow:clip;padding:clamp(20px,3vh,42px) 14px max(30px,env(safe-area-inset-bottom));background:#fff;color:#283022}
    .envelope-intro::after,.envelope-intro::before{content:none!important}
    .envelope-intro__inner{width:min(100%,720px);max-width:100%;min-height:calc(100svh - 72px);display:grid;align-content:center;justify-items:center;text-align:center}
    .envelope-intro__stage{--envelope-drop:clamp(22px,4vw,38px);position:relative;width:min(84vw,470px);aspect-ratio:2/3}
    .envelope-intro__scene{position:absolute;inset:0}
    .envelope-intro__names{position:absolute;z-index:8;left:50%;top:-24%;width:min(112%,620px);transform:translateX(-50%);text-align:center;pointer-events:none}
    .envelope-intro__title{margin:0;font-family:Italianno,"Cormorant Garamond",Georgia,serif;font-size:clamp(3.4rem,12vw,6.25rem);font-weight:400;line-height:.8;letter-spacing:.005em;text-wrap:balance}
    .envelope-intro__meta{margin:8px 0 0;color:#66705d;font-family:"Cormorant Garamond",Georgia,serif;font-size:clamp(.86rem,2.4vw,1.08rem);letter-spacing:.08em}
    .envelope-intro__art{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;z-index:1;translate:0 var(--envelope-drop);opacity:0;pointer-events:none;user-select:none;-webkit-user-drag:none}
    .envelope-intro__photo{position:absolute;z-index:2;display:block;width:30%;aspect-ratio:.72;overflow:hidden;padding:4px;background:#fff;border:1px solid rgba(78,96,62,.2);box-shadow:0 12px 28px rgba(46,59,38,.16);opacity:0;translate:0 var(--envelope-drop)}
    .envelope-intro__photo img{width:100%;height:100%;object-fit:cover;display:block}
    .envelope-intro__photo--left{left:14%;top:34%;transform:translateY(160px) rotate(-8deg) scale(.96)}
    .envelope-intro__photo--center{left:34%;width:32%;top:27%;transform:translateY(190px) rotate(0deg) scale(.96)}
    .envelope-intro__photo--right{left:56%;top:34%;transform:translateY(160px) rotate(8deg) scale(.96)}
    .envelope-intro.is-active .envelope-intro__photo--left{animation:invitePhotoLeft 1.25s cubic-bezier(.2,.82,.2,1) .15s forwards}
    .envelope-intro.is-active .envelope-intro__photo--center{animation:invitePhotoCenter 1.35s cubic-bezier(.2,.82,.2,1) .45s forwards}
    .envelope-intro.is-active .envelope-intro__photo--right{animation:invitePhotoRight 1.25s cubic-bezier(.2,.82,.2,1) .75s forwards}
    .envelope-intro.is-active .envelope-intro__art{animation:inviteEnvelope 4.0s cubic-bezier(.2,.82,.2,1) .05s forwards}
    .envelope-intro__art--front{z-index:3;clip-path:polygon(0 47%,50% 67%,100% 47%,100% 100%,0 100%)}
    .envelope-intro__heart{position:absolute;z-index:5;left:50%;top:58%;display:grid;width:12%;aspect-ratio:1;place-items:center;border:2px solid rgba(184,146,84,.8);border-radius:999px;background:#fff;color:var(--gold,#b89254);box-shadow:0 7px 16px rgba(46,59,38,.18);font-family:Georgia,serif;font-size:clamp(1.05rem,4vw,1.7rem);line-height:1;opacity:0;pointer-events:none;transform:translateX(-50%) translateY(10px) scale(.86);translate:0 var(--envelope-drop)}
    .envelope-intro.is-active .envelope-intro__heart{animation:inviteHeart .7s ease 1.25s forwards}
    .envelope-intro__scroll{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));z-index:8;display:grid;justify-items:center;gap:7px;transform:translateX(-50%);color:#667a56;font-size:.68rem;font-weight:600;letter-spacing:.17em;text-transform:uppercase;text-decoration:none;white-space:nowrap}
    .envelope-intro__scroll span:last-child{font-size:1.35rem;line-height:1;animation:inviteScroll 1.5s ease-in-out infinite}
    @keyframes inviteEnvelope{0%{opacity:0;transform:translateY(78px) scale(.985)}35%{opacity:1}100%{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes invitePhotoLeft{0%{opacity:0;transform:translateY(160px) rotate(-11deg) scale(.96)}15%{opacity:1}78%{opacity:1;transform:translateY(-8px) rotate(-8.5deg) scale(1)}100%{opacity:1;transform:translateY(0) rotate(-8deg) scale(1)}}
    @keyframes invitePhotoCenter{0%{opacity:0;transform:translateY(190px) rotate(0) scale(.96)}15%{opacity:1}80%{opacity:1;transform:translateY(-10px) rotate(0) scale(1)}100%{opacity:1;transform:translateY(0) rotate(0) scale(1)}}
    @keyframes invitePhotoRight{0%{opacity:0;transform:translateY(160px) rotate(11deg) scale(.96)}15%{opacity:1}78%{opacity:1;transform:translateY(-8px) rotate(8.5deg) scale(1)}100%{opacity:1;transform:translateY(0) rotate(8deg) scale(1)}}
    @keyframes inviteHeart{0%{opacity:0;transform:translateX(-50%) translateY(10px) scale(.86)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
    @keyframes inviteScroll{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
    @media(max-width:540px){.envelope-intro{width:100%;max-width:100vw;padding-top:max(36px,calc(env(safe-area-inset-top) + 18px));padding-inline:12px}.envelope-intro__inner{width:100%;max-width:100%;min-height:calc(100svh - 58px)}.envelope-intro__names{left:50%;top:-15%;width:min(calc(100vw - 24px),480px);max-width:100vw;transform:translateX(-50%)}.envelope-intro__title{font-size:clamp(3rem,13vw,5.2rem)}.envelope-intro__stage{--envelope-drop:clamp(24px,7vw,34px);position:relative;left:auto;justify-self:center;width:min(calc(100vw - 32px),420px);max-width:100%;margin-inline:auto}.envelope-intro__photo{width:31%}.envelope-intro__photo--center{width:33%;left:33.5%;top:27%}.envelope-intro__photo--left{left:12.5%}.envelope-intro__photo--right{left:56.5%}.envelope-intro__heart{width:13%}.envelope-intro__scroll{max-width:calc(100vw - 24px);font-size:.58rem}}
    @media(prefers-reduced-motion:reduce){.envelope-intro__art,.envelope-intro__photo,.envelope-intro__heart{animation:none!important;opacity:1!important}.envelope-intro__art{transform:none}.envelope-intro__photo--left{transform:rotate(-8deg)}.envelope-intro__photo--center{transform:none}.envelope-intro__photo--right{transform:rotate(8deg)}.envelope-intro__heart{transform:translateX(-50%)}.envelope-intro__scroll span:last-child{animation:none}}
  </style>
</head>
<body class="invitation-open mobile-intro-pending">
  <div class="mobile-envelope-gate" id="envelopeScreen" role="dialog" aria-modal="true" aria-label="${escapeHtml(copy.openInvitation)}" style="--mobile-envelope-color:${escapeHtml(mobileEnvelopeColor)}">
    <div class="mobile-envelope-layer mobile-envelope-layer-bottom" aria-hidden="true">
      <img src="assets/mobile-envelope-layer-bottom.png" alt="">
    </div>
    <div class="mobile-envelope-layer mobile-envelope-layer-top" aria-hidden="true">
      <img src="assets/mobile-envelope-layer-top.png" alt="">
    </div>
    <div class="mobile-envelope-layer mobile-envelope-layer-seal" aria-hidden="true">
      <img src="${escapeHtml(envelopeSealFileName)}" alt="">
      
    </div>
    <button class="mobile-wax-seal" id="sealTrigger" type="button" aria-label="${escapeHtml(copy.openInvitation)}"></button>
    <p class="mobile-envelope-instruction">${escapeHtml(locale === "pt" ? "Toque no Brasão" : "Touch the crest")}<br>${escapeHtml(locale === "pt" ? "para abrir o convite" : "to open the invitation")}</p>
  </div>
  <section class="hero envelope-intro" id="hero" tabindex="-1" aria-labelledby="introTitle">
    <div class="envelope-intro__inner">
      <div class="envelope-intro__stage">
        <div class="envelope-intro__scene" data-hero-media>
          <div class="envelope-intro__names"><h1 class="envelope-intro__title script" id="introTitle">${escapeHtml(introTitle)}</h1><p class="envelope-intro__meta">${escapeHtml(localizedDate)} · ${escapeHtml(venueName)}</p></div>
          <img class="envelope-intro__art" src="assets/green-envelope.png" alt="${escapeHtml(copy.envelopeAlt)}" fetchpriority="high" decoding="async">
          <div class="envelope-intro__photo envelope-intro__photo--left">${image(introPhotos[1], copy.photoAlt)}</div>
          <div class="envelope-intro__photo envelope-intro__photo--center">${image(introPhotos[0], copy.photoAlt)}</div>
          <div class="envelope-intro__photo envelope-intro__photo--right">${image(introPhotos[2], copy.photoAlt)}</div>
          <img class="envelope-intro__art envelope-intro__art--front" src="assets/green-envelope.png" alt="" aria-hidden="true" decoding="async">
          <div class="envelope-intro__heart" aria-hidden="true">♥</div>
        </div>
      </div>
    </div>
    <a class="envelope-intro__scroll" href="#invitation"><span>${escapeHtml(introScrollHint)}</span><span aria-hidden="true">↓</span></a>
    <a id="replayEnvelope" href="#hero" hidden tabindex="-1" aria-hidden="true"></a>
  </section>
  <header class="topbar"><div class="container topbar-inner"><a class="brand script" href="#hero">${escapeHtml(compactInitials)}<span>${escapeHtml(shortDate)}</span></a><button class="menu-toggle" id="menuToggle" type="button" aria-controls="primaryNav" aria-expanded="false" aria-label="${escapeHtml(copy.openMenu)}"><span></span><span></span><span></span></button><nav class="nav" id="primaryNav" aria-label="${escapeHtml(copy.sections)}"><a href="#invitation">${escapeHtml(copy.navInvitation)}</a><a href="#countdown">${escapeHtml(copy.navCountdown)}</a><a href="#story">${escapeHtml(copy.navStory)}</a><a href="#rsvp">RSVP</a><a href="#venue">${escapeHtml(copy.navVenue)}</a><a href="#timeline">${escapeHtml(copy.navTimeline)}</a><a href="#dress-code">${escapeHtml(copy.navDress)}</a><a href="#stay">${escapeHtml(copy.navStay)}</a><a href="#travel">${escapeHtml(copy.navTravel)}</a><a href="#faq">FAQ</a></nav></div></header>
  <main>
    <section class="section" id="invitation"><div class="container editorial-grid"><div class="editorial-image invitation-art" data-reveal="image-left">${image(safeInvitationImage, copy.invitationAlt)}</div><div class="editorial-copy" data-reveal="right"><div class="line-label micro">${escapeHtml(copy.invitation)}</div><h3 class="script">${escapeHtml(copy.youAreInvited)}</h3><p>${escapeHtml(invitation.message || copy.invitationIntro)}</p><div class="detail-list"><div class="detail-row"><span>${escapeHtml(copy.date)}</span><strong>${escapeHtml(localizedDate)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.time)}</span><strong>${escapeHtml(eventTime)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.venue)}</span><strong>${escapeHtml(venueName)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.location)}</span><strong>${escapeHtml(venueArea)}</strong></div></div><a class="text-link" href="#venue">${escapeHtml(copy.viewVenue)}</a></div></div></section>
    <section class="section countdown-section" id="countdown"><div class="container"><div class="section-heading" data-reveal="up"><div class="line-label micro">${escapeHtml(copy.countdown)}</div><h2 class="section-title script">${escapeHtml(copy.countdownTitle)}</h2></div><div class="countdown" data-reveal="up" style="--reveal-delay:160ms"><div class="time-box"><strong data-time="days">00</strong><span>${escapeHtml(copy.days)}</span></div><div class="time-box"><strong data-time="hours">00</strong><span>${escapeHtml(copy.hours)}</span></div><div class="time-box"><strong data-time="minutes">00</strong><span>${escapeHtml(copy.minutes)}</span></div><div class="time-box"><strong data-time="seconds">00</strong><span>${escapeHtml(copy.seconds)}</span></div></div></div></section>
    <section class="section" id="story"><div class="container story-layout"><div class="story-copy" data-reveal="left"><div class="line-label micro" style="justify-content:flex-start">${escapeHtml(copy.loveStory)}</div><h3 class="script">${escapeHtml(copy.ourLoveStory)}</h3><p>${escapeHtml(storyIntro)}</p><div class="story-points"><div class="story-point"><h4>${escapeHtml(copy.howWeMet)}</h4><p>${escapeHtml(details.howWeMet || copy.howWeMetFallback)}</p></div><div class="story-point"><h4>${escapeHtml(copy.proposal)}</h4><p>${escapeHtml(details.proposal || copy.proposalFallback)}</p></div><div class="story-point"><h4>${escapeHtml(copy.nextChapter)}</h4><p>${escapeHtml(details.nextChapter || copy.nextChapterFallback)}</p></div></div></div><div class="story-gallery" data-reveal="right"><figure>${image(heroImage, copy.photoAlt)}</figure><figure>${image(storyImage1, copy.photoAlt)}</figure><figure>${image(storyImage2, copy.photoAlt)}</figure></div></div></section>
    <section class="section rsvp-section" id="rsvp"><div class="container rsvp-layout"><div class="rsvp-heading" data-reveal="left"><div class="line-label micro" style="justify-content:flex-start">RSVP & ${escapeHtml(copy.location)}</div><h2 class="script">${escapeHtml(copy.willCelebrate)}</h2><p>${escapeHtml(copy.replyBy)} ${escapeHtml(localizedRsvpDeadline)}.</p></div><div class="rsvp-actions" data-reveal="right"><button class="editorial-button editorial-button-dark" id="openRsvp" type="button">${escapeHtml(copy.confirmAttendance)} <span aria-hidden="true">↗</span></button>${mapsUrl !== "#" ? `<a class="editorial-button" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy.openLocation)} <span aria-hidden="true">↗</span></a>` : ""}<p>${escapeHtml(location)}</p></div></div></section>
    <section class="section" id="venue"><div class="container editorial-grid"><div class="editorial-copy" data-reveal="left"><div class="line-label micro">${escapeHtml(copy.dateVenue)}</div><h3 class="script">${escapeHtml(venueTitle)}</h3><p>${escapeHtml(venueDescription)}</p><div class="detail-list"><div class="detail-row"><span>${escapeHtml(copy.ceremony)}</span><strong>${escapeHtml(ceremonyTime)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.reception)}</span><strong>${escapeHtml(receptionTime)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.address)}</span><strong>${escapeHtml(location)}</strong></div><div class="detail-row"><span>${escapeHtml(copy.parking)}</span><strong>${escapeHtml(details.parkingInfo || copy.parkingFallback)}</strong></div></div><a class="text-link" href="#travel">${escapeHtml(copy.travelInfo)}</a></div><div class="editorial-image" data-reveal="image-right">${image(venueImage, copy.venueAlt)}</div></div></section>
    <section class="section" id="timeline"><div class="container"><div class="section-heading" data-reveal="up"><div class="line-label micro">${escapeHtml(copy.timeline)}</div><h2 class="section-title script">${escapeHtml(copy.orderDay)}</h2></div><div class="timeline" data-reveal="up" aria-label="${escapeHtml(copy.orderDay)}"><svg class="timeline-path" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0 C42 84 60 123 48 205 C37 294 64 334 49 431 C36 522 65 580 49 669 C38 765 62 829 50 1000"></path></svg><div class="timeline-item" data-timeline-item style="--timeline-index:0;--node-rotate:-7deg"><div class="timeline-time">${escapeHtml(arrivalTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.guestArrival)}</h4><p>${escapeHtml(details.arrivalDescription || copy.arrivalFallback)}</p></div></div><div class="timeline-item" data-timeline-item style="--timeline-index:1;--node-rotate:5deg"><div class="timeline-time">${escapeHtml(ceremonyTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.ceremony)}</h4><p>${escapeHtml(details.ceremonyDescription || copy.ceremonyFallback)}</p></div></div><div class="timeline-item" data-timeline-item style="--timeline-index:2;--node-rotate:-4deg"><div class="timeline-time">${escapeHtml(receptionTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.cocktail)}</h4><p>${escapeHtml(details.receptionDescription || copy.receptionFallback)}</p></div></div><div class="timeline-item" data-timeline-item style="--timeline-index:3;--node-rotate:6deg"><div class="timeline-time">${escapeHtml(mealTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.mealSpeeches)}</h4><p>${escapeHtml(details.mealDescription || copy.mealFallback)}</p></div></div><div class="timeline-item" data-timeline-item style="--timeline-index:4;--node-rotate:-6deg"><div class="timeline-time">${escapeHtml(cakeTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.cake)}</h4><p>${escapeHtml(details.cakeDescription || copy.cakeFallback)}</p></div></div><div class="timeline-item" data-timeline-item style="--timeline-index:5;--node-rotate:4deg"><div class="timeline-time">${escapeHtml(partyTime)}</div><span class="timeline-node" aria-hidden="true"><span></span></span><div class="timeline-entry"><h4>${escapeHtml(copy.party)}</h4><p>${escapeHtml(details.partyDescription || copy.partyFallback)}</p></div></div></div></div></section>
    <section class="section" id="dress-code"><div class="container"><div class="section-heading" data-reveal="up"><div class="line-label micro">${escapeHtml(copy.dressCode)}</div><h2 class="section-title script">${escapeHtml(details.dressCodeTitle || copy.dressCodeTitle)}</h2><p class="section-subtitle">${escapeHtml(details.dressCodeIntro || copy.dressCodeIntro)}</p></div><div class="three-columns" data-reveal="up"><article><h4>${escapeHtml(copy.overallStyle)}</h4><p>${escapeHtml(details.dressCodeStyle || copy.dressStyleFallback)}</p></article><article><h4>${escapeHtml(copy.suggestedColours)}</h4><p>${escapeHtml(details.dressCodeColors || copy.dressColorsFallback)}</p></article><article><h4>${escapeHtml(copy.comfortNote)}</h4><p>${escapeHtml(details.dressCodeComfort || copy.dressComfortFallback)}</p></article></div></div></section>
    <section class="section" id="stay"><div class="container editorial-grid"><div class="editorial-copy" data-reveal="left"><div class="line-label micro">${escapeHtml(copy.whereStay)}</div><h3 class="script">${escapeHtml(copy.weekend)}</h3><p>${escapeHtml(details.accommodationIntro || copy.accommodationIntro)}</p><div class="hotels"><div class="hotel"><h4>${escapeHtml(details.hotel1Name || copy.hotel1Name)}</h4><p>${escapeHtml(details.hotel1Description || copy.hotel1Description)}</p></div><div class="hotel"><h4>${escapeHtml(details.hotel2Name || copy.hotel2Name)}</h4><p>${escapeHtml(details.hotel2Description || copy.hotel2Description)}</p></div><div class="hotel"><h4>${escapeHtml(details.hotel3Name || copy.hotel3Name)}</h4><p>${escapeHtml(details.hotel3Description || copy.hotel3Description)}</p></div></div></div><div class="editorial-image" data-reveal="image-right">${image(stayImage, copy.stayAlt)}</div></div></section>
    <section class="section" id="travel"><div class="container"><div class="section-heading" data-reveal="up"><div class="line-label micro">${escapeHtml(copy.travelInfo)}</div><h2 class="section-title script">${escapeHtml(copy.gettingHere)}</h2><p class="section-subtitle">${escapeHtml(details.travelIntro || copy.travelIntro)}</p></div><div class="three-columns" data-reveal="up"><article><h4>${escapeHtml(copy.airport)}</h4><p>${escapeHtml(details.travelAirport || copy.airportFallback)}</p></article><article><h4>${escapeHtml(copy.transfers)}</h4><p>${escapeHtml(details.travelTransfers || copy.transfersFallback)}</p></article><article><h4>${escapeHtml(copy.parking)}</h4><p>${escapeHtml(details.travelParking || details.parkingInfo || copy.parkingTravelFallback)}</p></article></div><div class="hero-actions calendar-actions">${calendarUrl ? `<a href="${escapeHtml(calendarUrl.toString())}" target="_blank" rel="noopener">${escapeHtml(copy.googleCalendar)}</a>` : ""}<a href="wedding.ics" download>${escapeHtml(copy.downloadCalendar)}</a></div></div></section>
    <section class="section" id="faq"><div class="container"><div class="section-heading" data-reveal="up"><div class="line-label micro">FAQ</div><h2 class="section-title script">${escapeHtml(copy.questions)}</h2></div><div class="faq-list" data-reveal="up"><div class="faq-item open"><button class="faq-q" type="button"><span>${escapeHtml(copy.plusOneQuestion)}</span><span>+</span></button><div class="faq-a">${escapeHtml(details.faqPlusOne || copy.plusOneFallback)}</div></div><div class="faq-item"><button class="faq-q" type="button"><span>${escapeHtml(copy.dressQuestion)}</span><span>+</span></button><div class="faq-a">${escapeHtml(details.dressCodeIntro || copy.dressCodeIntro)}</div></div><div class="faq-item"><button class="faq-q" type="button"><span>${escapeHtml(copy.rsvpQuestion)}</span><span>+</span></button><div class="faq-a">${escapeHtml(attendanceEnabled ? copy.rsvpEnabled : copy.rsvpContact)}</div></div><div class="faq-item"><button class="faq-q" type="button"><span>${escapeHtml(copy.calendarQuestion)}</span><span>+</span></button><div class="faq-a">${escapeHtml(copy.calendarAnswer)}</div></div></div></div></section>
  </main>
  <div class="rsvp-modal" id="rsvpModal" hidden aria-hidden="true"><div class="rsvp-backdrop" data-close-rsvp></div><div class="rsvp-dialog" role="dialog" aria-modal="true" aria-labelledby="rsvpTitle"><button class="rsvp-close" id="closeRsvp" type="button" aria-label="${escapeHtml(copy.close)}">×</button><aside class="rsvp-side"><div class="rsvp-monogram script">${escapeHtml(compactInitials)}</div><div><div class="micro">${escapeHtml(shortDate)}</div><h2 class="script">${escapeHtml(copy.hopeJoin)}</h2><p>${escapeHtml(copy.replyBy)} ${escapeHtml(localizedRsvpDeadline)}.</p></div><div class="rsvp-event-lines"><span>${escapeHtml(venueName)}</span><span>${escapeHtml(venueArea)} · ${escapeHtml(eventTime)}</span></div></aside><div class="rsvp-form-panel"><div class="line-label micro" style="justify-content:flex-start">RSVP</div><h2 class="script" id="rsvpTitle">${escapeHtml(copy.kindlyReply)}</h2><p class="rsvp-intro">${escapeHtml(copy.replyBy)} ${escapeHtml(localizedRsvpDeadline)}.</p>${youformMarkup}</div></div></div>
  <footer class="footer"><div class="container" data-reveal="up"><div class="monogram">${escapeHtml(initials)}</div><h2 class="script">${escapeHtml(names)}</h2><p>${escapeHtml(details.footerMessage || copy.footerMessage)}</p><small>${escapeHtml(localizedDate)} · ${escapeHtml(venueArea)}</small></div></footer>
  ${musicUrl ? `<aside class="music-player" id="musicPlayer" aria-label="${escapeHtml(locale === "pt" ? "Música do casamento" : "Wedding music")}">
    <audio id="weddingAudio" src="${escapeHtml(musicUrl)}" preload="auto" playsinline loop></audio>
    <button class="music-toggle" id="musicToggle" type="button" aria-label="${escapeHtml(locale === "pt" ? "Reproduzir música" : "Play music")}"><span class="music-toggle-icon" aria-hidden="true"></span></button>
    <span class="music-copy"><strong>${escapeHtml(musicTitle)}</strong><span>${escapeHtml(musicArtist)}</span></span>
    <span class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  </aside>` : ""}
  <script>
    (function(){
      function unlock(){
        if(document.body&&document.body.classList.contains("locked")){
          document.body.classList.remove("locked");
        }
      }
      unlock();
      document.addEventListener("DOMContentLoaded",function(){
        unlock();
        var intro=document.querySelector(".envelope-intro");
        var mobileIntro=window.matchMedia&&window.matchMedia("(max-width: 600px)").matches;
        if(intro&&!mobileIntro)requestAnimationFrame(function(){intro.classList.add("is-active")});
      },{once:true});
      window.addEventListener("pageshow",unlock);
      if(document.body&&"MutationObserver" in window){
        var guard=new MutationObserver(function(){
          if(!document.body.classList.contains("locked"))return;
          guard.disconnect();
          document.body.classList.remove("locked");
        });
        guard.observe(document.body,{attributes:true,attributeFilter:["class"]});
        window.setTimeout(function(){guard.disconnect();unlock()},3500);
      }
    })();
  </script>
  <script src="script.js" defer></script>
</body>
</html>`;
}


function editorialSiteCopy(locale) {
  const en = {
    weddingWebsite: "Wedding website", envelopeAlt: "Wedding envelope with wax seal", openInvitation: "Open invitation", touchSeal: "Touch the seal to open", weddingInvitation: "Wedding invitation", openMenu: "Open navigation menu", closeMenu: "Close navigation menu", sections: "Wedding sections",
    navInvitation: "Invitation", navCountdown: "Countdown", navStory: "Love Story", navVenue: "Venue", navTimeline: "Timeline", navDress: "Dress Code", navStay: "Stay", navTravel: "Travel",
    togetherFamilies: "Together with their families", heroIntro: "We would love you to join us as we celebrate the beginning of our next chapter.", location: "Location", replayEnvelope: "Replay envelope", invitation: "Invitation", youAreInvited: "You are invited", invitationIntro: "All the essential details for our celebration are gathered here.", date: "Date", time: "Time", venue: "Venue", viewVenue: "View date & venue", invitationAlt: "Wedding invitation", countdown: "Countdown", countdownTitle: "Until our forever begins", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    loveStory: "Love Story", ourLoveStory: "Our Love Story", storyIntro: "There are stories that seem written by destiny. Ours grew through shared moments and brought us here.", howWeMet: "How we met", howWeMetFallback: "A short introduction about the first chapter of our relationship.", proposal: "The proposal", proposalFallback: "The moment when one question changed everything and began the journey to this day.", nextChapter: "Our next chapter", nextChapterFallback: "Now we cannot wait to celebrate surrounded by the people who mean the most to us.", photoAlt: "Photo of the couple",
    willCelebrate: "Will you celebrate with us?", replyBy: "Please send your response by", confirmAttendance: "Confirm attendance", openLocation: "Open location", dateVenue: "Date & Venue", venueTitle: "By the sea, with all of you", venueDescription: "{venue} is the setting for our ceremony, reception and evening celebration.", ceremony: "Ceremony", reception: "Reception", address: "Address", parking: "Parking", parkingFallback: "Available at the venue", travelInfo: "Travel information", venueAlt: "Wedding venue",
    timeline: "Wedding Timeline", orderDay: "The order of the day", guestArrival: "Guest arrival", arrivalFallback: "Time to settle in and enjoy the welcome atmosphere before the ceremony.", ceremonyFallback: "The moment we exchange our vows surrounded by family and friends.", cocktail: "Cocktail hour", receptionFallback: "Drinks, music, photographs and relaxed conversation.", mealSpeeches: "Meal & speeches", mealFallback: "A meal together followed by speeches and a few emotional surprises.", cake: "Cake cutting", cakeFallback: "One sweet moment before the evening celebration begins.", party: "Party", partyFallback: "Music, dancing and the rest of the night together.",
    dressCode: "Dress Code", dressCodeTitle: "Elegant celebration", dressCodeIntro: "Formal attire in refined, comfortable tones.", overallStyle: "Overall style", dressStyleFallback: "Elegant wedding attire with refined silhouettes and a timeless feel.", suggestedColours: "Suggested colours", dressColorsFallback: "Soft neutrals, champagne, beige, muted olive, warm brown and classic black.", comfortNote: "Comfort note", dressComfortFallback: "A comfortable second pair of shoes may be useful later in the day.",
    whereStay: "Where to Stay", weekend: "Make a weekend of it", accommodationIntro: "Here are a few accommodation ideas for guests staying nearby.", hotel1Name: "Nearby hotel", hotel1Description: "A comfortable option close to the venue.", hotel2Name: "City hotel", hotel2Description: "A practical option with easy transport connections.", hotel3Name: "Private apartments", hotel3Description: "A flexible solution for groups of friends or family.", stayAlt: "Accommodation near the venue",
    gettingHere: "Getting here", travelIntro: "Useful information to make the journey simple.", airport: "Airport", airportFallback: "Check the closest airport and allow extra time for traffic.", transfers: "Transfers", transfersFallback: "Taxi, shuttle or grouped transport details can be added here.", parkingTravelFallback: "Follow the venue signs and arrival instructions.", googleCalendar: "Add to Google Calendar", downloadCalendar: "Download calendar file",
    questions: "A few things you may be wondering", plusOneQuestion: "Can I bring a plus one?", plusOneFallback: "Please follow the guest names shown on your invitation or contact the couple.", dressQuestion: "Is there a dress code?", rsvpQuestion: "How do I RSVP?", rsvpEnabled: "Use the RSVP button on this website to send your response.", rsvpContact: "Please contact the couple directly to confirm your attendance.", calendarQuestion: "Can I add the event to my calendar?", calendarAnswer: "Yes. Use the Google Calendar or calendar-file buttons in the travel section.",
    close: "Close RSVP form", hopeJoin: "We hope you can join us", kindlyReply: "Kindly reply", yourName: "Your name", attending: "Will you be attending?", accepts: "Joyfully accepts", declines: "Regretfully declines", message: "Message for the couple", sendResponse: "Send response", rsvpThanks: "Thank you", footerMessage: "Thank you for being part of our story. We cannot wait to celebrate with you.", heroAlt: "Couple celebrating their wedding",
  };
  if (locale !== "pt") return en;
  return {
    ...en,
    weddingWebsite: "Website do casamento", envelopeAlt: "Envelope de casamento com selo de cera", openInvitation: "Abrir convite", touchSeal: "Toca no selo para abrir", weddingInvitation: "Convite de casamento", openMenu: "Abrir menu de navegação", closeMenu: "Fechar menu de navegação", sections: "Secções do casamento",
    navInvitation: "Convite", navCountdown: "Contagem", navStory: "A nossa história", navVenue: "Local", navTimeline: "Programa", navDress: "Dress code", navStay: "Alojamento", navTravel: "Viagem",
    togetherFamilies: "Juntamente com as suas famílias", heroIntro: "Gostávamos muito que te juntasses a nós para celebrar o início do nosso próximo capítulo.", location: "localização", replayEnvelope: "Ver envelope novamente", invitation: "Convite", youAreInvited: "Estás convidado", invitationIntro: "Todos os detalhes essenciais da nossa celebração estão reunidos aqui.", date: "Data", time: "Hora", venue: "Local", viewVenue: "Ver data e local", invitationAlt: "Convite de casamento", countdown: "Contagem decrescente", countdownTitle: "Até começar o nosso para sempre", days: "Dias", hours: "Horas", minutes: "Minutos", seconds: "Segundos",
    loveStory: "A nossa história", ourLoveStory: "A nossa história de amor", storyIntro: "Há histórias que parecem escritas pelo destino. A nossa cresceu em momentos partilhados e trouxe-nos até aqui.", howWeMet: "Como nos conhecemos", howWeMetFallback: "Uma pequena introdução sobre o primeiro capítulo da nossa relação.", proposal: "O pedido", proposalFallback: "O momento em que uma pergunta mudou tudo e começou a viagem até este dia.", nextChapter: "O próximo capítulo", nextChapterFallback: "Mal podemos esperar por celebrar rodeados das pessoas que mais significam para nós.", photoAlt: "Fotografia do casal",
    willCelebrate: "Vais celebrar connosco?", replyBy: "Pedimos que confirmes até", confirmAttendance: "Confirmar presença", openLocation: "Abrir localização", dateVenue: "Data e local", venueTitle: "Com todos vocês, num lugar especial", venueDescription: "{venue} será o cenário da cerimónia, receção e festa.", ceremony: "Cerimónia", reception: "Receção", address: "Morada", parking: "Estacionamento", parkingFallback: "Disponível no local", travelInfo: "Informações de viagem", venueAlt: "Local do casamento",
    timeline: "Programa do casamento", orderDay: "A ordem do dia", guestArrival: "Chegada dos convidados", arrivalFallback: "Tempo para chegar, instalar-se e desfrutar do ambiente antes da cerimónia.", ceremonyFallback: "O momento em que trocamos votos rodeados de família e amigos.", cocktail: "Cocktail", receptionFallback: "Bebidas, música, fotografias e conversa descontraída.", mealSpeeches: "Refeição e discursos", mealFallback: "Uma refeição em conjunto, seguida de discursos e algumas surpresas emocionantes.", cake: "Corte do bolo", cakeFallback: "Um momento doce antes de começar a celebração da noite.", party: "Festa", partyFallback: "Música, dança e o resto da noite juntos.",
    dressCode: "Dress code", dressCodeTitle: "Celebração elegante", dressCodeIntro: "Traje formal em tons elegantes e confortáveis.", overallStyle: "Estilo geral", dressStyleFallback: "Traje de casamento elegante, com silhuetas cuidadas e um estilo intemporal.", suggestedColours: "Cores sugeridas", dressColorsFallback: "Neutros suaves, champanhe, bege, verde seco, castanho quente e preto clássico.", comfortNote: "Nota de conforto", dressComfortFallback: "Um segundo par de sapatos confortável pode ser útil mais tarde.",
    whereStay: "Onde ficar", weekend: "Aproveita o fim de semana", accommodationIntro: "Deixamos algumas sugestões de alojamento para quem ficar perto.", hotel1Name: "Hotel próximo", hotel1Description: "Uma opção confortável perto do local.", hotel2Name: "Hotel na cidade", hotel2Description: "Uma opção prática com boas ligações de transporte.", hotel3Name: "Apartamentos privados", hotel3Description: "Uma solução flexível para grupos de amigos ou família.", stayAlt: "Alojamento perto do local",
    gettingHere: "Como chegar", travelIntro: "Informação útil para tornar a viagem simples.", airport: "Aeroporto", airportFallback: "Consulta o aeroporto mais próximo e reserva tempo extra para o trânsito.", transfers: "Transfers", transfersFallback: "Aqui podem ser indicados táxis, shuttle ou transporte em grupo.", parkingTravelFallback: "Segue a sinalização do local e as instruções de chegada.", googleCalendar: "Adicionar ao Google Calendar", downloadCalendar: "Descarregar calendário",
    questions: "Algumas dúvidas que podes ter", plusOneQuestion: "Posso levar acompanhante?", plusOneFallback: "Segue os nomes indicados no convite ou contacta diretamente o casal.", dressQuestion: "Existe dress code?", rsvpQuestion: "Como confirmo a presença?", rsvpEnabled: "Usa o botão de confirmação neste website para enviar a tua resposta.", rsvpContact: "Contacta diretamente o casal para confirmar a presença.", calendarQuestion: "Posso adicionar o evento ao calendário?", calendarAnswer: "Sim. Usa os botões do Google Calendar ou do ficheiro de calendário na secção de viagem.",
    close: "Fechar formulário RSVP", hopeJoin: "Esperamos que estejas connosco", kindlyReply: "Confirma, por favor", yourName: "O teu nome", attending: "Vais estar presente?", accepts: "Aceito com alegria", declines: "Não vou conseguir estar presente", message: "Mensagem para o casal", sendResponse: "Enviar resposta", rsvpThanks: "Obrigado", footerMessage: "Obrigado por fazeres parte da nossa história. Mal podemos esperar por celebrar contigo.", heroAlt: "Casal a celebrar o casamento",
  };
}

function formatWeddingOfTitle(locale, person1, person2) {
  const first = String(person1 || "").trim();
  const second = String(person2 || "").trim();
  const titles = {
    pt: `O casamento de ${first} e ${second}`,
    en: `The Wedding of ${first} and ${second}`,
    es: `La boda de ${first} y ${second}`,
    fr: `Le mariage de ${first} et ${second}`,
    de: `Die Hochzeit von ${first} und ${second}`,
  };
  return titles[normalizeLocale(locale, "en")] || titles.en;
}

function weddingIntroEyebrow(locale) {
  const labels = {
    pt: "Convite de casamento",
    en: "Wedding invitation",
    es: "Invitación de boda",
    fr: "Invitation de mariage",
    de: "Hochzeitseinladung",
  };
  return labels[normalizeLocale(locale, "en")] || labels.en;
}

function weddingIntroScrollHint(locale) {
  const hints = {
    pt: "Desliza para descobrir a nossa história",
    en: "Scroll to discover our story",
    es: "Desliza para descubrir nuestra historia",
    fr: "Faites défiler pour découvrir notre histoire",
    de: "Scrollt, um unsere Geschichte zu entdecken",
  };
  return hints[normalizeLocale(locale, "en")] || hints.en;
}

function defaultRsvpDeadline(eventDate) {
  const safeDate = normalizeEventDate(eventDate);
  if (!safeDate) return "";
  const date = new Date(`${safeDate}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 10);
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

function normalizeSiteAudioPath(value) {
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
    || !/\.mp3$/i.test(segments.at(-1))
  ) {
    return "";
  }
  return segments.join("/");
}

function normalizeWebsiteSections(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    story: source.story !== false,
    rsvp: source.rsvp !== false,
    venueParking: source.venueParking !== false,
    programme: source.programme !== false,
    menu: source.menu !== false,
    dressCode: source.dressCode !== false,
    stayTravel: source.stayTravel !== false,
    faq: source.faq !== false,
  };
}

function normalizeLocalImageBasename(value) {
  const normalized = normalizeSiteImagePath(value);
  return normalized && !normalized.includes("/") ? normalized : "";
}

const WEDDING_THEME_PROPERTIES = Object.freeze({
  paper: "--paper",
  paperSoft: "--paper-soft",
  ink: "--ink",
  muted: "--muted",
  primary: "--olive",
  primarySoft: "--olive-soft",
  accent: "--wine",
  gold: "--gold",
  line: "--line",
});

function normalizeWeddingTheme(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized = {};
  for (const key of ["themeColor", ...Object.keys(WEDDING_THEME_PROPERTIES)]) {
    const color = typeof value[key] === "string" ? value[key].trim() : "";
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) normalized[key] = color;
  }
  return normalized;
}

function renderWeddingThemeStyle(theme) {
  const declarations = Object.entries(WEDDING_THEME_PROPERTIES)
    .flatMap(([key, property]) => theme[key] ? [`${property}:${theme[key]}`] : []);
  return declarations.length
    ? `<style id="envelope-theme">:root{${declarations.join(";")}}</style>`
    : "";
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
