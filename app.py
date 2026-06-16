import urllib.request
import xml.etree.ElementTree as ET
import re
from flask import Flask, render_template, jsonify

app = Flask(__name__)

def fetch_and_parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return None

    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return None

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []

    for entry_el in root.findall('atom:entry', ns):
        # Extract title (which is the release date)
        title_el = entry_el.find('atom:title', ns)
        date = title_el.text.strip() if title_el is not None else "Unknown Date"
        
        # Extract updated timestamp
        updated_el = entry_el.find('atom:updated', ns)
        updated = updated_el.text.strip() if updated_el is not None else ""
        
        # Extract alternate link
        link_el = entry_el.find("atom:link[@rel='alternate']", ns)
        link = link_el.attrib.get('href', '').strip() if link_el is not None else ""
        
        # Extract HTML content
        content_el = entry_el.find('atom:content', ns)
        content_html = content_el.text if content_el is not None else ""

        # Split content_html by <h3> tags
        # Each h3 marks the type of the update (Feature, Issue, Announcement, Breaking, Change)
        parts = re.split(r'<h3>(.*?)</h3>', content_html)
        updates = []
        
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                update_type = parts[i].strip()
                update_content = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # Create a plain text version for tweeting
                # Strip HTML tags
                plain_text = re.sub(r'<[^>]+>', '', update_content)
                # Unescape HTML entities if any
                plain_text = html_unescape(plain_text)
                # Compress whitespaces
                plain_text = ' '.join(plain_text.split())

                updates.append({
                    'type': update_type,
                    'content': update_content,
                    'plain_text': plain_text
                })
        else:
            # Fallback if no <h3> tags are present in the feed content
            plain_text = re.sub(r'<[^>]+>', '', content_html)
            plain_text = html_unescape(plain_text)
            plain_text = ' '.join(plain_text.split())
            updates.append({
                'type': 'Update',
                'content': content_html,
                'plain_text': plain_text
            })

        entries.append({
            'date': date,
            'updated': updated,
            'link': link,
            'updates': updates
        })
    
    return entries

def html_unescape(text):
    # Simple unescaper for common entities
    replacements = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    }
    for entity, char in replacements.items():
        text = text.replace(entity, char)
    return text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases = fetch_and_parse_feed()
    if releases is None:
        return jsonify({'success': False, 'error': 'Failed to fetch release notes from Google Cloud.'}), 500
    return jsonify({'success': True, 'releases': releases})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
