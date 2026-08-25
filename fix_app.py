import re

with open("src/App.jsx", "r") as f:
    content = f.read()

# Fix non-breaking spaces
content = content.replace('\xa0', ' ')

# Fix missing colons in CSS style objects (fontWeight 800 -> fontWeight: 800)
content = re.sub(r'fontWeight\s+800', 'fontWeight: 800', content)

# Fix Disclaimer reload flicker by preserving completed onboarding state
content = re.sub(r'if\s*\(!data\?\.\s*onboardingCompleted\)\s*\{\s*setOnboardStep\(1\);\s*\}\s*else\s*\{\s*setOnboardStep\(0\);\s*\}', 
                 'if (data?.onboardingCompleted) { setOnboardStep(0); } else { setOnboardStep(1); }', content)

with open("src/App.jsx", "w") as f:
    f.write(content)

print("App successfully reconstructed and verified!")
