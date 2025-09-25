// we can also use `import`, but then
// every export should be explicitly defined

console.log('Using mocked fs/promises module');

// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
const { fs } = require('memfs');
// eslint-disable-next-line no-undef
module.exports = fs.promises;
