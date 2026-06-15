import hljs from 'highlight.js/lib/core';
import yamlLang from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('yaml', yamlLang);

export function highlightYaml(yaml: string): string {
  return hljs.highlight(yaml, { language: 'yaml' }).value;
}
