#!/usr/bin/env python3
"""
Automated Google Scholar Sync Script for Kieu Van Tuyen
Fetches the latest publications and citations from Google Scholar
and updates data/publications.json and index.html.
"""

import re
import json
import urllib.request
import os
import sys
from bs4 import BeautifulSoup

SCHOLAR_ID = "Zq72t0wAAAAJ"
SCHOLAR_URL = f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en&sortby=pubdate&cstart=0&pagesize=100"

USER_NAMES = [
    r"\bT\.?\s*V\.?\s*Kieu\b",
    r"\bT\s+Van\s+Kieu\b",
    r"\bTV\s+Kieu\b",
    r"\bK\s+Tuyen\s+Van\b",
    r"\bKieu\s+Van\s+Tuyen\b",
    r"\bTuyen\s+Van\s+Kieu\b",
    r"\bKiều\s+Văn\s+Tuyên\b"
]

def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()

def normalize_title(title):
    return re.sub(r"[^a-zA-Z0-9\s]", "", title).lower().strip()

def highlight_author(authors_str):
    res = authors_str
    for pattern in USER_NAMES:
        res = re.sub(f"({pattern})", r"<strong>\1</strong>", res, flags=re.IGNORECASE)
    return res

def fetch_scholar_papers():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    req = urllib.request.Request(SCHOLAR_URL, headers=headers)
    try:
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
    except Exception as e:
        print(f"Error fetching Google Scholar: {e}", file=sys.stderr)
        return []

    soup = BeautifulSoup(html, "html.parser")
    papers = []

    for row in soup.select("tr.gsc_a_tr"):
        title_el = row.select_one("a.gsc_a_at")
        if not title_el:
            continue
        title = clean_text(title_el.text)
        link = "https://scholar.google.com" + title_el["href"]
        
        grays = row.select("div.gs_gray")
        authors = clean_text(grays[0].text) if len(grays) > 0 else ""
        venue = clean_text(grays[1].text) if len(grays) > 1 else ""
        
        year_el = row.select_one("span.gsc_a_h")
        year = clean_text(year_el.text) if year_el else ""
        
        cites_el = row.select_one("a.gsc_a_ac")
        cites = clean_text(cites_el.text) if cites_el else "0"

        papers.append({
            "title": title,
            "authors": authors,
            "venue": venue,
            "year": year,
            "cites": cites,
            "scholar_url": link
        })

    return papers

def generate_bibtex(paper, bib_id):
    title = paper["title"]
    authors = paper["authors"]
    venue = paper["venue"]
    year = paper["year"] or "2025"
    
    first_author_surname = "kieu"
    if authors:
        parts = authors.split(",")[0].strip().split()
        first_author_surname = parts[-1].lower() if parts else "kieu"
    
    key = bib_id or f"{first_author_surname}{year}{re.sub(r'[^a-zA-Z]', '', title)[:6].lower()}"

    bib = f"@article{{{key},\n"
    bib += f"  title={{{title}}},\n"
    bib += f"  author={{{authors}}},\n"
    if venue:
        bib += f"  journal={{{venue}}},\n"
    bib += f"  year={{{year}}}\n"
    bib += "}"
    return key, bib

def build_paper_html(paper, curated_meta, index):
    title = paper["title"]
    authors = highlight_author(paper["authors"])
    venue = paper["venue"]
    year = paper["year"]
    scholar_url = paper["scholar_url"]

    norm_title = normalize_title(title)
    meta = {}
    for k, v in curated_meta.items():
        if normalize_title(k) in norm_title or norm_title in normalize_title(k):
            meta = v
            break

    is_highlighted = meta.get("highlighted", False)
    entry_class = "paper-entry highlighted" if is_highlighted else "paper-entry"

    # Links
    links = []
    if "doi" in meta:
        title_href = meta["doi"]
    elif "arxiv" in meta:
        title_href = meta["arxiv"]
    else:
        title_href = scholar_url

    if "arxiv" in meta:
        links.append(f'<a href="{meta["arxiv"]}">[arXiv]</a>')
    if "code" in meta:
        links.append(f'<a href="{meta["code"]}">[code]</a>')
    
    links.append(f'<a href="{scholar_url}">[scholar]</a>')

    bib_id = meta.get("bibtex_id", f"paper{index}")
    key, bibtex_code = generate_bibtex(paper, bib_id)
    links.append(f'<a href="javascript:toggleBibtex(\'{key}\')">[bibtex]</a>')

    links_html = " / ".join(links)
    
    desc_html = ""
    if "description" in meta:
        desc_html = f'<p class="paper-desc">{meta["description"]}</p>\n'

    html = f"""      <!-- Paper {index} -->
      <div class="{entry_class}">
        <a href="{title_href}" class="papertitle">{title}</a>
        <div class="paper-authors">{authors}</div>
        <div class="paper-venue">{venue}</div>
        <div class="paper-links">{links_html}</div>
        {desc_html}        <pre class="bibtex-box" id="bibtex-{key}">{bibtex_code}</pre>
      </div>\n"""
    return html

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    curated_path = os.path.join(base_dir, "data", "curated_papers.json")
    pub_json_path = os.path.join(base_dir, "data", "publications.json")
    index_path = os.path.join(base_dir, "index.html")

    curated_meta = {}
    if os.path.exists(curated_path):
        with open(curated_path, "r", encoding="utf-8") as f:
            curated_meta = json.load(f)

    print("Fetching papers from Google Scholar...")
    papers = fetch_scholar_papers()
    if not papers:
        print("No papers retrieved or request was blocked. Keeping existing index.html.")
        return

    print(f"Retrieved {len(papers)} papers.")

    # Save to data/publications.json
    with open(pub_json_path, "w", encoding="utf-8") as f:
        json.dump(papers, f, indent=2, ensure_ascii=False)
    print(f"Saved raw publications to {pub_json_path}")

    # Build Publications HTML
    pubs_html = "<!-- PUBLICATIONS_START -->\n"
    for idx, p in enumerate(papers, start=1):
        pubs_html += build_paper_html(p, curated_meta, idx)
    pubs_html += "      <!-- PUBLICATIONS_END -->"

    # Replace in index.html
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

        start_marker = "<!-- PUBLICATIONS_START -->"
        end_marker = "<!-- PUBLICATIONS_END -->"

        if start_marker in content and end_marker in content:
            pattern = re.compile(f"{re.escape(start_marker)}.*?{re.escape(end_marker)}", re.DOTALL)
            new_content = pattern.sub(pubs_html, content)
            with open(index_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("Successfully updated index.html with latest Scholar publications.")
        else:
            print("Markers not found in index.html, please ensure <!-- PUBLICATIONS_START --> and <!-- PUBLICATIONS_END --> exist.")

if __name__ == "__main__":
    main()
