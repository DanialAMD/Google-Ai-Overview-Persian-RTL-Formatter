# Google AI Overview RTL Fix

Chrome Extension (Manifest V3) for fixing Persian/Arabic text layout inside Google's AI Overview.

## What's improved in 1.1.0
- Detects Persian text even when Google nests it inside inline spans.
- Right-aligns Persian paragraphs and headings.
- Sets list containers (`ul`/`ol`) to RTL so bullets move to the right.
- Keeps Latin technical terms, links, and code isolated within Persian text.
- Watches dynamically-rendered AI Overview content.
- Does not apply RTL rules to ordinary Google search results.

## Install
1. Extract the ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `google-ai-overview-rtl` folder.
6. Refresh the Google results page.

## Update from 1.0
Remove or disable the old unpacked extension, then load this extracted folder. If Chrome reports the same extension already exists, use **Reload** on the existing extension after replacing its files.

## Note
Google changes its page structure periodically. This version targets the visible AI Overview label and its nearby content; it has not been verified against every Google layout variant.
