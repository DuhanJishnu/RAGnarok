import re
import html

def sanitize_model_output(single_line_str: str) -> str:
    """
    - Remove literal 'undefined'/'None'/'null' tokens.
    - Normalize repeated backslash-n sequences.
    - Ensure it doesn't start with the word 'Title'.
    - (Optional) escape JSON-unfriendly characters before json.dumps.
    """
    if single_line_str is None:
        return ""

    s = single_line_str

    # remove common bogus tokens
    s = re.sub(r'\b(undefined|None|null)\b', '', s)

    # collapse multiple occurrences of '\n' to single '\n\n' where appropriate
    s = re.sub(r'(\\n\\s*){3,}', '\\n\\n', s)

    # trim spaces around '\n'
    s = re.sub(r'\\n\\s+', '\\n', s)
    s = re.sub(r'\s+\\n', '\\n', s)

    # if it starts with "Title" inserted by model, replace with generated heading
    if re.match(r'^\s*Title\\n', s):
        s = re.sub(r'^\s*Title\\n\s*', '', s)
        s = '# ' + s  # ensure a leading H1

    # final trim
    s = s.strip()

    return s

# Rendering on client (or server if you want to convert before sending):
# Convert literal '\n' tokens to real newlines:
# renderable = sanitize_model_output(model_single_line).replace('\\n', '\n')
