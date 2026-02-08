#!/usr/bin/env python3
import subprocess, json, time, csv, sys

REPOS = {
    "vllm-project/vllm": "DarkLight1337 WoosukKwon youkaichao mgoin hmellor Isotr0py njhill jeejeelee yewentao256 ywang96 simon-mo LucasWilkinson russellb robertgshaw2-redhat NickLucche reidliu41 zhuohan123 tlrmchlsmth chaunceyjiang heheda12345 khluu noooop varun-sundar-rabindranath bigPYJ1151 tdoublep andyxning MatthewBonanni gshtras comaniac Yard1 jikunshang alexm-redhat markmc bnellnm dsikka rasmith AndreasKaratzas ruisearch42 tjtanaa rkooo567 houseroad lgeiger vllmellm 22quinn ProExpertProg bbeckca alex-jw-brooks Alexei-V-Ivanov-AMD KuntaiDu zou3519".split(),
    "huggingface/transformers": "thomwolf ydshieh sgugger LysandreJik patrickvonplaten gante stas00 ArthurZucker Rocketknight1 julien-c zucchini-nlp younesbelkada Cyrilvallez sshleifer NielsRogge amyeroberts Narsil patil-suraj SunMarc VictorSanh cyyever stevhliu mrm8488 sanchit-gandhi muellerzr yonigozlan MekkCyber mfuntowicz jplu vasqu aaugustin stefan-it faaany rlouf qubvel yao-matrix Sai-Suraj-27 pacman100 jiqing-feng sywangyi remi-or molbap ylacombe fxmarty lukovnikov ivarflakstad alaradirik Wauplin MKhalusova".split(),
    "langchain-ai/langchain": "baskaryan hwchase17 ccurme eyurtsev mdrxy cbornet leo-gan nfcampos hinthornw sydney-runkle vowelparrot jacoblee93 rlancemartin dev2049 tomasonjo olgavrou keenborder786 obi1kenobi MichaelLi65535 eltociear isahers1 agola11 lkuligin sepiatone ZhangShenao maang-h liugddx chyroc vbarda MthwRobinson pprados 169 ShorthillsAI mspronesti hemidactylus DangerousPotential MateuszOssGit jhpiedrahitao ofermend kacperlukawski mbchang 3coins bracesproul timothyasp Anush008 shibuiwilliam nickscamara Raj725 fpingham".split(),
    "run-llama/llama_index": "logan-markewich jerryjliu Disiok nerdai masci hatianzhang ravi03071991 AstraBert seldo jamesbraza sourabhdesai EmanuelCampos Javtor mattf tomasonjo Florian-BACHO nfiacco leehuwuj ofermend adrianlyjak anoopshrma nightosong RogerHYang hongyishi yisding wey-gu jaelgu strawgate jon-chuang aaronjimv mattref rendyfebry ShorthillsAI fzowl raspawar nicoloboschi jordanparker6 tslmy hemidactylus TuanaCelik yarikama Anush008 ColeMurray david20571015 emptycrown joelrorseth brycecf RussellLuo".split(),
    "instructor-ai/instructor": "jxnl ivanleomk DaveOkpare shreya-51 Anmol6 savarin fpingham ssonal tinycrops joschkabraun jeongyoonm NicolasPllr1 lakshyaag daaniyaan pnkvalavala shanktt lazyhope inn-0 thomasnormal jlondonobo gao-hongnan Cruppelt Phodaie majiayu000 a3lem noxan 0xRaduan max-muoto kwilsonmg rgbkrk eltociear dogonthehorizon PhiBrandon bllchmbrs paulelliotco PLNech arcaputo3 rishabgit h0rv rshah713 rbraddev ryanhalliday stephen-iezzi Tedfulk zilto indigoviolet yanomaly".split(),
    "outlines-dev/outlines": "rlouf RobinPicard lapp0 brandonwillard laitifranz cpfiffer Ki-Seki Anri-Lombard benlipkin yvan-sraka parkervg alonsosilvaallende eitanturok jrysana saattrupdan majiayu000 leloykun jqueguiner the-vampiire isamu-isozaki HerrIvan posionus bettybas g-prz ksvladimir tscholak neilmehta24 JulesGM eltociear 7flash hoesler dtiarks Perdu mondaychen harsh-sprinklr brosand aman-17 torymur yasteven shawnz scampion rshah713 plarroy-nv milo157 mattkindy martin0258 denadai2 lassiraa kstathou gtsiolis".split(),
    "ggerganov/llama.cpp": "ggerganov ngxson slaren JohannesGaessler jeffbolznv danbev CISC cebtenzzre ikawrakow 0cc4m am17an ochafik compilade phymbert rgerganov lhez angt yeahdongcn NeoZhangJianyu netrunnereve KerfuffleV2 taronaeo qnixsynapse noemotiovon allozaur IMbackK ericcurtin ServeurpersoCom sw mofosyne pwilkin jhen0409 prusnak hipudding gabe-l-hart SomeoneSerge mtmcp Galunid howard0su Xarbirus MollySophia anzz1 Acly HanClinto fairydreaming jart Green-Sky SlyEcho reeselevine DannyDaemonic".split(),
    "mozilla/DeepSpeech": "reuben lissyx kdavis-mozilla tilmankamp Cwiiis CatalinVoss JRMeyer carlfm01 andi4191 mychiux413 mcfletch bernardohenz ftyers imskr andrenatal NanoNabla rhamnett bprfh nicolaspanel aayagar001 gardenia22 imrahul361 juandspy gvoysey jendker rcgale GeorgeFedoseev igorfritzsch mach327 daanzu crs117 bjornbytes mathematiguy vinhngx olafthiele eggonlea KathyReid jorxster baljeet areyliu6 piraka9011 NormanTUD rajpratik71 ricky-ck-chan ryojiysd dabinat dwks qin zaptrem b-ak".split(),
    "Lightning-AI/pytorch-lightning": "williamFalcon Borda awaelchli carmocca tchaton rohitgr7 kaushikb11 ananthsub akihironitta SkafteNicki ethanwharris justusschock daniellepintz SeanNaren edenlightning mauvilsa lantiga otaj four4fish VictorPrins jjenniferdai neggert krshrimali krishnakalyan3 jeremyjordan jerome-habana nicolai86 fnhirwa DuYicong515 arnaudgelas GdoongMathew matsumotosan s-rog deependujha manskx lezwon nateraw rlizzo ananyahjha93 yurijmikhalevich teddykoker yukw777 mathemusician borisdayma dmitsf".split(),
}

