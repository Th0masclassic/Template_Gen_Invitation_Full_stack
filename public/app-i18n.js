(function () {
  "use strict";

  const supported = ["pt", "en", "es", "fr", "de"];
  const localeTags = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" };
  const languageNames = { pt: "Português", en: "English", es: "Español", fr: "Français", de: "Deutsch" };

  const copy = {
    pt: {
      title: "Atelier Vow · Convites digitais",
      privateAccess: "Acesso privado do cliente",
      eyebrow: "O teu convite, à tua medida",
      heroTitle: "Um convite bonito começa com uma história verdadeira.",
      heroText: "Escolhe um dos nossos estilos, adiciona os detalhes do casamento e envia o pedido. Nós tratamos do resto.",
      start: "Começar agora",
      styles: "Ver os 10 estilos",
      step1Title: "Escolhe o estilo",
      step1Text: "Um template ou criação personalizada",
      step2Title: "Adiciona os detalhes",
      step2Text: "Nomes, mensagem, data e local",
      step3Title: "Envia o pedido",
      step3Text: "Recebemos e processamos o convite",
      createTitle: "Cria o teu convite",
      createText: "Podes partir de um dos estilos existentes ou pedir um convite mais personalizado.",
      templateMode: "Escolher um template",
      templateModeText: "Usa um dos 10 estilos como base.",
      customMode: "Criar algo personalizado",
      customModeText: "Inspira-te num estilo e adapta-o.",
      inspiration: "Escolhe a inspiração",
      inspirationText: "Os estilos e o conteúdo final respeitam o idioma selecionado.",
      weddingDetails: "Detalhes do casamento",
      weddingDetailsText: "Estas informações serão usadas para criar o convite.",
      person1: "Primeiro nome",
      person2: "Segundo nome",
      date: "Data",
      time: "Hora",
      optional: "(opcional)",
      venue: "Local",
      maps: "Link ou referência Google Maps",
      mapsHelp: "Se ficar vazio, procuramos automaticamente pelo local indicado.",
      message: "Mensagem do convite",
      messageHelp: "Até 260 caracteres.",
      giftIban: "IBAN para presente",
      giftHelp: "Ao preencher o IBAN, o convite inclui a secção de presente.",
      holder: "Titular da conta",
      reference: "Referência",
      giftMessage: "Mensagem do presente",
      rsvpEnable: "Ativar confirmação de presença",
      rsvpHelp: "O formulário abre de forma segura através da Youform.",
      rsvpUrl: "Link da Youform",
      websiteEnable: "Criar também um website do casamento",
      websiteHelp: "Depois de aprovares a imagem, podes pré-visualizar e publicar o site na EdgeOne.",
      photo: "Fotografia do casal",
      photoAdd: "Adicionar fotografia do casal",
      photoHelp: "JPG, PNG ou WebP · máximo 5 MB",
      websitePhotosLabel: "Fotografias para o website",
      websitePhotosTitle: "Adicionar fotografias do casal",
      websitePhotosHelp: "Até 6 imagens · JPG, PNG ou WebP · máximo 5 MB cada",
      websitePhotosSelected: "fotografias selecionadas",
      websitePhotosRemove: "Remover fotografia",
      websitePhotosClear: "Remover todas",
      websitePhotosLimit: "O website aceita um máximo de 6 fotografias.",
      websitePhotosInvalid: "Usa apenas fotografias JPG, PNG ou WebP.",
      submit: "Enviar pedido",
      privacy: "Os dados são usados apenas para preparar este convite.",
      preview: "Pré-visualização",
      previewText: "Uma referência do estilo e dos dados enviados.",
      mode: "Modo",
      style: "Estilo",
      photography: "Fotografia",
      noPhoto: "Sem fotografia",
      digitalPdf: "Convite digital",
      location: "Localização",
      gift: "Presente",
      attendance: "Confirmação",
      language: "Idioma",
      defaultMessage: "Juntamente com as suas famílias, convidam para celebrar o seu casamento.",
      publishWebsite: "Publicar website",
      openWebsite: "Abrir website",
      previewWebsite: "Pré-visualizar website",
      websitePublishing: "A publicar website…",
      websiteReady: "Website publicado",
      venuePlaceholder: "Quinta ou local do casamento",
      mapsPlaceholder: "Cola o link, escreve o local ou deixa vazio",
      holderPlaceholder: "Nome do titular",
      referencePlaceholder: "Presente de casamento",
      giftMessagePlaceholder: "A vossa presença é o melhor presente. Para quem quiser contribuir, deixamos os dados abaixo.",
      footer: "Atelier Vow · Portal de criação de convites digitais",
    },
    en: {
      title: "Atelier Vow · Digital invitations",
      privateAccess: "Private customer access",
      eyebrow: "Your invitation, made for you",
      heroTitle: "A beautiful invitation begins with a true story.",
      heroText: "Choose a style, add your wedding details and submit the request. We will take care of the rest.",
      start: "Start now",
      styles: "View the 10 styles",
      step1Title: "Choose a style",
      step1Text: "A template or a personalised creation",
      step2Title: "Add the details",
      step2Text: "Names, message, date and venue",
      step3Title: "Submit the request",
      step3Text: "We receive and prepare your invitation",
      createTitle: "Create your invitation",
      createText: "Start with one of our existing styles or request a more personalised invitation.",
      templateMode: "Choose a template",
      templateModeText: "Use one of the 10 styles as your base.",
      customMode: "Create something personal",
      customModeText: "Use a style as inspiration and adapt it.",
      inspiration: "Choose your inspiration",
      inspirationText: "The available styles and final content follow the selected language.",
      weddingDetails: "Wedding details",
      weddingDetailsText: "This information will be used to create the invitation.",
      person1: "First name",
      person2: "Second name",
      date: "Date",
      time: "Time",
      optional: "(optional)",
      venue: "Venue",
      maps: "Google Maps link or reference",
      mapsHelp: "Leave it empty and we will search using the venue.",
      message: "Invitation message",
      messageHelp: "Up to 260 characters.",
      giftIban: "Gift IBAN",
      giftHelp: "Adding an IBAN enables the gift section.",
      holder: "Account holder",
      reference: "Payment reference",
      giftMessage: "Gift message",
      rsvpEnable: "Enable RSVP",
      rsvpHelp: "The RSVP form opens securely through Youform.",
      rsvpUrl: "Youform link",
      websiteEnable: "Create a wedding website as well",
      websiteHelp: "After approving the image, you can preview and publish the website on EdgeOne.",
      photo: "Couple photo",
      photoAdd: "Add a couple photo",
      photoHelp: "JPG, PNG or WebP · maximum 5 MB",
      websitePhotosLabel: "Website photos",
      websitePhotosTitle: "Add couple photos",
      websitePhotosHelp: "Up to 6 images · JPG, PNG or WebP · maximum 5 MB each",
      websitePhotosSelected: "photos selected",
      websitePhotosRemove: "Remove photo",
      websitePhotosClear: "Remove all",
      websitePhotosLimit: "The website accepts a maximum of 6 photos.",
      websitePhotosInvalid: "Use JPG, PNG or WebP photos only.",
      submit: "Submit request",
      privacy: "Your data is used only to prepare this invitation.",
      preview: "Preview",
      previewText: "A reference for the selected style and submitted details.",
      mode: "Mode",
      style: "Style",
      photography: "Photo",
      noPhoto: "No photo",
      digitalPdf: "Digital invitation",
      location: "Location",
      gift: "Gift",
      attendance: "RSVP",
      language: "Language",
      defaultMessage: "Together with their families, invite you to celebrate their wedding.",
      publishWebsite: "Publish website",
      openWebsite: "Open website",
      previewWebsite: "Preview website",
      websitePublishing: "Publishing website…",
      websiteReady: "Website published",
      venuePlaceholder: "Wedding venue",
      mapsPlaceholder: "Paste a link, type the venue, or leave blank",
      holderPlaceholder: "Account holder name",
      referencePlaceholder: "Wedding gift",
      giftMessagePlaceholder: "Your presence is the greatest gift. For anyone wishing to contribute, the details are below.",
      footer: "Atelier Vow · Digital invitation portal",
    },
    es: {
      title: "Atelier Vow · Invitaciones digitales",
      privateAccess: "Acceso privado del cliente",
      eyebrow: "Tu invitación, hecha para ti",
      heroTitle: "Una invitación bonita comienza con una historia real.",
      heroText: "Elige un estilo, añade los datos de la boda y envía la solicitud. Nosotros hacemos el resto.",
      start: "Empezar ahora",
      styles: "Ver los 10 estilos",
      step1Title: "Elige el estilo",
      step1Text: "Una plantilla o una creación personalizada",
      step2Title: "Añade los detalles",
      step2Text: "Nombres, mensaje, fecha y lugar",
      step3Title: "Envía la solicitud",
      step3Text: "Recibimos y preparamos la invitación",
      createTitle: "Crea tu invitación",
      createText: "Parte de uno de nuestros estilos o solicita una invitación más personalizada.",
      templateMode: "Elegir una plantilla",
      templateModeText: "Usa uno de los 10 estilos como base.",
      customMode: "Crear algo personalizado",
      customModeText: "Inspírate en un estilo y adáptalo.",
      inspiration: "Elige la inspiración",
      inspirationText: "Los estilos y el contenido final respetan el idioma seleccionado.",
      weddingDetails: "Detalles de la boda",
      weddingDetailsText: "Usaremos esta información para crear la invitación.",
      person1: "Primer nombre",
      person2: "Segundo nombre",
      date: "Fecha",
      time: "Hora",
      optional: "(opcional)",
      venue: "Lugar",
      maps: "Enlace o referencia de Google Maps",
      mapsHelp: "Si lo dejas vacío, buscaremos el lugar automáticamente.",
      message: "Mensaje de la invitación",
      messageHelp: "Hasta 260 caracteres.",
      giftIban: "IBAN para regalo",
      giftHelp: "Al añadir el IBAN se activa la sección de regalo.",
      holder: "Titular de la cuenta",
      reference: "Referencia",
      giftMessage: "Mensaje del regalo",
      rsvpEnable: "Activar confirmación de asistencia",
      rsvpHelp: "El formulario se abre de forma segura a través de Youform.",
      rsvpUrl: "Enlace de Youform",
      websiteEnable: "Crear también una web de la boda",
      websiteHelp: "Después de aprobar la imagen podrás previsualizar y publicar la web en EdgeOne.",
      photo: "Foto de la pareja",
      photoAdd: "Añadir una foto de la pareja",
      photoHelp: "JPG, PNG o WebP · máximo 5 MB",
      websitePhotosLabel: "Fotos para la web",
      websitePhotosTitle: "Añadir fotos de la pareja",
      websitePhotosHelp: "Hasta 6 imágenes · JPG, PNG o WebP · máximo 5 MB cada una",
      websitePhotosSelected: "fotos seleccionadas",
      websitePhotosRemove: "Eliminar foto",
      websitePhotosClear: "Eliminar todas",
      websitePhotosLimit: "La web admite un máximo de 6 fotos.",
      websitePhotosInvalid: "Usa solo fotos JPG, PNG o WebP.",
      submit: "Enviar solicitud",
      privacy: "Los datos se utilizan únicamente para preparar esta invitación.",
      preview: "Vista previa",
      previewText: "Una referencia del estilo y los datos enviados.",
      mode: "Modo",
      style: "Estilo",
      photography: "Foto",
      noPhoto: "Sin foto",
      digitalPdf: "Invitación digital",
      location: "Ubicación",
      gift: "Regalo",
      attendance: "Confirmación",
      language: "Idioma",
      defaultMessage: "Junto con sus familias, os invitan a celebrar su boda.",
      publishWebsite: "Publicar web",
      openWebsite: "Abrir web",
      previewWebsite: "Previsualizar web",
      websitePublishing: "Publicando web…",
      websiteReady: "Web publicada",
      venuePlaceholder: "Lugar de la boda",
      mapsPlaceholder: "Pega el enlace, escribe el lugar o déjalo vacío",
      holderPlaceholder: "Nombre del titular",
      referencePlaceholder: "Regalo de boda",
      giftMessagePlaceholder: "Vuestra presencia es el mejor regalo. Para quien desee contribuir, dejamos los datos a continuación.",
      footer: "Atelier Vow · Portal de invitaciones digitales",
    },
    fr: {
      title: "Atelier Vow · Invitations numériques",
      privateAccess: "Accès privé client",
      eyebrow: "Votre invitation, à votre image",
      heroTitle: "Une belle invitation commence par une histoire vraie.",
      heroText: "Choisissez un style, ajoutez les détails du mariage et envoyez la demande. Nous nous occupons du reste.",
      start: "Commencer",
      styles: "Voir les 10 styles",
      step1Title: "Choisissez le style",
      step1Text: "Un modèle ou une création personnalisée",
      step2Title: "Ajoutez les détails",
      step2Text: "Noms, message, date et lieu",
      step3Title: "Envoyez la demande",
      step3Text: "Nous recevons et préparons l'invitation",
      createTitle: "Créez votre invitation",
      createText: "Partez de l'un de nos styles ou demandez une invitation plus personnalisée.",
      templateMode: "Choisir un modèle",
      templateModeText: "Utilisez l'un des 10 styles comme base.",
      customMode: "Créer quelque chose d'unique",
      customModeText: "Inspirez-vous d'un style et adaptez-le.",
      inspiration: "Choisissez l'inspiration",
      inspirationText: "Les styles et le contenu final suivent la langue sélectionnée.",
      weddingDetails: "Détails du mariage",
      weddingDetailsText: "Ces informations serviront à créer l'invitation.",
      person1: "Premier prénom",
      person2: "Deuxième prénom",
      date: "Date",
      time: "Heure",
      optional: "(facultatif)",
      venue: "Lieu",
      maps: "Lien ou référence Google Maps",
      mapsHelp: "Si le champ reste vide, nous rechercherons le lieu automatiquement.",
      message: "Message d'invitation",
      messageHelp: "260 caractères maximum.",
      giftIban: "IBAN pour le cadeau",
      giftHelp: "L'ajout de l'IBAN active la section cadeau.",
      holder: "Titulaire du compte",
      reference: "Référence",
      giftMessage: "Message pour le cadeau",
      rsvpEnable: "Activer la confirmation de présence",
      rsvpHelp: "Le formulaire est ouvert de façon sécurisée via Youform.",
      rsvpUrl: "Lien Youform",
      websiteEnable: "Créer également un site de mariage",
      websiteHelp: "Après approbation de l'image, vous pourrez prévisualiser et publier le site sur EdgeOne.",
      photo: "Photo du couple",
      photoAdd: "Ajouter une photo du couple",
      photoHelp: "JPG, PNG ou WebP · 5 Mo maximum",
      websitePhotosLabel: "Photos pour le site",
      websitePhotosTitle: "Ajouter des photos du couple",
      websitePhotosHelp: "Jusqu'à 6 images · JPG, PNG ou WebP · 5 Mo maximum chacune",
      websitePhotosSelected: "photos sélectionnées",
      websitePhotosRemove: "Supprimer la photo",
      websitePhotosClear: "Tout supprimer",
      websitePhotosLimit: "Le site accepte 6 photos maximum.",
      websitePhotosInvalid: "Utilisez uniquement des photos JPG, PNG ou WebP.",
      submit: "Envoyer la demande",
      privacy: "Les données servent uniquement à préparer cette invitation.",
      preview: "Aperçu",
      previewText: "Une référence du style et des informations envoyées.",
      mode: "Mode",
      style: "Style",
      photography: "Photo",
      noPhoto: "Sans photo",
      digitalPdf: "Invitation numérique",
      location: "Lieu",
      gift: "Cadeau",
      attendance: "Confirmation",
      language: "Langue",
      defaultMessage: "Avec leurs familles, vous invitent à célébrer leur mariage.",
      publishWebsite: "Publier le site",
      openWebsite: "Ouvrir le site",
      previewWebsite: "Prévisualiser le site",
      websitePublishing: "Publication du site…",
      websiteReady: "Site publié",
      venuePlaceholder: "Lieu du mariage",
      mapsPlaceholder: "Collez le lien, saisissez le lieu ou laissez vide",
      holderPlaceholder: "Nom du titulaire",
      referencePlaceholder: "Cadeau de mariage",
      giftMessagePlaceholder: "Votre présence est le plus beau des cadeaux. Pour celles et ceux qui souhaitent contribuer, les informations figurent ci-dessous.",
      footer: "Atelier Vow · Portail d'invitations numériques",
    },
    de: {
      title: "Atelier Vow · Digitale Einladungen",
      privateAccess: "Privater Kundenzugang",
      eyebrow: "Eure Einladung, für euch gestaltet",
      heroTitle: "Eine schöne Einladung beginnt mit einer wahren Geschichte.",
      heroText: "Wählt einen Stil, ergänzt eure Hochzeitsdaten und sendet die Anfrage. Wir kümmern uns um den Rest.",
      start: "Jetzt beginnen",
      styles: "10 Stile ansehen",
      step1Title: "Stil auswählen",
      step1Text: "Eine Vorlage oder eine persönliche Gestaltung",
      step2Title: "Details ergänzen",
      step2Text: "Namen, Nachricht, Datum und Ort",
      step3Title: "Anfrage senden",
      step3Text: "Wir erhalten und erstellen die Einladung",
      createTitle: "Erstellt eure Einladung",
      createText: "Beginnt mit einem unserer Stile oder bestellt eine individuellere Einladung.",
      templateMode: "Vorlage auswählen",
      templateModeText: "Einen der 10 Stile als Grundlage verwenden.",
      customMode: "Persönlich gestalten",
      customModeText: "Von einem Stil inspirieren lassen und anpassen.",
      inspiration: "Inspiration auswählen",
      inspirationText: "Stile und Endinhalt richten sich nach der ausgewählten Sprache.",
      weddingDetails: "Hochzeitsdetails",
      weddingDetailsText: "Diese Angaben werden für die Einladung verwendet.",
      person1: "Erster Name",
      person2: "Zweiter Name",
      date: "Datum",
      time: "Uhrzeit",
      optional: "(optional)",
      venue: "Ort",
      maps: "Google-Maps-Link oder Ortsangabe",
      mapsHelp: "Wenn das Feld leer bleibt, suchen wir automatisch nach dem Ort.",
      message: "Einladungstext",
      messageHelp: "Bis zu 260 Zeichen.",
      giftIban: "IBAN für Geschenke",
      giftHelp: "Mit einer IBAN wird der Geschenkbereich aktiviert.",
      holder: "Kontoinhaber",
      reference: "Verwendungszweck",
      giftMessage: "Geschenktext",
      rsvpEnable: "Teilnahmebestätigung aktivieren",
      rsvpHelp: "Das Formular wird sicher über Youform geöffnet.",
      rsvpUrl: "Youform-Link",
      websiteEnable: "Zusätzlich eine Hochzeitswebsite erstellen",
      websiteHelp: "Nach Freigabe des Bildes könnt ihr die Website ansehen und auf EdgeOne veröffentlichen.",
      photo: "Paarfoto",
      photoAdd: "Paarfoto hinzufügen",
      photoHelp: "JPG, PNG oder WebP · maximal 5 MB",
      websitePhotosLabel: "Fotos für die Website",
      websitePhotosTitle: "Paarfotos hinzufügen",
      websitePhotosHelp: "Bis zu 6 Bilder · JPG, PNG oder WebP · jeweils maximal 5 MB",
      websitePhotosSelected: "Fotos ausgewählt",
      websitePhotosRemove: "Foto entfernen",
      websitePhotosClear: "Alle entfernen",
      websitePhotosLimit: "Die Website akzeptiert maximal 6 Fotos.",
      websitePhotosInvalid: "Verwendet nur JPG-, PNG- oder WebP-Fotos.",
      submit: "Anfrage senden",
      privacy: "Die Daten werden nur für diese Einladung verwendet.",
      preview: "Vorschau",
      previewText: "Eine Vorschau des Stils und der eingegebenen Daten.",
      mode: "Modus",
      style: "Stil",
      photography: "Foto",
      noPhoto: "Kein Foto",
      digitalPdf: "Digitale Einladung",
      location: "Ort",
      gift: "Geschenk",
      attendance: "Teilnahme",
      language: "Sprache",
      defaultMessage: "Gemeinsam mit ihren Familien laden sie euch ein, ihre Hochzeit zu feiern.",
      publishWebsite: "Website veröffentlichen",
      openWebsite: "Website öffnen",
      previewWebsite: "Website ansehen",
      websitePublishing: "Website wird veröffentlicht…",
      websiteReady: "Website veröffentlicht",
      venuePlaceholder: "Ort der Hochzeit",
      mapsPlaceholder: "Link einfügen, Ort eingeben oder leer lassen",
      holderPlaceholder: "Name des Kontoinhabers",
      referencePlaceholder: "Hochzeitsgeschenk",
      giftMessagePlaceholder: "Eure Anwesenheit ist das schönste Geschenk. Für alle, die etwas beitragen möchten, stehen die Angaben unten.",
      footer: "Atelier Vow · Portal für digitale Einladungen",
    },
  };

  const babyShowerCopy = {
    pt: {
      title: "Atelier Vow · Convites de baby shower",
      eyebrow: "O teu baby shower, à tua medida",
      heroTitle: "Um pequeno amor merece um convite inesquecível.",
      heroText: "Escolhe um estilo, adiciona os detalhes do baby shower e envia o pedido. Nós tratamos do resto.",
      createTitle: "Cria o convite de baby shower",
      createText: "Parte de um dos estilos existentes ou importa o teu próprio template.",
      detailsTitle: "Detalhes do baby shower",
      detailsText: "Estas informações serão usadas para criar o convite.",
      person1: "Nome da mãe / anfitriã",
      person2: "Nome do pai / segundo anfitrião",
      defaultMessage: "Um pequeno amor está a caminho. Junta-te a nós para celebrar este momento tão especial.",
      venuePlaceholder: "Local do baby shower",
      venueFallback: "Local do baby shower",
      person1Fallback: "Mãe",
      person2Fallback: "Família",
      person1Error: "Indica o nome da mãe ou anfitriã.",
      person2Error: "Indica o nome do pai ou segundo anfitrião.",
      locationError: "Indica o local do baby shower.",
      photo: "Fotografia da família",
      photoAdd: "Adicionar fotografia da família",
      websitePhotosLabel: "Fotografias para o website do baby shower",
      websitePhotosTitle: "Adicionar fotografias da família",
      websitePhotosHelp: "Até 6 imagens · JPG, PNG ou WebP · máximo 5 MB cada",
      websiteEnable: "Criar também um website do baby shower",
      websiteHelp: "Depois de aprovares a imagem, podes pré-visualizar e publicar o website.",
      generatedAlt: "Convite de baby shower de",
    },
    en: {
      title: "Atelier Vow · Baby shower invitations",
      eyebrow: "Your baby shower, made for you",
      heroTitle: "A little love deserves an unforgettable invitation.",
      heroText: "Choose a style, add the baby shower details and submit the request. We will take care of the rest.",
      createTitle: "Create the baby shower invitation",
      createText: "Start with an existing style or import your own template.",
      detailsTitle: "Baby shower details",
      detailsText: "This information will be used to create the invitation.",
      person1: "Mother / host name",
      person2: "Father / second host name",
      defaultMessage: "A little love is on the way. Join us to celebrate this very special moment.",
      venuePlaceholder: "Baby shower venue",
      venueFallback: "Baby shower venue",
      person1Fallback: "Mother",
      person2Fallback: "Family",
      person1Error: "Enter the mother or host name.",
      person2Error: "Enter the father or second host name.",
      locationError: "Enter the baby shower venue.",
      photo: "Family photo",
      photoAdd: "Add a family photo",
      websitePhotosLabel: "Baby shower website photos",
      websitePhotosTitle: "Add family photos",
      websitePhotosHelp: "Up to 6 images · JPG, PNG or WebP · maximum 5 MB each",
      websiteEnable: "Create a baby shower website as well",
      websiteHelp: "After approving the image, you can preview and publish the website.",
      generatedAlt: "Baby shower invitation for",
    },
    es: {
      title: "Atelier Vow · Invitaciones para baby shower",
      eyebrow: "Tu baby shower, hecho para ti",
      heroTitle: "Un pequeño amor merece una invitación inolvidable.",
      heroText: "Elige un estilo, añade los detalles del baby shower y envía la solicitud. Nosotros hacemos el resto.",
      createTitle: "Crea la invitación para el baby shower",
      createText: "Parte de un estilo existente o importa tu propia plantilla.",
      detailsTitle: "Detalles del baby shower",
      detailsText: "Usaremos esta información para crear la invitación.",
      person1: "Nombre de la madre / anfitriona",
      person2: "Nombre del padre / segundo anfitrión",
      defaultMessage: "Un pequeño amor está en camino. Acompáñanos a celebrar este momento tan especial.",
      venuePlaceholder: "Lugar del baby shower",
      venueFallback: "Lugar del baby shower",
      person1Fallback: "Madre",
      person2Fallback: "Familia",
      person1Error: "Indica el nombre de la madre o anfitriona.",
      person2Error: "Indica el nombre del padre o segundo anfitrión.",
      locationError: "Indica el lugar del baby shower.",
      photo: "Foto de la familia",
      photoAdd: "Añadir una foto de la familia",
      websitePhotosLabel: "Fotos para la web del baby shower",
      websitePhotosTitle: "Añadir fotos de la familia",
      websitePhotosHelp: "Hasta 6 imágenes · JPG, PNG o WebP · máximo 5 MB cada una",
      websiteEnable: "Crear también una web para el baby shower",
      websiteHelp: "Después de aprobar la imagen podrás previsualizar y publicar la web.",
      generatedAlt: "Invitación de baby shower de",
    },
    fr: {
      title: "Atelier Vow · Invitations de baby shower",
      eyebrow: "Votre baby shower, à votre image",
      heroTitle: "Un petit amour mérite une invitation inoubliable.",
      heroText: "Choisissez un style, ajoutez les détails du baby shower et envoyez la demande. Nous nous occupons du reste.",
      createTitle: "Créez l'invitation du baby shower",
      createText: "Partez d'un style existant ou importez votre propre modèle.",
      detailsTitle: "Détails du baby shower",
      detailsText: "Ces informations serviront à créer l'invitation.",
      person1: "Nom de la mère / hôte",
      person2: "Nom du père / deuxième hôte",
      defaultMessage: "Un petit amour est en route. Rejoignez-nous pour célébrer ce moment très spécial.",
      venuePlaceholder: "Lieu du baby shower",
      venueFallback: "Lieu du baby shower",
      person1Fallback: "Mère",
      person2Fallback: "Famille",
      person1Error: "Indiquez le nom de la mère ou de l'hôte.",
      person2Error: "Indiquez le nom du père ou du deuxième hôte.",
      locationError: "Indiquez le lieu du baby shower.",
      photo: "Photo de famille",
      photoAdd: "Ajouter une photo de famille",
      websitePhotosLabel: "Photos pour le site du baby shower",
      websitePhotosTitle: "Ajouter des photos de famille",
      websitePhotosHelp: "Jusqu'à 6 images · JPG, PNG ou WebP · 5 Mo maximum chacune",
      websiteEnable: "Créer également un site pour le baby shower",
      websiteHelp: "Après approbation de l'image, vous pourrez prévisualiser et publier le site.",
      generatedAlt: "Invitation de baby shower de",
    },
    de: {
      title: "Atelier Vow · Babyshower-Einladungen",
      eyebrow: "Eure Babyshower, für euch gestaltet",
      heroTitle: "Ein kleines Wunder verdient eine unvergessliche Einladung.",
      heroText: "Wählt einen Stil, ergänzt die Babyshower-Daten und sendet die Anfrage. Wir kümmern uns um den Rest.",
      createTitle: "Erstellt die Babyshower-Einladung",
      createText: "Beginnt mit einem vorhandenen Stil oder importiert eure eigene Vorlage.",
      detailsTitle: "Babyshower-Details",
      detailsText: "Diese Angaben werden für die Einladung verwendet.",
      person1: "Name der Mutter / Gastgeberin",
      person2: "Name des Vaters / zweiten Gastgebers",
      defaultMessage: "Ein kleines Wunder ist unterwegs. Feiert diesen ganz besonderen Moment mit uns.",
      venuePlaceholder: "Ort der Babyshower",
      venueFallback: "Ort der Babyshower",
      person1Fallback: "Mutter",
      person2Fallback: "Familie",
      person1Error: "Gebt den Namen der Mutter oder Gastgeberin an.",
      person2Error: "Gebt den Namen des Vaters oder zweiten Gastgebers an.",
      locationError: "Gebt den Ort der Babyshower an.",
      photo: "Familienfoto",
      photoAdd: "Familienfoto hinzufügen",
      websitePhotosLabel: "Fotos für die Babyshower-Website",
      websitePhotosTitle: "Familienfotos hinzufügen",
      websitePhotosHelp: "Bis zu 6 Bilder · JPG, PNG oder WebP · jeweils maximal 5 MB",
      websiteEnable: "Auch eine Babyshower-Website erstellen",
      websiteHelp: "Nach der Bildfreigabe könnt ihr die Website ansehen und veröffentlichen.",
      generatedAlt: "Babyshower-Einladung für",
    },
  };

  const weddingEventCopy = {
    pt: {
      person1Fallback: "Tomas",
      person2Fallback: "Rita",
      person1Error: "Indica o primeiro nome.",
      person2Error: "Indica o segundo nome.",
      locationError: "Indica o local do casamento.",
      generatedAlt: "Convite de casamento de",
    },
    en: {
      person1Fallback: "Alex",
      person2Fallback: "Taylor",
      person1Error: "Enter the first name.",
      person2Error: "Enter the second name.",
      locationError: "Enter the wedding venue.",
      generatedAlt: "Wedding invitation for",
    },
    es: {
      person1Fallback: "Alex",
      person2Fallback: "Taylor",
      person1Error: "Indica el primer nombre.",
      person2Error: "Indica el segundo nombre.",
      locationError: "Indica el lugar de la boda.",
      generatedAlt: "Invitación de boda de",
    },
    fr: {
      person1Fallback: "Alex",
      person2Fallback: "Taylor",
      person1Error: "Indiquez le premier prénom.",
      person2Error: "Indiquez le deuxième prénom.",
      locationError: "Indiquez le lieu du mariage.",
      generatedAlt: "Invitation de mariage de",
    },
    de: {
      person1Fallback: "Alex",
      person2Fallback: "Taylor",
      person1Error: "Gebt den ersten Namen an.",
      person2Error: "Gebt den zweiten Namen an.",
      locationError: "Gebt den Ort der Hochzeit an.",
      generatedAlt: "Hochzeitseinladung für",
    },
  };

  const templateBase = [
    ["editorial_photo", "Editorial Photo", "Photographic", "/assets/templates/01_editorial_photo.png"],
    ["greenery_icons", "Clean Greenery", "Botanical", "/assets/templates/02_greenery_icons.png"],
    ["sage_botanical", "Soft Sage", "Natural", "/assets/templates/03_sage_botanical.png"],
    ["minimal_church", "Minimal Church", "Classic", "/assets/templates/04_minimal_church.png"],
    ["ivory_silk", "Ivory & Silk", "Quiet luxury", "/assets/templates/05_ivory_silk.png"],
    ["blush_floral", "Blush Floral", "Romantic", "/assets/templates/06_blush_floral.png"],
    ["navy_gold", "Navy & Gold", "Contrast", "/assets/templates/07_navy_gold.png"],
    ["coastal_blue", "Coastal Blue", "Light", "/assets/templates/08_coastal_blue.png"],
    ["terracotta_boho", "Terracotta Boho", "Organic", "/assets/templates/09_terracotta_boho.png"],
    ["olive_minimal", "Minimal Olive", "Contemporary", "/assets/templates/10_olive_minimal.png"],
  ];

  const babyTemplateBase = [
    ["baby_clouds", "Little Cloud", "Soft sky and clouds", "/assets/templates/baby-shower/01_baby_clouds.png"],
    ["baby_teddy", "Teddy Welcome", "Warm teddy bear", "/assets/templates/baby-shower/02_baby_teddy.png"],
    ["baby_safari", "Tiny Safari", "Playful safari animals", "/assets/templates/baby-shower/03_baby_safari.png"],
    ["baby_bunny", "Sweet Bunny", "Delicate bunny", "/assets/templates/baby-shower/04_baby_bunny.png"],
    ["baby_moon", "Moon & Stars", "Dreamy celestial", "/assets/templates/baby-shower/05_baby_moon.png"],
    ["baby_balloons", "Baby Balloons", "Joyful balloons", "/assets/templates/baby-shower/06_baby_balloons.png"],
    ["baby_blossom", "Baby Blossom", "Elegant florals", "/assets/templates/baby-shower/07_baby_blossom.png"],
    ["baby_rainbow", "Little Rainbow", "Modern pastel rainbow", "/assets/templates/baby-shower/08_baby_rainbow.png"],
    ["baby_blue", "Blue Dreams", "Classic blue nursery", "/assets/templates/baby-shower/09_baby_blue.png"],
    ["baby_neutral", "Neutral Nest", "Minimal neutral", "/assets/templates/baby-shower/10_baby_neutral.png"],
  ];

  const localizedTemplates = {
    pt: [
      ["Editorial Foto", "Fotográfico"], ["Folhagem Clean", "Botânico"], ["Sálvia Suave", "Natural"],
      ["Igreja Minimal", "Clássico"], ["Marfim & Seda", "Luxo discreto"], ["Blush Floral", "Romântico"],
      ["Noite Dourada", "Contraste"], ["Costa Azul", "Leve"], ["Terracota Boho", "Orgânico"], ["Oliva Minimal", "Contemporâneo"],
    ],
    es: [
      ["Editorial Fotográfico", "Fotográfico"], ["Verde Limpio", "Botánico"], ["Salvia Suave", "Natural"],
      ["Iglesia Minimal", "Clásico"], ["Marfil y Seda", "Lujo discreto"], ["Floral Rosa", "Romántico"],
      ["Noche Dorada", "Contraste"], ["Azul Costero", "Ligero"], ["Terracota Boho", "Orgánico"], ["Oliva Minimal", "Contemporáneo"],
    ],
    fr: [
      ["Éditorial Photo", "Photographique"], ["Feuillage Épuré", "Botanique"], ["Sauge Douce", "Naturel"],
      ["Église Minimaliste", "Classique"], ["Ivoire & Soie", "Luxe discret"], ["Fleurs Poudrées", "Romantique"],
      ["Nuit Dorée", "Contraste"], ["Bleu Littoral", "Léger"], ["Terracotta Bohème", "Organique"], ["Olive Minimaliste", "Contemporain"],
    ],
    de: [
      ["Foto Editorial", "Fotografisch"], ["Klares Grün", "Botanisch"], ["Sanfter Salbei", "Natürlich"],
      ["Minimalistische Kirche", "Klassisch"], ["Elfenbein & Seide", "Dezenter Luxus"], ["Blütenrosa", "Romantisch"],
      ["Goldene Nacht", "Kontrast"], ["Küstenblau", "Leicht"], ["Terrakotta Boho", "Organisch"], ["Olive Minimal", "Zeitgemäß"],
    ],
  };

  function normalize(value, fallback) {
    const locale = String(value || "").toLowerCase().replace("_", "-").split("-")[0];
    return supported.includes(locale) ? locale : (fallback || "en");
  }

  function explicitLocale() {
    return new URLSearchParams(location.search).get("lang");
  }

  function storedLocale() {
    try { return localStorage.getItem("atelier-vow-language"); } catch { return ""; }
  }

  let locale = normalize(explicitLocale() || storedLocale() || navigator.language, "en");
  let onChange = null;

  function t(key) {
    return (copy[locale] && copy[locale][key]) || copy.en[key] || key;
  }

  function getTemplates(eventType = "wedding", selectedLocale) {
    const language = normalize(selectedLocale || locale);
    const labels = eventType === "wedding" ? (localizedTemplates[language] || null) : null;
    const source = eventType === "baby_shower" ? babyTemplateBase : templateBase;
    return source.map((item, index) => ({
      id: item[0],
      name: labels ? labels[index][0] : item[1],
      mood: labels ? labels[index][1] : item[2],
      image: item[3],
      language,
    }));
  }

  function getEventUi(eventType = "wedding") {
    if (eventType === "baby_shower") {
      return {
        photoHelp: t("photoHelp"),
        websitePhotosSelected: t("websitePhotosSelected"),
        websitePhotosRemove: t("websitePhotosRemove"),
        websitePhotosClear: t("websitePhotosClear"),
        websitePhotosLimit: t("websitePhotosLimit"),
        websitePhotosInvalid: t("websitePhotosInvalid"),
        ...(babyShowerCopy[locale] || babyShowerCopy.en),
      };
    }
    return {
      title: t("title"),
      eyebrow: t("eyebrow"),
      heroTitle: t("heroTitle"),
      heroText: t("heroText"),
      createTitle: t("createTitle"),
      createText: t("createText"),
      detailsTitle: t("weddingDetails"),
      detailsText: t("weddingDetailsText"),
      person1: t("person1"),
      person2: t("person2"),
      defaultMessage: t("defaultMessage"),
      venuePlaceholder: t("venuePlaceholder"),
      venueFallback: t("venuePlaceholder"),
      ...(weddingEventCopy[locale] || weddingEventCopy.en),
      photo: t("photo"),
      photoAdd: t("photoAdd"),
      photoHelp: t("photoHelp"),
      websitePhotosLabel: t("websitePhotosLabel"),
      websitePhotosTitle: t("websitePhotosTitle"),
      websitePhotosHelp: t("websitePhotosHelp"),
      websitePhotosSelected: t("websitePhotosSelected"),
      websitePhotosRemove: t("websitePhotosRemove"),
      websitePhotosClear: t("websitePhotosClear"),
      websitePhotosLimit: t("websitePhotosLimit"),
      websitePhotosInvalid: t("websitePhotosInvalid"),
      websiteEnable: t("websiteEnable"),
      websiteHelp: t("websiteHelp"),
    };
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.textContent = value;
  }

  function setPlaceholder(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute("placeholder", value);
  }

  function setLabel(inputId, key, optional) {
    setLabelValue(inputId, t(key), optional);
  }

  function setLabelValue(inputId, value, optional) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    if (!label) return;
    label.replaceChildren(document.createTextNode(value));
    if (optional) {
      label.append(" ");
      const small = document.createElement("small");
      small.textContent = t("optional");
      label.append(small);
    }
  }

  function applyEventType(eventType = "wedding", options) {
    const normalizedEventType = eventType === "baby_shower" ? "baby_shower" : "wedding";
    const eventUi = getEventUi(normalizedEventType);
    document.title = eventUi.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", eventUi.heroText);
    setText(".hero-copy .eyebrow", eventUi.eyebrow);
    setText(".hero-copy h1", eventUi.heroTitle);
    setText(".hero-copy > p", eventUi.heroText);
    setText(".panel .panel-header h2", eventUi.createTitle);
    setText(".panel .panel-header p", eventUi.createText);
    const sectionRows = document.querySelectorAll("#templates .section-title-row");
    if (sectionRows[1]) {
      sectionRows[1].querySelector("h3").textContent = eventUi.detailsTitle;
      sectionRows[1].querySelector("p").textContent = eventUi.detailsText;
    }
    setLabelValue("person1", eventUi.person1);
    setLabelValue("person2", eventUi.person2);
    setText("#websiteEnabledLabel", eventUi.websiteEnable);
    setText("#websiteEnabledHelp", eventUi.websiteHelp);
    setLabelValue("websitePhotos", eventUi.websitePhotosLabel, true);
    setText("#websitePhotosTitle", eventUi.websitePhotosTitle);
    setText("#websitePhotosSubtitle", eventUi.websitePhotosHelp);
    setText("#websitePhotosClear", eventUi.websitePhotosClear);
    setPlaceholder("#location", eventUi.venuePlaceholder);
    setPlaceholder("#message", eventUi.defaultMessage);

    const photoInput = document.getElementById("photo");
    const photoLabel = photoInput && photoInput.closest(".field") && photoInput.closest(".field").querySelector("label");
    if (photoLabel) {
      photoLabel.replaceChildren(document.createTextNode(eventUi.photo), document.createTextNode(" "));
      const optional = document.createElement("small");
      optional.textContent = t("optional");
      photoLabel.append(optional);
    }
    const photoPreview = document.getElementById("photoPreview");
    if (!photoPreview?.classList.contains("visible")) {
      setText("#photoTitle", eventUi.photoAdd);
      setText("#photoSubtitle", eventUi.photoHelp);
    }

    const person1Error = document.getElementById("person1")?.closest(".field")?.querySelector(".error-text");
    const person2Error = document.getElementById("person2")?.closest(".field")?.querySelector(".error-text");
    const locationError = document.getElementById("location")?.closest(".field")?.querySelector(".error-text");
    if (person1Error) person1Error.textContent = eventUi.person1Error;
    if (person2Error) person2Error.textContent = eventUi.person2Error;
    if (locationError) locationError.textContent = eventUi.locationError;

    if (options && options.resetDefaultMessage) {
      const message = document.getElementById("message");
      if (message) message.value = eventUi.defaultMessage;
    }
    return eventUi;
  }

  function applyStatic() {
    document.documentElement.lang = localeTags[locale];
    document.title = t("title");
    setText(".top-note", t("privateAccess"));
    setText(".hero-copy .eyebrow", t("eyebrow"));
    setText(".hero-copy h1", t("heroTitle"));
    setText(".hero-copy > p", t("heroText"));
    setText('.hero-actions a[href="#create"]', t("start"));
    setText('.hero-actions a[href="#templates"]', t("styles"));
    const steps = document.querySelectorAll(".step");
    [[t("step1Title"), t("step1Text")], [t("step2Title"), t("step2Text")], [t("step3Title"), t("step3Text")]].forEach((values, index) => {
      if (!steps[index]) return;
      const strong = steps[index].querySelector("strong");
      if (strong) strong.textContent = values[0];
      const span = steps[index].querySelector("span:last-child");
      if (span) {
        const text = [...span.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
        if (text) text.nodeValue = values[1];
      }
    });
    const panelHeaders = document.querySelectorAll(".panel-header");
    if (panelHeaders[0]) {
      setText(".panel .panel-header h2", t("createTitle"));
      setText(".panel .panel-header p", t("createText"));
    }
    if (panelHeaders[1]) {
      panelHeaders[1].querySelector("h2").textContent = t("preview");
      panelHeaders[1].querySelector("p").textContent = t("previewText");
    }
    const modeButtons = document.querySelectorAll(".mode-button");
    if (modeButtons[0]) { modeButtons[0].querySelector("strong").textContent = t("templateMode"); replaceTail(modeButtons[0], t("templateModeText")); }
    if (modeButtons[1]) { modeButtons[1].querySelector("strong").textContent = t("customMode"); replaceTail(modeButtons[1], t("customModeText")); }
    const sectionRows = document.querySelectorAll("#templates .section-title-row");
    if (sectionRows[0]) { sectionRows[0].querySelector("h3").textContent = t("inspiration"); sectionRows[0].querySelector("p").textContent = t("inspirationText"); }
    if (sectionRows[1]) { sectionRows[1].querySelector("h3").textContent = t("weddingDetails"); sectionRows[1].querySelector("p").textContent = t("weddingDetailsText"); }
    setLabel("person1", "person1");
    setLabel("person2", "person2");
    setLabel("date", "date");
    setLabel("time", "time", true);
    setLabel("location", "venue");
    setLabel("mapsUrl", "maps", true);
    setLabel("message", "message");
    setLabel("giftIban", "giftIban", true);
    setLabel("giftHolder", "holder", true);
    setLabel("giftReference", "reference", true);
    setLabel("giftMessage", "giftMessage", true);
    setLabel("attendanceUrl", "rsvpUrl", true);
    setText("#attendanceEnabledLabel", t("rsvpEnable"));
    setText("#attendanceEnabledHelp", t("rsvpHelp"));
    setText("#websiteEnabledLabel", t("websiteEnable"));
    setText("#websiteEnabledHelp", t("websiteHelp"));
    setText("#mapsUrl + small", t("mapsHelp"));
    setText("#message + small", t("messageHelp"));
    setText("#giftIban + small", t("giftHelp"));
    setText("#attendanceUrl + small", t("rsvpHelp"));
    setText("#photoTitle", t("photoAdd"));
    setText("#photoSubtitle", t("photoHelp"));
    setText(".privacy-note", t("privacy"));
    setText(".submit-button", t("submit"));
    setText(".app-shell > .footer", t("footer"));
    setPlaceholder("#location", t("venuePlaceholder"));
    setPlaceholder("#mapsUrl", t("mapsPlaceholder"));
    setPlaceholder("#message", t("defaultMessage"));
    setPlaceholder("#giftHolder", t("holderPlaceholder"));
    setPlaceholder("#giftReference", t("referencePlaceholder"));
    setPlaceholder("#giftMessage", t("giftMessagePlaceholder"));
    setPlaceholder("#attendanceUrl", "https://app.youform.com/forms/...");
    const metaLabels = document.querySelectorAll(".preview-meta-row span");
    [t("mode"), t("style"), t("photography"), t("digitalPdf")].forEach((value, index) => { if (metaLabels[index]) metaLabels[index].textContent = value; });
    setText("#previewPhotoState", t("noPhoto"));
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.setAttribute("aria-label", t("language"));
    const selectedEventType = document.getElementById("eventType")?.value || "wedding";
    applyEventType(selectedEventType);
  }

  function replaceTail(button, value) {
    const text = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
    if (text) text.nodeValue = `\n            ${value}\n          `;
  }

  function installSelector() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("languageSelect")) return;
    const wrap = document.createElement("label");
    wrap.className = "language-select-wrap";
    const select = document.createElement("select");
    select.id = "languageSelect";
    select.className = "language-select";
    select.innerHTML = supported.map((item) => `<option value="${item}">${languageNames[item]}</option>`).join("");
    select.value = locale;
    select.addEventListener("change", () => setLocale(select.value, true));
    wrap.append(select);
    topbar.append(wrap);
  }

  function setLocale(value, persist) {
    const next = normalize(value, locale);
    if (next === locale && document.documentElement.lang === localeTags[next]) return;
    const message = document.getElementById("message");
    const oldDefaults = [
      ...Object.values(copy).map((entry) => entry.defaultMessage),
      ...Object.values(babyShowerCopy).map((entry) => entry.defaultMessage),
    ];
    const shouldReplaceMessage = message && (!message.value.trim() || oldDefaults.includes(message.value.trim()));
    locale = next;
    if (persist) {
      try { localStorage.setItem("atelier-vow-language", locale); } catch {}
      const url = new URL(location.href);
      url.searchParams.set("lang", locale);
      history.replaceState(null, "", url);
    }
    const select = document.getElementById("languageSelect");
    if (select) select.value = locale;
    applyStatic();
    if (shouldReplaceMessage) {
      const selectedEventType = document.getElementById("eventType")?.value || "wedding";
      message.value = getEventUi(selectedEventType).defaultMessage;
    }
    if (typeof onChange === "function") onChange(locale);
  }

  async function resolveServerLocale() {
    if (explicitLocale() || storedLocale()) return;
    try {
      const response = await fetch("/api/client/bootstrap", { cache: "no-store" });
      const body = await response.json();
      if (body.success && body.data && body.data.locale) setLocale(body.data.locale, false);
    } catch {
      // Browser language remains the safe fallback.
    }
  }

  function mount(options) {
    onChange = options && options.onChange;
    installSelector();
    applyStatic();
    resolveServerLocale();
  }

  window.WeddingI18n = {
    mount,
    t,
    getTemplates,
    getEventUi,
    applyEventType,
    get locale() { return locale; },
    localeTag() { return localeTags[locale]; },
    setLocale,
  };
}());
