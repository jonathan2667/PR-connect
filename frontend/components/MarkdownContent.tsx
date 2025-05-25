import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Function to extract clean content from potentially JSON-formatted strings
const extractContentFromJSON = (rawContent: string): string => {
  try {
    // Check if the content looks like JSON
    if (rawContent.trim().startsWith('{') && rawContent.trim().endsWith('}')) {
      const parsed = JSON.parse(rawContent);
      
      // Try to find the actual content field
      if (parsed.content) {
        return parsed.content;
      }
      
      // If there are generated_releases, get the first one's content
      if (parsed.generated_releases && parsed.generated_releases.length > 0) {
        return parsed.generated_releases[0].content || rawContent;
      }
      
      // If we can't find content, return the original
      return rawContent;
    }
    
    // If it doesn't look like JSON, return as-is
    return rawContent;
  } catch (e) {
    // If JSON parsing fails, return the original content
    return rawContent;
  }
};

// Function to clean content from LaTeX and other formatting artifacts
const cleanContent = (content: string): string => {
  let cleaned = content;
  
  // Remove LaTeX boxed formatting
  cleaned = cleaned.replace(/\\boxed\{/g, '').replace(/\}$/g, '');
  
  // Remove code block markers
  cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/\n?```$/gm, '');
  
  // Clean up excessive whitespace while preserving paragraph breaks
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  return cleaned.trim();
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  // First extract content from JSON if needed, then clean it
  const extractedContent = extractContentFromJSON(content);
  const cleanedContent = cleanContent(extractedContent);
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Style headings
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
          
          // Style paragraphs
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          
          // Style lists
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-2" {...props} />,
          
          // Style links
          a: ({ node, ...props }) => (
            <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
          ),
          
          // Style strong and emphasis
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
          ),
          
          // Style code blocks
          code: ({ node, ...props }: any) => {
            const isInline = !props.className || !props.className.includes('language-');
            return isInline ? 
              <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm" {...props} /> :
              <code className="block bg-gray-100 rounded p-4 my-4 font-mono text-sm overflow-x-auto" {...props} />
          },
          
          // Style horizontal rules
          hr: ({ node, ...props }) => <hr className="my-6 border-gray-300" {...props} />,
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 