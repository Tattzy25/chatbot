'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Image as AIImage } from '@/components/ai-elements/image';
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from '@/components/ai-elements/task';
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { Checkpoint, CheckpointTrigger } from '@/components/ai-elements/checkpoint';
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationActions,
  ConfirmationAction,
} from '@/components/ai-elements/confirmation';
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
} from '@/components/ai-elements/context';
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationSource,
} from '@/components/ai-elements/inline-citation';
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
} from '@/components/ai-elements/plan';
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
} from '@/components/ai-elements/queue';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Suggestion } from '@/components/ai-elements/suggestion';
import { Tool } from '@/components/ai-elements/tool';
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from '@/components/ai-elements/web-preview';

type TaskItem = {
  type: 'file' | 'text';
  file?: {
    icon: string;
    name: string;
  };
  text?: string;
};

type Task = {
  title: string;
  items: TaskItem[];
};

type QueueItem = {
  id?: string;
  title: string;
  status?: string;
};

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];
const renderTask = (task: Task, taskIndex: number, messageId: string, i: number) => (
  <Task key={`${messageId}-${i}-${taskIndex}`}>
    <TaskTrigger title={task.title} />
    <TaskContent>
      {task.items.map((item: TaskItem, itemIndex: number) => (
        <TaskItem key={`${taskIndex}-${itemIndex}`}>
          {item.type === 'file' ? <TaskItemFile>{item.file?.icon} {item.file?.name}</TaskItemFile> : item.text}
        </TaskItem>
      ))}
    </TaskContent>
  </Task>
);

const renderQueueItem = (item: any, idx: number) => (
  <QueueItem key={item.id || idx}>
    <QueueItemIndicator completed={item.status === 'completed'} />
    <QueueItemContent>{item.title}</QueueItemContent>
  </QueueItem>
);

