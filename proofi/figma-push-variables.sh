#!/bin/bash
# CEF Brand — Push Figma Variables (Teal · Dark-First · No Purple)
# File: wFykE2Rw6zTNCFmGiTuyIa
#
# Requires: Figma Enterprise + token with file_variables:read/write scopes
# Usage: FIGMA_TOKEN=figd_xxx ./figma-push-variables.sh

set -euo pipefail
FIGMA_TOKEN="${FIGMA_TOKEN:-$(cat /Users/martijnbroersma/clawd/.secrets/figma-token 2>/dev/null)}"
FILE_KEY="wFykE2Rw6zTNCFmGiTuyIa"
API="https://api.figma.com/v1/files/${FILE_KEY}/variables"
[ -z "$FIGMA_TOKEN" ] && echo "FIGMA_TOKEN not set" && exit 1

echo "Pushing CEF variables (teal/dark-first) to ${FILE_KEY}..."

curl -s -w "\n%{http_code}" -X POST "$API" \
  -H "X-Figma-Token: ${FIGMA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
  "variableCollections": [
    {"action":"CREATE","id":"prim","name":"Primitives","initialModeId":"pd"},
    {"action":"CREATE","id":"sem","name":"Semantic","initialModeId":"dark"},
    {"action":"CREATE","id":"sp","name":"Spacing","initialModeId":"spd"},
    {"action":"CREATE","id":"sh","name":"Shape","initialModeId":"shd"}
  ],
  "variableModes": [
    {"action":"CREATE","id":"light","name":"Light","variableCollectionId":"sem"}
  ],
  "variables": [
    {"action":"CREATE","id":"g1","name":"gray/1","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g2","name":"gray/2","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g3","name":"gray/3","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g4","name":"gray/4","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g5","name":"gray/5","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g6","name":"gray/6","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g7","name":"gray/7","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g8","name":"gray/8","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g9","name":"gray/9","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g10","name":"gray/10","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g11","name":"gray/11","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"g12","name":"gray/12","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t300","name":"teal/300","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t400","name":"teal/400","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t500","name":"teal/500","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t600","name":"teal/600","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t700","name":"teal/700","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t100","name":"teal/100","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"t800","name":"teal/800","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"grn4","name":"green/400","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"grn7","name":"green/700","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"red4","name":"red/400","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"red7","name":"red/700","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"amb4","name":"amber/400","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"amb7","name":"amber/700","variableCollectionId":"prim","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bgp","name":"bg/page","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bgs","name":"bg/surface","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bge","name":"bg/elevated","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bgh","name":"bg/hover","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"tp","name":"text/primary","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"ts","name":"text/secondary","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"tm","name":"text/muted","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bd","name":"border/default","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"bs","name":"border/strong","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"ap","name":"accent/primary","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"ab","name":"accent/button","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"sv","name":"status/verified","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"se","name":"status/error","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"sw","name":"status/warning","variableCollectionId":"sem","resolvedType":"COLOR"},
    {"action":"CREATE","id":"s1","name":"space/1","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s2","name":"space/2","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s3","name":"space/3","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s4","name":"space/4","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s6","name":"space/6","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s8","name":"space/8","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s12","name":"space/12","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"s16","name":"space/16","variableCollectionId":"sp","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"rsm","name":"radius/sm","variableCollectionId":"sh","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"rmd","name":"radius/md","variableCollectionId":"sh","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"rlg","name":"radius/lg","variableCollectionId":"sh","resolvedType":"FLOAT"},
    {"action":"CREATE","id":"rfl","name":"radius/full","variableCollectionId":"sh","resolvedType":"FLOAT"}
  ],
  "variableModeValues": [
    {"variableId":"g1","modeId":"pd","value":{"r":0.039,"g":0.043,"b":0.055,"a":1}},
    {"variableId":"g2","modeId":"pd","value":{"r":0.059,"g":0.067,"b":0.082,"a":1}},
    {"variableId":"g3","modeId":"pd","value":{"r":0.082,"g":0.094,"b":0.118,"a":1}},
    {"variableId":"g4","modeId":"pd","value":{"r":0.110,"g":0.125,"b":0.153,"a":1}},
    {"variableId":"g5","modeId":"pd","value":{"r":0.141,"g":0.161,"b":0.184,"a":1}},
    {"variableId":"g6","modeId":"pd","value":{"r":0.176,"g":0.204,"b":0.239,"a":1}},
    {"variableId":"g7","modeId":"pd","value":{"r":0.227,"g":0.259,"b":0.302,"a":1}},
    {"variableId":"g8","modeId":"pd","value":{"r":0.314,"g":0.345,"b":0.384,"a":1}},
    {"variableId":"g9","modeId":"pd","value":{"r":0.420,"g":0.455,"b":0.502,"a":1}},
    {"variableId":"g10","modeId":"pd","value":{"r":0.545,"g":0.576,"b":0.624,"a":1}},
    {"variableId":"g11","modeId":"pd","value":{"r":0.690,"g":0.722,"b":0.769,"a":1}},
    {"variableId":"g12","modeId":"pd","value":{"r":0.886,"g":0.910,"b":0.941,"a":1}},
    {"variableId":"t100","modeId":"pd","value":{"r":0.800,"g":0.984,"b":0.945,"a":1}},
    {"variableId":"t300","modeId":"pd","value":{"r":0.369,"g":0.918,"b":0.831,"a":1}},
    {"variableId":"t400","modeId":"pd","value":{"r":0.176,"g":0.831,"b":0.749,"a":1}},
    {"variableId":"t500","modeId":"pd","value":{"r":0.078,"g":0.722,"b":0.651,"a":1}},
    {"variableId":"t600","modeId":"pd","value":{"r":0.051,"g":0.580,"b":0.533,"a":1}},
    {"variableId":"t700","modeId":"pd","value":{"r":0.059,"g":0.463,"b":0.431,"a":1}},
    {"variableId":"t800","modeId":"pd","value":{"r":0.067,"g":0.369,"b":0.349,"a":1}},
    {"variableId":"grn4","modeId":"pd","value":{"r":0.290,"g":0.871,"b":0.502,"a":1}},
    {"variableId":"grn7","modeId":"pd","value":{"r":0.082,"g":0.502,"b":0.239,"a":1}},
    {"variableId":"red4","modeId":"pd","value":{"r":0.973,"g":0.443,"b":0.443,"a":1}},
    {"variableId":"red7","modeId":"pd","value":{"r":0.725,"g":0.110,"b":0.110,"a":1}},
    {"variableId":"amb4","modeId":"pd","value":{"r":0.984,"g":0.749,"b":0.141,"a":1}},
    {"variableId":"amb7","modeId":"pd","value":{"r":0.706,"g":0.325,"b":0.035,"a":1}},

    {"variableId":"bgp","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g2"}},
    {"variableId":"bgs","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g3"}},
    {"variableId":"bge","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g4"}},
    {"variableId":"bgh","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g5"}},
    {"variableId":"tp","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g12"}},
    {"variableId":"ts","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g10"}},
    {"variableId":"tm","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g9"}},
    {"variableId":"bd","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g6"}},
    {"variableId":"bs","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"g7"}},
    {"variableId":"ap","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"t400"}},
    {"variableId":"ab","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"t500"}},
    {"variableId":"sv","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"grn4"}},
    {"variableId":"se","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"red4"}},
    {"variableId":"sw","modeId":"dark","value":{"type":"VARIABLE_ALIAS","id":"amb4"}},

    {"variableId":"bgp","modeId":"light","value":{"r":1,"g":1,"b":1,"a":1}},
    {"variableId":"bgs","modeId":"light","value":{"r":0.973,"g":0.976,"b":0.984,"a":1}},
    {"variableId":"bge","modeId":"light","value":{"r":0.910,"g":0.918,"b":0.933,"a":1}},
    {"variableId":"bgh","modeId":"light","value":{"r":0.875,"g":0.890,"b":0.914,"a":1}},
    {"variableId":"tp","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"g2"}},
    {"variableId":"ts","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"g8"}},
    {"variableId":"tm","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"g9"}},
    {"variableId":"bd","modeId":"light","value":{"r":0.816,"g":0.835,"b":0.867,"a":1}},
    {"variableId":"bs","modeId":"light","value":{"r":0.722,"g":0.749,"b":0.788,"a":1}},
    {"variableId":"ap","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"t600"}},
    {"variableId":"ab","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"t600"}},
    {"variableId":"sv","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"grn7"}},
    {"variableId":"se","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"red7"}},
    {"variableId":"sw","modeId":"light","value":{"type":"VARIABLE_ALIAS","id":"amb7"}},

    {"variableId":"s1","modeId":"spd","value":4},
    {"variableId":"s2","modeId":"spd","value":8},
    {"variableId":"s3","modeId":"spd","value":12},
    {"variableId":"s4","modeId":"spd","value":16},
    {"variableId":"s6","modeId":"spd","value":24},
    {"variableId":"s8","modeId":"spd","value":32},
    {"variableId":"s12","modeId":"spd","value":48},
    {"variableId":"s16","modeId":"spd","value":64},
    {"variableId":"rsm","modeId":"shd","value":6},
    {"variableId":"rmd","modeId":"shd","value":8},
    {"variableId":"rlg","modeId":"shd","value":12},
    {"variableId":"rfl","modeId":"shd","value":9999}
  ]
}' | {
  BODY=$(head -n -1)
  CODE=$(tail -1)
  echo "HTTP $CODE"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  [ "$CODE" = "200" ] && echo "✅ Done" || echo "❌ Token needs file_variables:write scope + Enterprise plan"
}
