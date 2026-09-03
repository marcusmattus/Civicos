import type { Preview } from '@storybook/nextjs-vite'
// The real application stylesheet: stories render against the same tokens the
// app ships, so a component that looks right here looks right in production.
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: '#f6f8fb' },
        surface: { name: 'Surface', value: '#ffffff' },
        navy: { name: 'Navy shell', value: '#0b2440' },
      },
    },
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
  initialGlobals: { backgrounds: { value: 'canvas' } },
}

export default preview
