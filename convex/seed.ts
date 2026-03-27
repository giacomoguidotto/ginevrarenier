import { internalMutation } from "./_generated/server";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("projects").first();
    if (existing) {
      return;
    }

    // --- Projects ---
    const projects = [
      {
        slug: "oslo",
        title: { en: "Oslo", it: "Oslo" },
        subtitle: { en: "City of Light", it: "Città di Luce" },
        description: {
          en: "A journey through the city of Oslo. From the bustling streets to the serene parks, each photograph captures a moment of life in the city.",
          it: "Un viaggio attraverso la città di Oslo. Dalle strade affollate alle parchi tranquilli, ogni fotografia cattura un momento di vita nella città.",
        },
        category: { en: "Urban", it: "Urban" },
      },
      {
        slug: "portraits",
        title: { en: "Portraits", it: "Ritratti" },
        subtitle: { en: "Human Connection", it: "Connessione Umana" },
        description: {
          en: "A journey into the human soul. Each portrait tells a unique story of emotion, strength, and vulnerability.",
          it: "Un viaggio nell'anima umana. Ogni ritratto racconta una storia unica di emozione, forza e vulnerabilità.",
        },
        category: { en: "People", it: "Persone" },
      },
      {
        slug: "landscapes",
        title: { en: "Landscapes", it: "Paesaggi" },
        subtitle: { en: "Nature's Poetry", it: "Poesia della Natura" },
        description: {
          en: "Nature's grandeur captured in moments of perfect light. From misty mornings to golden sunsets.",
          it: "La grandiosità della natura catturata in momenti di luce perfetta. Dalle mattine nebbiose ai tramonti dorati.",
        },
        category: { en: "Nature", it: "Natura" },
      },
      {
        slug: "urban",
        title: { en: "Urban", it: "Urbano" },
        subtitle: { en: "City Whispers", it: "Sussurri di Città" },
        description: {
          en: "The poetry of cities. Architecture, streets, and the pulse of urban life through a contemplative lens.",
          it: "La poesia delle città. Architettura, strade e il battito della vita urbana attraverso uno sguardo contemplativo.",
        },
        category: { en: "Architecture", it: "Architettura" },
      },
      {
        slug: "abstract",
        title: { en: "Abstract", it: "Astratto" },
        subtitle: { en: "Beyond Form", it: "Oltre la Forma" },
        description: {
          en: "Beyond representation. Exploring form, color, and texture in ways that challenge perception.",
          it: "Oltre la rappresentazione. Esplorando forma, colore e texture in modi che sfidano la percezione.",
        },
        category: { en: "Experimental", it: "Sperimentale" },
      },
      {
        slug: "moments",
        title: { en: "Fleeting Moments", it: "Momenti Fugaci" },
        subtitle: { en: "Life's Breath", it: "Respiro di Vita" },
        description: {
          en: "Life's ephemeral beauty. Candid captures of joy, contemplation, and human connection.",
          it: "La bellezza effimera della vita. Scatti spontanei di gioia, contemplazione e connessione umana.",
        },
        category: { en: "Documentary", it: "Documentario" },
      },
      {
        slug: "noir",
        title: { en: "Noir", it: "Noir" },
        subtitle: { en: "Shadow & Light", it: "Ombra & Luce" },
        description: {
          en: "A study in contrasts. Black and white photography that embraces shadow and light.",
          it: "Uno studio sui contrasti. Fotografia in bianco e nero che abbraccia ombra e luce.",
        },
        category: { en: "Black & White", it: "Bianco & Nero" },
      },
    ];

    for (let i = 0; i < projects.length; i++) {
      await ctx.db.insert("projects", {
        ...projects[i],
        coverImageUrl: undefined,
        order: i,
        published: true,
      });
    }

    // --- Site Content ---
    const sections = [
      {
        section: "hero",
        content: {
          tagline: {
            en: "Visual Storyteller",
            it: "Narratrice Visiva",
          },
          title: {
            en: "Capturing",
            it: "Catturando",
          },
          titleAccent: {
            en: "Ethereal Moments",
            it: "Momenti Eterei",
          },
          description: {
            en: "Through my lens, I explore the delicate interplay of light and shadow, creating images that resonate with the soul.",
            it: "Attraverso il mio obiettivo, esploro il delicato gioco di luce e ombra, creando immagini che risuonano con l'anima.",
          },
          cta: {
            en: "Enter the Vision",
            it: "Entra nella Visione",
          },
          ctaSecondary: {
            en: "Get in Touch",
            it: "Contattami",
          },
        },
      },
      {
        section: "intro",
        content: {
          label: { en: "The Artist", it: "L'Artista" },
          title: { en: "Where Light", it: "Dove la Luce" },
          titleBreak: { en: "Meets Soul", it: "Incontra l'Anima" },
          paragraph1: {
            en: "From the moment I first held a camera, I've been chasing light across every corner I discover, seeking those fleeting moments where reality transcends into something magical.",
            it: "Dal momento in cui ho impugnato per la prima volta una fotocamera, inseguo la luce in ogni angolo che scopro, cercando quei momenti fugaci in cui la realtà trascende in qualcosa di magico.",
          },
          paragraph2: {
            en: "My work is an exploration of the human experience—the quiet intensity of a gaze, the dance of shadows on ancient walls, the poetry hidden in everyday scenes.",
            it: "Il mio lavoro è un'esplorazione dell'esperienza umana—la quieta intensità di uno sguardo, la danza delle ombre sui muri antichi, la poesia nascosta nelle scene quotidiane.",
          },
          cta: { en: "Discover My Story", it: "Scopri la Mia Storia" },
          portraitImage: { en: "", it: "" },
        },
      },
      {
        section: "testimonial",
        content: {
          quote: {
            en: "Ginevra has an extraordinary ability to capture not just images, but emotions. Her photographs express the true movement of life in the smallest details.",
            it: "Ginevra ha una straordinaria capacità di catturare non solo immagini, ma emozioni. Le sue fotografie esprimono il vero moto della vita nei più piccoli dettagli.",
          },
          author: {
            en: "Miranda Priestly",
            it: "Miranda Priestly",
          },
          role: {
            en: "Art Director, Vogue USA",
            it: "Art Director, Vogue USA",
          },
        },
      },
      {
        section: "essence.hero",
        content: {
          label: { en: "The Artist", it: "L'Artista" },
          title: { en: "Essence", it: "Essenza" },
          paragraph1: {
            en: "Raised in Venice, amidst the interplay of water and light, I discovered early that the world speaks in images. Photography became my language, a way to capture the fleeting moments that define our existence.",
            it: "Cresciuta a Venezia, tra l'intreccio di acqua e luce, ho scoperto presto che il mondo parla per immagini. La fotografia è diventata il mio linguaggio, un modo per catturare i momenti fugaci che definiscono la nostra esistenza.",
          },
          paragraph2: {
            en: "My work is guided by a simple philosophy: every photograph should evoke an emotion, tell a story, and reveal something invisible to the casual glance. I seek the extraordinary hidden within the ordinary.",
            it: "Il mio lavoro è guidato da una filosofia semplice: ogni fotografia dovrebbe evocare un'emozione, raccontare una storia e rivelare qualcosa di invisibile allo sguardo distratto. Cerco lo straordinario nascosto nell'ordinario.",
          },
          paragraph3: {
            en: "Whether capturing the quiet dignity of a stranger's gaze or the dramatic sweep of a mountain range, I approach each subject with reverence and curiosity.",
            it: "Che si tratti di catturare la quieta dignità dello sguardo di uno sconosciuto o l'ampio respiro di una catena montuosa, mi avvicino a ogni soggetto con riverenza e curiosità.",
          },
          portraitImage: { en: "", it: "" },
        },
      },
      {
        section: "essence.achievements",
        content: {
          "years.title": {
            en: "Started at 19",
            it: "Iniziata a 19 Anni",
          },
          "years.description": {
            en: "A passion born early, cultivated with dedication",
            it: "Una passione nata presto, coltivata con dedizione",
          },
          "recognition.title": {
            en: "Academy of Fine Arts",
            it: "Accademia di Belle Arti",
          },
          "recognition.description": {
            en: "Trained at one of the most prestigious schools",
            it: "Formata da una delle scuole più prestigiose",
          },
          "countries.title": {
            en: "Solo Explorer",
            it: "Esploratrice Solitaria",
          },
          "countries.description": {
            en: "Traveling the world in search of unique stories",
            it: "Viaggiando il mondo alla ricerca di storie uniche",
          },
        },
      },
      {
        section: "essence.timeline",
        content: {
          label: { en: "Journey", it: "Percorso" },
          title: {
            en: "A Path Immersed in Light",
            it: "Un Cammino Immersa nella Luce",
          },
          "2022.title": {
            en: "First Camera",
            it: "Prima Fotocamera",
          },
          "2022.description": {
            en: "I inherited my first DSLR camera from my grandmother, passing down a passion that will last a lifetime.",
            it: "Ho ereditato la mia prima reflex digitale da mia nonna, tramandandomi una passione che durerà per tutta la mia vita.",
          },
          "2024.title": {
            en: "Beyond Borders",
            it: "Oltre i Confini",
          },
          "2024.description": {
            en: "Immersed in landscapes never seen before, I began capturing horizons that spoke a new language. Each shot a discovery, each light a revelation.",
            it: "Immerso in paesaggi mai visti prima, ho iniziato a catturare orizzonti che parlavano una lingua nuova. Ogni scatto una scoperta, ogni luce una rivelazione.",
          },
          "2025.title": {
            en: "At CPF Bauer",
            it: "Alla CPF Bauer",
          },
          "2025.description": {
            en: "After Venice, I chose to push further. Milan welcomed me with a leap into the unknown, toward the vision I was seeking.",
            it: "Dopo Venezia, ho scelto di spingermi oltre. Milano mi ha accolta con un salto nel vuoto, verso la visione che stavo cercando.",
          },
        },
      },
      {
        section: "essence.cta",
        content: {
          title: {
            en: "Let's Create Together",
            it: "Creiamo Insieme",
          },
          description: {
            en: "Whether you have a vision in mind or want to explore possibilities, I'd love to hear from you.",
            it: "Che tu abbia una visione in mente o voglia esplorare le possibilità, mi piacerebbe sentirti.",
          },
          button: {
            en: "Get in Touch",
            it: "Contattami",
          },
        },
      },
    ];

    for (const { section, content } of sections) {
      await ctx.db.insert("siteContent", {
        section,
        content: JSON.stringify(content),
      });
    }

    // --- Social Links ---
    await ctx.db.insert("socialLinks", {
      platform: "instagram",
      href: "https://www.instagram.com/ginevra.renier/",
      label: "Instagram",
      value: "@ginevrarenier",
      order: 0,
    });

    await ctx.db.insert("socialLinks", {
      platform: "email",
      href: "mailto:ginevrarenier@gmail.com",
      label: "Email",
      value: "ginevrarenier@gmail.com",
      order: 1,
    });
  },
});
