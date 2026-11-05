# Studio Chinese web fonts

Two self-hosted WOFF2 subsets make Chinese typography consistent across devices.
They are authoring-time font assets, not new JavaScript or runtime dependencies.
The English Bricolage Grotesque / Onest system is unchanged. CSS family aliases
are `Studio WenKai` for selected Chinese section headings and `Studio Sans SC`
for Chinese body text and smaller headings; the upstream fonts retain their
original copyright and family metadata.

## Official sources and licences

### LXGW WenKai Regular

- Upstream: https://github.com/lxgw/LxgwWenKai
- Pinned commit: `da0fdf92a0adc5d83c82ecde06d6665c97a2a45e`
- Original font: https://raw.githubusercontent.com/lxgw/LxgwWenKai/da0fdf92a0adc5d83c82ecde06d6665c97a2a45e/fonts/TTF/LXGWWenKai-Regular.ttf
- Original licence: https://raw.githubusercontent.com/lxgw/LxgwWenKai/da0fdf92a0adc5d83c82ecde06d6665c97a2a45e/OFL.txt
- Licence copied verbatim beside the font: `LXGW-OFL.txt` (SIL OFL 1.1).
- Original SHA-256: `2d73eea94ad808999d90c0000c239a84a33b09d4bc6ab6c5b8bbf1eda8a7fc8b`
- Delivery asset: `lxgw-wenkai-studio.woff2`, 181,472 bytes, regular weight 400.
- The upstream additional permission expressly permits the reserved names in
  format-converted or subsetted fonts solely for web delivery. This subset is
  shipped only as a web font, not an installable desktop font or font service.

### Noto Sans SC

- Official Google Fonts distribution: https://github.com/google/fonts/tree/main/ofl/notosanssc
- Font upstream: https://github.com/notofonts/noto-cjk
- Distribution commit: `bbda7253fc363238b05d97515ca71f8ae49c4fa9`
- Original font: https://raw.githubusercontent.com/google/fonts/bbda7253fc363238b05d97515ca71f8ae49c4fa9/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- Original licence: https://raw.githubusercontent.com/google/fonts/bbda7253fc363238b05d97515ca71f8ae49c4fa9/ofl/notosanssc/OFL.txt
- Licence copied verbatim beside the font: `NotoSansSC-OFL.txt` (SIL OFL 1.1).
- Original SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`
- Delivery asset: `noto-sans-sc-studio.woff2`, 196,148 bytes, genuine variable
  `wght` range 400–600 (default 400). The unused weight extremes are removed.

## Subset scope and reproduction

`scripts/prepare-chinese-fonts.py` uses FontTools to collect the Unicode
characters in `src/**/*.ts`, `src/**/*.tsx` and `index.html`, plus printable
ASCII. The initial subset includes 877 mapped codepoints, including all 759
Chinese ideographs currently present. Both fonts have zero missing present-site
Chinese characters. The WOFF2 outputs retain kerning/layout information and
font licence metadata. Content beyond this subset can fall back to local system
fonts; re-run the script after changing Chinese copy to extend the web assets.

Download the two original fonts from the pinned official URLs into an ignored
local tooling directory, naming them `LXGWWenKai-Regular.ttf` and
`NotoSansSC-variable.ttf`. The script checks both original SHA-256 values before
processing, so a changed source revision requires an explicit provenance update.
Original multi-megabyte TTFs are not part of the published site or Git history.

In a Python tooling environment with FontTools 4.60.1 and its WOFF extra:

```sh
python -m pip install "fonttools[woff]==4.60.1"
python scripts/prepare-chinese-fonts.py --sources outputs/chinese-font-sources
```

This release used Brotli 1.2.1. The repository's normal npm installation, test,
build and GitHub Pages workflows do not need Python or FontTools. No browser
requests to Google Fonts or another external font server are made.
