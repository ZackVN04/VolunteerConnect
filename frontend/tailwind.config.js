/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-surface": "#2e3132",
        "on-surface": "#191c1d",
        "on-primary-container": "#005027",
        "on-error": "#ffffff",
        "background": "#f8f9fa",
        "on-secondary-container": "#5f665b",
        "tertiary-fixed-dim": "#61de8a",
        "tertiary-fixed": "#7efba4",
        "surface-container-high": "#e7e8e9",
        "error": "#ba1a1a",
        "primary-fixed-dim": "#4ae183",
        "on-tertiary-fixed": "#00210c",
        "secondary-fixed-dim": "#c2c9bb",
        "on-primary-fixed-variant": "#005228",
        "primary-fixed": "#6bfe9c",
        "surface-container-highest": "#e1e3e4",
        "on-secondary-fixed-variant": "#42493e",
        "on-surface-variant": "#3d4a3e",
        "surface-bright": "#f8f9fa",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#00210c",
        "surface-container-low": "#f3f4f5",
        "primary-container": "#2ecc71",
        "secondary": "#596055",
        "surface-container": "#edeeef",
        "secondary-container": "#dee5d6",
        "on-tertiary-container": "#005127",
        "primary": "#006d37",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed": "#dee5d6",
        "outline": "#6c7b6d",
        "surface-variant": "#e1e3e4",
        "outline-variant": "#bbcbbb",
        "on-error-container": "#93000a",
        "inverse-on-surface": "#f0f1f2",
        "error-container": "#ffdad6",
        "on-secondary-fixed": "#171d14",
        "on-secondary": "#ffffff",
        "tertiary": "#006d37",
        "surface-tint": "#006d37",
        "on-tertiary-fixed-variant": "#005228",
        "inverse-primary": "#4ae183",
        "surface": "#f8f9fa",
        "on-tertiary": "#ffffff",
        "on-background": "#191c1d",
        "tertiary-container": "#4bca78",
        "surface-dim": "#d9dadb"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-mobile": "16px",
        "lg": "48px",
        "base": "8px",
        "md": "24px",
        "gutter": "20px",
        "sm": "12px",
        "margin-desktop": "auto",
        "xl": "80px",
        "xs": "4px"
      },
      fontFamily: {
        "body-md": ["Be Vietnam Pro"],
        "headline-md": ["Plus Jakarta Sans"],
        "label-sm": ["Be Vietnam Pro"],
        "display-lg": ["Plus Jakarta Sans"],
        "display-lg-mobile": ["Plus Jakarta Sans"],
        "body-lg": ["Be Vietnam Pro"]
      },
      fontSize: {
        "body-md": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "fontWeight": "600"
          }
        ],
        "label-sm": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0.01em",
            "fontWeight": "600"
          }
        ],
        "display-lg": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "display-lg-mobile": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.01em",
            "fontWeight": "700"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "400"
          }
        ]
      }
    },
  },
  plugins: [],
}
