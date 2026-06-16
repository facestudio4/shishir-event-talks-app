# BigQuery Release Notes Explorer

A premium, glassmorphic Single-Page Application (SPA) built with Python Flask and plain vanilla web technologies (HTML5, JavaScript, and CSS3) that fetches, parses, and displays official Google Cloud BigQuery release notes. It also allows you to quickly filter and share updates directly to X (formerly Twitter).

## Features

*   **Live XML Parsing**: Dynamically fetches the feed from `docs.cloud.google.com` and parses Atom XML data.
*   **Atomic Heading Splitting**: Separates combined daily release notes into distinct, categorizable updates (e.g. *Feature*, *Issue*, *Announcement*, *Breaking*, *Change*) by parsing `<h3>` tags.
*   **Real-time Search & Filter**: Instant client-side search indexing and category filtering.
*   **Analytics Dashboard**: Visual statistics panel showing the count of total items, features, breaking changes, and issues, featuring animated counting effects.
*   **Twitter/X Web Intent Integration**: Automatically formats update text, verifies character limits (truncating descriptions with `...` if they exceed the 280-character limit), appends hashtags (`#BigQuery #GCP`), and opens the X web composer popup.
*   **Modern Glassmorphism UI**: High-end UI styling including radial gradients, frosted-glass backdrops (`backdrop-filter`), hover lifts, and animated shimmer loading skeletons.

---

## Technology Stack

*   **Backend**: Python, Flask
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom CSS variables, glassmorphic styles), Vanilla JavaScript (asynchronous Fetch API, DOM manipulation)
*   **Feed Parser**: Standard Python Libraries (`urllib.request`, `xml.etree.ElementTree`, `re`)

---

## Directory Structure

```text
bq-releases-notes/
│
├── app.py                # Flask server, route controllers, and feed parser
├── .gitignore            # Git exclusion rules
├── README.md             # Project documentation
│
├── templates/
│   └── index.html        # Main HTML page structure
│
└── static/
    ├── css/
    │   └── style.css     # Premium UI stylesheet (glassmorphism, animations)
    └── js/
        └── main.js       # Dynamic search, filtering, statistics, and X-sharing
```

---

## Installation & Setup

### Prerequisites
Make sure you have **Python 3.x** installed.

### 1. Install Dependencies
Install Flask using `pip`:
```bash
pip install Flask
```

### 2. Run the Development Server
Start the Flask application:
```bash
python app.py
```

### 3. Open in Browser
Once the server starts running, open your web browser and navigate to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)
