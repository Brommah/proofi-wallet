#!/bin/bash
# Fetch GitHub profiles for all contributors and save as JSON lines

OUTPUT="/Users/martijnbroersma/clawd/reports/all_profiles.jsonl"
> "$OUTPUT"

declare -A SEEN
declare -A USER_REPOS

# Define repos and their contributors
declare -A REPO_CONTRIBUTORS
REPO_CONTRIBUTORS["vllm-project/vllm"]="DarkLight1337 WoosukKwon youkaichao mgoin hmellor Isotr0py njhill jeejeelee yewentao256 ywang96 simon-mo LucasWilkinson russellb robertgshaw2-redhat NickLucche reidliu41 zhuohan123 tlrmchlsmth chaunceyjiang heheda12345 khluu noooop varun-sundar-rabindranath bigPYJ1151 tdoublep andyxning MatthewBonanni gshtras comaniac Yard1 jikunshang alexm-redhat markmc bnellnm dsikka rasmith AndreasKaratzas ruisearch42 tjtanaa rkooo567 houseroad lgeiger vllmellm 22quinn ProExpertProg bbeckca alex-jw-brooks Alexei-V-Ivanov-AMD KuntaiDu zou3519"
REPO_CONTRIBUTORS["huggingface/transformers"]="thomwolf ydshieh sgugger LysandreJik patrickvonplaten gante stas00 ArthurZucker Rocketknight1 julien-c zucchini-nlp younesbelkada Cyrilvallez sshleifer NielsRogge amyeroberts Narsil patil-suraj SunMarc VictorSanh cyyever stevhliu mrm8488 sanchit-gandhi muellerzr yonigozlan MekkCyber mfuntowicz jplu vasqu aaugustin stefan-it faaany rlouf qubvel yao-matrix Sai-Suraj-27 pacman100 jiqing-feng sywangyi remi-or molbap ylacombe fxmarty lukovnikov ivarflakstad alaradirik Wauplin MKhalusova"
REPO_CONTRIBUTORS["langchain-ai/langchain"]="baskaryan hwchase17 ccurme eyurtsev mdrxy cbornet leo-gan nfcampos hinthornw sydney-runkle vowelparrot jacoblee93 rlancemartin dev2049 tomasonjo olgavrou keenborder786 obi1kenobi MichaelLi65535 eltociear isahers1 agola11 lkuligin sepiatone ZhangShenao maang-h liugddx chyroc vbarda MthwRobinson pprados 169 ShorthillsAI mspronesti hemidactylus DangerousPotential MateuszOssGit jhpiedrahitao ofermend kacperlukawski mbchang 3coins bracesproul timothyasp Anush008 shibuiwilliam nickscamara Raj725 fpingham"
REPO_CONTRIBUTORS["run-llama/llama_index"]="logan-markewich jerryjliu Disiok nerdai masci hatianzhang ravi03071991 AstraBert seldo jamesbraza sourabhdesai EmanuelCampos Javtor mattf tomasonjo Florian-BACHO nfiacco leehuwuj ofermend adrianlyjak anoopshrma nightosong RogerHYang hongyishi yisding wey-gu jaelgu strawgate jon-chuang aaronjimv mattref rendyfebry ShorthillsAI fzowl raspawar nicoloboschi jordanparker6 tslmy hemidactylus TuanaCelik yarikama Anush008 ColeMurray david20571015 emptycrown joelrorseth brycecf RussellLuo"
REPO_CONTRIBUTORS["instructor-ai/instructor"]="jxnl ivanleomk DaveOkpare shreya-51 Anmol6 savarin fpingham ssonal tinycrops joschkabraun jeongyoonm NicolasPllr1 lakshyaag daaniyaan pnkvalavala shanktt lazyhope inn-0 thomasnormal jlondonobo gao-hongnan Cruppelt Phodaie majiayu000 a3lem noxan 0xRaduan max-muoto kwilsonmg rgbkrk eltociear dogonthehorizon PhiBrandon bllchmbrs paulelliotco PLNech arcaputo3 rishabgit h0rv rshah713 rbraddev ryanhalliday stephen-iezzi Tedfulk zilto indigoviolet yanomaly"
REPO_CONTRIBUTORS["outlines-dev/outlines"]="rlouf RobinPicard lapp0 brandonwillard laitifranz cpfiffer Ki-Seki Anri-Lombard benlipkin yvan-sraka parkervg alonsosilvaallende eitanturok jrysana saattrupdan majiayu000 leloykun jqueguiner the-vampiire isamu-isozaki HerrIvan posionus bettybas g-prz ksvladimir tscholak neilmehta24 JulesGM eltociear 7flash hoesler dtiarks Perdu mondaychen harsh-sprinklr brosand aman-17 torymur yasteven shawnz scampion rshah713 plarroy-nv milo157 mattkindy martin0258 denadai2 lassiraa kstathou gtsiolis"
REPO_CONTRIBUTORS["ggerganov/llama.cpp"]="ggerganov ngxson slaren JohannesGaessler jeffbolznv danbev CISC cebtenzzre ikawrakow 0cc4m am17an ochafik compilade phymbert rgerganov lhez angt yeahdongcn NeoZhangJianyu netrunnereve KerfuffleV2 taronaeo qnixsynapse noemotiovon allozaur IMbackK ericcurtin ServeurpersoCom sw mofosyne pwilkin jhen0409 prusnak hipudding gabe-l-hart SomeoneSerge mtmcp Galunid howard0su Xarbirus MollySophia anzz1 Acly HanClinto fairydreaming jart Green-Sky SlyEcho reeselevine DannyDaemonic"
REPO_CONTRIBUTORS["mozilla/DeepSpeech"]="reuben lissyx kdavis-mozilla tilmankamp Cwiiis CatalinVoss JRMeyer carlfm01 andi4191 mychiux413 mcfletch bernardohenz ftyers imskr andrenatal NanoNabla rhamnett bprfh nicolaspanel aayagar001 gardenia22 imrahul361 juandspy gvoysey jendker rcgale GeorgeFedoseev igorfritzsch mach327 daanzu crs117 bjornbytes mathematiguy vinhngx olafthiele eggonlea KathyReid jorxster baljeet areyliu6 piraka9011 NormanTUD rajpratik71 ricky-ck-chan ryojiysd dabinat dwks qin zaptrem b-ak"
REPO_CONTRIBUTORS["Lightning-AI/pytorch-lightning"]="williamFalcon Borda awaelchli carmocca tchaton rohitgr7 kaushikb11 ananthsub akihironitta SkafteNicki ethanwharris justusschock daniellepintz SeanNaren edenlightning mauvilsa lantiga otaj four4fish VictorPrins jjenniferdai neggert krshrimali krishnakalyan3 jeremyjordan jerome-habana nicolai86 fnhirwa DuYicong515 arnaudgelas GdoongMathew matsumotosan s-rog deependujha manskx lezwon nateraw rlizzo ananyahjha93 yurijmikhalevich teddykoker yukw777 mathemusician borisdayma dmitsf"

