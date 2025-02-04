const assert = require('assert');
const fs = require('fs');

const enRoot = 'example-pages/jamstack-toolkit';
const frRoot = 'example-pages/jamstack-toolkit';
const assetsDestination = 'example-pages/assets';
const odsDir = `dist/${assetsDestination}/vendor/ontario-design-system`;
const enPageLocation = `dist/${enRoot}/index.html`;
const frPageLocation = `dist/${frRoot}/index.html`;
const expectedNoDsFiles = 5;

describe('Site generation', function () {
  describe('Top-level redirect page present', function () {
    it('should generate a top-level redirect page', function () {
      assert(fs.existsSync('dist/index.html'));
    });
  });
  describe('English-language example page present', function () {
    it('should generate an English-language example page', function () {
      assert(fs.existsSync(enPageLocation));
    });
  });
  describe('French-language example page present', function () {
    it('should generate a French-language example page', function () {
      assert(fs.existsSync(frPageLocation));
    });
  });
  describe('Ontario design system inclusion', function () {
    it('should copy over the design system assets', function () {
      assert(
        fs.existsSync(odsDir),
        'Expected directory for design system not found'
      );
      const actualLength = fs.readdirSync(odsDir).length;
      const expectedLength = expectedNoDsFiles;
      assert(
        actualLength === expectedLength,
        `The expected number of files in design system directory were not found, expected ${expectedLength}, got ${actualLength}`
      );
    });
  });
  describe('Site CSS file present', function () {
    it('Should copy over the site CSS file', function () {
      assert(fs.existsSync('dist/example-pages/assets/css/style.css'));
    });
  });
});
