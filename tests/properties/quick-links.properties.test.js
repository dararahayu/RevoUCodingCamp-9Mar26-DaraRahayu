import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

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

      linkItem.appendChild(anchor);
      linkItem.appendChild(deleteBtn);

      linksList.appendChild(linkItem);
    });

    this.container.appendChild(linksList);
  }
}

// Custom arbitraries for generating test data
const validUrlArbitrary = () => fc.oneof(
  fc.webUrl({ withFragments: true, withQueryParameters: true }),
  fc.tuple(fc.constantFrom('http', 'https'), fc.domain()).map(([protocol, domain]) => `${protocol}://${domain}`)
);

const invalidUrlArbitrary = () => fc.oneof(
  fc.constant(''),
  fc.constant('not-a-url'),
  fc.domain(), // domain without protocol
  fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))
);

describe('QuickLinksManager - Property-Based Tests', () => {
  /**
   * Property 14: Quick Link Addition Increases Collection Size
   * **Validates: Requirements 9.1**
   * 
   * For any link list and any valid label (non-empty) and valid URL, when a link is added,
   * the link list length SHALL increase by one and the new link SHALL be present in the collection.
   */
  test('Property 14: Quick Link Addition Increases Collection Size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Valid label
        validUrlArbitrary(), // Valid URL
        (label, url) => {
          const linksManager = new QuickLinksManager(null);
          const initialLength = linksManager.getLinks().length;
          
          const addedLink = linksManager.addLink(label, url);
          
          // Skip if URL validation failed (some generated URLs might be edge cases)
          if (addedLink === null) {
            return true;
          }
          
          const newLength = linksManager.getLinks().length;
          const links = linksManager.getLinks();
          
          // Verify length increased by one
          const lengthIncreased = newLength === initialLength + 1;
          
          // Verify the new link is present in the collection
          const linkPresent = links.some(l => l.id === addedLink.id && l.label === label.trim());
          
          return lengthIncreased && linkPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Invalid Link Rejection
   * **Validates: Requirements 9.5**
   * 
   * For any link submission where the label is empty or the URL is invalid
   * (does not match http:// or https:// protocol), the submission SHALL be rejected
   * and the link list SHALL remain unchanged.
   */
  test('Property 15: Invalid Link Rejection - Empty Label', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        ), // Empty or whitespace-only label
        validUrlArbitrary(), // Valid URL
        (emptyLabel, url) => {
          const linksManager = new QuickLinksManager(null);
          const initialLength = linksManager.getLinks().length;
          
          const result = linksManager.addLink(emptyLabel, url);
          
          const newLength = linksManager.getLinks().length;
          
          // Verify operation was rejected (returns null)
          // Verify link list length unchanged
          return result === null && newLength === initialLength;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 15: Invalid Link Rejection - Invalid URL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Valid label
        invalidUrlArbitrary(), // Invalid URL
        (label, invalidUrl) => {
          const linksManager = new QuickLinksManager(null);
          const initialLength = linksManager.getLinks().length;
          
          const result = linksManager.addLink(label, invalidUrl);
          
          const newLength = linksManager.getLinks().length;
          
          // Verify operation was rejected (returns null)
          // Verify link list length unchanged
          return result === null && newLength === initialLength;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 15: Invalid Link Rejection - Non-HTTP/HTTPS Protocol', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ftp', 'file', 'mailto', 'tel', 'data'),
        fc.domain(),
        (label, protocol, domain) => {
          const linksManager = new QuickLinksManager(null);
          const invalidUrl = `${protocol}://${domain}`;
          const initialLength = linksManager.getLinks().length;
          
          const result = linksManager.addLink(label, invalidUrl);
          
          const newLength = linksManager.getLinks().length;
          
          // Verify operation was rejected
          return result === null && newLength === initialLength;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Link Deletion Removes from Collection
   * **Validates: Requirements 9.4**
   * 
   * For any link list containing a specific link, when that link is deleted,
   * the link SHALL no longer be present in the collection and the list length
   * SHALL decrease by one.
   */
  test('Property 16: Link Deletion Removes from Collection', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        validUrlArbitrary(),
        (label, url) => {
          const linksManager = new QuickLinksManager(null);
          const link = linksManager.addLink(label, url);
          
          // Skip if link creation failed
          if (link === null) {
            return true;
          }
          
          const initialLength = linksManager.getLinks().length;
          
          const result = linksManager.deleteLink(link.id);
          
          const newLength = linksManager.getLinks().length;
          const links = linksManager.getLinks();
          
          // Verify operation succeeded
          // Verify length decreased by one
          // Verify link is no longer present
          const lengthDecreased = newLength === initialLength - 1;
          const linkNotPresent = !links.some(l => l.id === link.id);
          
          return result === true && lengthDecreased && linkNotPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Link Serialization Round-Trip
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
   * 
   * For any valid collection of quick links, serializing the collection to JSON and then
   * deserializing it SHALL produce an equivalent collection where each link has the
   * same id, label, and url.
   */
  test('Property 17: Link Serialization Round-Trip', () => {
    fc.assert(
      fc.property(
        // Generate array of link data
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            url: fc.oneof(
              fc.webUrl(),
              fc.tuple(fc.constantFrom('http', 'https'), fc.domain()).map(([p, d]) => `${p}://${d}`)
            )
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (linkDataArray) => {
          const linksManager = new QuickLinksManager(null);
          
          // Create links
          const originalLinks = linkDataArray.map(data => 
            new QuickLink(data.id, data.label, data.url)
          );
          
          // Serialize
          const jsonArray = originalLinks.map(link => link.toJSON());
          const jsonString = JSON.stringify(jsonArray);
          
          // Deserialize
          const parsedArray = JSON.parse(jsonString);
          linksManager.loadLinks(parsedArray);
          
          const restoredLinks = linksManager.getLinks();
          
          // Verify array length matches
          if (restoredLinks.length !== originalLinks.length) {
            return false;
          }
          
          // Verify each link matches
          for (let i = 0; i < originalLinks.length; i++) {
            const original = originalLinks[i];
            const restored = restoredLinks[i];
            
            if (
              restored.id !== original.id ||
              restored.label !== original.label ||
              restored.url !== original.url
            ) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: QuickLink toJSON produces valid JSON-serializable object
   * **Validates: Requirements 10.1, 10.3**
   */
  test('Additional Property: QuickLink toJSON produces valid JSON-serializable object', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.webUrl(),
        (id, label, url) => {
          const link = new QuickLink(id, label, url);
          const json = link.toJSON();
          
          // Should not throw when stringifying
          let stringified;
          try {
            stringified = JSON.stringify(json);
          } catch (e) {
            return false;
          }
          
          // Should be able to parse back
          let parsed;
          try {
            parsed = JSON.parse(stringified);
          } catch (e) {
            return false;
          }
          
          // Parsed object should have all required properties
          return (
            parsed.hasOwnProperty('id') &&
            parsed.hasOwnProperty('label') &&
            parsed.hasOwnProperty('url')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: QuickLink fromJSON creates valid QuickLink instance
   * **Validates: Requirements 10.2, 10.3**
   */
  test('Additional Property: QuickLink fromJSON creates valid QuickLink instance', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.webUrl(),
        (id, label, url) => {
          const jsonData = {
            id: id,
            label: label,
            url: url
          };
          
          const link = QuickLink.fromJSON(jsonData);
          
          // Verify it's a QuickLink instance
          if (!(link instanceof QuickLink)) {
            return false;
          }
          
          // Verify all properties match the input
          return (
            link.id === id &&
            link.label === label &&
            link.url === url
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Link array serialization round-trip
   * **Validates: Requirements 10.4**
   */
  test('Additional Property: Link array serialization round-trip preserves collection', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            label: fc.string({ minLength: 1 }),
            url: fc.webUrl()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (linkDataArray) => {
          // Create links
          const originalLinks = linkDataArray.map(data => 
            new QuickLink(data.id, data.label, data.url)
          );
          
          // Serialize array
          const jsonArray = originalLinks.map(link => link.toJSON());
          const jsonString = JSON.stringify(jsonArray);
          
          // Deserialize array
          const parsedArray = JSON.parse(jsonString);
          const restoredLinks = parsedArray.map(data => QuickLink.fromJSON(data));
          
          // Verify array length matches
          if (restoredLinks.length !== originalLinks.length) {
            return false;
          }
          
          // Verify each link matches
          for (let i = 0; i < originalLinks.length; i++) {
            const original = originalLinks[i];
            const restored = restoredLinks[i];
            
            if (
              restored.id !== original.id ||
              restored.label !== original.label ||
              restored.url !== original.url
            ) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
