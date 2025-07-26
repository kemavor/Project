#!/usr/bin/env python3
"""
Test available Gemini models
"""

import google.generativeai as genai


def test_gemini_models():
    """Test available Gemini models"""

    api_key = "AIzaSyApVQ5Y6B3w97Z3Qk22oP9S0dUvZqTDbvY"
    genai.configure(api_key=api_key)

    print("🔍 Testing Gemini Models...")

    # List available models
    try:
        models = genai.list_models()
        print("Available models:")
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                print(f"  ✅ {model.name}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

    # Test different model names
    model_names = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-pro-vision',
        'gemini-1.5-flash'
    ]

    for model_name in model_names:
        try:
            print(f"\nTesting {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, how are you?")
            print(f"  ✅ {model_name} works! Response: {response.text[:50]}...")
            break
        except Exception as e:
            print(f"  ❌ {model_name} failed: {e}")


if __name__ == "__main__":
    test_gemini_models()
