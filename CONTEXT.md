# New Model Smell

An immersive, dryly comic web experience about how recently AI companies have released new models. It frames AI model releases as luxury vehicle launches and release recency as fading new-model freshness.

## Language

**Release Age**:
The time elapsed since an AI model's Public Availability Date.
_Avoid_: AI time, clock time

**Model Freshness**:
The comic interpretation of Release Age: a newly released model is fresh, and its freshness fades as its Release Age grows.
_Avoid_: Model quality, model performance

**New Model Motors**:
The fictional luxury-motoring world in which AI model releases are treated as new vehicle launches.
_Avoid_: Freshness lab, fragrance house, fresh model market

**Model Vehicle**:
The shared fictional concept-car design used to represent a Flagship Model. Each Flagship Model visible in a lineup is represented by an instance of the Model Vehicle.
_Avoid_: Company car, real production car

**Company Trim**:
A company-specific transformation of the Model Vehicle using an original New Model Motors visual identity. Company Trims are versions of the same vehicle, not separate vehicles.
_Avoid_: Company Vehicle, car brand

**Tracked Company**:
An AI company represented by a Company Trim. The initial Tracked Companies are OpenAI, Anthropic, and Google.
_Avoid_: Car manufacturer, automotive brand

**Flagship Model**:
A Tracked Company's highest-capability, general-purpose model that it publicly positions as its leading model. Mini, budget, specialized, private-preview, and minor point-update models are excluded.
_Avoid_: Best model, latest model, newest model

**Flagship Lineup**:
The set of coequal Flagship Models currently offered by a Tracked Company. A Flagship Lineup contains one or more models, and each model keeps its own Release Age.
_Avoid_: Current Flagship, latest model

**Flagship Launch**:
The Public Availability Date on which a Flagship Model enters a Flagship Lineup and starts that model's Model Freshness.
_Avoid_: Product update, model announcement

**Public Availability Date**:
The first date on which an ordinary customer can use a model through an official product or API without a private invitation. Paid access and openly available previews qualify; announcements, waitlists, and invite-only previews do not.
_Avoid_: Announcement date, general-availability date

**Motor Town**:
The small explorable driving world containing the Tracked Companies' separate Dealerships, roads, and incidental playful destinations.
_Avoid_: Motor District, campus, open world

**Dealership**:
A Tracked Company's dedicated building in Motor Town.
_Avoid_: Company page, company wing

**Showroom**:
The interior exhibition space of a Dealership in which visitors encounter and choose vehicles representing that company's Flagship Lineup.
_Avoid_: Model list, shared showroom

**Inspector Cart**:
The visitor's small default vehicle for traveling through Motor Town and exploring Dealerships before choosing a Model Vehicle.
_Avoid_: Player avatar, walking mode, free camera

**Drive-Out**:
The visitor-controlled act of steering a selected Model Vehicle out of its Dealership. A Drive-Out selects the corresponding Flagship Model and returns the visitor to Motor Town in that vehicle.
_Avoid_: Automatic transition, drive-out cutscene

**Active Flagship**:
The Flagship Model represented by the Model Vehicle the visitor is currently driving after a Drive-Out. Content Destinations respond to the Active Flagship.
_Avoid_: Selected car, active vehicle

**Content Destination**:
A shared place in Motor Town where visitors reveal one category of information about the Active Flagship.
_Avoid_: Menu item, content portal

**Dyno Lab**:
The Content Destination for benchmark evidence about the Active Flagship.
_Avoid_: Benchmark page, leaderboard

**Comparable Benchmark**:
A benchmark result produced from the same evaluation source, version, and conditions as another model's result. Only Comparable Benchmarks may be shown as direct competition.
_Avoid_: Normalized score, estimated score, cross-benchmark ranking

**Benchmark Record**:
A curated benchmark result identified by benchmark name and version, score and unit, evaluator, evaluation date, source URL, provenance, and relevant comparison caveats.
_Avoid_: Unsourced score, generated score

**Dyno Sheet**:
The manually curated set of Benchmark Records presented for an Active Flagship. It includes rival results only when they are Comparable Benchmarks; otherwise it presents the model's result alone.
_Avoid_: Overall score, universal ranking

**Drive-In**:
The Content Destination for articles about the Active Flagship.
_Avoid_: Article page, news feed

**Model Article**:
A published source whose primary subject is a Flagship Model, such as an official launch post, system card, independent evaluation, or technical analysis. Rumors, general company news, and incidental mentions are excluded.
_Avoid_: Company news, AI news, rumor

**Drive-In Program**:
The manually curated set of Model Articles presented for the Active Flagship at the Drive-In.
_Avoid_: News feed, company feed

**Screening**:
The Drive-In presentation of a Model Article, containing its title, source, publication date, type, a short original synopsis, and a link to the external original. It does not reproduce the full article.
_Avoid_: Article copy, embedded article, scraped content

**Model Dossier**:
The readable information experience opened from a Content Destination for the Active Flagship.
_Avoid_: Model page, details page
