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

## Amazon Bedrock floor plan analysis

Copy `.env.example` to `.env`, set `AWS_BEARER_TOKEN_BEDROCK` to your Amazon Bedrock API key, and choose an AWS region where the configured text and image models are enabled. The default text model is the global Claude Sonnet 4.6 inference profile, which supports requests from `ap-south-1`; global inference can process data outside the source Region. `AWS_REGION`, `BEDROCK_MODEL_ID`, and `BEDROCK_IMAGE_MODEL_ID` can be changed to match your AWS setup. Start the frontend and API server with `npm run dev`.

In Upload Floor Plan, submit a PNG, JPG, or WEBP image up to 3.5 MB. Bedrock analyzes the plan and returns identified rooms, visible openings, qualitative observations, limitations, and recommendations for the Overview. The selected city then loads current and historical weather from the public Open-Meteo API. The **Generate image** button uses Amazon Titan Image Generator, conditioned on the uploaded floor-plan layout, to create an illustrative climate-design concept; it is not dimensionally accurate or a construction drawing.

The bearer token is used only by the server-side AWS SDK and is never sent to the browser. Uploaded floor plans are sent to Amazon Bedrock; do not upload plans containing sensitive personal information. Climate values come from public weather models and do not describe indoor conditions. Thermal and ventilation findings are AI-generated qualitative hypotheses, not measured results. For deployment, run the Node API server with the `.env` values set and route `/api/analyze-floorplan`, `/api/generate-design-image`, and `/api/climate` from the frontend origin to that server.
