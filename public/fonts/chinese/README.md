# Studio Chinese web fonts

Two self-hosted WOFF2 subsets make Chinese typography consistent across devices.
They are authoring-time font assets, not new JavaScript or runtime dependencies.
The English Bricolage Grotesque / Onest system is unchanged. CSS family aliases
are `Studio Rounded SC` for selected Chinese section headings and `Studio Sans SC`
for Chinese body text and smaller headings; the upstream fonts retain their
original copyright and family metadata.

## Official sources and licences

### Resource Han Rounded CN Medium

- Upstream: https://github.com/CyanoHao/Resource-Han-Rounded
- Official release: https://github.com/CyanoHao/Resource-Han-Rounded/releases/tag/v0.990
- Download: https://github.com/CyanoHao/Resource-Han-Rounded/releases/download/v0.990/RHR-CN-0.990.7z
- Original font member: `ResourceHanRoundedCN-Medium.ttf`, simplified Chinese,
  static OpenType weight class 500.
- Original SHA-256: `b2ec1727fbc04b70255db6cb71be0eca3b7a7167ef11655059c5576cc920143f`
- Upstream distributor licence: https://raw.githubusercontent.com/CyanoHao/Resource-Han-Rounded/be90fee7a031c1297da5a260ccfb91756088d51c/OFL-License.txt
- Licence copied verbatim beside the font: `ResourceHanRounded-OFL.txt` (SIL OFL 1.1).
- Delivery asset: `resource-han-rounded-studio.woff2`, 129,148 bytes.
- This is a web subset of Resource Han Rounded; it is not the original
  Source Han Sans font or an endorsement by the upstream authors.

### Noto Sans SC

- Official Google Fonts distribution: https://github.com/google/fonts/tree/main/ofl/notosanssc
- Font upstream: https://github.com/notofonts/noto-cjk
- Distribution commit: `bbda7253fc363238b05d97515ca71f8ae49c4fa9`
- Original font: https://raw.githubusercontent.com/google/fonts/bbda7253fc363238b05d97515ca71f8ae49c4fa9/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- Original licence: https://raw.githubusercontent.com/google/fonts/bbda7253fc363238b05d97515ca71f8ae49c4fa9/ofl/notosanssc/OFL.txt
- Licence copied verbatim beside the font: `NotoSansSC-OFL.txt` (SIL OFL 1.1).
- Original SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`
- Delivery asset: `noto-sans-sc-studio.woff2`, 199,732 bytes, genuine variable
  `wght` range 400–600 (default 400). The unused weight extremes are removed.

## Subset scope and reproduction

`scripts/prepare-chinese-fonts.py` uses FontTools to collect the Unicode
characters in `src/**/*.ts`, `src/**/*.tsx` and `index.html`, plus printable
ASCII. Both subsets cover all 895 collected codepoints, including 778 Chinese
ideographs. The WOFF2 outputs retain kerning/layout
information and font licence metadata. Content beyond the subset can fall back
to local system fonts; re-run the script after changing Chinese copy.

Extract only `ResourceHanRoundedCN-Medium.ttf` from the official 7-Zip release
and save it in an ignored local tooling directory. Download the pinned Noto
original beside it as `NotoSansSC-variable.ttf`. The script checks original
SHA-256 values before processing; a changed source revision requires an
explicit provenance update. The original archive and multi-megabyte TTFs are
not part of the published site or Git history.

In a Python tooling environment with FontTools 4.60.1 and its WOFF extra:

```sh
python -m pip install "fonttools[woff]==4.60.1"
python scripts/prepare-chinese-fonts.py --sources outputs/chinese-font-sources
```

Use `--face rounded` or `--face sans` to regenerate only one asset.

This release used Brotli 1.2.1. The repository's normal npm installation, test,
build and GitHub Pages workflows do not need Python or FontTools. No browser
requests to Google Fonts or another external font server are made.
