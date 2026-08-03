(function () {
  "use strict";

  const supported = ["pt", "en", "es", "fr", "de"];
  const localeTags = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE" };
  const languageNames = { pt: "Português", en: "English", es: "Español", fr: "Français", de: "Deutsch" };

  const copy = {
    pt: {
      title: "InviteLab · Convites digitais",
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
      customMode: "Importar template personalizado",
      customModeText: "Carrega a imagem do teu próprio template.",
      inspiration: "Escolhe a inspiração",
      inspirationText: "No modo personalizado esta escolha é opcional.",
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
      rsvpEnable: "Ativar confirmação de presença",
      rsvpHelp: "O formulário abre de forma segura através da Youform.",
      rsvpUrl: "Link da Youform",
      websiteEnable: "Criar também um website do casamento",
      websiteHelp: "Depois de aprovares a imagem, podes pré-visualizar e publicar o site no teu link InviteLab.",
      photo: "Fotografia do casal",
      photoAdd: "Adicionar fotografia do casal",
      photoHelp: "JPG, PNG ou WebP · máximo 20 MB · compressão automática",
      invalidImage: "Escolhe uma imagem JPG, PNG ou WebP.",
      fileTooLarge: "{label}: o ficheiro “{name}” tem {size} MB e excede o limite de {limit} MB.",
      imageReadFailed: "Não foi possível ler “{name}”. Tenta outro ficheiro JPG, PNG ou WebP.",
      imagePrepareFailed: "Não foi possível preparar “{name}” para envio.",
      imageDimensionsFailed: "Não foi possível confirmar as dimensões de “{name}”.",
      browserImageFailed: "O browser não conseguiu preparar “{name}”.",
      compressedStillLarge: "{label}: “{name}” continua acima do limite depois da compressão automática. Usa uma imagem com menos resolução.",
      preparingPhoto: "A preparar {label}…",
      convertingPhoto: "A comprimir e converter para JPG compatível",
      jpgReady: "JPG pronto",
      added: "Adicionada",
      optionalState: "Opcional",
      customTemplateLabel: "template personalizado",
      couplePhotoLabel: "fotografia do casal",
      websitePhotoLabel: "fotografia do website",
      websitePhotosLabel: "Fotografias para o website",
      websitePhotosTitle: "Adicionar fotografias do casal",
      websitePhotosHelp: "Até 5 imagens · JPG, PNG ou WebP · máximo 20 MB · compressão automática cada",
      websitePhotosSelected: "fotografias selecionadas",
      websitePhotosRemove: "Remover fotografia",
      websitePhotosClear: "Remover todas",
      websitePhotosLimit: "O website aceita um máximo de 5 fotografias.",
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
      attendance: "Confirmação",
      language: "Idioma",
      defaultMessage: "Juntamente com as suas famílias, convidam para celebrar o seu casamento.",
      publishWebsite: "Publicar website",
      openWebsite: "Abrir Website",
      previewWebsite: "Pré-visualizar website",
      websitePublishing: "A publicar website…",
      websiteReady: "Website publicado",
      venuePlaceholder: "Quinta ou local do casamento",
      mapsPlaceholder: "Cola o link, escreve o local ou deixa vazio",
      footer: "InviteLab · Convites digitais feitos para a tua história",
    },
    en: {
      title: "InviteLab · Digital invitations",
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
      customMode: "Import a custom template",
      customModeText: "Upload an image of your own template.",
      inspiration: "Choose your inspiration",
      inspirationText: "This choice is optional in custom-template mode.",
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
      rsvpEnable: "Enable RSVP",
      rsvpHelp: "The RSVP form opens securely through Youform.",
      rsvpUrl: "Youform link",
      websiteEnable: "Create a wedding website as well",
      websiteHelp: "After approving the image, you can preview and publish it on your InviteLab link.",
      photo: "Couple photo",
      photoAdd: "Add a couple photo",
      photoHelp: "JPG, PNG or WebP · maximum 20 MB · automatic compression",
      invalidImage: "Choose a JPG, PNG or WebP image.",
      fileTooLarge: "{label}: “{name}” is {size} MB and exceeds the {limit} MB limit.",
      imageReadFailed: "We could not read “{name}”. Try another JPG, PNG or WebP file.",
      imagePrepareFailed: "We could not prepare “{name}” for upload.",
      imageDimensionsFailed: "We could not confirm the dimensions of “{name}”.",
      browserImageFailed: "Your browser could not prepare “{name}”.",
      compressedStillLarge: "{label}: “{name}” is still over the limit after automatic compression. Use a lower-resolution image.",
      preparingPhoto: "Preparing {label}…",
      convertingPhoto: "Compressing and converting to a compatible JPG",
      jpgReady: "JPG ready",
      added: "Added",
      optionalState: "Optional",
      customTemplateLabel: "custom template",
      couplePhotoLabel: "couple photo",
      websitePhotoLabel: "website photo",
      websitePhotosLabel: "Website photos",
      websitePhotosTitle: "Add couple photos",
      websitePhotosHelp: "Up to 5 images · JPG, PNG or WebP · maximum 20 MB · automatic compression each",
      websitePhotosSelected: "photos selected",
      websitePhotosRemove: "Remove photo",
      websitePhotosClear: "Remove all",
      websitePhotosLimit: "The website accepts a maximum of 5 photos.",
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
      footer: "InviteLab · Digital invitations made for your story",
    },
    es: {
      title: "InviteLab · Invitaciones digitales",
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
      customMode: "Importar una plantilla personalizada",
      customModeText: "Sube la imagen de tu propia plantilla.",
      inspiration: "Elige la inspiración",
      inspirationText: "Esta elección es opcional en el modo de plantilla personalizada.",
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
      rsvpEnable: "Activar confirmación de asistencia",
      rsvpHelp: "El formulario se abre de forma segura a través de Youform.",
      rsvpUrl: "Enlace de Youform",
      websiteEnable: "Crear también una web de la boda",
      websiteHelp: "Después de aprobar la imagen podrás previsualizar y publicar la web en tu enlace de InviteLab.",
      photo: "Foto de la pareja",
      photoAdd: "Añadir una foto de la pareja",
      photoHelp: "JPG, PNG o WebP · máximo 20 MB · compresión automática",
      invalidImage: "Elige una imagen JPG, PNG o WebP.",
      fileTooLarge: "{label}: el archivo “{name}” ocupa {size} MB y supera el límite de {limit} MB.",
      imageReadFailed: "No pudimos leer “{name}”. Prueba con otro archivo JPG, PNG o WebP.",
      imagePrepareFailed: "No pudimos preparar “{name}” para enviarlo.",
      imageDimensionsFailed: "No pudimos confirmar las dimensiones de “{name}”.",
      browserImageFailed: "El navegador no pudo preparar “{name}”.",
      compressedStillLarge: "{label}: “{name}” sigue superando el límite después de la compresión automática. Usa una imagen de menor resolución.",
      preparingPhoto: "Preparando {label}…",
      convertingPhoto: "Comprimiendo y convirtiendo a JPG compatible",
      jpgReady: "JPG listo",
      added: "Añadida",
      optionalState: "Opcional",
      customTemplateLabel: "plantilla personalizada",
      couplePhotoLabel: "foto de la pareja",
      websitePhotoLabel: "foto del sitio web",
      websitePhotosLabel: "Fotos para la web",
      websitePhotosTitle: "Añadir fotos de la pareja",
      websitePhotosHelp: "Hasta 5 imágenes · JPG, PNG o WebP · máximo 20 MB · compresión automática cada una",
      websitePhotosSelected: "fotos seleccionadas",
      websitePhotosRemove: "Eliminar foto",
      websitePhotosClear: "Eliminar todas",
      websitePhotosLimit: "La web admite un máximo de 5 fotos.",
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
      footer: "InviteLab · Invitaciones digitales hechas para tu historia",
    },
    fr: {
      title: "InviteLab · Invitations numériques",
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
      customMode: "Importer un modèle personnalisé",
      customModeText: "Importez l'image de votre propre modèle.",
      inspiration: "Choisissez l'inspiration",
      inspirationText: "Ce choix est facultatif en mode modèle personnalisé.",
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
      rsvpEnable: "Activer la confirmation de présence",
      rsvpHelp: "Le formulaire est ouvert de façon sécurisée via Youform.",
      rsvpUrl: "Lien Youform",
      websiteEnable: "Créer également un site de mariage",
      websiteHelp: "Après approbation de l'image, vous pourrez prévisualiser et publier le site sur votre lien InviteLab.",
      photo: "Photo du couple",
      photoAdd: "Ajouter une photo du couple",
      photoHelp: "JPG, PNG ou WebP · 20 Mo maximum · compression automatique",
      invalidImage: "Choisissez une image JPG, PNG ou WebP.",
      fileTooLarge: "{label} : le fichier « {name} » pèse {size} Mo et dépasse la limite de {limit} Mo.",
      imageReadFailed: "Impossible de lire « {name} ». Essayez un autre fichier JPG, PNG ou WebP.",
      imagePrepareFailed: "Impossible de préparer « {name} » pour l’envoi.",
      imageDimensionsFailed: "Impossible de confirmer les dimensions de « {name} ».",
      browserImageFailed: "Le navigateur n’a pas pu préparer « {name} ».",
      compressedStillLarge: "{label} : « {name} » dépasse encore la limite après la compression automatique. Utilisez une image de résolution inférieure.",
      preparingPhoto: "Préparation de {label}…",
      convertingPhoto: "Compression et conversion en JPG compatible",
      jpgReady: "JPG prêt",
      added: "Ajoutée",
      optionalState: "Facultatif",
      customTemplateLabel: "modèle personnalisé",
      couplePhotoLabel: "photo du couple",
      websitePhotoLabel: "photo du site",
      websitePhotosLabel: "Photos pour le site",
      websitePhotosTitle: "Ajouter des photos du couple",
      websitePhotosHelp: "Jusqu'à 5 images · JPG, PNG ou WebP · 20 Mo maximum · compression automatique chacune",
      websitePhotosSelected: "photos sélectionnées",
      websitePhotosRemove: "Supprimer la photo",
      websitePhotosClear: "Tout supprimer",
      websitePhotosLimit: "Le site accepte 5 photos maximum.",
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
      footer: "InviteLab · Invitations numériques créées pour votre histoire",
    },
    de: {
      title: "InviteLab · Digitale Einladungen",
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
      customMode: "Eigene Vorlage importieren",
      customModeText: "Ladet ein Bild eurer eigenen Vorlage hoch.",
      inspiration: "Inspiration auswählen",
      inspirationText: "Im Modus für eigene Vorlagen ist diese Auswahl optional.",
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
      rsvpEnable: "Teilnahmebestätigung aktivieren",
      rsvpHelp: "Das Formular wird sicher über Youform geöffnet.",
      rsvpUrl: "Youform-Link",
      websiteEnable: "Zusätzlich eine Hochzeitswebsite erstellen",
      websiteHelp: "Nach Freigabe könnt ihr die Website ansehen und über euren InviteLab-Invites-Link veröffentlichen.",
      photo: "Paarfoto",
      photoAdd: "Paarfoto hinzufügen",
      photoHelp: "JPG, PNG oder WebP · maximal 20 MB · automatische Komprimierung",
      invalidImage: "Wählt ein JPG-, PNG- oder WebP-Bild aus.",
      fileTooLarge: "{label}: „{name}“ ist {size} MB groß und überschreitet das Limit von {limit} MB.",
      imageReadFailed: "„{name}“ konnte nicht gelesen werden. Versucht eine andere JPG-, PNG- oder WebP-Datei.",
      imagePrepareFailed: "„{name}“ konnte nicht für den Upload vorbereitet werden.",
      imageDimensionsFailed: "Die Abmessungen von „{name}“ konnten nicht geprüft werden.",
      browserImageFailed: "Der Browser konnte „{name}“ nicht vorbereiten.",
      compressedStillLarge: "{label}: „{name}“ liegt auch nach der automatischen Komprimierung über dem Limit. Verwendet ein Bild mit geringerer Auflösung.",
      preparingPhoto: "{label} wird vorbereitet…",
      convertingPhoto: "Komprimierung und Konvertierung in kompatibles JPG",
      jpgReady: "JPG bereit",
      added: "Hinzugefügt",
      optionalState: "Optional",
      customTemplateLabel: "benutzerdefinierte Vorlage",
      couplePhotoLabel: "Paarfoto",
      websitePhotoLabel: "Website-Foto",
      websitePhotosLabel: "Fotos für die Website",
      websitePhotosTitle: "Paarfotos hinzufügen",
      websitePhotosHelp: "Bis zu 5 Bilder · JPG, PNG oder WebP · jeweils maximal 20 MB · automatische Komprimierung",
      websitePhotosSelected: "Fotos ausgewählt",
      websitePhotosRemove: "Foto entfernen",
      websitePhotosClear: "Alle entfernen",
      websitePhotosLimit: "Die Website akzeptiert maximal 5 Fotos.",
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
      footer: "InviteLab · Digitale Einladungen für eure Geschichte",
    },
  };


  // Exact UI translations cover text that is rendered outside the main selector-based copy.
  // Values are keyed by the original Portuguese wording and can also be translated again
  // after the visitor changes language because aliases are registered for every locale.
  const exactTextRows = [
    ["Digital · clean · personalizado", "Digital · clean · personalised", "Digital · limpio · personalizado", "Numérique · épuré · personnalisé", "Digital · klar · personalisiert"],
    ["Feito para guardar.", "Made to keep.", "Hecha para guardar.", "Conçue pour être conservée.", "Zum Aufbewahren gemacht."],
    ["Pensado para partilhar.", "Designed to share.", "Pensada para compartir.", "Pensée pour être partagée.", "Zum Teilen gestaltet."],
    ["Um processo simples, mesmo a partir do telemóvel.", "A simple process, even from your phone.", "Un proceso sencillo, incluso desde el móvil.", "Un processus simple, même depuis votre téléphone.", "Ein einfacher Ablauf, auch vom Smartphone aus."],
    ["O produto que compraste", "Your purchased product", "El producto que compraste", "Le produit que vous avez acheté", "Euer gekauftes Produkt"],
    ["Template personalizado", "Custom template", "Plantilla personalizada", "Modèle personnalisé", "Eigene Vorlage"],
    ["Adicionar imagem do template", "Add template image", "Añadir imagen de la plantilla", "Ajouter l’image du modèle", "Vorlagenbild hinzufügen"],
    ["Seleciona a data.", "Select the date.", "Selecciona la fecha.", "Sélectionnez la date.", "Wählt das Datum aus."],
    ["Usaremos o formulário predefinido do servidor quando este campo ficar vazio.", "We will use the server’s default form when this field is empty.", "Usaremos el formulario predeterminado del servidor si este campo queda vacío.", "Nous utiliserons le formulaire par défaut du serveur si ce champ reste vide.", "Wenn dieses Feld leer bleibt, verwenden wir das Standardformular des Servers."],
    ["Ao enviar, os dados serão usados apenas para preparar o convite deste pedido. Podes manter esta página aberta enquanto processamos.", "Your data will only be used to prepare this invitation. You may keep this page open while we process it.", "Los datos solo se usarán para preparar esta invitación. Puedes mantener esta página abierta mientras la procesamos.", "Les données serviront uniquement à préparer cette invitation. Vous pouvez garder cette page ouverte pendant le traitement.", "Die Daten werden nur zur Erstellung dieser Einladung verwendet. Ihr könnt die Seite während der Verarbeitung geöffnet lassen."],
    ["Testar imagem local (sem gerar)", "Test local image (without generating)", "Probar imagen local (sin generar)", "Tester une image locale (sans générer)", "Lokales Bild testen (ohne Generierung)"],
    ["Disponível apenas neste servidor local. Usa os restantes dados deste formulário.", "Available only on this local server. It uses the remaining data in this form.", "Disponible solo en este servidor local. Usa los demás datos del formulario.", "Disponible uniquement sur ce serveur local. Les autres données de ce formulaire seront utilisées.", "Nur auf diesem lokalen Server verfügbar. Die übrigen Formulardaten werden verwendet."],
    ["Template selecionado", "Selected template", "Plantilla seleccionada", "Modèle sélectionné", "Ausgewählte Vorlage"],
    ["Fotografia carregada", "Uploaded photo", "Foto subida", "Photo importée", "Hochgeladenes Foto"],
    ["Progresso", "Progress", "Progreso", "Progression", "Fortschritt"],
    ["Aprovação", "Approval", "Aprobación", "Approbation", "Freigabe"],
    ["Editável", "Editable", "Editable", "Modifiable", "Bearbeitbar"],
    ["A validar as informações…", "Validating the information…", "Validando la información…", "Validation des informations…", "Angaben werden geprüft…"],
    ["O convite está a ganhar forma", "Your invitation is taking shape", "La invitación está tomando forma", "L’invitation prend forme", "Die Einladung nimmt Form an"],
    ["A primeira pré-visualização aparece assim que estiver disponível.", "The first preview will appear as soon as it is available.", "La primera vista previa aparecerá en cuanto esté disponible.", "Le premier aperçu apparaîtra dès qu’il sera disponible.", "Die erste Vorschau erscheint, sobald sie verfügbar ist."],
    ["Link guardado:", "Saved link:", "Enlace guardado:", "Lien enregistré :", "Gespeicherter Link:"],
    ["abrir estado do pedido", "open project status", "abrir estado del pedido", "ouvrir l’état de la demande", "Projektstatus öffnen"],
    ["Descarregar imagem", "Download image", "Descargar imagen", "Télécharger l’image", "Bild herunterladen"],
    ["Aprovar", "Approve", "Aprobar", "Approuver", "Bestätigen"],
    ["Gerar PDF", "Create PDF", "Generar PDF", "Créer le PDF", "PDF erstellen"],
    ["Abrir no Canva", "Open in Canva", "Abrir en Canva", "Ouvrir dans Canva", "In Canva öffnen"],
    ["Tentar criar link Canva novamente", "Try creating the Canva link again", "Intentar crear de nuevo el enlace de Canva", "Réessayer de créer le lien Canva", "Canva-Link erneut erstellen"],
    ["Link do pedido", "Project link", "Enlace del pedido", "Lien de la demande", "Projektlink"],
    ["Voltar ao editor", "Back to editor", "Volver al editor", "Retour à l’éditeur", "Zurück zum Editor"],
    ["O que queres gerar novamente?", "What would you like to regenerate?", "¿Qué quieres volver a generar?", "Que souhaitez-vous régénérer ?", "Was möchtet ihr neu erstellen?"],
    ["Escolhe apenas a peça que queres alterar. A outra versão fica guardada enquanto preparamos a nova.", "Choose only the item you want to change. The other version remains saved while we prepare the new one.", "Elige solo la pieza que quieres cambiar. La otra versión permanecerá guardada mientras preparamos la nueva.", "Choisissez uniquement l’élément à modifier. L’autre version reste enregistrée pendant la préparation de la nouvelle.", "Wählt nur den Teil aus, den ihr ändern möchtet. Die andere Version bleibt während der Erstellung gespeichert."],
    ["Escolhe esta opção para refazer o convite.", "Choose this option to regenerate the invitation.", "Elige esta opción para volver a generar la invitación.", "Choisissez cette option pour régénérer l’invitation.", "Wählt diese Option, um die Einladung neu zu erstellen."],
    ["Escolhe esta opção para refazer o envelope.", "Choose this option to regenerate the envelope.", "Elige esta opción para volver a generar el sobre.", "Choisissez cette option pour régénérer l’enveloppe.", "Wählt diese Option, um den Umschlag neu zu erstellen."],
    ["O que queres alterar?", "What would you like to change?", "¿Qué quieres cambiar?", "Que souhaitez-vous modifier ?", "Was möchtet ihr ändern?"],
    ["Máximo 240 caracteres. Esta nota é usada apenas como orientação visual.", "Maximum 240 characters. This note is used only as visual guidance.", "Máximo 240 caracteres. Esta nota solo se usa como orientación visual.", "240 caractères maximum. Cette note sert uniquement d’indication visuelle.", "Maximal 240 Zeichen. Dieser Hinweis dient nur als visuelle Orientierung."],
    ["Personaliza o website do casamento", "Personalise the wedding website", "Personaliza la web de la boda", "Personnalisez le site du mariage", "Hochzeitswebsite personalisieren"],
    ["Estes detalhes aparecem nas secções do site. São opcionais — se ficares sem preencher, usamos o texto e horários elegantes predefinidos.", "These details appear in the website sections. They are optional—if left blank, we use elegant default copy and times.", "Estos detalles aparecen en las secciones de la web. Son opcionales; si los dejas vacíos, usaremos textos y horarios predeterminados.", "Ces détails apparaissent dans les sections du site. Ils sont facultatifs ; s’ils restent vides, nous utiliserons des textes et horaires élégants par défaut.", "Diese Angaben erscheinen in den Website-Bereichen. Sie sind optional; bei leeren Feldern verwenden wir elegante Standardtexte und -zeiten."],
    ["A vossa história ou mensagem para os convidados", "Your story or message to the guests", "Vuestra historia o mensaje para los invitados", "Votre histoire ou message aux invités", "Eure Geschichte oder Nachricht an die Gäste"],
    ["Hora da cerimónia", "Ceremony time", "Hora de la ceremonia", "Heure de la cérémonie", "Uhrzeit der Zeremonie"],
    ["Hora da receção / cocktail", "Reception / cocktail time", "Hora de la recepción / cóctel", "Heure de la réception / du cocktail", "Uhrzeit von Empfang / Cocktail"],
    ["Descrição da cerimónia", "Ceremony description", "Descripción de la ceremonia", "Description de la cérémonie", "Beschreibung der Zeremonie"],
    ["Descrição da receção", "Reception description", "Descripción de la recepción", "Description de la réception", "Beschreibung des Empfangs"],
    ["Chegada dos convidados", "Guest arrival", "Llegada de los invitados", "Arrivée des invités", "Ankunft der Gäste"],
    ["Jantar, brindes e dança", "Dinner, toasts and dancing", "Cena, brindis y baile", "Dîner, discours et danse", "Abendessen, Anstoßen und Tanz"],
    ["Usar predefinições", "Use defaults", "Usar valores predeterminados", "Utiliser les valeurs par défaut", "Standardwerte verwenden"],
    ["Continuar para gerar", "Continue to generation", "Continuar para generar", "Continuer vers la génération", "Weiter zur Generierung"],
    ["Fotografia atual guardada", "Current photo saved", "Foto actual guardada", "Photo actuelle enregistrée", "Aktuelles Foto gespeichert"],
    ["Carrega outra imagem apenas se a quiseres substituir.", "Upload another image only if you want to replace it.", "Sube otra imagen solo si quieres sustituirla.", "Importez une autre image uniquement pour la remplacer.", "Ladet nur dann ein anderes Bild hoch, wenn ihr es ersetzen möchtet."],
    ["Mantida", "Kept", "Conservada", "Conservée", "Beibehalten"],
    ["Template personalizado atual guardado", "Current custom template saved", "Plantilla personalizada actual guardada", "Modèle personnalisé actuel enregistré", "Aktuelle eigene Vorlage gespeichert"],
    ["Carrega outro ficheiro apenas se o quiseres substituir.", "Upload another file only if you want to replace it.", "Sube otro archivo solo si quieres sustituirlo.", "Importez un autre fichier uniquement pour le remplacer.", "Ladet nur dann eine andere Datei hoch, wenn ihr sie ersetzen möchtet."],
    ["A editar o teu projeto guardado", "Editing your saved project", "Editando tu proyecto guardado", "Modification de votre projet enregistré", "Gespeichertes Projekt bearbeiten"],
    ["Atualiza apenas o que mudou. A fotografia, o template e as imagens do website continuam guardados até escolheres substitutos.", "Update only what changed. The photo, template and website images remain saved until you choose replacements.", "Actualiza solo lo que haya cambiado. La foto, la plantilla y las imágenes de la web seguirán guardadas hasta que elijas sustitutas.", "Modifiez uniquement ce qui a changé. La photo, le modèle et les images du site restent enregistrés jusqu’à leur remplacement.", "Aktualisiert nur die Änderungen. Foto, Vorlage und Website-Bilder bleiben gespeichert, bis ihr Ersatz auswählt."],
    ["Criar nova versão", "Create new version", "Crear una nueva versión", "Créer une nouvelle version", "Neue Version erstellen"],
    ["A abrir o teu projeto…", "Opening your project…", "Abriendo tu proyecto…", "Ouverture de votre projet…", "Projekt wird geöffnet…"],
    ["Estamos a recuperar os dados anteriores para poderes alterar só o necessário.", "We are restoring the previous details so you only need to change what is necessary.", "Estamos recuperando los datos anteriores para que solo tengas que cambiar lo necesario.", "Nous récupérons les informations précédentes afin que vous ne modifiiez que le nécessaire.", "Die bisherigen Daten werden geladen, damit ihr nur das Nötige ändern müsst."],
    ["Não foi possível abrir o projeto.", "We could not open the project.", "No pudimos abrir el proyecto.", "Impossible d’ouvrir le projet.", "Das Projekt konnte nicht geöffnet werden."],
    ["Volta ao resultado e tenta novamente.", "Return to the result and try again.", "Vuelve al resultado e inténtalo de nuevo.", "Revenez au résultat et réessayez.", "Kehrt zum Ergebnis zurück und versucht es erneut."],
    ["O template Canva ainda não está pronto. Volta a este pedido dentro de alguns instantes.", "The Canva template is not ready yet. Return to this project in a few moments.", "La plantilla de Canva aún no está lista. Vuelve a este pedido dentro de unos instantes.", "Le modèle Canva n’est pas encore prêt. Revenez à cette demande dans quelques instants.", "Die Canva-Vorlage ist noch nicht bereit. Öffnet dieses Projekt in Kürze erneut."],
    ["Estamos a preparar o teu pedido", "We are preparing your project", "Estamos preparando tu pedido", "Nous préparons votre demande", "Euer Projekt wird vorbereitet"],
    ["O processamento pode demorar alguns minutos. O teu pedido será tratado o mais depressa possível.", "Processing may take a few minutes. Your project will be handled as quickly as possible.", "El proceso puede tardar unos minutos. Tu pedido se tramitará lo antes posible.", "Le traitement peut prendre quelques minutes. Votre demande sera traitée au plus vite.", "Die Verarbeitung kann einige Minuten dauern. Euer Projekt wird so schnell wie möglich bearbeitet."],
    ["Estamos a criar o teu convite", "We are creating your invitation", "Estamos creando tu invitación", "Nous créons votre invitation", "Eure Einladung wird erstellt"],
    ["A edição com GPT Image 2 pode demorar alguns minutos. O pedido será processado o mais depressa possível.", "Editing with GPT Image 2 may take a few minutes. The request will be processed as quickly as possible.", "La edición con GPT Image 2 puede tardar unos minutos. La solicitud se procesará lo antes posible.", "La modification avec GPT Image 2 peut prendre quelques minutes. La demande sera traitée au plus vite.", "Die Bearbeitung mit GPT Image 2 kann einige Minuten dauern. Die Anfrage wird so schnell wie möglich verarbeitet."],
    ["A enviar e validar as informações…", "Uploading and validating the information…", "Enviando y validando la información…", "Envoi et validation des informations…", "Angaben werden hochgeladen und geprüft…"],
    ["Não foi possível gerar o convite", "We could not create the invitation", "No pudimos crear la invitación", "Impossible de créer l’invitation", "Die Einladung konnte nicht erstellt werden"],
    ["Ocorreu um problema durante a geração. Volta ao editor e tenta novamente.", "A problem occurred during generation. Return to the editor and try again.", "Ha ocurrido un problema durante la generación. Vuelve al editor e inténtalo de nuevo.", "Un problème est survenu pendant la génération. Revenez à l’éditeur et réessayez.", "Während der Generierung ist ein Problem aufgetreten. Kehrt zum Editor zurück und versucht es erneut."],
    ["A iniciar…", "Starting…", "Iniciando…", "Démarrage…", "Wird gestartet…"],
    ["A gerar o PDF", "Creating the PDF", "Generando el PDF", "Création du PDF", "PDF wird erstellt"],
    ["A criar o PDF…", "Creating the PDF…", "Creando el PDF…", "Création du PDF…", "PDF wird erstellt…"],
    ["A imagem está a ganhar detalhe…", "Your invitation is taking shape…", "La invitación está tomando forma…", "L’invitation prend forme…", "Die Einladung nimmt Form an…"],
    ["Convite", "Invitation", "Invitación", "Invitation", "Einladung"],
    ["Envelope", "Envelope", "Sobre", "Enveloppe", "Umschlag"],
    ["Não aprovar", "Do not approve", "No aprobar", "Ne pas approuver", "Nicht bestätigen"],
    ["Ficheiros finais", "Final files", "Archivos finales", "Fichiers finaux", "Enddateien"],
    ["Abre o convite digital e o website sempre que quiseres.", "Open the digital invitation and website whenever you need them.", "Abre la invitación digital y la web cuando quieras.", "Ouvrez l’invitation numérique et le site quand vous le souhaitez.", "Öffnet die digitale Einladung und die Website jederzeit."],
    ["Abrir PDF", "Open PDF", "Abrir PDF", "Ouvrir le PDF", "PDF öffnen"],
    ["Abrir Website", "Open website", "Abrir sitio web", "Ouvrir le site", "Website öffnen"],
    ["Pré-visualizar website", "Preview website", "Previsualizar sitio web", "Prévisualiser le site", "Website ansehen"],
    ["Pré-visualização do website", "Website preview", "Vista previa del sitio web", "Aperçu du site", "Website-Vorschau"],
    ["Cancelar", "Cancel", "Cancelar", "Annuler", "Abbrechen"],
    ["Gerar novamente", "Regenerate", "Volver a generar", "Régénérer", "Neu erstellen"],
    ["InviteLab — início", "InviteLab — home", "InviteLab — inicio", "InviteLab — accueil", "InviteLab — Startseite"],
    ["Exemplo de convite", "Invitation example", "Ejemplo de invitación", "Exemple d’invitation", "Einladungsbeispiel"],
    ["Etapas do processo", "Process steps", "Pasos del proceso", "Étapes du processus", "Ablaufschritte"],
    ["Modo de criação", "Creation mode", "Modo de creación", "Mode de création", "Erstellungsmodus"],
    ["Etapas do pedido", "Project steps", "Pasos del pedido", "Étapes de la demande", "Projektschritte"],
    ["Pre-visualização do convite em construção", "Preview of the invitation being created", "Vista previa de la invitación en creación", "Aperçu de l’invitation en cours de création", "Vorschau der Einladung während der Erstellung"],
    ["Convite de casamento gerado", "Generated wedding invitation", "Invitación de boda generada", "Invitation de mariage générée", "Erstellte Hochzeitseinladung"],
    ["Envelope de casamento gerado", "Generated wedding envelope", "Sobre de boda generado", "Enveloppe de mariage générée", "Erstellter Hochzeitsumschlag"],
    ["Pré-visualização do website do casamento", "Wedding website preview", "Vista previa de la web de la boda", "Aperçu du site du mariage", "Vorschau der Hochzeitswebsite"],
    ["Ex.: nomes maiores, tons mais claros, selo mais discreto, menos flores", "E.g. larger names, lighter tones, a subtler seal, fewer flowers", "Ej.: nombres más grandes, tonos más claros, sello más discreto, menos flores", "Ex. : noms plus grands, tons plus clairs, sceau plus discret, moins de fleurs", "Z. B. größere Namen, hellere Töne, dezenteres Siegel, weniger Blumen"],
    ["Ex.: Conhecemo-nos há 8 anos e mal podemos esperar por celebrar este dia convosco.", "E.g. We met eight years ago and cannot wait to celebrate this day with you.", "Ej.: Nos conocimos hace ocho años y estamos deseando celebrar este día con vosotros.", "Ex. : Nous nous sommes rencontrés il y a huit ans et avons hâte de célébrer cette journée avec vous.", "Z. B. Wir haben uns vor acht Jahren kennengelernt und können es kaum erwarten, diesen Tag mit euch zu feiern."],
    ["Ex.: Troca de votos na capela da quinta.", "E.g. Exchange of vows in the venue chapel.", "Ej.: Intercambio de votos en la capilla de la finca.", "Ex. : Échange des vœux dans la chapelle du domaine.", "Z. B. Eheversprechen in der Kapelle des Veranstaltungsorts."],
    ["Ex.: Cocktail no jardim, seguido de jantar e festa.", "E.g. Garden cocktail followed by dinner and dancing.", "Ej.: Cóctel en el jardín, seguido de cena y fiesta.", "Ex. : Cocktail dans le jardin, suivi du dîner et de la fête.", "Z. B. Cocktail im Garten, anschließend Abendessen und Feier."]
  ];

  const exactTextCopy = Object.fromEntries(exactTextRows.map((row) => [row[0], {
    pt: row[0], en: row[1], es: row[2], fr: row[3], de: row[4],
  }]));
  const exactTextAliases = new Map();
  for (const [source, values] of Object.entries(exactTextCopy)) {
    exactTextAliases.set(source, source);
    for (const value of Object.values(values)) exactTextAliases.set(value, source);
  }
  function exact(value) {
    const raw = String(value ?? "");
    const source = exactTextAliases.get(raw.trim());
    return source ? (exactTextCopy[source]?.[locale] || source) : raw;
  }
  function localizeExactText(root = document) {
    const container = root?.nodeType === Node.TEXT_NODE ? root.parentNode : root;
    if (!container) return;
    const translateNode = (node) => {
      const raw = node.nodeValue;
      const trimmed = raw?.trim();
      if (!trimmed) return;
      const translated = exact(trimmed);
      if (translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
    };
    if (root?.nodeType === Node.TEXT_NODE) translateNode(root);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return parent && !parent.closest("script,style") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    while (walker.nextNode()) translateNode(walker.currentNode);
    const elements = container.querySelectorAll ? container.querySelectorAll("[placeholder],[alt],[title],[aria-label]") : [];
    for (const element of elements) {
      for (const attribute of ["placeholder", "alt", "title", "aria-label"]) {
        const raw = element.getAttribute(attribute);
        if (!raw) continue;
        const translated = exact(raw);
        if (translated !== raw) element.setAttribute(attribute, translated);
      }
    }
  }

  const babyShowerCopy = {
    pt: {
      title: "InviteLab · Convites de baby shower",
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
      websitePhotosHelp: "Até 5 imagens · JPG, PNG ou WebP · máximo 20 MB · compressão automática cada",
      websiteEnable: "Criar também um website do baby shower",
      websiteHelp: "Depois de aprovares a imagem, podes pré-visualizar e publicar o website.",
      generatedAlt: "Convite de baby shower de",
    },
    en: {
      title: "InviteLab · Baby shower invitations",
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
      websitePhotosHelp: "Up to 5 images · JPG, PNG or WebP · maximum 20 MB · automatic compression each",
      websiteEnable: "Create a baby shower website as well",
      websiteHelp: "After approving the image, you can preview and publish the website.",
      generatedAlt: "Baby shower invitation for",
    },
    es: {
      title: "InviteLab · Invitaciones para baby shower",
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
      websitePhotosHelp: "Hasta 5 imágenes · JPG, PNG o WebP · máximo 20 MB · compresión automática cada una",
      websiteEnable: "Crear también una web para el baby shower",
      websiteHelp: "Después de aprobar la imagen podrás previsualizar y publicar la web.",
      generatedAlt: "Invitación de baby shower de",
    },
    fr: {
      title: "InviteLab · Invitations de baby shower",
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
      websitePhotosHelp: "Jusqu'à 5 images · JPG, PNG ou WebP · 20 Mo maximum · compression automatique chacune",
      websiteEnable: "Créer également un site pour le baby shower",
      websiteHelp: "Après approbation de l'image, vous pourrez prévisualiser et publier le site.",
      generatedAlt: "Invitation de baby shower de",
    },
    de: {
      title: "InviteLab · Babyshower-Einladungen",
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
      websitePhotosHelp: "Bis zu 5 Bilder · JPG, PNG oder WebP · jeweils maximal 20 MB · automatische Komprimierung",
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
    ["editorial_photo", "Editorial Photo", "Photographic", "/assets/templates/01_editorial_photo.png", "/assets/templates/Details%20Template/01_editorial_photo_details.png"],
    ["greenery_icons", "Clean Greenery", "Botanical", "/assets/templates/02_greenery_icons.png", "/assets/templates/Details%20Template/02_greenery_icons_details.png"],
    ["sage_botanical", "Soft Sage", "Natural", "/assets/templates/03_sage_botanical.png", "/assets/templates/Details%20Template/03_sage_botanical_details.png"],
    ["minimal_church", "Minimal Church", "Classic", "/assets/templates/04_minimal_church.png", "/assets/templates/Details%20Template/04_minimal_church_details.png"],
    ["ivory_silk", "Ivory & Silk", "Quiet luxury", "/assets/templates/05_ivory_silk.png", "/assets/templates/Details%20Template/05_ivory_silk_details.png"],
    ["blush_floral", "Blush Floral", "Romantic", "/assets/templates/06_blush_floral.png", "/assets/templates/Details%20Template/06_blush_floral_details.png"],
    ["aquarela_paris", "Aquarela In Paris", "Contrast", "/assets/templates/07_aquarela.png", "/assets/templates/Details%20Template/07_aquarela_details.png"],
    ["coastal_blue", "Coastal Blue", "Light", "/assets/templates/08_coastal_blue.png", "/assets/templates/Details%20Template/08_coastal_blue_details.png"],
    ["terracotta_boho", "Terracotta Boho", "Organic", "/assets/templates/09_terracotta_boho.png", "/assets/templates/Details%20Template/09_terracotta_boho_details.png"],
    ["olive_minimal", "Minimal Olive", "Contemporary", "/assets/templates/10_olive_minimal.png", "/assets/templates/Details%20Template/10_olive_minimal_details.png"],
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
      ["Aquarela em Paris", "Contraste"], ["Costa Azul", "Leve"], ["Terracota Boho", "Orgânico"], ["Oliva Minimal", "Contemporâneo"],
    ],
    es: [
      ["Editorial Fotográfico", "Fotográfico"], ["Verde Limpio", "Botánico"], ["Salvia Suave", "Natural"],
      ["Iglesia Minimal", "Clásico"], ["Marfil y Seda", "Lujo discreto"], ["Floral Rosa", "Romántico"],
      ["Aquarela Paris", "Contraste"], ["Azul Costero", "Ligero"], ["Terracota Boho", "Orgánico"], ["Oliva Minimal", "Contemporáneo"],
    ],
    fr: [
      ["Éditorial Photo", "Photographique"], ["Feuillage Épuré", "Botanique"], ["Sauge Douce", "Naturel"],
      ["Église Minimaliste", "Classique"], ["Ivoire & Soie", "Luxe discret"], ["Fleurs Poudrées", "Romantique"],
      ["Aquarela Paris", "Contraste"], ["Bleu Littoral", "Léger"], ["Terracotta Bohème", "Organique"], ["Olive Minimaliste", "Contemporain"],
    ],
    de: [
      ["Foto Editorial", "Fotografisch"], ["Klares Grün", "Botanisch"], ["Sanfter Salbei", "Natürlich"],
      ["Minimalistische Kirche", "Klassisch"], ["Elfenbein & Seide", "Dezenter Luxus"], ["Blütenrosa", "Romantisch"],
      ["Aquarela Paris", "Kontrast"], ["Küstenblau", "Leicht"], ["Terrakotta Boho", "Organisch"], ["Olive Minimal", "Zeitgemäß"],
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
    try { return localStorage.getItem("invitelab-invites-language") || localStorage.getItem("atelier-vow-language"); } catch { return ""; }
  }

  // A first-time visitor starts in English. A chosen query-string or saved
  // language remains authoritative for returning customers.
  let locale = normalize(explicitLocale() || storedLocale() || "en", "en");
  let onChange = null;

  function t(key) {
    return (copy[locale] && copy[locale][key]) || copy.en[key] || key;
  }

  function format(key, values = {}) {
    return String(t(key)).replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, name) => String(values[name] ?? ""));
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
      detailsImage: item[4] || "",
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
    setLabel("attendanceUrl", "rsvpUrl", true);
    setText("#attendanceEnabledLabel", t("rsvpEnable"));
    setText("#attendanceEnabledHelp", t("rsvpHelp"));
    setText("#websiteEnabledLabel", t("websiteEnable"));
    setText("#websiteEnabledHelp", t("websiteHelp"));
    setText("#mapsUrl + small", t("mapsHelp"));
    setText("#message + small", t("messageHelp"));
    setText("#attendanceUrl + small", t("rsvpHelp"));
    setText("#photoTitle", t("photoAdd"));
    setText("#photoSubtitle", t("photoHelp"));
    setText(".privacy-note", t("privacy"));
    setText(".submit-button", t("submit"));
    setText(".app-shell > .footer", t("footer"));
    setPlaceholder("#location", t("venuePlaceholder"));
    setPlaceholder("#mapsUrl", t("mapsPlaceholder"));
    setPlaceholder("#message", t("defaultMessage"));
    setPlaceholder("#attendanceUrl", "https://app.youform.com/forms/...");
    const metaLabels = document.querySelectorAll(".preview-meta-row span");
    [t("mode"), t("style"), t("photography"), t("digitalPdf")].forEach((value, index) => { if (metaLabels[index]) metaLabels[index].textContent = value; });
    setText("#previewPhotoState", t("noPhoto"));
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.setAttribute("aria-label", t("language"));
    const selectedEventType = document.getElementById("eventType")?.value || "wedding";
    applyEventType(selectedEventType);
    localizeExactText(document);
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
      try { localStorage.setItem("invitelab-invites-language", locale); } catch {}
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

  let exactTextObserver = null;
  function mount(options) {
    onChange = options && options.onChange;
    installSelector();
    applyStatic();
    if (!exactTextObserver && document.body) {
      exactTextObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "characterData") localizeExactText(mutation.target);
          for (const node of mutation.addedNodes || []) {
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) localizeExactText(node);
          }
        }
      });
      exactTextObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    resolveServerLocale();
  }

  window.WeddingI18n = {
    mount,
    t,
    format,
    exact,
    localizeExactText,
    getTemplates,
    getEventUi,
    applyEventType,
    get locale() { return locale; },
    localeTag() { return localeTags[locale]; },
    setLocale,
  };
}());
