import requests
import json

BASE_URL = "http://localhost:5000"

def test_health_check():
    response = requests.get(f"{BASE_URL}/api/health")
    print("Health Check:", response.json())

def test_chat():
    print("\n--- Testing Chat Endpoint ---")
    data = {"question": "What is RAG?", "secure_mode": False}
    response = requests.post(f"{BASE_URL}/api/chat", json=data)
    print("Chat Response:", response.json())

def test_chat_secure():
    print("\n--- Testing Secure Chat Endpoint ---")
    data = {"question": "What is RAG?", "secure_mode": True}
    response = requests.post(f"{BASE_URL}/api/chat", json=data)
    print("Secure Chat Response:", response.json())

def test_search():
    print("\n--- Testing Search Endpoint ---")
    data = {"query": "RAG", "k": 3}
    response = requests.post(f"{BASE_URL}/api/search", json=data)
    print("Search Response:", response.json())

def test_search_analyze():
    print("\n--- Testing Search Analyze Endpoint ---")
    data = {"query": "RAG", "analyze": True}
    response = requests.post(f"{BASE_URL}/api/search", json=data)
    print("Search Analyze Response:", response.json())

def test_chat_stream():
    print("\n--- Testing Chat Stream Endpoint ---")
    data = {"question": "Explain RAG in simple terms.", "stream": True}
    with requests.post(f"{BASE_URL}/api/chat", json=data, stream=True) as r:
        for chunk in r.iter_lines():
            if chunk:
                decoded_chunk = chunk.decode('utf-8')
                if decoded_chunk.startswith('data:'):
                    try:
                        json_data = json.loads(decoded_chunk[5:])
                        print(json_data)
                    except json.JSONDecodeError:
                        print(f"Received non-JSON data: {decoded_chunk}")

if __name__ == "__main__":
    test_health_check()
    test_chat()
    test_chat_secure()
    test_search()
    test_search_analyze()
    # Uncomment to test streaming
    # test_chat_stream()
