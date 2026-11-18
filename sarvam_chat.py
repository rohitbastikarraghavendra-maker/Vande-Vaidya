import os
from pathlib import Path

from sarvamai import SarvamAI


for line in Path(__file__).with_name(".env").read_text(encoding="utf-8-sig").splitlines():
    if line.startswith("SARVAM_API_KEY="):
        os.environ.setdefault("SARVAM_API_KEY", line.partition("=")[2].strip())
        break

key = os.environ.get("SARVAM_API_KEY")
if not key:
    raise SystemExit("Set SARVAM_API_KEY in .env first.")

client = SarvamAI(api_subscription_key=key)
reply = client.chat.completions_v2(
    model="sarvam-105b-conversations",
    messages=[{"role": "user", "content": "Say hello in one short sentence."}],
)
print(reply.choices[0].message.content)
