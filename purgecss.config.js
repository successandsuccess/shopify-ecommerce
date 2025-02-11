module.exports = {
    content: [
      './templates/*.liquid',
      './sections/*.liquid',
      './snippets/*.liquid',
      './layout/*.liquid',
      './assets/*.js',
    ],
    css: [
        './assets/collage.css',
        './assets/collapsible-content.css',
        './assets/component-accordion.css',
        './assets/component-article-card.css',
        './assets/component-card.css',
        './assets/component-cart-drawer.css'
    ], // Path to your CSS file
    output: './dist/', // Output directory for optimized CSS
    safelist: {
      // Add any classes that should not be removed
      standard: ['active', 'open', 'hidden'],
    },
  };
  