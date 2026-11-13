import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './Markdown.module.css';

interface MarkdownProps {
  readonly children: string;
  readonly className?: string;
}

/**
 * Authored lesson prose. Markdown is rendered only inside the lazily loaded
 * lesson route, never in the shell or metadata screens.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={[styles.markdown, className].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren }) => {
            const external = Boolean(href?.startsWith('http'));
            return (
              <a
                href={href}
                {...(external
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
              >
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
