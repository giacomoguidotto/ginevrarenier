import { internalMutation } from "./_generated/server";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // --- Site Content ---
    const sections: Array<{
      section: string;
      content: Record<string, { en: string; it: string }>;
    }> = [
      {
        section: "hero",
        content: {
          tagline: {
            en: "Visual Storyteller",
            it: "Narratrice Visiva",
          },
          title: {
            en: "Capturing\nEthereal Moments",
            it: "Catturando\nMomenti Eterei",
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
          title: {
            en: "Where Light\nMeets Soul",
            it: "Dove la Luce\nIncontra l'Anima",
          },
          bio: {
            en: "From the moment I first held a camera, I've been chasing light across every corner I discover, seeking those fleeting moments where reality transcends into something magical.\n\nMy work is an exploration of the human experience. I seek the quiet intensity of a gaze, the dance of shadows on ancient walls, the poetry hidden in everyday scenes.",
            it: "Dal momento in cui ho impugnato per la prima volta una fotocamera, inseguo la luce in ogni angolo che scopro, cercando quei momenti fugaci in cui la realtà trascende in qualcosa di magico.\n\nIl mio lavoro è un'esplorazione dell'esperienza umana. Cerco la quieta intensità di uno sguardo, la danza delle ombre sui muri antichi, la poesia nascosta nelle scene quotidiane.",
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
          bio: {
            en: "Raised in Venice, amidst the interplay of water and light, I discovered early that the world speaks in images. Photography became my language, a way to capture the fleeting moments that define our existence.\n\nMy work is guided by a simple philosophy: every photograph should evoke an emotion, tell a story, and reveal something invisible to the casual glance. I seek the extraordinary hidden within the ordinary.\n\nWhether capturing the quiet dignity of a stranger's gaze or the dramatic sweep of a mountain range, I approach each subject with reverence and curiosity.",
            it: "Cresciuta a Venezia, tra l'intreccio di acqua e luce, ho scoperto presto che il mondo parla per immagini. La fotografia è diventata il mio linguaggio, un modo per catturare i momenti fugaci che definiscono la nostra esistenza.\n\nIl mio lavoro è guidato da una filosofia semplice: ogni fotografia dovrebbe evocare un'emozione, raccontare una storia e rivelare qualcosa di invisibile allo sguardo distratto. Cerco lo straordinario nascosto nell'ordinario.\n\nChe si tratti di catturare la quieta dignità dello sguardo di uno sconosciuto o l'ampio respiro di una catena montuosa, mi avvicino a ogni soggetto con riverenza e curiosità.",
          },
          portraitImage: { en: "", it: "" },
        },
      },
      {
        section: "essence.highlights",
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
      {
        section: "home.featured",
        content: {
          label: {
            en: "Featured Projects",
            it: "Progetti in Evidenza",
          },
          title: {
            en: "Selected Works",
            it: "Opere Selezionate",
          },
        },
      },
      {
        section: "connect.header",
        content: {
          label: {
            en: "Let's Talk",
            it: "Parliamo",
          },
          title: {
            en: "Connect",
            it: "Contatti",
          },
          description: {
            en: "Whether you're envisioning a collaboration, seeking a commission, or simply want to say hello. I'd love to hear from you.",
            it: "Che tu stia immaginando una collaborazione, cercando una commissione, o semplicemente voglia salutare. Mi piacerebbe sentirti.",
          },
        },
      },
      {
        section: "connect.location",
        content: {
          location: {
            en: "Venice, Italy",
            it: "Venezia, Italia",
          },
        },
      },
      {
        section: "vision.header",
        content: {
          label: {
            en: "Portfolio",
            it: "Portfolio",
          },
          title: {
            en: "Vision",
            it: "Visione",
          },
          description: {
            en: "A curated collection of works spanning portraits, landscapes, urban explorations, and abstract expressions. Each project is a chapter in an ongoing visual narrative.",
            it: "Una collezione curata di opere che spaziano da ritratti, paesaggi, esplorazioni urbane ed espressioni astratte. Ogni progetto è un capitolo di una narrazione visiva in continua evoluzione.",
          },
        },
      },
      {
        section: "footer",
        content: {
          tagline: {
            en: "Capturing moments that transcend time. Photography that tells stories through light and shadow.",
            it: "Catturare momenti che trascendono il tempo. Fotografia che racconta storie attraverso luce e ombra.",
          },
        },
      },
      {
        section: "reflections.header",
        content: {
          label: {
            en: "Journal",
            it: "Diario",
          },
          title: {
            en: "Reflections",
            it: "Riflessioni",
          },
          description: {
            en: "Musings on light, shadow, and the ephemeral nature of moments. Essays on creativity, the craft of photography, and the stories behind the images.",
            it: "Pensieri su luce, ombra e la natura effimera dei momenti. Saggi sulla creatività, l'arte della fotografia e le storie dietro le immagini.",
          },
        },
      },
    ];

    for (const { section, content } of sections) {
      const row = await ctx.db
        .query("siteContent")
        .withIndex("by_section", (q) => q.eq("section", section))
        .unique();
      if (!row) {
        await ctx.db.insert("siteContent", {
          section,
          content,
        });
      }
    }

    // --- Social Links ---
    const existingSocial = await ctx.db.query("socialLinks").first();
    if (!existingSocial) {
      await ctx.db.insert("socialLinks", {
        platform: "email",
        handle: "ginevrarenier@gmail.com",
        order: 0,
      });

      await ctx.db.insert("socialLinks", {
        platform: "instagram",
        handle: "ginevra.renier",
        order: 1,
      });
    }

    // --- Achievements (timeline entries) ---
    const existingAchievement = await ctx.db.query("achievements").first();
    if (!existingAchievement) {
      await ctx.db.insert("achievements", {
        startYear: 2022,
        title: { en: "First Camera", it: "Prima Fotocamera" },
        description: {
          en: "I inherited my first DSLR camera from my grandmother, passing down a passion that will last a lifetime.",
          it: "Ho ereditato la mia prima reflex digitale da mia nonna, tramandandomi una passione che durerà per tutta la mia vita.",
        },
      });

      await ctx.db.insert("achievements", {
        startYear: 2024,
        title: { en: "Beyond Borders", it: "Oltre i Confini" },
        description: {
          en: "Immersed in landscapes never seen before, I began capturing horizons that spoke a new language. Each shot a discovery, each light a revelation.",
          it: "Immerso in paesaggi mai visti prima, ho iniziato a catturare orizzonti che parlavano una lingua nuova. Ogni scatto una scoperta, ogni luce una rivelazione.",
        },
      });

      await ctx.db.insert("achievements", {
        startYear: 2025,
        title: { en: "At CPF Bauer", it: "Alla CPF Bauer" },
        description: {
          en: "After Venice, I chose to push further. Milan welcomed me with a leap into the unknown, toward the vision I was seeking.",
          it: "Dopo Venezia, ho scelto di spingermi oltre. Milano mi ha accolta con un salto nel vuoto, verso la visione che stavo cercando.",
        },
      });
    }
  },
});