# Build unique user list with repo mappings
for repo in "${!REPO_CONTRIBUTORS[@]}"; do
  for user in ${REPO_CONTRIBUTORS[$repo]}; do
    # Skip bots
    if [[ "$user" == *"[bot]"* ]] || [[ "$user" == "dependabot"* ]] || [[ "$user" == "pre-commit-ci"* ]] || [[ "$user" == "deepsource-autofix"* ]] || [[ "$user" == "cursoragent"* ]] || [[ "$user" == "devin-ai-integration"* ]]; then
      continue
    fi
    if [[ -z "${SEEN[$user]}" ]]; then
      SEEN[$user]=1
      USER_REPOS[$user]="$repo"
    else
      USER_REPOS[$user]="${USER_REPOS[$user]}|$repo"
    fi
  done
done

echo "Total unique users to fetch: ${#SEEN[@]}"

COUNT=0
for user in "${!SEEN[@]}"; do
  COUNT=$((COUNT + 1))
  if (( COUNT % 50 == 0 )); then
    echo "Progress: $COUNT / ${#SEEN[@]}"
  fi
  
  PROFILE=$(gh api "users/$user" -q '{login: .login, name: .name, company: .company, location: .location, bio: .bio, blog: .blog, twitter: .twitter_username, public_repos: .public_repos, followers: .followers, type: .type}' 2>/dev/null)
  
  if [[ -n "$PROFILE" ]]; then
    REPOS="${USER_REPOS[$user]}"
    echo "$PROFILE" | jq -c --arg repos "$REPOS" '. + {source_repos: $repos}' >> "$OUTPUT"
  fi
  
  # Rate limit: small delay
  sleep 0.15
done

echo "Done! Total profiles fetched: $(wc -l < "$OUTPUT")"