BOTS = {"dependabot[bot]", "pre-commit-ci[bot]", "deepsource-autofix[bot]", "cursoragent", "devin-ai-integration[bot]"}

# Build unique user -> repos mapping
user_repos = {}
for repo, users in REPOS.items():
    for u in users:
        if u in BOTS:
            continue
        user_repos.setdefault(u, []).append(repo)

print(f"Total unique users: {len(user_repos)}", flush=True)

# Fetch profiles
profiles = []
for i, (user, repos) in enumerate(user_repos.items()):
    if (i+1) % 50 == 0:
        print(f"Progress: {i+1}/{len(user_repos)}", flush=True)
    try:
        result = subprocess.run(
            ["gh", "api", f"users/{user}", "-q",
             '{login: .login, name: .name, company: .company, location: .location, bio: .bio, blog: .blog, twitter: .twitter_username, public_repos: .public_repos, followers: .followers, type: .type}'],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0 and result.stdout.strip():
            p = json.loads(result.stdout.strip())
            p['source_repos'] = '|'.join(repos)
            profiles.append(p)
    except Exception as e:
        print(f"Error fetching {user}: {e}", file=sys.stderr)
    time.sleep(0.12)

print(f"Fetched {len(profiles)} profiles", flush=True)

# Save raw
with open('/Users/martijnbroersma/clawd/reports/all_profiles.jsonl', 'w') as f:
    for p in profiles:
        f.write(json.dumps(p) + '\n')

# Filter
LOCATION_KEYWORDS = [
    'san francisco', 'sf', 'bay area', 'oakland', 'berkeley', 'palo alto', 'mountain view',
    'sunnyvale', 'menlo park', 'santa clara', 'san jose', 'silicon valley', 'cupertino',
    'berlin', 'amsterdam', 'london', 'munich', 'münchen', 'paris',
    'europe', 'germany', 'deutschland', 'netherlands', 'nederland', 'uk', 'united kingdom',
    'england', 'france', 'california', 'ca, us'
]

EXCLUDE_LOCATION = ['china', 'beijing', 'shanghai', 'shenzhen', 'hangzhou', 'japan', 'tokyo',
                     'korea', 'seoul', 'india', 'bangalore', 'hyderabad', 'mumbai', 'delhi',
                     'chennai', 'pune', 'taiwan', 'taipei']

def location_match(loc):
    if not loc:
        return True  # empty = we'll enrich later
    loc_lower = loc.lower()
    # Exclude clearly non-target locations
    for ex in EXCLUDE_LOCATION:
        if ex in loc_lower:
            return False
    # Match target locations
    for kw in LOCATION_KEYWORDS:
        if kw in loc_lower:
            return True
    # If location is set but doesn't match, still include if ambiguous
    return True  # be inclusive, filter manually later

def is_active(p):
    followers = p.get('followers', 0) or 0
    repos = p.get('public_repos', 0) or 0
    return followers > 10 or repos > 20

def has_bio(p):
    bio = p.get('bio') or ''
    return len(bio.strip()) > 5

def is_bot_or_org(p):
    if p.get('type') == 'Organization':
        return True
    login = (p.get('login') or '').lower()
    if 'bot' in login or login.startswith('dependabot'):
        return True
    return False

# Score signal strength
def compute_signal(p):
    signals = []
    bio = (p.get('bio') or '').lower()
    company = (p.get('company') or '').lower()
    
    # Multi-repo contributor
    repos = p.get('source_repos', '').split('|')
    if len(repos) >= 3:
        signals.append('multi-repo-contributor')
    
    # High followers
    if (p.get('followers') or 0) > 500:
        signals.append('high-influence')
    elif (p.get('followers') or 0) > 100:
        signals.append('notable-influence')
    
    # Bio keywords
    ai_keywords = ['machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'llm', 'neural',
                   'transformer', 'inference', 'computer vision', 'data scientist', 'ml engineer',
                   'ai engineer', 'applied ai', 'research engineer', 'ml platform', 'mlops',
                   'generative ai', 'gen ai', 'artificial intelligence']
    for kw in ai_keywords:
        if kw in bio:
            signals.append('ai-bio')
            break
    
    # Production-focused keywords
    prod_keywords = ['production', 'engineering', 'platform', 'infrastructure', 'deploy',
                    'scale', 'startup', 'founder', 'cto', 'lead', 'senior', 'staff', 'principal']
    for kw in prod_keywords:
        if kw in bio or kw in company:
            signals.append('production-focus')
            break
    
    # Location match
    loc = (p.get('location') or '').lower()
    for kw in ['san francisco', 'sf', 'bay area', 'berlin', 'amsterdam', 'london', 'munich', 'paris']:
        if kw in loc:
            signals.append('target-location')
            break
    
    return '; '.join(signals) if signals else 'contributor'

filtered = []
for p in profiles:
    if is_bot_or_org(p):
        continue
    if not is_active(p):
        continue
    if not has_bio(p):
        continue
    if not location_match(p.get('location')):
        continue
    p['signal'] = compute_signal(p)
    filtered.append(p)

# Sort by signal quality then followers
def sort_key(p):
    signal = p.get('signal', '')
    score = 0
    if 'target-location' in signal: score += 100
    if 'ai-bio' in signal: score += 50
    if 'production-focus' in signal: score += 30
    if 'multi-repo-contributor' in signal: score += 40
    if 'high-influence' in signal: score += 20
    score += min((p.get('followers') or 0) / 100, 20)
    return -score

filtered.sort(key=sort_key)

print(f"Filtered candidates: {len(filtered)}", flush=True)

# Write CSV
csv_path = '/Users/martijnbroersma/clawd/reports/ai-innovator-github-candidates.csv'
with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['github_username', 'name', 'location', 'company', 'bio', 'blog', 'twitter', 'followers', 'public_repos', 'source_repo', 'signal'])
    for p in filtered:
        writer.writerow([
            p.get('login', ''),
            p.get('name', ''),
            p.get('location', ''),
            p.get('company', ''),
            (p.get('bio') or '').replace('\n', ' ').replace('\r', ''),
            p.get('blog', ''),
            p.get('twitter', ''),
            p.get('followers', 0),
            p.get('public_repos', 0),
            p.get('source_repos', ''),
            p.get('signal', '')
        ])

