export default {
  source: ['design-tokens/tokens.json'],
  hooks: {
    formats: {
      socialbookTokens: ({ dictionary }) => {
        const lightTokens = dictionary.allTokens.filter(
          (t) => t.path[0] !== 'dark' && t.path[0] !== 'font',
        );
        const darkTokens = dictionary.allTokens.filter(
          (t) => t.path[0] === 'dark',
        );

        function cssVarName(path) {
          if (path.length === 1) return path[0];
          return path.slice(1).join('-');
        }

        let css = ':root {\n';
        for (const token of lightTokens) {
          css += `  --${cssVarName(token.path)}: ${token.$value};\n`;
        }
        css += '}\n\n';

        css += '.dark {\n';
        for (const token of darkTokens) {
          css += `  --${cssVarName(token.path.slice(1))}: ${token.$value};\n`;
        }
        css += '}\n';

        return css;
      },
    },
  },
  platforms: {
    css: {
      buildPath: 'src/app/',
      files: [
        {
          destination: 'tokens.generated.css',
          format: 'socialbookTokens',
        },
      ],
    },
  },
};
