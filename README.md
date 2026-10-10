# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Gemini floor plan analysis

Create a `.env` file from `.env.example` and set `GEMINI_API_KEY` to a Google AI Studio API key. Start the app with `npm run dev`; this starts the Vite frontend and the local API server. In the Upload Floor Plan section, select a PNG, JPG, or WEBP image up to 10 MB and choose **Analyze with Gemini**. The Gemini key is read only by the API server and is never sent to the browser.

Uploaded floor plan images are sent to Google's Gemini API for analysis. Do not upload images containing sensitive personal information. For deployment, run the Node API server with `GEMINI_API_KEY` set and route `/api/analyze-floorplan` from the frontend origin to that server.
