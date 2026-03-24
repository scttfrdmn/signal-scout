What it is

Signal Scout is an internal BD prospecting tool for ENSO. It surfaces organizations that are at a moment where ENSO's brand strategy and creative production work becomes necessary — pre-IPO companies without a story, consumer brands entering a new cultural moment, coalitions that need creative work to realize their mission, not just describe it.

How it works technically

It's a single-file React component (signal-scout-v1a.jsx) that runs entirely in the browser. When a user hits "Run Scan," it makes a POST request directly to api.anthropic.com/v1/messages using the Anthropic Messages API with the web search tool enabled. The model runs 7 targeted web searches across sources like Fast Company, Ad Age, Semafor, TechCrunch, and Bloomberg, then returns structured results parsed by the frontend. No backend. Currently auth is handled automatically by Claude's artifact environment — the API key is injected by the host.

Each scan returns 5–8 results. Each result contains: a plain-language Opportunity statement, a Signal (exact fact), Why ENSO (the brand gap), Decision Maker, Source URL, and Urgency. Scan history, seen organizations, and pursuit status (Pursuing / Watch / Passed) are all stored in localStorage.

How people use it

A strategist opens the tool, optionally types a focus area (e.g. "climate infrastructure" or "civic campaigns"), hits Run Scan, and reviews results. They mark each result as Pursuing, Watch, or Passed. The tool deduplicates against previously seen organizations so repeat scans surface new signals. There's an Export function for sharing results and a Slack canvas export in the current build.

What needs to happen for hosted + authenticated + pipeline connected

Right now the tool has no backend, no auth, and no external data connections. To make it production-ready you'd need to:

Move the API key server-side. Currently the Anthropic API key is browser-injected. In a hosted version it should live in a backend proxy — the frontend calls your server, your server calls Anthropic. This keeps the key off the client entirely.
Add Google auth. Standard OAuth flow. The tool has a username field currently used only for tagging scan IDs — that would be replaced by the authenticated user's identity.
Replace localStorage with a database. Scan history, org statuses, and seen companies are all in localStorage today. For a shared team tool they need to live server-side, scoped by user and team.
Connect to the ENSO Pipeline. The tool currently tracks pursuit status locally. "Connect to Pipeline" means writing org status changes (Pursuing / Watch / Passed) and result metadata back to whatever system ENSO uses to manage BD pipeline — likely a CRM or project management tool. The data model is simple: org name, signal type, decision maker, source, date surfaced, status, assigned to.
The frontend logic, prompt, and parsing are all stable and working. The surface area for the engineering work is the backend, auth layer, and pipeline integration — the React component itself needs minimal changes beyond pointing API calls at your proxy instead of Anthropic directly.


