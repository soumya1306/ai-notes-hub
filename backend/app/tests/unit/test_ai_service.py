import pytest
from unittest.mock import MagicMock, AsyncMock, patch


@pytest.fixture()
def mock_genai_client():
    """
    This functions with the help of patch replaces the original model we have with a mock blackbox that replaces the model. It simulates the app.services.ai.client and since it patches the original client any call specific to this test will be routed to this mock client instead of the original Gemini client that we defined.
    """

    with patch("app.services.ai.client") as mock_client:
        yield mock_client


async def test_summarize_note_returns_text(mock_genai_client):
    """
    Here we create the response of a MagicMock() type and then set it to "This is a summary.". Then we use AsyncMock to set it to the generate_content()'s response. Finally when actually call the summarize note it calls the generate_content() eventually and then responds with the "This is a summary.". The assert result basicaaly tests if the result is what we expect or not.
    """

    mock_response = MagicMock()
    mock_response.text = "This is a summary."
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response
    )

    from app.services.ai import summarize_note

    result = await summarize_note("<p>My long note content here.</p>")

    assert result == "This is a summary."
    mock_genai_client.aio.models.generate_content.assert_called_once()


async def test_generate_tags_returns_lists(mock_genai_client):
    """
    Similar to the previous test we create a mock response and set the text to "python, fastapi, testing". Then we set this response to the generate_content()'s response. Finally when we call the generate_tags it should return a list of tags and we check if "python" is in the result.
    """

    mock_response = MagicMock()
    mock_response.text = "python, fastapi, testing"
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response
    )

    from app.services.ai import generate_tags

    result = await generate_tags("<p>Note about Python and FastAPI testing</p>")
    assert isinstance(result, list)
    assert "python" in result


async def test_embedtest_returns_vector(mock_genai_client):
    """
    Here we create a mock response for the embedding and set the values to a list of 0.1 repeated 768 times. Then we set this response to the embeddings.create()'s response. Finally when we call the embed_text it should return a vector of length 768.
    """

    mock_result = MagicMock()
    mock_result.embedding = [MagicMock(values=[0.1] * 768)]
    mock_genai_client.aio.embeddings.create = AsyncMock(return_value=mock_result)
    from app.services.ai import embed_text

    result = await embed_text("Sample text to embed")
    assert len(result) == 768


async def test_ask_question_returns_answer(mock_genai_client):
    """
    Here we create a mock response for the question and set the text to "This is the answer to your question.". Then we set this response to the generate_content()'s response. Finally when we call the ask_question it should return the answer we set in the mock response.
    """
    mock_response = MagicMock()
    mock_response.text = "This is the answer to your question."
    mock_genai_client.aio.models.generate_content = AsyncMock(
        return_value=mock_response
    )

    from app.services.ai import ask_question

    result = await ask_question(
        "What is the answer?", ["AI Notes Hub is a note-taking app."]
    )
    assert result == "This is the answer to your question."


async def test_summarize_note_429_raises_http_exception(mock_genai_client):
    """
    Here we simulate a 429 error from the Gemini API by setting the side_effect of the generate_content() to a ClientError with a 429 status code. Then when we call the summarize_note it should raise an HTTPException with a 429 status code, which we check in the assert statement.
    """
    from google.genai.errors import ClientError
    from fastapi import HTTPException

    mock_genai_client.aio.models.generate_content = AsyncMock(
        side_effect=ClientError(429, {"error": {"message": "Rate limit exceeded"}})
    )

    from app.services.ai import summarize_note

    with pytest.raises(HTTPException) as exc_info:
        await summarize_note("<p>My long note content here.</p>")

    assert exc_info.value.status_code == 429
