from pathlib import Path
import re

files = list(Path('/home/monkey/POSMobile/resources/js').rglob('*.tsx'))

for path in files:
    text = path.read_text()
    lines = text.splitlines(keepends=True)
    changed = False
    out = []
    for line in lines:
        # Missing closing quote: href="/path   at end of line (only 1 quote after href=)
        m = re.match(r'^(\s*href=")(/[^"\s]+)(\s*)$', line.rstrip('\r\n'))
        if m:
            newline = f'{m.group(1)}{m.group(2)}"' + ('\n' if line.endswith('\n') else '')
            print(f'{path}: {line.rstrip()!r} -> {newline.rstrip()!r}')
            out.append(newline)
            changed = True
        else:
            out.append(line)
    if changed:
        path.write_text(''.join(out))
