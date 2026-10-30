"""게임에 내장할 폰트를 필요한 글자만 남겨 작게 만든다.

포함 글자: KS X 1001 한글 2,350자 + ASCII + content.json·src/ 안의 모든 글자.
질문을 고쳐도 대부분 다시 만들 필요가 없도록 상용 한글은 미리 넣어 둔다.
Pretendard, 야놀자 야체 모두 SIL Open Font License 1.1 폰트다.

사용: python3 tools/subset_fonts.py
"""
import os
import pathlib
import unicodedata

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "fonts"
FONT_DIRS = [pathlib.Path.home() / "Library/Fonts", pathlib.Path("/Library/Fonts")]
FONTS = [
    ("Pretendard-Medium.otf", "pretendard-500.woff"),
    ("Pretendard-Bold.otf", "pretendard-700.woff"),
    ("Pretendard-ExtraBold.otf", "pretendard-800.woff"),
    ("야놀자+야체+Bold.ttf", "yache.woff"),
]


def find_font(name):
    want = unicodedata.normalize("NFC", name)
    for d in FONT_DIRS:
        if not d.is_dir():
            continue
        for f in os.listdir(d):
            if unicodedata.normalize("NFC", f) == want:
                return d / f
    raise SystemExit(f"폰트를 찾지 못했습니다: {name} (~/Library/Fonts 또는 /Library/Fonts)")


def collect_chars():
    chars = set(chr(c) for c in range(0x20, 0x7F))
    for cp in range(0xAC00, 0xD7A4):
        ch = chr(cp)
        try:
            # 파이썬 euc-kr은 KS X 1001 밖의 글자도 8바이트 조합형으로 인코딩한다. 2바이트만 상용 2,350자다.
            if len(ch.encode("euc-kr")) == 2:
                chars.add(ch)
        except UnicodeEncodeError:
            pass
    for p in [ROOT / "content.json", *sorted((ROOT / "src").glob("*"))]:
        chars |= set(p.read_text(encoding="utf-8"))
    return sorted(c for c in chars if c.isprintable())


def main():
    OUT.mkdir(exist_ok=True)
    chars = collect_chars()
    text = "".join(chars)
    for src, dst in FONTS:
        opts = subset.Options()
        opts.flavor = "woff"
        opts.hinting = False
        opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        font = subset.load_font(str(find_font(src)), opts)
        s = subset.Subsetter(opts)
        s.populate(text=text)
        s.subset(font)
        subset.save_font(font, str(OUT / dst), opts)
        print(f"{dst}: {(OUT / dst).stat().st_size / 1024:.0f} KB")
    (OUT / "chars.txt").write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
