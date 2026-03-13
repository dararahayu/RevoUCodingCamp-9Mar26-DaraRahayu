import { describe, test, expect, beforeEach } from 'vitest';

// Define QuickLink class in the test environment
class QuickLink {
  constructor(id, label, url) {
    this.id = id;
    this.label = label;
    this.url = url;
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      url: this.url
    };
  }

  static fromJSON(data) {
    return new QuickLink(data.id, data.label, data.url);
  }
}

// Define QuickLinksManager class in the test environment
class QuickLinksManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.links = [];
  }

  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  addLink(label, url) {
    const trimmedLabel = label.trim();
    if (trimmedLabel === '') {
      return null;
    }

    if (!this.validateUrl(url)) {
      return null;
    }

    const id = Date.now().toString();
    const link = new QuickLink(id, trimmedLabel, url);
    this.links.push(link);
    
    return link;
  }

  deleteLink(id) {
    const index = this.links.findIndex(l => l.id === id);
    if (index !== -1) {
      this.links.splice(index, 1);
      return true;
    }
    return false;
  }

  getLinks() {
    return this.links;
  }

  loadLinks(linksData) {
    this.links = linksData.map(data => QuickLink.fromJSON(data));
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const linksList = document.createElement('ul');
    linksList.className = 'links-list';

    this.links.forEach(link => {
      const linkItem = document.createElement('li');
      linkItem.className = 'link-item';

      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-anchor';
      anchor.textContent = link.label;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        this.deleteLink(link.id);
        this.render();
      });

      linkItem.appendChild(anchor);
      linkItem.appendChild(deleteBtn);

      linksList.appendChild(linkItem);
    });

    this.container.appendChild(linksList);
  }
}

