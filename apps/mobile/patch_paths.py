import os, re

OLD_FWD = 'C:/Users/sangw/OneDrive/Documents/Unreal Projects/CEN/apps/mobile'
OLD_BWD = 'C:\\Users\\sangw\\OneDrive\\Documents\\Unreal Projects\\CEN\\apps\\mobile'
OLD_BWD_ESC = 'C:\\\\Users\\\\sangw\\\\OneDrive\\\\Documents\\\\Unreal Projects\\\\CEN\\\\apps\\\\mobile'
OLD_ESC_SP = 'C:/Users/sangw/OneDrive/Documents/Unreal\\ Projects/CEN/apps/mobile'

NEW_FWD = 'C:/cen'
NEW_BWD = 'C:\\cen'
NEW_BWD_ESC = 'C:\\\\cen'

ROOT = r'C:\cen\android'
EXTS = ('.cmake', '.json', '.gradle', '.properties', '.txt', '.cfg', '.xml')

count = 0
for dirpath, _, files in os.walk(ROOT):
    if '\\.gradle\\' in dirpath or '/.gradle/' in dirpath:
        continue
    for f in files:
        if not f.endswith(EXTS):
            continue
        p = os.path.join(dirpath, f)
        try:
            with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
                t = fh.read()
        except Exception:
            continue
        if 'Unreal' not in t and 'OneDrive' not in t:
            continue
        t2 = (t
              .replace(OLD_ESC_SP, NEW_FWD)
              .replace(OLD_FWD, NEW_FWD)
              .replace(OLD_BWD_ESC, NEW_BWD_ESC)
              .replace(OLD_BWD, NEW_BWD))
        if t != t2:
            with open(p, 'w', encoding='utf-8') as fh:
                fh.write(t2)
            count += 1
            print('patched:', p)
print('total patched:', count)
