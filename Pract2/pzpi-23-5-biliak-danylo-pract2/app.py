import os
import tiktoken
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def count_tokens(text, model="gpt-4o"):
    """Returns the number of tokens in a text string."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    
    num_tokens = len(encoding.encode(text))
    return num_tokens

def chat_with_gpt(prompt, model="gpt-4o", stream=True):
    """Sends a prompt to ChatGPT and handles the response."""
    print(f"\n--- Requesting response for: '{prompt}' ---")
    print(f"Estimated tokens: {count_tokens(prompt, model)}")
    print("Response: ", end="", flush=True)

    try:
        response_stream = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=stream,
        )

        if stream:
            for chunk in response_stream:
                if chunk.choices[0].delta.content is not None:
                    print(chunk.choices[0].delta.content, end="", flush=True)
            print("\n")
        else:
            print(response_stream.choices[0].message.content)
            
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        print("Note: Make sure you have a valid OPENAI_API_KEY in your .env file.")

if __name__ == "__main__":
    user_prompt = "Поясни коротко архітектурний стиль ChatGPT."
    chat_with_gpt(user_prompt)
