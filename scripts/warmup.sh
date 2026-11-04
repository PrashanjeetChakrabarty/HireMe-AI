#!/bin/zsh
# Wakes up every free-tier service before a demo and prints how long each one took.
# The addresses of your own services come from scripts/warmup.env (copy scripts/warmup.env.example) or from the terminal.
[ -f "${0:A:h}/warmup.env" ] && source "${0:A:h}/warmup.env"
SITE="${SITE_URL:-https://hireme-ai-hiring.vercel.app}"
API="${API_URL:?Set API_URL first, for example: export API_URL=https://your-api.azurewebsites.net}"
AI="${AI_URL:?Set AI_URL first, for example: export AI_URL=https://your-ai-service.example.com}"

check() {
  local out
  out=$(curl -s -o /dev/null --max-time 150 -w "HTTP %{http_code} in %{time_total}s" "$2")
  printf "%-22s %s\n" "$1" "$out"
}

echo "Waking everything up (the first pass can take up to 2 minutes)..."
check "Frontend (Vercel)"  "$SITE/"
check "AI service (Korea)" "$AI/"
check "Backend + database" "$API/api/Roles/register-options"
echo
echo "Second pass (should be fast now):"
check "Frontend (Vercel)"  "$SITE/"
check "AI service (Korea)" "$AI/"
check "Backend + database" "$API/api/Roles/register-options"
