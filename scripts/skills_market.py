import requests
import sys
import json

API_KEY = "sk_live_skillsmp_-k-Ds9NPbvPf9s1sbYYHGf-M3walHxAmWFLbbel55fU"
SEARCH_URL = "https://skillsmp.com/api/v1/skills/search"
AI_SEARCH_URL = "https://skillsmp.com/api/v1/skills/ai-search"

def search_skills(query, ai=False):
    url = AI_SEARCH_URL if ai else SEARCH_URL
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    params = {"q": query}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python skills_market.py <query> [--ai]")
        sys.exit(1)
    
    query = sys.argv[1]
    is_ai = "--ai" in sys.argv
    results = search_skills(query, ai=is_ai)
    print(json.dumps(results, indent=2))
