export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f9f9ff",
        "on-secondary": "#ffffff",
        "inverse-on-surface": "#ecf0ff",
        "surface-container": "#e7eeff",
        "surface-bright": "#f9f9ff",
        "on-secondary-container": "#00734c",
        "on-primary": "#ffffff",
        primary: "#003d9b",
        tertiary: "#432f9c",
        "surface-dim": "#cadbfc",
        "on-tertiary": "#ffffff",
        "inverse-primary": "#b2c5ff",
        "surface-tint": "#0c56d0",
        "primary-fixed": "#dae2ff",
        "on-error-container": "#93000a",
        "surface-container-high": "#dfe8ff",
        "tertiary-container": "#5b49b5",
        secondary: "#006c47",
        "inverse-surface": "#20314b",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "on-surface": "#091c35",
        "primary-container": "#0052cc",
        surface: "#f9f9ff",
        "on-surface-variant": "#434654",
        "surface-container-low": "#f0f3ff",
        "surface-container-lowest": "#ffffff",
        "on-background": "#091c35",
        "surface-container-highest": "#d6e3ff",
        "on-primary-fixed": "#001848",
        "on-primary-fixed-variant": "#0040a2",
        "tertiary-fixed": "#e5deff",
        "secondary-container": "#82f9be",
        outline: "#737685",
        "error-container": "#ffdad6",
        "outline-variant": "#c3c6d6",
        "surface-variant": "#d6e3ff"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        "body-md": ["Inter"],
        "label-bold": ["Inter"],
        h1: ["Inter"],
        h2: ["Inter"],
        h3: ["Inter"]
      },
      fontSize: {
        "body-md": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "400" }],
        "label-bold": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0em", fontWeight: "400" }],
        h1: ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "28px", letterSpacing: "0em", fontWeight: "600" }]
      }
    }
  },
  plugins: []
};
