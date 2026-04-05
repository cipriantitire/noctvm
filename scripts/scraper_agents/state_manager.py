import json
import os

# This is the physical bridge where the Swarm will pass data back and forth
BRIDGE_FILE = os.path.join(os.path.dirname(__file__), 'scraper_state.json')

def init_state():
    state = {
        "status": "idle",
        "target_url": "https://example.com/events", # Dummy target for our first test
        "raw_data": {},
        "qa_feedback": "None"
    }
    with open(BRIDGE_FILE, 'w') as f:
        json.dump(state, f, indent=4)
    print(f"Initialized swarm state at {BRIDGE_FILE}")

if __name__ == "__main__":
    init_state()