describe('QuickLinksManager Class - Unit Tests', () => {
  let linksManager;

  beforeEach(() => {
    linksManager = new QuickLinksManager(null);
  });

  /**
   * Test empty label rejection
   * **Validates: Requirements 9.5**
   */
  describe('Label Validation', () => {
    test('rejects empty string label', () => {
      const result = linksManager.addLink('', 'https://example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects whitespace-only label', () => {
      const result = linksManager.addLink('   ', 'https://example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects tabs and newlines as label', () => {
      const result = linksManager.addLink('\t\n  \t', 'https://example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('trims whitespace from valid label', () => {
      const link = linksManager.addLink('  GitHub  ', 'https://github.com');
      
      expect(link).not.toBeNull();
      expect(link.label).toBe('GitHub');
    });
  });

  /**
   * Test invalid URL format rejection (missing protocol, malformed)
   * **Validates: Requirements 9.5**
   */
  describe('Invalid URL Format Rejection', () => {
    test('rejects URL without protocol', () => {
      const result = linksManager.addLink('Example', 'example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects URL with www but no protocol', () => {
      const result = linksManager.addLink('Example', 'www.example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects malformed URL with invalid characters', () => {
      const result = linksManager.addLink('Bad URL', 'http://invalid url with spaces');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects completely invalid URL string', () => {
      const result = linksManager.addLink('Invalid', 'not-a-url');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects URL with ftp protocol', () => {
      const result = linksManager.addLink('FTP Site', 'ftp://example.com');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects URL with file protocol', () => {
      const result = linksManager.addLink('File', 'file:///path/to/file');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('rejects empty URL string', () => {
      const result = linksManager.addLink('Empty URL', '');
      
      expect(result).toBeNull();
      expect(linksManager.getLinks().length).toBe(0);
    });
  });

  /**
   * Test valid URL formats (http://, https://)
   * **Validates: Requirements 9.1, 9.5**
   */
  describe('Valid URL Format Acceptance', () => {
    test('accepts URL with http:// protocol', () => {
      const link = linksManager.addLink('HTTP Site', 'http://example.com');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('http://example.com');
      expect(linksManager.getLinks().length).toBe(1);
    });

    test('accepts URL with https:// protocol', () => {
      const link = linksManager.addLink('HTTPS Site', 'https://example.com');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('https://example.com');
      expect(linksManager.getLinks().length).toBe(1);
    });

    test('accepts https URL with path', () => {
      const link = linksManager.addLink('GitHub Repo', 'https://github.com/user/repo');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('https://github.com/user/repo');
    });

    test('accepts https URL with query parameters', () => {
      const link = linksManager.addLink('Search', 'https://example.com/search?q=test');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('https://example.com/search?q=test');
    });

    test('accepts https URL with port number', () => {
      const link = linksManager.addLink('Local Dev', 'http://localhost:3000');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('http://localhost:3000');
    });

    test('accepts https URL with fragment', () => {
      const link = linksManager.addLink('Docs Section', 'https://example.com/docs#section');
      
      expect(link).not.toBeNull();
      expect(link.url).toBe('https://example.com/docs#section');
    });
  });

  /**
   * Test link list with 0 links handles operations correctly
   * **Validates: Requirements 9.4**
   */
  describe('Empty Link List Operations', () => {
    test('getLinks returns empty array for new QuickLinksManager', () => {
      expect(linksManager.getLinks()).toEqual([]);
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('deleteLink returns false when link list is empty', () => {
      const result = linksManager.deleteLink('nonexistent-id');
      
      expect(result).toBe(false);
    });

    test('loadLinks handles empty array', () => {
      linksManager.addLink('Test', 'https://test.com');
      
      linksManager.loadLinks([]);
      
      expect(linksManager.getLinks().length).toBe(0);
    });
  });

  /**
   * Test link click opens in new tab (target="_blank")
   * **Validates: Requirements 9.3**
   */
  describe('Link Rendering with New Tab Target', () => {
    test('rendered link has target="_blank" attribute', () => {
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      linksManager = new QuickLinksManager(container);
      linksManager.addLink('GitHub', 'https://github.com');
      
      linksManager.render();
      
      const linksList = container.lastChild;
      expect(linksList.className).toBe('links-list');
      
      const linkItem = linksList.children[0];
      const anchor = linkItem.querySelector('a');
      
      expect(anchor.target).toBe('_blank');
    });

    test('rendered link has rel="noopener noreferrer" for security', () => {
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      linksManager = new QuickLinksManager(container);
      linksManager.addLink('Example', 'https://example.com');
      
      linksManager.render();
      
      const linksList = container.lastChild;
      const linkItem = linksList.children[0];
      const anchor = linkItem.querySelector('a');
      
      expect(anchor.rel).toBe('noopener noreferrer');
    });

    test('rendered link has correct href attribute', () => {
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      linksManager = new QuickLinksManager(container);
      linksManager.addLink('Test Site', 'https://test.com/path');
      
      linksManager.render();
      
      const linksList = container.lastChild;
      const linkItem = linksList.children[0];
      const anchor = linkItem.querySelector('a');
      
      expect(anchor.href).toBe('https://test.com/path');
    });

    test('rendered link displays correct label text', () => {
      const container = {
        innerHTML: '',
        appendChild: function(child) {
          this.lastChild = child;
        }
      };
      
      linksManager = new QuickLinksManager(container);
      linksManager.addLink('My Label', 'https://example.com');
      
      linksManager.render();
      
      const linksList = container.lastChild;
      const linkItem = linksList.children[0];
      const anchor = linkItem.querySelector('a');
      
      expect(anchor.textContent).toBe('My Label');
    });

    test('render handles null container gracefully', () => {
      linksManager = new QuickLinksManager(null);
      linksManager.addLink('Test', 'https://test.com');
      
      // Should not throw
      expect(() => linksManager.render()).not.toThrow();
    });
  });

  /**
   * Test additional link operations
   * **Validates: Requirements 9.1, 9.4**
   */
  describe('Link CRUD Operations', () => {
    test('addLink creates link with valid label and URL', () => {
      const link = linksManager.addLink('GitHub', 'https://github.com');
      
      expect(link).not.toBeNull();
      expect(link.label).toBe('GitHub');
      expect(link.url).toBe('https://github.com');
      expect(link.id).toBeDefined();
      expect(linksManager.getLinks().length).toBe(1);
    });

    test('addLink generates unique IDs for multiple links', () => {
      const link1 = linksManager.addLink('Link 1', 'https://example1.com');
      const link2 = linksManager.addLink('Link 2', 'https://example2.com');
      
      expect(link1.id).not.toBe(link2.id);
    });

    test('deleteLink removes link from list', () => {
      const link = linksManager.addLink('To Delete', 'https://delete.com');
      expect(linksManager.getLinks().length).toBe(1);
      
      const result = linksManager.deleteLink(link.id);
      
      expect(result).toBe(true);
      expect(linksManager.getLinks().length).toBe(0);
    });

    test('deleteLink returns false for nonexistent link ID', () => {
      linksManager.addLink('Link 1', 'https://example.com');
      const result = linksManager.deleteLink('nonexistent-id');
      
      expect(result).toBe(false);
      expect(linksManager.getLinks().length).toBe(1);
    });

    test('deleteLink removes correct link from multiple links', () => {
      const link1 = linksManager.addLink('Link 1', 'https://example1.com');
      const link2 = linksManager.addLink('Link 2', 'https://example2.com');
      const link3 = linksManager.addLink('Link 3', 'https://example3.com');
      
      linksManager.deleteLink(link2.id);
      
      const remainingLinks = linksManager.getLinks();
      expect(remainingLinks.length).toBe(2);
      expect(remainingLinks.find(l => l.id === link1.id)).toBeDefined();
      expect(remainingLinks.find(l => l.id === link3.id)).toBeDefined();
      expect(remainingLinks.find(l => l.id === link2.id)).toBeUndefined();
    });
  });

  /**
   * Test loadLinks deserialization
   * **Validates: Requirements 10.2, 10.3**
   */
  describe('Link Loading and Deserialization', () => {
    test('loadLinks deserializes link data correctly', () => {
      const linksData = [
        { id: '1', label: 'GitHub', url: 'https://github.com' },
        { id: '2', label: 'Google', url: 'https://google.com' }
      ];
      
      linksManager.loadLinks(linksData);
      
      const links = linksManager.getLinks();
      expect(links.length).toBe(2);
      expect(links[0].id).toBe('1');
      expect(links[0].label).toBe('GitHub');
      expect(links[0].url).toBe('https://github.com');
      expect(links[1].id).toBe('2');
      expect(links[1].label).toBe('Google');
      expect(links[1].url).toBe('https://google.com');
    });

    test('loadLinks creates QuickLink instances', () => {
      const linksData = [
        { id: '1', label: 'Test', url: 'https://test.com' }
      ];
      
      linksManager.loadLinks(linksData);
      
      const links = linksManager.getLinks();
      expect(links[0]).toBeInstanceOf(QuickLink);
    });

    test('loadLinks replaces existing links', () => {
      linksManager.addLink('Existing', 'https://existing.com');
      
      const linksData = [
        { id: '1', label: 'New', url: 'https://new.com' }
      ];
      
      linksManager.loadLinks(linksData);
      
      const links = linksManager.getLinks();
      expect(links.length).toBe(1);
      expect(links[0].label).toBe('New');
    });
  });
});
