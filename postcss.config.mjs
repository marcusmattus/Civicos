/**
 * Object form rather than the array shorthand: Next accepts both, but
 * Storybook's PostCSS loader only understands this one.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
