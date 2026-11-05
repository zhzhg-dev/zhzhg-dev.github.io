"""Build content-specific, self-hosted Chinese WOFF2 fonts.

Optional authoring tool, not a build or website dependency. Install FontTools
with its WOFF extra in your tooling environment, then provide the two original
official fonts with --sources. See public/fonts/chinese/README.md for provenance.
"""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


REPOSITORY = Path(__file__).resolve().parent.parent
OUTPUT = REPOSITORY / "public" / "fonts" / "chinese"
SOURCE_HASHES = {
    "LXGWWenKai-Regular.ttf": "2d73eea94ad808999d90c0000c239a84a33b09d4bc6ab6c5b8bbf1eda8a7fc8b",
    "NotoSansSC-variable.ttf": "a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da",
}


def site_codepoints():
    files = sorted((REPOSITORY / "src").rglob("*.tsx"))
    files += sorted((REPOSITORY / "src").rglob("*.ts"))
    files += [REPOSITORY / "index.html"]
    # Include the complete present site, including hidden dialogs, dynamic
    # labels and translated project evidence—not just the initial viewport.
    text = "".join(path.read_text(encoding="utf-8") for path in files)
    needed = {ord(char) for char in text if not char.isspace()}
    needed.update(range(0x20, 0x7F))
    return needed


def prepare(source, destination, codepoints, variable=False):
    source_hash = sha256(source.read_bytes()).hexdigest()
    if source_hash != SOURCE_HASHES[source.name]:
        raise ValueError(f"Unexpected original font checksum: {source.name}")
    font = TTFont(source, recalcTimestamp=False)
    original_map = font.getBestCmap()
    options = subset.Options()
    options.flavor = "woff2"
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17, 25]
    options.name_legacy = True
    options.name_languages = [0x409]
    options.notdef_glyph = True
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    if variable:
        # The site uses only regular to semibold. Keep genuine interpolation
        # for 400–600, without shipping the unused 100–900 weight range.
        instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
    font.flavor = "woff2"
    font.save(destination)
    verification = TTFont(destination)
    cmap = verification.getBestCmap()
    cjk = {point for point in codepoints if 0x3400 <= point <= 0x9FFF}
    missing_cjk = sorted(cjk - set(cmap))
    if missing_cjk:
        raise ValueError(f"Missing CJK glyphs in {destination.name}: {missing_cjk}")
    return {
        "file": destination.name,
        "bytes": destination.stat().st_size,
        "sha256": sha256(destination.read_bytes()).hexdigest(),
        "source_sha256": source_hash,
        "requested_codepoints": len(codepoints),
        "mapped_codepoints": len(cmap),
        "original_mapped_codepoints": len(original_map),
        "cjk_codepoints": len(cjk),
        "glyphs": verification["maxp"].numGlyphs,
        "weight_range": [
            {"axis": axis.axisTag, "min": axis.minValue, "default": axis.defaultValue, "max": axis.maxValue}
            for axis in verification["fvar"].axes
        ] if "fvar" in verification else None,
    }


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, required=True)
    args = parser.parse_args()
    points = site_codepoints()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    reports = [
        prepare(args.sources / "LXGWWenKai-Regular.ttf", OUTPUT / "lxgw-wenkai-studio.woff2", points),
        prepare(args.sources / "NotoSansSC-variable.ttf", OUTPUT / "noto-sans-sc-studio.woff2", points, variable=True),
    ]
    print(json.dumps(reports, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
