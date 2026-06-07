# otter-plugin-omdb

Otter plugin for [The Open Movie Database](https://www.omdbapi.com). Enriches movies and series with plot, cast, director, MPAA content rating, runtime, and poster using IMDb-sourced data. Requires an OMDb API key.

---

## Overview

OMDb provides IMDb-sourced metadata for a large catalog of movies and series. This plugin looks up titles by name (and optional year), fetches full detail from the OMDb API, and maps the result onto Otter's media model. It also fills `content_rating` from the MPAA rating field (R, NC-17, and X are flagged as NSFW).

## Capabilities

| Capability | Description |
|------------|-------------|
| `enrich` | Fills missing fields for movies and series using the OMDb API |

## Enriched fields

| Field | Movies | Series |
|-------|:------:|:------:|
| `description` | ✓ | ✓ |
| `poster` | ✓ | ✓ |
| `year` | ✓ | ✓ |
| `genres` | ✓ | ✓ |
| `cast` | ✓ | ✓ |
| `director` | ✓ | ✓ |
| `content_rating` (MPAA) | ✓ | ✓ |
| `duration_minutes` | ✓ | — |

## Configuration

| Setting | Required | Description |
|---------|:--------:|-------------|
| `OMDB_API_KEY` | Yes | Free API key from [omdbapi.com](https://www.omdbapi.com/apikey.aspx) |

Settings are passed as environment variables when Otter invokes the plugin.

## Development

```sh
bun install
OMDB_API_KEY=your_key bun run index.ts
```

```json
{
  "capability": "enrich",
  "args": {
    "media_type": "movie",
    "existing": { "title": "Inception", "year": 2010 },
    "missing": ["description", "cast", "content_rating"]
  }
}
```

Output:

```json
{
  "result": {
    "description": "A thief who steals corporate secrets...",
    "cast": [
      { "name": "Christopher Nolan", "role": "director" },
      { "name": "Leonardo DiCaprio", "role": "actor" }
    ],
    "content_rating": { "nsfw": false, "rating": "PG-13", "warnings": [] }
  }
}
```

## License

MIT