print(f"CSV saved: {csv_path}", flush=True)

# Write markdown report
md_path = '/Users/martijnbroersma/clawd/reports/ai-innovator-github-sourcing.md'

# Separate top-tier candidates
top_tier = [p for p in filtered if 'target-location' in p.get('signal','') and 'ai-bio' in p.get('signal','')]
strong = [p for p in filtered if p not in top_tier and ('ai-bio' in p.get('signal','') or 'production-focus' in p.get('signal',''))]
rest = [p for p in filtered if p not in top_tier and p not in strong]

with open(md_path, 'w') as f:
    f.write("# AI Innovator / Lead AI Engineer — GitHub Sourcing Report\n\n")
    f.write(f"**Role:** AI Innovator / Lead AI Engineer @ Cere Network (cef.ai)\n")
    f.write(f"**Date:** {time.strftime('%Y-%m-%d')}\n")
    f.write(f"**Method:** Scraped top 50 contributors from 9 major AI/ML open-source repos\n\n")
    f.write("## Repos Scanned\n\n")
    for repo in REPOS:
        f.write(f"- [{repo}](https://github.com/{repo})\n")
    f.write(f"\n## Summary\n\n")
    f.write(f"- **Total unique contributors scraped:** {len(user_repos)}\n")
    f.write(f"- **Profiles fetched:** {len(profiles)}\n")
    f.write(f"- **Candidates after filtering:** {len(filtered)}\n")
    f.write(f"- **🔥 Top tier (target location + AI bio):** {len(top_tier)}\n")
    f.write(f"- **⭐ Strong (AI bio or production focus):** {len(strong)}\n")
    f.write(f"- **📋 Other active contributors:** {len(rest)}\n\n")
    
    f.write("## 🔥 Top Tier Candidates\n\n")
    f.write("These candidates are in target locations (Europe/SF Bay Area) AND have AI/ML in their bio.\n\n")
    if not top_tier:
        f.write("_None found in this batch._\n\n")
    for p in top_tier:
        f.write(f"### [{p.get('name') or p['login']}](https://github.com/{p['login']})\n")
        f.write(f"- **Location:** {p.get('location', 'N/A')}\n")
        f.write(f"- **Company:** {p.get('company', 'N/A')}\n")
        f.write(f"- **Bio:** {(p.get('bio') or 'N/A').strip()}\n")
        f.write(f"- **Followers:** {p.get('followers', 0)} | **Repos:** {p.get('public_repos', 0)}\n")
        if p.get('twitter'): f.write(f"- **Twitter:** [@{p['twitter']}](https://twitter.com/{p['twitter']})\n")
        if p.get('blog'): f.write(f"- **Blog:** {p['blog']}\n")
        f.write(f"- **Source repos:** {p.get('source_repos', '')}\n")
        f.write(f"- **Signal:** {p.get('signal', '')}\n\n")
    
    f.write("## ⭐ Strong Candidates\n\n")
    f.write("AI/ML bio or production-focused — may need location verification.\n\n")
    for p in strong[:50]:  # limit to top 50
        f.write(f"### [{p.get('name') or p['login']}](https://github.com/{p['login']})\n")
        f.write(f"- **Location:** {p.get('location', 'N/A')}\n")
        f.write(f"- **Company:** {p.get('company', 'N/A')}\n")
        f.write(f"- **Bio:** {(p.get('bio') or 'N/A').strip()}\n")
        f.write(f"- **Followers:** {p.get('followers', 0)} | **Repos:** {p.get('public_repos', 0)}\n")
        if p.get('twitter'): f.write(f"- **Twitter:** [@{p['twitter']}](https://twitter.com/{p['twitter']})\n")
        if p.get('blog'): f.write(f"- **Blog:** {p['blog']}\n")
        f.write(f"- **Source repos:** {p.get('source_repos', '')}\n")
        f.write(f"- **Signal:** {p.get('signal', '')}\n\n")
    
    if len(strong) > 50:
        f.write(f"_...and {len(strong)-50} more in the CSV._\n\n")
    
    f.write("## 📋 Other Active Contributors\n\n")
    f.write(f"_{len(rest)} additional contributors in the CSV file._\n\n")
    f.write("## Next Steps\n\n")
    f.write("1. **Enrich** top-tier candidates with LinkedIn profiles\n")
    f.write("2. **Verify locations** for candidates with empty location fields\n")
    f.write("3. **Check activity** — look at recent commits (last 6 months)\n")
    f.write("4. **Outreach** — personalized messages referencing their open-source work\n")
    f.write("5. **Cross-reference** with LinkedIn for current employment status\n")

print(f"Report saved: {md_path}", flush=True)
print("DONE!", flush=True)
