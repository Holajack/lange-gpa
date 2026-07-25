# Nuri — Phase 1 Vocabulary Content Map for the 23 Empty Meetings

**Source of truth:** `/Volumes/LaCie/GPA_Language_Learning/research/phase1.txt` (Thomson, *The First Hundred Hours*, Meeting Plans 1–40), cross-checked against `research/knowledge-base/phase1.md`.
**Target file:** `/Volumes/LaCie/GPA_Language_Learning/src/lib/vocab.ts`
**Authored:** 2026-07-22

---

## 0. Ground truth as it stands today

Counted directly from `vocab.ts`: **28 domains, 245 items.**

| domain id | items | effective meeting |
|---|---|---|
| food | 12 | 8 (domain default) |
| animals | 12 | 1 |
| home | 12 | 2 |
| body | 10 | 5 |
| traveling | 10 | 37 |
| family | 8 | 5 |
| sport | 8 | 33 |
| health | 8 | 18 |
| nature | 10 | 14 |
| work | 8 | 32 |
| colors | 10 | 7 |
| numbers | 10 | 12 (one–ten only) |
| clothing | 10 | 9 |
| prepositions | 8 | 4 |
| emotions | 8 | 11 |
| tableware | 6 | 2 |
| tools | 7 | 11 |
| room | 6 | 3 |
| rooms | 4 | 8 |
| family-more | 6 | 5 |
| body-more | 8 | 5 |
| adjectives | 10 | 25 |
| states | 6 | 19 |
| insects | 5 | 12 |
| animals-more | 6 | 3 |
| nature-more | 7 | 14 |
| drinks-more | 2 | 8 |
| verbs | 28 | 33 |

Populated meetings: 1,2,3,4,5,7,8,9,11,12,14,18,19,25,32,33,37 — **not touched by this map.**

> **Gap noted, not filled (out of scope by instruction):** meetings 32, 33 and 37 count as "populated" but their *prescribed* content is only partly present. M32's paths-of-movement words (over/through/around/past), M33's times-of-day and transport sets, and M37's basic human movements are still missing. Where the guide re-runs that material in a later meeting I have picked it up there (M38 carries movement verbs, transport and directions; M34 carries times of day and meals). Flagged for the owner as a follow-up if he later wants 32/33/37 topped up.

---

## 1. Method and constraints applied

- **Depictable-only filter.** Every word below is an object, a demonstrable action, a visible attribute, a place, a person-role, a countable/quantity display, or a Lexicarry-style situation bubble. Words the guide names that fail this test are listed per-meeting under *Excluded*.
- **Pacing.** 29–38 new items per Meeting Plan (guide: ~7–8 new words per meeting-hour × 2–3 hour meetings). Denser meetings (13, 26, 30, 31, 34) are dense in the guide itself.
- **Localization honesty.** Post-Soviet / Central-Asian specifics in the guide (bread oven, Eastern toilet, gas bottle, riyals/fils, mosque-only town) are generalised: *oven*, *toilet*, *money/coin/banknote*, and a town that carries *church / mosque / temple* rather than one tradition.
- **Domain reuse over domain creation** where an existing domain already owns the concept. Existing domains that gain new items do so via **per-item `meeting:`** (which overrides `domain.meeting` in `effMeeting`), so the domain's own default stays intact.
- **Global id uniqueness.** Every id below is prefixed and checked against the 245 existing ids. Where a concept collides with an existing item the new item is dropped, not renamed (e.g. no second `water`, `shop`, `wash`, `read`, `listen`, `star`, `rope`, `nail`, `wrench`).

---

## 2. Summary table

