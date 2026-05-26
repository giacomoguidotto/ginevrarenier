import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

const SECTIONS: Array<{
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
      credential: { en: "", it: "" },
      portraitImage: { en: "", it: "" },
    },
  },
  {
    section: "testimonial",
    content: {
      quote: { en: "", it: "" },
      author: { en: "", it: "" },
      role: { en: "", it: "" },
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
    section: "connect.availability",
    content: {
      available: { en: "true", it: "true" },
      description: {
        en: "Currently accepting select projects for 2026. For urgent inquiries, please mention in your message.",
        it: "Attualmente accetto progetti selezionati per il 2026. Per richieste urgenti, per favore menzionalo nel messaggio.",
      },
      descriptionUnavailable: {
        en: "Not currently taking on new projects. Feel free to reach out for future collaborations.",
        it: "Al momento non accetto nuovi progetti. Non esitare a contattarmi per future collaborazioni.",
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
    section: "home.subscribe",
    content: {
      prompt: {
        en: "Be the first to see what comes next.",
        it: "Scopri per primo cosa nasce dopo.",
      },
    },
  },
  {
    section: "footer.subscribe",
    content: {
      prompt: {
        en: "Stay close to my journey.",
        it: "Resta vicino al mio percorso.",
      },
    },
  },
  {
    section: "connect.subscribe",
    content: {
      prompt: {
        en: "Prefer to follow quietly? I'll only write when there's something new to see.",
        it: "Preferisci seguire in silenzio? Ti scrivo solo quando c'è qualcosa di nuovo da vedere.",
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

const SOCIAL_LINKS = [
  { platform: "email" as const, handle: "ginevrarenier@gmail.com", order: 0 },
  { platform: "instagram" as const, handle: "ginevra.renier", order: 1 },
];

const ACHIEVEMENTS = [
  {
    startYear: 2022,
    title: { en: "First Camera", it: "Prima Fotocamera" },
    description: {
      en: "I inherited my first DSLR camera from my grandmother, passing down a passion that will last a lifetime.",
      it: "Ho ereditato la mia prima reflex digitale da mia nonna, tramandandomi una passione che durerà per tutta la mia vita.",
    },
  },
  {
    startYear: 2024,
    title: { en: "Beyond Borders", it: "Oltre i Confini" },
    description: {
      en: "Immersed in landscapes never seen before, I began capturing horizons that spoke a new language. Each shot a discovery, each light a revelation.",
      it: "Immerso in paesaggi mai visti prima, ho iniziato a catturare orizzonti che parlavano una lingua nuova. Ogni scatto una scoperta, ogni luce una rivelazione.",
    },
  },
  {
    startYear: 2025,
    title: { en: "At CPF Bauer", it: "Alla CPF Bauer" },
    description: {
      en: "After Venice, I chose to push further. Milan welcomed me with a leap into the unknown, toward the vision I was seeking.",
      it: "Dopo Venezia, ho scelto di spingermi oltre. Milano mi ha accolta con un salto nel vuoto, verso la visione che stavo cercando.",
    },
  },
];

async function insertSeedData(ctx: MutationCtx) {
  for (const { section, content } of SECTIONS) {
    await ctx.db.insert("siteContent", { section, content });
  }
  for (const link of SOCIAL_LINKS) {
    await ctx.db.insert("socialLinks", link);
  }
  for (const achievement of ACHIEVEMENTS) {
    await ctx.db.insert("achievements", achievement);
  }
}

async function clearTable(
  ctx: MutationCtx,
  table: "siteContent" | "socialLinks" | "achievements"
) {
  const rows = await ctx.db.query(table).collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const hasContent = await ctx.db.query("siteContent").first();
    const hasSocial = await ctx.db.query("socialLinks").first();
    const hasAchievements = await ctx.db.query("achievements").first();

    if (!(hasContent || hasSocial || hasAchievements)) {
      await insertSeedData(ctx);
      return;
    }

    if (!hasContent) {
      for (const { section, content } of SECTIONS) {
        await ctx.db.insert("siteContent", { section, content });
      }
    }
    if (!hasSocial) {
      for (const link of SOCIAL_LINKS) {
        await ctx.db.insert("socialLinks", link);
      }
    }
    if (!hasAchievements) {
      for (const achievement of ACHIEVEMENTS) {
        await ctx.db.insert("achievements", achievement);
      }
    }
  },
});

export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    await clearTable(ctx, "siteContent");
    await clearTable(ctx, "socialLinks");
    await clearTable(ctx, "achievements");
    await insertSeedData(ctx);
  },
});
