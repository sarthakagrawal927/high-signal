# Market and OSS Research

Built on top of `SPEC.md` (verified 2026-04-05). Scope: signal intelligence for companies and sectors.

---

## 1. Market Deltas Since 2026-04-05

Limited to verified moves in or directly adjacent to the High Signal wedge.

1. **AlphaSense — $500M+ ARR confirmed, new CFO, raising "hundreds of millions" at >$4B** (Apr 14, 2026). Now owns 90% of S&P 100 / 70% of S&P 500 as customers. Wedge implication: enterprise top is locked. [Fortune](https://fortune.com/2026/04/14/exclusive-alphasense-names-new-cfo-as-revenue-tops-500-million/) · [Bloomberg](https://www.bloomberg.com/news/articles/2026-03-24/alphasense-said-to-seek-hundreds-of-millions-in-fresh-funding)

2. **Rogo — acquired Offset (Mar 13, 2026)** to bring AI agents with persistent memory of how financial models are built/updated into the workflow layer. Plus March product update shipped "Screenings" (deterministic search across companies, transactions, Crunchbase) and shared Projects. [PR Newswire](https://www.prnewswire.com/news-releases/rogo-acquires-offset-to-bring-ai-agents-into-financial-workflows-302713749.html) · [Rogo blog](https://rogo.ai/news/march-product-update)

3. **Daloopa — MCP connector for OpenAI ChatGPT** (launched Dec 2025, expanded thru Q1 2026). Hyperlinked, fully-sourced fundamentals piped directly into agent contexts; benchmark report (Feb 10, 2026) showed +71pp accuracy vs public-web grounding. Direct threat to "research copilot grounded in filings." [PR Newswire](https://www.prnewswire.com/news-releases/daloopa-expands-financial-data-model-context-protocol-mcp-through-a-new-connector-with-openai-302636805.html)

4. **Dataminr — launched Dataminr for Cyber Defense (Mar 2026)**, first product fusing ThreatConnect acquisition. PreGenAI (predictive intelligence agents) on the 2026 roadmap. Drift toward physical/cyber, not company futures — vacates wedge. [Dataminr](https://www.dataminr.com/press/announcement/dataminr-redefines-cyber-defense/)

5. **Brightwave — shipped "Research Agents" + Report Builder/Blueprints** for private market investors (early 2026). Continues pushing the autonomous-agent-fleet model rather than versioned signal memory. [Brightwave](https://www.brightwave.io/)

6. **Wand AI × Accern — combined entity active**, no new product launches since acquisition close (Aug 2025). Accern's no-code NLP taxonomy lenses now feeding Wand's agentic platform. Watch but not imminent. [Wand AI](https://wand.ai/blog/wand-ai-acquires-accern-expanding-real-time-data-capabilities)

7. **Quartr — 3 of top-5 hedge funds + 2 of Mag-7 on API**, fully-backed $10M (Jul 2025) extending into 2026. NY/Dublin offices. Cementing IR/transcript source layer; upstream of any signal product. [Quartr press](https://quartr.com/newsroom/press-release/quartr-raises-10m-to-deepen-its-leadership-in-qualitative-public-market-research)

8. **Hebbia — $130M Series B at $700M val + mobile rollout (late 2025, GA Nov 2025)**. Document-deep-dive direction. Not signal-shaped, but consumes attention from same buyer. [Hebbia](https://www.hebbia.com/)

Net read: heavy money is flowing into source-layer monopolies (Daloopa, Quartr) and agent-research workspaces (Rogo, Brightwave, Hebbia, AlphaSense). Nobody shipped a versioned-signal-memory or spillover-graph product in this window.

---

## 2. Open-Source Options Worth Knowing

All star/license/last-commit verified via direct GitHub fetch on 2026-04-25 unless noted.

### Financial NLP / domain models

- **[FinGPT](https://github.com/AI4Finance-Foundation/FinGPT)** — 19.8k, MIT, active. Sentiment, headline classification, NER, RAG over financial news. LoRA-tunable on consumer GPU. Strongest open finance LLM stack.
- **[FinNLP](https://github.com/AI4Finance-Foundation/FinNLP)** — 1.4k, MIT. Internet-scale financial data pipelines (US + China sources). Pairs with FinGPT.
- **[FinRL](https://github.com/AI4Finance-Foundation/FinRL)** — 14.9k, MIT, last release Mar 20, 2026. RL trading framework. Useful for backtest harness, less for signal extraction.
- **[FinBERT (ProsusAI)](https://github.com/ProsusAI/finBERT)** — 2.1k, Apache-2.0. Pretrained sentiment model on financial communications. Stable, low-friction baseline.

### Entity / event / relation extraction

- **[GLiNER](https://github.com/urchade/GLiNER)** — 3.1k, Apache-2.0, last release Mar 19, 2026. Zero-shot NER on CPU. Define entity types as text strings, no schema lock-in. Best fit for "extract any company/product/person from a feed."
- **[GLiREL](https://github.com/jackboyla/GLiREL)** — relation extraction sibling to GLiNER. Pair them for triples.
- **[REBEL](https://github.com/Babelscape/rebel)** — 562, CC BY-SA-NC 4.0 (NC kills commercial use — read carefully). Seq2seq end-to-end relation triplets, 200+ relation types, multilingual mREBEL. Good for prototyping graph edges.
- **[spaCy](https://github.com/explosion/spaCy)** — 33.5k, MIT, active. Industrial NER pipeline. Use as glue, not primary model.

### News ingestion / web extraction

- **[Trafilatura](https://github.com/adbar/trafilatura)** — 5.8k, Apache-2.0 (older versions GPLv3). Best-in-class article extraction; used by HuggingFace, Stanford, Allen AI corpora. Multilingual.
- **[Newspaper4k](https://github.com/AndyTheFactory/newspaper4k)** — 1.1k, MIT/Apache-2.0, last commit Feb 28, 2026. Active fork of newspaper3k (which is dead). Article + metadata + keywords.
- **[Scrapy](https://github.com/scrapy/scrapy)** — 61.5k, BSD-3, active. Full crawling framework. Heavier than needed unless you're scaling to thousands of feeds.

### Filings / fundamentals

- **[edgartools](https://github.com/dgunning/edgartools)** — 2.1k, MIT, last release Apr 15, 2026. Cleanest SEC EDGAR Python lib. Parses 8-Ks (events!), 10-K/Q financials, insider trades, fund holdings. No API key, no rate caps.
- **[OpenBB](https://github.com/OpenBB-finance/OpenBB)** — 66.5k, AGPLv3 (license is sticky — read before bundling). Multi-source fundamentals + macro + crypto + AI agent integrations via MCP servers. Last release Apr 25, 2026.

### Knowledge graph / embeddings

- **[NetworkX](https://github.com/networkx/networkx)** — 16.8k, BSD-3. The default Python graph lib. Use for the entity-relationship layer until scale forces Neo4j.
- **[PyKEEN](https://github.com/pykeen/pykeen)** — 2.0k, MIT. Train and evaluate KG embeddings (TransE, ComplEx, RotatE, etc.). Pair with NetworkX for spillover prediction.
- **[AmpliGraph](https://github.com/Accenture/AmpliGraph)** — 2.2k, Apache-2.0, AmpliGraph 2 in TF2/Keras. Same niche as PyKEEN; pick one.

### Backtest / signal evaluation

- **[VectorBT](https://github.com/polakowo/vectorbt)** — 7.3k, Apache-2.0 + Commons Clause (no reselling). Fast vectorized backtester. Free version maintenance-only; PRO behind paywall.
- **[Backtrader](https://github.com/mementum/backtrader)** — 21.3k, GPL-3.0. Mature but unmaintained since 2019. Use only for reference patterns.
- **[zipline-reloaded](https://github.com/stefan-jansen/zipline-reloaded)** — 1.6k. Community fork of Zipline, Stefan Jansen maintains. Limited active dev.

### Agent / RAG framework

- **[LangChain](https://github.com/langchain-ai/langchain)** — 135k, MIT, active (Apr 24, 2026). Default for chaining; bloat tradeoff.
- **[LlamaIndex](https://github.com/run-llama/llama_index)** — 48.9k, MIT, last release Apr 21, 2026. Pivoted to "document agent + OCR platform." Better fit than LangChain when filings are the core source.
- **[Haystack](https://github.com/deepset-ai/haystack)** — 25k, Apache-2.0, last release Apr 20, 2026. Pipeline-first, more explicit retrieval/routing/memory than LangChain. Used by Apple/Meta/Databricks/Netflix.

Picks for High Signal MVP: **edgartools + Trafilatura + GLiNER + GLiREL + NetworkX + LlamaIndex + FinBERT for sentiment baseline + VectorBT for hit-rate backtest.** Skip OpenBB (AGPL contagion) and REBEL (non-commercial).

---

## 3. Strategic Gaps — One Wedge for 8 Weeks Solo

The SPEC's "What Still Looks Open" list flags five gaps. Three are saturated by deltas above:
- evidence-linked outputs (Daloopa, Brightwave own this)
- agent workflows (Rogo, AlphaSense, Hebbia)
- domain-specific connectors (enterprise moats locked)

Two remain genuinely open:
- **clean spillover mapping** (event -> direct -> peers/suppliers/customers -> 2nd-order)
- **versioned signal hit-rate tracking by signal type** (every research copilot is one-shot summary; nobody is logging "this signal type, in this sector, hit X% directional accuracy over 90 days")

### The pick: **Spillover Cards + Versioned Hit-Rate Ledger, scoped to AI infra / semiconductors, weekly horizon, retail-prosumer + sector analyst buyer.**

Why this is the right 8-week wedge for a solo dev:

The big incumbents have decided their wedge is "answer any question over enterprise data with citations." None of them are building a graph that says "NVDA cut H100 lead times → here are the 11 second-order names that historically move within 5-10 days, here's the 2024-2025 base rate, here's the 2026 set of likely beneficiaries with confidence." Daloopa hands AI agents structured fundamentals; Quartr hands them transcripts; AlphaSense hands them everything — but **none expose the directed graph of who-moves-when, and none ship a versioned ledger of "did our last signal of this type actually pay off."** That gap is shippable in 8 weeks because the heavy lifting is OSS: edgartools for 8-K events, Trafilatura + Newspaper4k for ingestion, GLiNER+GLiREL for entity+relation extraction, NetworkX for the graph, a small hand-curated AI-infra peer-set seed (200 tickers max), and VectorBT to compute forward returns over each historical signal as the hit-rate baseline. The product surface is two things: a **Signal Card** (what changed, peer fan-out with predicted direction + confidence, evidence trail) and a **Track Record** page (every signal type vs. its rolling 90-day hit-rate, public, brutally honest). That honesty is the moat — every competitor hides hit-rates because they can't compute them on one-shot summaries; you can, because you version everything. AI infra is the right wedge because the entity graph is small, news-dense, retail attention is high, and spillover is the dominant alpha pattern (TSMC capex → ASML → HBM suppliers → cloud capex → power names). One market, one horizon, one buyer, one differentiator that nobody else can copy in under a quarter.

