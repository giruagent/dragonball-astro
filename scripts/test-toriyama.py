"""Validate the generated tribute page after running npm run build."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.elements = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


class TributeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = Page(ROOT / 'dist/akira-toriyama/index.html')

    def test_home_discovery(self):
        home = Page(ROOT / 'dist/index.html')
        self.assertTrue(any(tag == 'a' and attrs.get('href') == '/dragonball-astro/akira-toriyama/'
                            for tag, attrs in home.elements))

    def test_internal_anchors_resolve(self):
        ids = [attrs['id'] for _, attrs in self.page.elements if 'id' in attrs]
        self.assertEqual(len(ids), len(set(ids)))
        for tag, attrs in self.page.elements:
            if tag == 'a' and attrs.get('href', '').startswith('#'):
                self.assertIn(attrs['href'][1:], ids)

    def test_local_media(self):
        images = [attrs for tag, attrs in self.page.elements if tag == 'img']
        self.assertEqual(len(images), 3)
        self.assertEqual(len({image['src'] for image in images}), 3)
        for image in images:
            self.assertTrue(image['alt'])
            self.assertIn('width', image)
            self.assertIn('height', image)
            self.assertTrue(image['src'].startswith('/dragonball-astro/images/toriyama/'))
            ET.parse(ROOT / 'dist' / image['src'].removeprefix('/dragonball-astro/'))

    def test_base_paths(self):
        for tag, attrs in self.page.elements:
            url = attrs.get('href') if tag in ('a', 'link') else attrs.get('src')
            if url and not url.startswith('#') and not urlsplit(url).scheme:
                self.assertTrue(url.startswith('/dragonball-astro/'), url)

    def test_semantic_page(self):
        self.assertEqual(sum(tag == 'h1' for tag, _ in self.page.elements), 1)
        self.assertEqual(sum(tag == 'main' for tag, _ in self.page.elements), 1)
        self.assertTrue(any(tag == 'html' and attrs.get('lang') == 'en'
                            for tag, attrs in self.page.elements))
        self.assertFalse(any(tag == 'script' for tag, _ in self.page.elements))

    def test_primary_sources(self):
        links = [attrs.get('href', '') for tag, attrs in self.page.elements if tag == 'a']
        self.assertEqual(len({link for link in links if link.startswith('https://')}), 5)
        self.assertTrue(all(link.startswith(('https://en.dragon-ball-official.com/',
                                             'https://mangaplus.shueisha.co.jp/'))
                            for link in links if link.startswith('https://')))


if __name__ == '__main__':
    unittest.main(verbosity=2)
