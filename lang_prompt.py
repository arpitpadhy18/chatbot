LANGUAGE_PROMPT = {
    "en": "Answer in English only.",
    "hi": "केवल हिंदी में उत्तर दें।",
    "fr": "Répondez uniquement en français.",
    "ta": "தமிழில் மட்டும் பதிலளிக்கவும்.",
}

def get_language_instruction(lang_code: str) -> str:
    return LANGUAGE_PROMPT.get(
        lang_code,
        "Answer strictly in the same language as the context."
    )
