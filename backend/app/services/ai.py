import os
from google import genai
from bs4 import BeautifulSoup

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "gemini-embedding-001"

# for m in client.models.list():
#   print(m)
#   print("\n")


def _strip_html(html: str) -> str:
    """
    Strip TipTap HTML tags - plain text gives significatly better Gemini results
    """
    return BeautifulSoup(html, "html.parser").get_text(separator=" ").strip()


async def summarize_note(content: str) -> str:
    """
    Summarize the note with 2-3 concise sentences
    """
    plain = _strip_html(content)
    prompt = f"Summarize the following note in 2-3 concise sentences. Return only the summary, no preamble \n\n {plain}"
    response = await client.aio.models.generate_content(model=MODEL, contents=prompt)
    if response.text:
        return response.text.strip()

    return "Cannot summarize, Error Occured, Please try again!!!"


async def generate_tags(content: str) -> list[str]:
    """
    Generate tags from the note
    """
    plain = _strip_html(content)
    prompt = f"Generate 3-5 short, relevant tags for the following note. Return only a comma-separated list of lowercase tags, no preamble:\n\n {plain}"

    response = await client.aio.models.generate_content(
        model=MODEL,
        contents=prompt,
    )
    if response.text:
        raw = response.text.strip()
        tags = [tag.strip().lower() for tag in raw.split(",") if tag.strip()]
        return tags[:5]

    return []


async def embed_text(text: str) -> list[float]:
    """
    Generate a 768-dim embedding vector for the given text.
    """
    plain = _strip_html(text)
    response = await client.aio.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=plain,
        config={"output_dimensionality": 768},
    )
    if response.embeddings:
        return response.embeddings[0].values or []
    return []


async def ask_question(question: str, context_notes: list[str]) -> str:
    """
    Answer a natural-language question grounded in the user's notes.
    context_notes: list of plain-text note contents (already stripped).
    """

    if not context_notes:
        return "I couldn't find any relevant notes to answer your question."

    numbered = "\n\n".join(
        f"Note {i+1}:\n{note}" for i, note in enumerate(context_notes)
    )

    prompt = (
        "You are a helpful assistant. Answer the user's question using ONLY"
        "the notes provided below. Be concise and direct. "
        "If notes don't contain enough information, say so.\n\n"
        f"### Notes\n{numbered}\n\n"
        f"### Question\n{question}\n\n"
        "### Answer"
    )

    response = await client.aio.models.generate_content(model=MODEL, contents=prompt)

    if response.text:
        return response.text.strip()

    return "Could note generate an answer. Please try again."
