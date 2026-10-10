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

## AI floor plan analysis and design generation

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your Google AI Studio API key. Floor-plan image recognition uses Gemini (`gemini-3.8-flash` by default); `GEMINI_MODEL_ID` can override it. Thermal Map, Ventilation Map, Cooling Layout, and Proposed Plan each derive a layer-specific visual brief from the room-by-room analysis and available climate metrics, then send the brief with the uploaded plan to Gemini image generation (`gemini-nano-banana-2.1` by default). `GEMINI_IMAGE_MODEL_ID` can select a different image model enabled for your account. Amazon Bedrock remains configured separately for the **Climate design concept** feature; set its bearer token and model settings in `.env` as needed. Start the frontend and API server with `npm run dev`.

In Upload Floor Plan, submit a PNG, JPG, or WEBP image up to 3.5 MB. Gemini analyzes the plan and returns identified rooms, visible openings, qualitative observations, limitations, and recommendations for the Overview. Selecting a map tab generates and caches that layer's image for the current uploaded plan; use the retry button to generate it again if a request fails. The selected city then loads current and historical weather from the public Open-Meteo API. The **Generate image** button uses Amazon Titan Image Generator, conditioned on the uploaded floor-plan layout, to create a separate illustrative climate-design concept. Generated maps and design images are qualitative visual aids, not measured simulation results, dimensionally accurate plans, or construction drawings.

The Gemini API key and AWS bearer token are used only by the API server and are never sent to the browser. Uploaded floor plans are sent to Google Gemini for analysis and map generation and to Amazon Bedrock when generating the separate design concept; do not upload plans containing sensitive personal information. Climate values come from public weather models and do not describe indoor conditions. Thermal and ventilation findings are AI-generated qualitative hypotheses, not measured results. For deployment, run the Node API server with the `.env` values set and route `/api/analyze-floorplan`, `/api/generate-floorplan-layer`, `/api/generate-design-image`, and `/api/climate` from the frontend origin to that server.

## Production with PM2

Build the frontend, then start both processes from the project directory:

```sh
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

The frontend listens on port 80 and proxies `/api` requests to the API on port 3000. Ensure `drope.in` points to this server and that ports 80 and 3000 are allowed by the firewall. Binding to port 80 requires root privileges or granting the Node.js executable permission to bind privileged ports.

To issue a Let's Encrypt certificate with Certbot's standalone authenticator, first stop the frontend because Certbot needs port 80:

```sh
pm2 stop climatetwin-frontend
sudo certbot certonly --standalone -d drope.in
pm2 start climatetwin-frontend
```

This obtains the certificate but does not configure HTTPS; a TLS-terminating web server or HTTPS server configuration is still needed to serve it.
