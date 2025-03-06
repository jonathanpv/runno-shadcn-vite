import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { customTheme } from '@/components/ui/problem-markdown-theme';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import rehypeRaw from 'rehype-raw';

// Custom PreTag component for SyntaxHighlighter
const CustomPreTag = (props: React.HTMLAttributes<HTMLDivElement>) => {
  const [codeHeight, setCodeHeight] = React.useState<number | null>(null);
  const [codeWidth, setCodeWidth] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const preRef = React.useRef<HTMLDivElement>(null);
  
  // Use ref callback instead of useEffect
  const measureRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Get content height and width and set them immediately
      const height = node.scrollHeight;
      const width = node.scrollWidth;
      setCodeHeight(Math.min(height, 100));
      setCodeWidth(width);
    }
  }, []);
  
  const handleCopyCode = () => {
    if (!preRef.current) return;
    
    // Get the code from the current code block
    const codeElement = preRef.current.querySelector('code');
    let codeContent = '';
    
    if (codeElement) {
      // Get the textContent from the code element - this is the actual code
      codeContent = codeElement.textContent || '';
    } else {
      // Fallback to children props if DOM approach fails
      const childrenArray = React.Children.toArray(props.children);
      for (const child of childrenArray) {
        if (React.isValidElement(child)) {
          // Try to find the code content in child props
          const childProps = child.props as any;
          if (childProps && childProps.children) {
            if (Array.isArray(childProps.children)) {
              codeContent = childProps.children.join('');
            } else if (typeof childProps.children === 'string') {
              codeContent = childProps.children;
            }
          }
        }
      }
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div 
      {...props} 
      className={`${props.className || ''} rounded-md my-4 not-prose relative`}
      ref={preRef}
    > 
      <div className="absolute right-5 top-2 z-10">
        <Button
          onClick={handleCopyCode}
          size="icon"
          variant="ghost"
          className="h-7 w-7 relative"
          title={copied ? "Copied!" : "Copy code"}
        >
          <div className="relative w-3.5 h-3.5">
            <Copy 
              className={`absolute inset-0 transition-all duration-300 ${
                copied ? "opacity-0 scale-0 rotate-0" : "opacity-100 scale-100 rotate-0"
              }`} 
              size={14}
            />
            <Check 
              className={`absolute inset-0 transition-all duration-300 ${
                copied ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-45"
              }`}
              size={14}
            />
          </div>
          <span className="sr-only">{copied ? 'Copied!' : 'Copy code'}</span>
        </Button>
      </div>
      
      <div 
        ref={measureRef} 
        className="absolute opacity-0 pointer-events-none"
      >
        {props.children}
      </div>
      
      <ScrollArea 
        className="w-full"
        style={{ 
          height: codeHeight ? `${codeHeight}px` : 'auto',
          maxHeight: '100px',
          width: codeWidth ? `${Math.min(codeWidth, 100)}%` : '100%',
          maxWidth: '100%'
        }}
        scrollHideDelay={0}
        type="hover"
      >
        {props.children}
        <ScrollBar orientation="horizontal"></ScrollBar>
      </ScrollArea>
    </div>
  );
};

interface ProblemMarkdownProps {
  markdown: string;
}

// Function to process ligatures in text
const processLigatures = (text: string): React.ReactNode => {
  if (typeof text !== 'string') return text;
  
  // Split by potential ligature markers to process each part
  const parts = text.split(/(<=|>=|\^)/g);
  
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    if (part === '<=') return <span key={index}>≤</span>;
    if (part === '>=') return <span key={index}>≥</span>;
    if (part === '^' && index < parts.length - 1) {
      // Create superscript for the next part
      const superscriptContent = parts[index + 1].match(/^[0-9a-zA-Z]+/)?.[0] || '';
      
      // If we found content for the superscript, remove it from the next part
      if (superscriptContent && index + 1 < parts.length) {
        parts[index + 1] = parts[index + 1].substring(superscriptContent.length);
      }
      
      return <sup key={index}>{superscriptContent}</sup>;
    }
    return part;
  });
};

// Component to process text for ligatures and superscripts
const ProcessedText: React.FC<{children: React.ReactNode}> = ({ children }) => {
  if (typeof children === 'string') {
    return <>{processLigatures(children)}</>;
  }
  return <>{children}</>;
};

const ProblemMarkdown: React.FC<ProblemMarkdownProps> = ({ markdown }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          // This prevents react-markdown from adding its own pre tag
          pre: ({ children }) => {
            return children;
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-foreground"><ProcessedText>{children}</ProcessedText></h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-6 mb-3 text-foreground"><ProcessedText>{children}</ProcessedText></h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mt-5 mb-2 text-foreground"><ProcessedText>{children}</ProcessedText></h3>
          ),
          p: ({ children }) => (
            <p className="my-4 text-foreground"><ProcessedText>{children}</ProcessedText></p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="ml-2 text-foreground"><ProcessedText>{children}</ProcessedText></li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 italic text-foreground">
              <ProcessedText>{children}</ProcessedText>
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            // This line checks if the code block has a language specified
            // For example, in markdown: ```javascript
            // The className would be "language-javascript"
            // We use regex to extract just the language name ("javascript")
            const match = /language-(\w+)/.exec(className || '');
            
            // This is deciding whether to show a code block or inline code
            // Two conditions must be true to show a code block:
            // 1. !inline - This means it's NOT inline code (like `code` in text)
            // 2. match - This means we found a language in the className
            return !inline && match ? (
              // If both conditions are true, we render a syntax highlighted code block
              
              <SyntaxHighlighter
                // Apply our custom color theme
                style={customTheme}
                // Use the language we extracted (match[1] is the first capture group)
                language={match[1]}
                PreTag={CustomPreTag}
                codeTagProps={{ className: 'not-prose' }}
                {...props}
              >
                {/* 
                  Convert children to string and remove trailing newline if present
                  This helps with consistent formatting
                */}
                {String(children)}
              </SyntaxHighlighter>
              
            ) : (
              // If it's inline code or no language specified, render a simple code tag
              <code
                // Keep any existing classes and add some padding and rounded corners
                className={`${className} px-1 py-0.5 rounded text-foreground`}
                // Pass through any other props
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-accent rounded-md">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted border-b border-accent">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border-r border-accent last:border-r-0 text-foreground">
              <ProcessedText>{children}</ProcessedText>
            </th>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-accent last:border-b-0">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-r border-accent last:border-r-0 text-foreground">
              <ProcessedText>{children}</ProcessedText>
            </td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default ProblemMarkdown;