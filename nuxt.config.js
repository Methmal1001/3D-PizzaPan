// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // No server route rules are used, so the app manifest isn't needed (also silences a dev-only Vite warning)
  experimental: { appManifest: false },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Components are organised in folders (layout/, bakery/, menu/…) but used by their plain names
  components: [{ path: '~/components', pathPrefix: false }],

  tailwindcss: {
    cssPath: false, // main.css already contains the Tailwind directives
    viewer: false,
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'PizzaPan Bakery — Freshly Baked. Made Just for You.',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Step inside PizzaPan Bakery — an immersive 3D pizza shop. Explore the menu, build your own pizza and place a demo order.',
        },
        { name: 'theme-color', content: '#211A17' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },

  // Three.js and GSAP are only ever used in the browser (client-only components / plugin)
  build: {
    transpile: ['three'],
  },

  vite: {
    // Three.js (~750 kB) lives in its own lazily-loaded chunk, fetched only when a 3D scene mounts
    build: { chunkSizeWarningLimit: 900 },
    optimizeDeps: {
      include: ['three', 'gsap', 'lucide-vue-next'],
    },
  },
})
