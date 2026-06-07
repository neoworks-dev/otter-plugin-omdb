import { runPlugin } from "@shutterly/sdk";
import { enrich } from "./src/enrich.ts";

runPlugin({
  meta: {
    name: "omdb",
    displayName: "OMDb",
    description: "The Open Movie Database — enrich media with plot, cast, ratings, and runtime",
    icon: "https://www.omdbapi.com/favicon.ico",
    version: "0.1.0",
    capabilities: ["enrich"],
    settings: [
      {
        key: "OMDB_API_KEY",
        label: "API Key",
        description: "Free API key from omdbapi.com",
        type: "password",
        required: true,
      },
    ],
  },
  enrich: (args) => enrich(args),
});
