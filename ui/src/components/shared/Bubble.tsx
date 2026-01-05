import { useState } from 'react';
import { Copy, LucideClipboardCheck, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';

import ChatMessage from '@components/feature/Chat/ChatMessage';
import { Button } from '@components/shared/Button';
import { Card, CardContent } from '@components/shared/Card';

import { useChatStore } from '@stores/chatStore';

interface BubbleProps {
  bot: string;
  content: string;
}

const Bubble = ({ bot, content }: BubbleProps) => {
  const isMessageError = useChatStore((state) => state.isMessageError);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {});
    setIsCopied(true);
    // TODO: show toast notification for "Message copied"
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      {bot === 'AI' ? (
        <div className="flex max-w-[800px] items-start gap-1">
          <div className="flex items-center">
            {!content && !isMessageError && (
              <div className="animate-spin border rounded-full w-4 h-4 border-gray-500" />
            )}
          </div>
          {!!content && (
            <div className="flex group">
              <Card className="border-0 my-2 py-1 px-4 bg-gray-200 dark:bg-gray-800 rounded-sm text-left">
                <CardContent className="p-0">
                  <ChatMessage message={content} />
                </CardContent>
              </Card>
              <Button
                variant="ghost"
                className="mt-2 ml-1 h-fit opacity-0 group-hover:opacity-100 p-1 rounded-md"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <LucideClipboardCheck className="w-2 h-2" />
                ) : (
                  <Copy className="w-2 h-2" />
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-end">
          <Card className="max-w-[80%] border-none my-2 p-2 bg-blue-200 dark:bg-blue-900 rounded-sm text-left flex-wrap">
            <CardContent className="p-0">
              <Markdown>{content}</Markdown>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Bubble;
