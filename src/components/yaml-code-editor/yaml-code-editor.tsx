import { useRef } from 'react';

import styles from './yaml-code-editor.module.css';

import { highlightYaml } from '../../lib/highlight-yaml';

// Editable YAML with syntax highlighting: a transparent <textarea> over a
// highlighted <pre>, kept aligned by identical typography and synced scroll.
// (highlight.js only colours static markup, so an editor needs this overlay.)
export function YamlCodeEditor({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const preRef = useRef<HTMLPreElement>(null);

  function syncScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (preRef.current) {
      preRef.current.scrollTop = event.currentTarget.scrollTop;
      preRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  }

  return (
    <div className={styles.editor} style={{ minHeight: `${rows * 1.5}em` }}>
      <pre
        ref={preRef}
        className={styles.highlight}
        aria-hidden
        // Trailing newline keeps the last line visible while scrolling.
        dangerouslySetInnerHTML={{ __html: `${highlightYaml(value)}\n` }}
      />
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        rows={rows}
      />
    </div>
  );
}