| Meeting | Theme (guide's own terms) | New words | Domains touched |
|---|---|---:|---|
| 6 | Touch, look at, wash, pat, stroke, each other, yourself; body parts with possessors | 34 | **touch-actions**\*, **body-extra**\* |
| 10 | More verbs (listen, read, etc.), to/from, singular/plural, put on/take off | 35 | verbs, **smallthings**\* |
| 13 | Ordinal numbers, countries, nationalities, languages | 37 | **ordinals**\*, **geography**\*, **countries**\* |
| 15 | Want, have, see; emotions want to go places in the outdoors | 30 | **outdoors**\* |
| 16 | Nurturer understands to: body parts, family, objects (first talking meeting) | 30 | **expressions**\*, family-more |
| 17 | Speaking: body parts, possessives, objects, countryside; restaurant Lexicarry | 30 | **restaurant**\*, **foods-more**\* |
| 20 | Continue neighbourhood places | 34 | **town**\* |
| 21 | Verbs to do with a box (open, close, drop, push, etc.) | 33 | verbs, **containers**\* |
| 22 | More household objects and actions (lamp, radio, peel, turn on/off) | 34 | **appliances**\*, verbs |
| 23 | Cut out (emotions & people around town) | 34 | emotions, **people**\*, verbs, smallthings |
| 24 | Question words | 32 | **questions**\*, verbs, town |
| 26 | Shapes, lengths, grammar-focused activities | 36 | **shapes**\*, adjectives |
| 27 | Quantities | 34 | **quantities**\*, **toiletries**\*, verbs |
| 28 | Rooms in house, end/beginning, was born in, grew up in | 36 | rooms, **furnishings**\*, verbs, quantities |
| 29 | Water-related words (full, wet, etc.), doesn't have | 31 | **water-words**\*, verbs, containers |
| 30 | Days of week, months, today/tomorrow, telling time | 37 | **days**\*, **time-of-day**\*, **months**\* |
| 31 | Wall, together, separate, can/can't, large numbers, money, buy, sell, seasons | 38 | numbers, **money**\*, **seasons**\*, **weather**\*, adjectives |
| 34 | More actions (cough, sneeze); seeing, hearing, tasting, smelling; times of day | 37 | **senses**\*, verbs, time-of-day |
| 35 | Double-action commands; new objects and actions; occupations, marketplace | 36 | **occupations**\*, tools, outdoors |
| 36 | New Activity Re-Run, Refreshing, Filling In Gaps! | 34 | **materials**\*, **worship**\*, **school**\*, clothing |
| 38 | False statements, negative commands; "How do you travel?" | 33 | verbs, traveling, **directions**\* |
| 39 | Relative clauses; general words and plurals; Power Tools for Phase 2 | 34 | **meta-words**\*, people, expressions, verbs |
| 40 | Negations, verbs (bend, break, fold, etc.) | 33 | verbs, adjectives, smallthings |
| | **TOTAL NEW** | **782** | |

\* = new domain proposed in §4.

**Running total: 245 existing + 782 new = 1,027 words** — clears the guide's 1,000-word floor for the end of Phase 1 and sits inside the 1,000–1,200 band.

---

## 3. Meeting-by-meeting content

### Meeting 6 — "Touch, look at, wash, pat, stroke, each other, yourself" (34)
*Guide games:* Game 1 actions to places in the room; Game 2A–2D pat/stroke/wash done to him/them/me/each other/yourself; Game 3 body parts with my/your/his; Game 4 "stroking his brother's foot" — family × body part × action.

**`touch-actions` (new) — 17**
pat · stroke · rub · tickle · scratch · wipe · dry off · comb (hair) · brush (hair) · wave · clap · shake hands · hold hands · tap · hide · cover · kneel

**`body-extra` (new) — 17**
elbow · chin · cheek · forehead · lip · tongue · throat · chest · wrist · ankle · thumb · toe · beard · eyebrow · fingernail · waist · heel

*Excluded:* **me / him / them / us / each other / yourself / my / your / his** — pronouns and possessives; the guide teaches them by contrast inside a live game, they cannot be a single picture card. **wash** — already exists (`wash`, health).

---

### Meeting 10 — "More verbs (listen, read, etc.), to, from, singular/plural" (35)
*Guide games:* Game 1 "bee's wing, pot's lid"; Game 3 Rough-and-Ready Dozen of listen/read/think/chew/play/work/write/sleep/wake up/swallow/draw/erase; Game 5 to/from with candies, matches, buttons; Game 6 singular/plural; Game 8 put on / take off.

**`verbs` (existing, `meeting: 10`) — 12**
chew · swallow · bite · play · work · think · wake up · erase · put on · take off · lick · spit out

*(listen, read, write, draw, sleep, eat, drink already exist — deliberately not duplicated.)*

**`smallthings` (new) — 23**
candy · match · button · bead · coin (as an object; the *money* sense is M31) · string · eraser · pencil · notebook · envelope · stamp · ribbon · pin · needle · thread · glue · sticker · rubber band · lid · wing · handle · feather · shell

*Excluded:* **to / from** (grammatical case markers — the guide's own game strips them of any picture); **singular/plural** (a form contrast, not a word).

---

### Meeting 13 — "Ordinal numbers, countries, nationalities, languages" (37)
*Guide games:* Game 3 first/second/third with a line of ten mice; Game 4 world map — countries, continents, ocean, north/south/east/west, city, capital; Games 5–7 nationalities and languages; Game 8 large numbers with money; Game 9 Number Bingo.

**`ordinals` (new) — 12**
first · second · third · fourth · fifth · sixth · seventh · eighth · ninth · tenth · last · middle

**`geography` (new) — 15**
world · country · continent · ocean · island · desert · north · south · east · west · city · village · capital · border · flag

**`countries` (new) — 10** *(taught by pointing at a world map; flag emoji as card art)*
China · India · United States · Brazil · Russia · France · Germany · Japan · Egypt · Indonesia

*Excluded:* **nationalities** (American, Indian, Russian…) and **language names** — as picture cards they collapse into the same flag image as the country and would be indistinguishable in a point-at-the-picture deck; **nationality**, **foreigner**, **passport** as concepts (passport is depictable but is a Phase-2 travel word, not a Phase-1 map word).

---

### Meeting 15 — "Want, have, see" (30)
*Guide games:* Games 1–4 want/have/see mixed with give/take over every manipulable object so far; **Game 5 "People with emotions want to go places in the outdoors"** — the emotion cards are placed into a countryside scene, which is where this meeting's genuinely new nouns live.

**`outdoors` (new) — 30**
valley · field · waterfall · beach · cave · rock · sand · mud · path · bridge · fence · well · pond · cliff · rainbow · wind · storm · thunder · lightning · fog · shadow · hole · bush · leaf · branch · seed · nest · mushroom · stick · log

*Excluded:* **want** and **see** — already exist (`verb-want`, `verb-see`). **have** — no picture distinguishes "has a ball" from "holds a ball"; the guide teaches it purely as a yes/no exchange over a bag of objects, so it is a game mechanic, not a card.

---

### Meeting 16 — "Your nurturer understands to: body parts, family, objects" (30)
*Guide games:* Game 2 Lexicarry p.4 — offering and refusing food, offering/accepting help, requesting help; Game 3 GPs name a model's body parts; **Game 4 GPs describe their families**; Game 5 "ladder of success" (production of already-known words — no new vocabulary).

**`expressions` (new) — 22** *(Cartoon-Bubble situations; each is a depictable two-person scene, which is exactly how the guide teaches them)*
hello · goodbye · good morning · good night · please · thank you · you're welcome · sorry · excuse me · yes · no · welcome · congratulations · be careful · help me · come in · no thank you · here you are · good · bad · again · enough

**`family-more` (existing, `meeting: 16`) — 8**
uncle · aunt · cousin · nephew · niece · parents · children · neighbour

*Excluded:* nothing of substance — M16 is a talking meeting; its new load is deliberately light and social.

---

### Meeting 17 — "Speaking: body parts, possessive pronouns, objects, countryside" (30)
*Guide games:* Game 2 Lexicarry p.5 — ordering food in a restaurant, asking for the check, comforting someone; Game 5 talk about the countryside; Game 6 names and ages.

**`restaurant` (new) — 10**
restaurant · café · waiter · menu · bill · tray · napkin · glass · bottle · jug

**`foods-more` (new) — 20**
meat · vegetable · fruit · salad · cake · sugar · salt · pepper · oil · butter · onion · potato · carrot · beans · grapes · honey · melon · corn · garlic · yoghurt

*Excluded:* **"How old are you?" / "What is your name?"** — these belong to `expressions` conceptually but are questions about a person, not a scene; the question words themselves are taught properly at M24. **age**, **name** as abstract nouns → `name` lands at M39 as a meta-word.

---

### Meeting 20 — "Continue neighbourhood places" (34)
*Guide game 4:* "Add 1–2 sets of new items in the neighbourhood/town using the Rough-and-Ready Dozen." M19 Game 6 asks for **twenty to forty** new town items and explicitly says the activity will not be finished in that meeting — so the town deck belongs here.

**`town` (new) — 34**
street · sidewalk · market · bakery · pharmacy · school · bank · post office · police station · fire station · library · museum · park · bus stop · train station · airport · hotel · church · mosque · temple · cemetery · factory · office · garage · petrol station · barber shop · butcher shop · bookshop · toy shop · grocery shop · traffic light · streetlight · bench · gate

*Excluded:* **apartment building** (folded into `house`); **electric shop / light post / bread oven** as guide-specific items → generalised above.

---

### Meeting 21 — "Verbs to do with a box (open, close, drop, push, etc.)" (33)
*Guide game 4:* jar and box — open, close, drop on purpose, drop accidentally, push, pull, turn, turn over, roll, spin, lift, throw; optionally say/speak/talk. Game 1 Lexicarry p.8 adds dead/alive.

**`verbs` (existing, `meeting: 21`) — 17**
drop · roll · spin · turn over · tip over · shake · lift · put down · pick up · say · talk · shout · whisper · bounce · slide · stack · swing

*(open, close, push, pull, turn, throw already exist.)*

**`containers` (new) — 16**
box · jar · can · bucket · basket · bag · sack · purse · barrel · tin · crate · tub · flask · carton · can opener · pot lid

*Excluded:* **dead / alive** — the guide attaches them to a condolence bubble; not appropriate as picture-deck cards for a general audience and not cleanly depictable. **drop on purpose vs. drop accidentally** — one card (`drop`); the contrast is a live-game distinction, not two pictures.

---

### Meeting 22 — "More household objects and actions (lamp, radio, objects, peel, turn on/off)" (34)
*Guide game 3:* "a hodgepodge of new words" — appliances that can be switched on and off, plus peel/charge/call/measure/weigh/borrow/steal/take a picture/watch/listen/answer/evaluate.

**`appliances` (new) — 21**
radio · television · fan · air conditioner · heater · fridge · stove · oven · washing machine · vacuum cleaner · blender · kettle · iron · hairdryer · camera · torch · battery · plug · switch · remote control · microwave

**`verbs` (existing, `meeting: 22`) — 13**
turn on · turn off · peel · charge · call · measure · weigh · borrow · lend · steal · take a photo · watch · answer

*Excluded:* **evaluate** — abstract, no picture.

---

### Meeting 23 — "Cut out" (34)
*Guide games:* Game 4 GPs cut out faces (feelings, nationalities) behind a barrier while the nurturer narrates; Games 5–7 place those people around the town and the countryside and describe the scene.

**`emotions` (existing, `meeting: 23`) — 10**
excited · bored · worried · proud · shy · confused · calm · embarrassed · nervous · curious

**`people` (new) — 12** — *the guide says "the sad man", "the happy woman", "the crying person" on every page from here to M40, and the app has no word for **man**, **woman** or **person** at all.*
man · woman · person · child · boy (exists) → replaced by: teenager · old man · old woman · young man · young woman · crowd · guest · host · stranger · neighbour-person → **final 12:** man · woman · person · child · teenager · old man · old woman · young man · young woman · crowd · guest · stranger

**`verbs` (existing, `meeting: 23`) — 4**
cut out · glue (paste) · trace · colour in

**`smallthings` (existing, `meeting: 23`) — 8**
cardboard · paint · paintbrush · crayon · marker · chalk · ruler · sticky tape

*Excluded:* nothing new — the meeting's nationality cards are already ruled out at M13.

---

### Meeting 24 — "Question words" (32)
*Guide game 4:* who, what, where, what kind of, how many, why, because, and optionally whose / to whom / in what / with whom / for whom, taught by pointing at a busy town scene.

**`questions` (new) — 12** *(card art is an icon of the answer-type: 👤 for who, 📍 for where, 🕐 for when, 🔢 for how many …)*
who · what · where · when · why · how · how many · how much · which · whose · what kind of · because

**`verbs` (existing, `meeting: 24`) — 8**
lie down · crouch · lean · chase · wait · follow · meet · point at (exists) → replaced by: **stare**
→ final: lie down · crouch · lean · chase · wait · follow · meet · stare

**`town` (existing, `meeting: 24`) — 12**
corner · square · alley · roundabout · car park · market stall · taxi rank · pavement crossing · postbox · rubbish bin · fountain · statue

*Excluded:* **to whom / in what / with whom / for whom** — case-marked question phrases with no distinct picture. Note in the authoring brief: the 12 question words are the one set in this map that are *iconographic* rather than photographable; they are included because the guide devotes a whole Meeting Plan to them and the owner named them explicitly.

---

### Meeting 26 — "Shapes, lengths, grammar-focused activities" (36)
*Guide games:* Game 5 — crooked, straight, curved, long, short, tall, short, high, low, round, square, triangle, down, up, far, close; Game 6 long/short with yarn, paper, pencil, cloth in colours; Game 7 "What kind of?".

**`shapes` (new) — 16**
circle · square · triangle · rectangle · oval · line · dot · cross · arrow · straight · crooked · curved · edge · centre · side · tip

**`adjectives` (existing, `meeting: 26`) — 20**
tall · low · high · wide · narrow · thick · thin · deep · shallow · far · near · slow · light (in weight) · round · flat · empty-of-shape → replaced by: **crowded**
→ final 20: tall · low · high · wide · narrow · thick · thin · deep · shallow · far · near · slow · light · round · flat · crowded · together · separate · same · different

*(long, short, big, small, heavy, fast, old, new, hot, cold already exist. "together / separate / same / different" are placed here rather than at M31 because they are pure two-object visual contrasts and M31 is already the heaviest numeric meeting.)*

*Excluded:* **yarn / cloth** as materials → land at M36 (`materials`).

---

### Meeting 27 — "Quantities" (34)
*Guide game 5:* a few, many, most, all, more, less, one of them, two of them, some, a little, any, each, every, someone, everyone, no one, nothing — shown with a pile of beans, dolls, and glasses of water, flour and rice. Game 6 "wanting things in the town".

**`quantities` (new) — 21**
many · few · a lot · a little · more · less · all · some · none · each · every · half · whole · enough · both · pair · piece · slice · bunch · pile · drop

**`toiletries` (new) — 10** *(the guide's M19/M27 "I'm dirty → take the washcloth" objects, which the town-shopping game also needs)*
soap · toothpaste · shampoo · comb · razor · perfume · tissue · washcloth · hairbrush · nail clippers

**`verbs` (existing, `meeting: 27`) — 3**
count · share · divide

*Excluded:* **someone / everyone / no one / nothing / anything / any** — indefinite pronouns; the guide teaches them inside the bean-pile game but no single picture distinguishes "someone" from "a person". **most** — folded into "a lot"/"all"; a superlative has no stable picture.

---

### Meeting 28 — "Rooms in house, end/beginning, was born in, grew up in, more countries" (36)
*Guide games:* Game 4A rooms + go into / leave; Game 4B more furnishings; Game 5 quantities with town and country drawings, adding "the end of the lake, the beginning of the sidewalk"; Game 6 "Where does one go to buy / sell…".

**`rooms` (existing, `meeting: 28`) — 12**
hallway · entryway · guest room · dining room · storeroom · basement · attic · balcony · courtyard · garden → moved to M35; replaced by **terrace**
→ final 12: hallway · entryway · guest room · dining room · storeroom · basement · attic · balcony · courtyard · terrace · indoors · outdoors

**`furnishings` (new) — 18**
sofa · cupboard · wardrobe · drawer · rug · curtain · mirror · pillow · blanket · sink · toilet · shower · bathtub · tap · clothesline · broom · dustpan · ladder

**`verbs` (existing, `meeting: 28`) — 4**
enter · leave · buy · sell

**`quantities` (existing, `meeting: 28`) — 2**
beginning · end

*Excluded:* **was born in / grew up in** — tense-marked biographical predicates, no picture; the guide teaches them purely as map talk. **Eastern toilet / round bread oven / gas bottle** — guide-local; generalised to *toilet*, *oven* (M22), and dropped respectively.

---

### Meeting 29 — "Water-related words (full, wet, etc.), doesn't have" (31)
*Guide game 4 "Water, water everywhere":* full, empty, half full, wet, dry, cold, hot, dripping, splashing, drips, ice, melting, warm, boiling, cool, spill, flow, puddle. Game 5 Actions Charades over every action learned so far.

**`water-words` (new) — 22**
full · empty · half full · wet · dry · damp · dripping · splashing · ice · melting · boiling · warm · cool · spill · flow · puddle · steam · bubble · foam · freeze · leak · soak

**`verbs` (existing, `meeting: 29`) — 8** *(household work actions the charades game needs; the guide named iron/vacuum/clean/brush at M18 Game 4B but they were never authored)*
fill · sweep · mop · iron · vacuum · scrub · hang up · sew

**`containers` (existing, `meeting: 29`) — 1**
pitcher

*Excluded:* **doesn't have / doesn't** — negation is a form, not a card (see M38/M40 exclusions).

---

### Meeting 30 — "Days of week, weather, numbers 11–20 / months, today, tomorrow, telling time" (37)
*Guide games:* Game 6 days of the week, yesterday/today/tomorrow, day before yesterday, day after tomorrow, months, week/month/year, next/last, weekend, holiday, birthday; Game 8 telling time with a movable-hand clock.

**`days` (new) — 15**
Monday · Tuesday · Wednesday · Thursday · Friday · Saturday · Sunday · today · tomorrow · yesterday · week · weekend · day · night · calendar

**`time-of-day` (new) — 10**
hour · minute · o'clock · half past · quarter past · morning · afternoon · evening · noon · midnight

**`months` (new) — 12**
January · February · March · April · May · June · July · August · September · October · November · December

*Excluded:* **next / last (week, year)**, **early / late**, **now / soon** — relative time deixis; not depictable on a single card. (early/late are reconsidered and dropped rather than forced.) **the day before yesterday / the day after tomorrow** — multi-word deictic phrases, no card.

---

### Meeting 31 — "Wall, together, separate, can, can't, because, large numbers, money, buy, sell" (38)
*Guide games:* Game 3 wall/together/separate/same side + can/can't/because; **Game 4 "Strengthen higher numbers"** — 11–20, 20–100, 200/300, thousand, million, count, "How many?"; Game 5 buying and selling books, introducing *pay*; Game 6 the four seasons with weather pictures.

**`numbers` (existing, `meeting: 31`) — 20**
eleven · twelve · thirteen · fourteen · fifteen · sixteen · seventeen · eighteen · nineteen · twenty · thirty · forty · fifty · sixty · seventy · eighty · ninety · one hundred · one thousand · zero

**`money` (new) — 8**
coin · banknote · price · change · wallet · receipt · cheap · expensive

**`seasons` (new) — 5**
spring · summer · autumn · winter · season

**`weather` (new) — 5**
weather · thermometer · sunny · cloudy · umbrella

*(rain, snow, sun, cloud, wind, storm, fog already exist across `nature`, `nature-more` and `outdoors`.)*

*Excluded:* **can / can't / because** — modal and connective; `because` is however included at M24 with the question words, where the guide pairs it with "why?" and it can carry a cause-and-effect two-panel card. **million** — dropped; beyond any picture a grower can verify by counting. **riyals / dinars / fils / pesos** — guide-local currencies, generalised to *coin / banknote / money*.

---

### Meeting 34 — "More actions (cough, sneeze)" (37)
*Guide games:* Game 3 seeing / hearing / tasting / smelling — sour, salty, sweet, bitter, spicy, fragrant, smooth (Lexicarry p.78 tastes and smells, p.79 textures); Game 5 cough, sneeze, breathe in, breathe out, wink, spit, blow your nose, smile, frown, kiss, hug; Game 7 people and times of day (dawn, breakfast, prayer times).

**`senses` (new) — 18**
hear · taste · smell · sweet · sour · salty · bitter · spicy · fragrant · smelly · delicious · loud · quiet · bright · dark · soft · rough · sticky

*(hard and smooth are dropped in favour of `adjectives` at M26 carrying `flat`/`round`; `soft` and `rough` are kept here as the guide's own texture pair.)*

**`verbs` (existing, `meeting: 34`) — 13**
cough · sneeze · breathe in · breathe out · yawn · wink · blink · spit · blow your nose · smile · frown · kiss · hug

**`time-of-day` (existing, `meeting: 34`) — 6**
dawn · sunrise · sunset · breakfast · lunch · dinner

*Excluded:* **ownership words (mine, hers, whose)** from Game 8 — possessive pronouns; `whose` is already carried as a question word at M24.

---

### Meeting 35 — "Double-action commands; new objects and actions" (36)
*Guide game 8:* "Filling out the basic set of names of outside objects and places" — 10–12 new items of the GPs' choice, explicitly suggesting **occupations (Lexicarry p.80)**, leaders, religious items, and job-specific objects. *Game 9 "Marketplace":* plumber, electrician, wire, pipe, bookshop, kitchen shop.

**`occupations` (new) — 20**
baker · butcher · barber · tailor · plumber · electrician · carpenter · driver · police officer · nurse · shopkeeper · customer · fisherman · mechanic · cleaner · guard · soldier · student · engineer · painter

*(teacher, farmer, cook, doctor already exist; waiter is at M17.)*

**`tools` (existing, `meeting: 35`) — 8**
wire · pipe · screw · drill · tape measure · shovel · axe · pliers

**`outdoors` (existing, `meeting: 35`) — 8**
yard · garden · chimney · pole · ditch · tent · barn · tractor

*Excluded:* **after / before / while** (Games 3–7) — clause connectives; the guide itself says these are for *understanding only* at this stage and they have no picture. **sheikh / king / president / judge** — political-religious roles that do not generalise across host worlds; `guard` and `soldier` carry the depictable part.

---

### Meeting 36 — "New Activity Re-Run, Refreshing, Filling In Gaps!" (34)
*Guide:* this meeting has **no prescribed content** — it is a "plan your own meeting" template whose stated purpose is to "live up to the hourly goal for new vocabulary" and fill gaps. I have used it exactly that way: the four everyday-life categories the deck still lacks entirely.

**`materials` (new) — 12**
wood · metal · glass · plastic · cloth · leather · rubber · gold · silver · wool · cotton · brick

**`worship` (new) — 8** *(the guide names "religious items: holy books, places of worship, items used in worship" as a legitimate M35/36 set; kept generic and non-partisan)*
holy book · candle · bell · pray · drum · gift · wedding · music

**`school` (new) — 6**
classroom · blackboard · desk · backpack · pencil case · playground

**`clothing` (existing, `meeting: 36`) — 8**
belt · sweater · skirt · boots · sandals · glasses · ring · watch

*Excluded:* nothing named — the guide names nothing here.

---

### Meeting 38 — "False statements, he isn't, negative commands" (33)
*Guide games:* Game 3a strengthen M37's movements against places ("swim under the bridge, drive down the street"); **Game 3b "How do you travel?"** — by airplane, I walk, it swims, it flies, I drive; Game 4 negation-listening; Game 5 "Don't you dare!" with must / may / need.

**`verbs` (existing, `meeting: 38`) — 9**
fly · drive · crawl · hop · skip · march · sail · row · slide down

**`traveling` (existing, `meeting: 38`) — 12**
taxi · lorry · motorcycle · ambulance · police car · fire engine · van · ship · helicopter · cart · wheel · engine

**`directions` (new) — 12**
left · right · straight ahead · forward · backward · up · down · stop · go · across · along · towards

*Excluded:* **not / don't / isn't / must / may / need** — negation and modality are forms, not words with pictures; the guide's own game teaches them by contradicting a visible action, which the app's session flow can do without a card. **How?** — carried as a question word at M24.

---

### Meeting 39 — "Relative clauses (the one who/that)" (34)
*Guide game 6 "General words and plurals":* word, words, letter, number, shape, colour, calendar, days, weeks, years, seasons, months, hours; optionally sentence, phrase, expression, example, list. *Game 4:* "What does X mean? How do you say X? What is the opposite of X?" — the Phase-2 Power Tools.

**`meta-words` (new) — 15**
word · letter · number · sentence · name · list · picture · story · question · answer · page · sound · voice · alphabet · opposite

**`people` (existing, `meeting: 39`) — 4**
group · queue · team · pair-of-people → replaced by **couple**
→ final: group · queue · team · couple

**`expressions` (existing, `meeting: 39`) — 8** *(the "Power Tools" the guide says you will need in Phase 2)*
What is this? · What are you doing? · Please repeat · Speak slowly · I don't understand · What does it mean? · How do you say…? · Please write it

**`verbs` (existing, `meeting: 39`) — 7**
help · show · repeat · ask · answer (verb) → collides with `meta-words` answer; use **reply** · explain → dropped (abstract)
→ final 7: help · show · repeat · ask · reply · spell · copy

*Excluded:* **paragraph / phrase / phase / activity / meeting** — the guide's own meta-jargon about the course, not host-world vocabulary and not depictable. **the one who / that** — a relative pronoun; a grammar target, not a card.

---

### Meeting 40 — "Negations, verbs (bend, break, fold, etc.)" (33)
*Guide game 4:* break, bend, stretch, squeeze, push, press, fold, tear, sprinkle, shake, grab, smell — each with a physical prop. Game 5 harder relative clauses. Game 3 negation-talking.

**`verbs` (existing, `meeting: 40`) — 20**
break · bend · stretch · squeeze · press · fold · tear · sprinkle · grab · twist · tie · untie · knock · stir · mix · wrap · crush · drag · swing · flatten

**`adjectives` (existing, `meeting: 40`) — 5**
broken · bent · torn · tight · loose

**`smallthings` (existing, `meeting: 40`) — 8**
knot · chain · hook · coat hanger · elastic band → collides with `rubber band` at M10; use **spring**
→ final 8: knot · chain · hook · coat hanger · spring · clip · zip · buckle

*Excluded:* **negation forms** — see M38. **push, shake, smell** — already assigned (`verb-push` exists; `shake` at M21; `smell` at M34); not duplicated.

---

## 4. New domains proposed (33)

Colours drawn from the existing six-token palette (`violet`, `lime`, `orange`, `lemon`, `coral`, `mint`) and rotated so no two consecutive domains share one.

| # | id | emoji | color | English name | meeting | items |
|---:|---|---|---|---|---:|---:|
| 1 | `touch-actions` | ✋ | coral | Touching & caring | 6 | 17 |
| 2 | `body-extra` | 🦴 | mint | More body parts | 6 | 17 |
| 3 | `smallthings` | 🧵 | violet | Small things | 10 | 23 (+8 @23, +8 @40) |
| 4 | `ordinals` | 🥇 | lemon | Order words | 13 | 12 |
| 5 | `geography` | 🌍 | mint | World & directions | 13 | 15 |
| 6 | `countries` | 🚩 | coral | Countries | 13 | 10 |
| 7 | `outdoors` | ⛰️ | lime | Out of doors | 15 | 30 (+8 @35) |
| 8 | `expressions` | 💬 | violet | Everyday expressions | 16 | 22 (+8 @39) |
| 9 | `restaurant` | 🍽️ | orange | Eating out | 17 | 10 |
| 10 | `foods-more` | 🥗 | lime | More food | 17 | 20 |
| 11 | `town` | 🏙️ | coral | Around town | 20 | 34 (+12 @24) |
| 12 | `containers` | 🧺 | mint | Containers & lids | 21 | 16 (+1 @29) |
| 13 | `appliances` | 🔌 | lemon | Appliances & devices | 22 | 21 |
| 14 | `people` | 🧑 | lime | People | 23 | 12 (+4 @39) |
| 15 | `questions` | ❓ | violet | Question words | 24 | 12 |
| 16 | `shapes` | 🔺 | mint | Shapes & lines | 26 | 16 |
| 17 | `quantities` | 🧮 | lemon | How much, how many | 27 | 21 (+2 @28) |
| 18 | `toiletries` | 🧼 | orange | Washing & grooming | 27 | 10 |
| 19 | `furnishings` | 🛋️ | coral | Furniture & fittings | 28 | 18 |
| 20 | `water-words` | 💧 | mint | Water & wetness | 29 | 22 |
| 21 | `days` | 📅 | coral | Days of the week | 30 | 15 |
| 22 | `time-of-day` | 🕐 | lemon | Telling time | 30 | 10 (+6 @34) |
| 23 | `months` | 🗓️ | violet | Months | 30 | 12 |
| 24 | `weather` | ☀️ | mint | Weather | 31 | 5 |
| 25 | `seasons` | 🍂 | lime | Seasons | 31 | 5 |
| 26 | `money` | 💰 | lemon | Money & buying | 31 | 8 |
| 27 | `senses` | 👃 | coral | Senses & tastes | 34 | 18 |
| 28 | `occupations` | 👷 | lime | Jobs people do | 35 | 20 |
| 29 | `materials` | 🧱 | orange | What things are made of | 36 | 12 |
| 30 | `worship` | 🕌 | violet | Worship & celebration | 36 | 8 |
| 31 | `school` | 📚 | lemon | School things | 36 | 6 |
| 32 | `directions` | 🧭 | mint | Directions & paths | 38 | 12 |
| 33 | `meta-words` | 🔤 | violet | Words about words | 39 | 15 |

**Existing domains that gain new items** (always via per-item `meeting:`, never by changing `domain.meeting`):
`verbs` (M10, 21, 22, 23, 24, 27, 28, 29, 34, 38, 39, 40) · `family-more` (M16) · `emotions` (M23) · `adjectives` (M26, 31→moved to 26, 40) · `rooms` (M28) · `numbers` (M31) · `clothing` (M36) · `tools` (M35) · `traveling` (M38)

Result: **61 domains, 1,027 items.**

---

## 5. Master exclusion list (words the guide names, deliberately not carded)

| Word / set | Meeting | Reason |
|---|---|---|
| me, him, them, us, each other, yourself | 6 | pronouns — no picture; taught by live contrast |
| my, your, his, her, our, their, mine, hers | 6, 16, 17, 19, 22, 34 | possessives — a form, not a referent |
| to, from | 10 | case markers; the guide's own game strips them of picture support |
| singular / plural contrast | 10 | a form, not a word |
| nationalities (American, Indian, Russian…) | 13 | as cards they duplicate the country flag exactly |
| language names (Hindi, Russian…) | 13 | same image as the country; not distinguishable by pointing |
| nationality, foreigner | 13 | abstract category nouns |
| have | 15 | no picture separates "has" from "holds" |
| dead, alive | 21 | not depictable for a general deck; condolence context |
| drop-on-purpose vs. drop-accidentally | 21 | one card; intent is not visible |
| evaluate | 22 | abstract |
| to whom, in what, with whom, for whom | 24 | case-marked question phrases, no picture |
| someone, everyone, no one, nothing, anything, any, most | 27 | indefinite pronouns / superlative — no stable image |
| was born in, grew up in | 28 | tense-marked biographical predicates |
| doesn't have, not, don't, isn't | 29, 38, 40 | negation is a form; taught by contradicting a visible action |
| can, can't | 31 | modal |
| million | 31 | beyond countable verification |
| riyals, dinars, fils, pesos | 13, 31 | guide-local currencies → *coin / banknote* |
| next week, last year, now, soon, early, late | 30 | relative time deixis |
| the day before yesterday, the day after tomorrow | 30 | multi-word deictic phrases |
| after, before, while | 35 | clause connectives; guide says comprehension-only |
| sheikh, king, president, judge | 35 | non-generalising political/religious roles |
| must, may, need | 38 | modality |
| the one who / that (relative pronoun) | 39, 40 | grammar target, not a card |
| paragraph, phrase, phase, activity, meeting | 39 | the guide's own course jargon, not host vocabulary |
| Eastern toilet, round bread oven, gas bottle | 28 | guide-local; generalised to *toilet* / *oven* or dropped |
| apartment building, light post, electric shop | 19, 20 | guide-local town furniture; generalised |

---

## 6. Notes for the authoring agents

1. **Read before you write.** Read at least 40 existing items across `food`, `home`, `verbs`, `colors`, `prepositions` and `adjectives` before authoring a line. Match the article convention exactly: es/fr/it/pt/de nouns carry the natural article (`la manzana`, `la pomme`, `der Apfel`, `la mela`, `a maçã`); ru/uk/pl/ja/zh/ko/hi/ar/th/tr/id/vi/ht do not, except `ar` which carries the definite `ال-` (`التفاحة`) and `vi` which carries the classifier where the file does (`con chó`, `quả táo`, `cái ghế`).
2. **Verbs are bare infinitives**, matching `verb-pour` (`verter` / `наливать` / `gießen` / `注ぐ` / `倒` / `붓다` / `dökmek` / `vide`). Do **not** switch to imperatives, even though the guide's games are commands.
3. **Adjectives** follow `adj-big`: bare masculine-singular citation form in the Romance/Slavic languages.
4. **Multi-word English heads** (`turn on`, `half past`, `blow your nose`, `What is this?`) still get one id and one word per language — use the natural single lexical unit in each language, not a literal calque.
5. **Ids**: prefix by domain — `touch-`, `bodyx-`, `small-`, `ord-`, `geo-`, `ctry-`, `out-`, `expr-`, `rest-`, `foodx-`, `town-`, `cont-`, `appl-`, `ppl-`, `q-`, `shape-`, `qty-`, `toil-`, `furn-`, `wtr-`, `day-`, `tod-`, `mon-`, `wthr-`, `sea-`, `mny-`, `sens-`, `occ-`, `mat-`, `wor-`, `sch-`, `dir-`, `meta-`. Items added to existing domains keep that domain's prefix (`verb-`, `adj-`, `num-`, `cloth-`, `tool-`, `emo-`, `rooms-`, `fam-`).
6. **Emoji must depict the word**, not the category — it is the fallback card art and there is no illustration for any of these 782 words yet. Where no emoji exists (e.g. `crooked`, `what kind of`), pick the closest iconographic one and flag it in a comment so an illustrator can replace it.
7. **Verify uniqueness** against the whole file after each batch: `grep -oE 'id: "[a-z0-9-]+"' src/lib/vocab.ts | sort | uniq -d` must return nothing.
8. **Never leave English in a non-English slot** and never transliterate — ru/uk Cyrillic, ja kana/kanji, zh Simplified, ko Hangul, hi Devanagari, ar Arabic, th Thai, ht real Kreyòl (not French).
