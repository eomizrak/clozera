import './assets/main.css'
import './assets/ui-theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { definePreset } from '@primeuix/themes'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router'

const ClozeraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
    focusRing: {
      color: '{primary.500}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fffaf3',
          100: '#fff7ed',
          200: '#ffedd5',
          300: '#fed7aa',
          400: '#d68b58',
          500: '#9a5a38',
          600: '#8a4b2a',
          700: '#5f2f18',
          800: '#431407',
          900: '#2a160d',
          950: '#160a04',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.100}',
          focusBackground: '{primary.200}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
        text: {
          color: '{surface.700}',
          hoverColor: '{surface.800}',
          mutedColor: '{surface.600}',
          hoverMutedColor: '{surface.700}',
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{primary.50}',
          borderColor: '{primary.200}',
          color: '{surface.700}',
          hoverColor: '{surface.800}',
        },
        formField: {
          background: '{surface.0}',
          filledBackground: '{surface.50}',
          filledHoverBackground: '{surface.50}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{primary.200}',
          hoverBorderColor: '{primary.300}',
          focusBorderColor: '{primary.500}',
          color: '{surface.800}',
          placeholderColor: '{surface.500}',
          iconColor: '{primary.700}',
          floatLabelFocusColor: '{primary.600}',
        },
        list: {
          option: {
            focusBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
            selectedBackground: '{primary.100}',
            selectedFocusBackground: '{primary.200}',
            color: '{surface.700}',
            focusColor: '{primary.800}',
            selectedColor: '{primary.800}',
            selectedFocusColor: '{primary.900}',
            icon: {
              color: '{primary.700}',
              focusColor: '{primary.800}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{surface.600}',
          },
        },
        navigation: {
          item: {
            focusBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
            activeBackground: '{primary.100}',
            color: '{surface.700}',
            focusColor: '{primary.800}',
            activeColor: '{primary.800}',
            icon: {
              color: '{primary.700}',
              focusColor: '{primary.800}',
              activeColor: '{primary.800}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{surface.600}',
          },
          submenuIcon: {
            color: '{primary.700}',
            focusColor: '{primary.800}',
            activeColor: '{primary.800}',
          },
        },
        overlay: {
          select: {
            background: '{surface.0}',
            borderColor: '{primary.200}',
            color: '{surface.700}',
          },
          popover: {
            background: '{surface.0}',
            borderColor: '{primary.200}',
            color: '{surface.700}',
          },
          modal: {
            background: '{surface.0}',
            borderColor: '{primary.200}',
            color: '{surface.700}',
          },
        },
      },
    },
  },
  components: {
    togglebutton: {
      root: {
        background: 'transparent',
        checkedBackground: '{primary.100}',
        hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
        borderColor: '{primary.200}',
        color: '{primary.700}',
        hoverColor: '{primary.800}',
        checkedColor: '{primary.800}',
        checkedBorderColor: '{primary.200}',
      },
      icon: {
        color: '{primary.700}',
        hoverColor: '{primary.800}',
        checkedColor: '{primary.800}',
      },
      content: {
        checkedBackground: 'transparent',
        checkedShadow: 'none',
      },
    },
    selectbutton: {
      root: {
        borderRadius: '{form.field.border.radius}',
      },
    },
    button: {
      colorScheme: {
        light: {
          root: {
            secondary: {
              background: '{surface.0}',
              hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
              activeBackground: '{primary.100}',
              borderColor: '{primary.200}',
              hoverBorderColor: '{primary.300}',
              activeBorderColor: '{primary.300}',
              color: '{primary.700}',
              hoverColor: '{primary.800}',
              activeColor: '{primary.900}',
            },
          },
          outlined: {
            primary: {
              hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
              activeBackground: '{primary.100}',
              borderColor: '{primary.200}',
              color: '{primary.700}',
            },
            secondary: {
              hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
              activeBackground: '{primary.100}',
              borderColor: '{primary.200}',
              color: '{primary.700}',
            },
          },
          text: {
            primary: {
              hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
              activeBackground: '{primary.100}',
              color: '{primary.700}',
            },
            secondary: {
              hoverBackground: 'color-mix(in srgb, {primary.500}, transparent 90%)',
              activeBackground: '{primary.100}',
              color: '{primary.700}',
            },
          },
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: ClozeraPreset,
    options: {
      darkModeSelector: false,
    },
  },
})

app.mount('#app')