const ChatBot = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();
  const [specialMessages, setSpecialMessages] = useState<any[]>([]);
  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    const text = message.text || 'Sent with attachments';
    const isImageCommand = text.toLowerCase().includes('generate image') || text.toLowerCase().includes('/image') || text.toLowerCase().includes('create an image') || text.toLowerCase().includes('create a image');
    const isTaskCommand = text.toLowerCase().includes('create tasks') || text.toLowerCase().includes('generate tasks') || text.toLowerCase().includes('/task');
    const isV0Command = (text.toLowerCase().includes('build ui') || text.toLowerCase().includes('build a') || text.toLowerCase().includes('build an') || text.toLowerCase().includes('create ui') || text.toLowerCase().includes('create app') || text.toLowerCase().includes('design ui') || text.toLowerCase().includes('/v0') || text.toLowerCase().includes('generate ui')) && !isImageCommand && !isTaskCommand;

    if (isImageCommand) {
      // Add user message
      setSpecialMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        parts: [{ type: 'text', text }]
      }]);
      try {
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        if (!response.ok) throw new Error('Image generation failed');
        const imageData = await response.json();
        // Add assistant message with image
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [
            { type: 'text', text: 'Here is the generated image:' },
            { type: 'data-image', data: imageData }
          ]
        }]);
      } catch (error) {
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [{ type: 'text', text: 'Failed to generate image: ' + (error as Error).message }]
        }]);
      }
    } else if (isTaskCommand) {
      // Add user message
      setSpecialMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        parts: [{ type: 'text', text }]
      }]);
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        if (!response.ok) throw new Error('Task generation failed');
        const taskData = await response.json();
        // Add assistant message with tasks
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [
            { type: 'text', text: 'Here are the generated tasks:' },
            { type: 'data-task', data: taskData }
          ]
        }]);
      } catch (error) {
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [{ type: 'text', text: 'Failed to generate tasks: ' + (error as Error).message }]
        }]);
      }
    } else if (isV0Command) {
      // Add user message
      setSpecialMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        parts: [{ type: 'text', text }]
      }]);
      try {
        const response = await fetch('/api/v0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        if (!response.ok) throw new Error('V0 UI generation failed');
        const v0Data = await response.json();
        // Add assistant message with web preview
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [
            { type: 'text', text: 'Here is your generated UI:' },
            { type: 'data-v0', data: v0Data }
          ]
        }]);
      } catch (error) {
        setSpecialMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          parts: [{ type: 'text', text: 'Failed to generate UI: ' + (error as Error).message }]
        }]);
      }
    } else {
      sendMessage(
        {
          text: text,
          files: message.files
        },
        {
          body: {
            model: model,
            webSearch: webSearch,
          },
        },
      );
    }
    setInput('');
  };
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {[...messages, ...specialMessages].map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.some((part: any) => part.type === 'source-url') && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part: any) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part: any) => part.type === 'source-url').map((part: any, i: number) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part: any, i: number) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <MessageActions>
                              <MessageAction
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    case 'data-image':
                      return <AIImage key={`${message.id}-${i}`} {...part.data} />;
                    case 'data-task':
                      return (
                        <div key={`${message.id}-${i}`}>
                          {part.data.tasks.map((task: any, taskIndex: number) => renderTask(task, taskIndex, message.id, i))}
                        </div>
                      );
                    case 'data-v0':
                      return (
                        <WebPreview key={`${message.id}-${i}`} defaultUrl={part.data.url}>
                          <WebPreviewNavigation>
                            <WebPreviewUrl />
                          </WebPreviewNavigation>
                          <WebPreviewBody src={part.data.url} />
                        </WebPreview>
                      );
                    case 'chain-of-thought':
                      return (
                        <ChainOfThought key={`${message.id}-${i}`}>
                          <ChainOfThoughtHeader>Chain of Thought</ChainOfThoughtHeader>
                          <ChainOfThoughtContent>
                            <ChainOfThoughtStep label="Step 1">{part.text || 'Analyzing...'}</ChainOfThoughtStep>
                          </ChainOfThoughtContent>
                        </ChainOfThought>
                      );
                    case 'checkpoint':
                      return <Checkpoint key={`${message.id}-${i}`}><CheckpointTrigger tooltip="Checkpoint" /></Checkpoint>;
                    case 'confirmation':
                      return (
                        <Confirmation key={`${message.id}-${i}`} approval={part.data?.approval} state={part.data?.state}>
                          <ConfirmationTitle>Confirm Action</ConfirmationTitle>
                          <ConfirmationActions>
                            <ConfirmationAction>Approve</ConfirmationAction>
                            <ConfirmationAction>Reject</ConfirmationAction>
                          </ConfirmationActions>
                        </Confirmation>
                      );
                    case 'context':
                      return (
                        <Context key={`${message.id}-${i}`} usedTokens={part.data?.usedTokens || 0} maxTokens={part.data?.maxTokens || 1000} usage={part.data?.usage}>
                          <ContextTrigger>Usage</ContextTrigger>
                          <ContextContent>
                            <ContextContentHeader />
                            <ContextInputUsage />
                            <ContextOutputUsage />
                          </ContextContent>
                        </Context>
                      );
                    case 'inline-citation':
                      return (
                        <InlineCitation key={`${message.id}-${i}`}>
                          <InlineCitationText>{part.text || 'Citation'}</InlineCitationText>
                          <InlineCitationCard>
                            <InlineCitationCardTrigger sources={part.data?.sources || []} />
                            <InlineCitationCardBody>
                              <InlineCitationSource title="Source" url={part.data?.url} />
                            </InlineCitationCardBody>
                          </InlineCitationCard>
                        </InlineCitation>
                      );
                    case 'plan':
                      return (
                        <Plan key={`${message.id}-${i}`}>
                          <PlanHeader>
                            <PlanTitle>Plan</PlanTitle>
                            <PlanDescription>Description</PlanDescription>
                          </PlanHeader>
                          <PlanContent>{part.text || 'Planning...'}</PlanContent>
                          <PlanTrigger />
                        </Plan>
                      );
                    case 'queue':
                      return (
                        <Queue key={`${message.id}-${i}`}>
                          <QueueSection>
                            <QueueSectionTrigger>
                              <QueueSectionLabel label="Queue" count={part.data?.items?.length || 0} />
                            </QueueSectionTrigger>
                            <QueueSectionContent>
                              <QueueList>
                                {part.data?.items?.map((item: any, idx: number) => renderQueueItem(item, idx))}
                              </QueueList>
                            </QueueSectionContent>
                          </QueueSection>
                        </Queue>
                      );
                    case 'shimmer':
                      return <Shimmer key={`${message.id}-${i}`}>{part.text || 'Loading...'}</Shimmer>;
                    case 'suggestion':
                      return <Suggestion key={`${message.id}-${i}`} suggestion={part.text || 'Suggestion'} />;
                    case 'tool':
                      return <Tool key={`${message.id}-${i}`}>{part.text || 'Tool'}</Tool>;
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBot;
