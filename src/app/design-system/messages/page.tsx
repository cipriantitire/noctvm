'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui';
import MessageTree, { MessageTreeNode } from '@/components/ui/MessageTree';
import VerifiedBadge from '@/components/VerifiedBadge';
import CodePreview from '../CodePreview';

const initialMockData: MessageTreeNode[] = [
  {
    id: '1',
    authorName: 'Alex Cipher',
    authorHandle: '@alexcipher',
    authorFallback: 'A',
    authorBadge: <VerifiedBadge type="verified" size="xs" />,
    content: 'This new UI component is looking phenomenal. The recursive threading feels very clean.',
    timestampStr: '2h',
    replies: [
      {
        id: '1-1',
        authorName: 'Sarah Node',
        authorHandle: '@sarahnode',
        authorFallback: 'S',
        content: 'I agree! I specifically love the curved elbows and how the vertical lines connect.',
        timestampStr: '1h',
        replies: [
          {
            id: '1-1-1',
            authorName: 'Alex Cipher',
            authorHandle: '@alexcipher',
            authorFallback: 'A',
            authorBadge: <VerifiedBadge type="verified" size="xs" />,
            content: 'Wait until you see how it handles editing and deleting inside the popover menu.',
            timestampStr: '10m',
          }
        ]
      },
      {
        id: '1-2',
        authorName: 'Marcus Volt',
        authorHandle: '@marcus_v',
        authorFallback: 'M',
        content: 'Is this component strictly for comments or can we use it for an inbox UI too?',
        timestampStr: '30m'
      }
    ]
  },
  {
    id: '2',
    authorName: 'Nexus Events',
    authorHandle: '@nexusevents',
    authorFallback: 'N',
    authorBadge: <VerifiedBadge type="owner" size="xs" />,
    content: 'Tickets for this Friday drop at midnight. Do not sleep on this one...',
    timestampStr: '4h',
  }
];

export default function MessageTreeShowcasePage() {
  const [data, setData] = useState<MessageTreeNode[]>(initialMockData);

  // Deep clone helper for recursive updates
  const updateTree = (nodes: MessageTreeNode[], targetId: string, updater: (node: MessageTreeNode) => MessageTreeNode | null): MessageTreeNode[] => {
    return nodes.reduce((acc, node) => {
      if (node.id === targetId) {
        const updated = updater(node);
        if (updated) acc.push(updated); // null means delete
      } else {
        const newNode = { ...node };
        if (newNode.replies) {
          newNode.replies = updateTree(newNode.replies, targetId, updater);
        }
        acc.push(newNode);
      }
      return acc;
    }, [] as MessageTreeNode[]);
  };

  const handleReply = (parentId: string, text: string) => {
    const newReply: MessageTreeNode = {
      id: Math.random().toString(),
      authorName: 'You',
      authorHandle: '@guest',
      authorFallback: 'U',
      content: text,
      timestampStr: 'Now',
    };

    if (parentId === 'root') {
      setData([newReply, ...data]);
      return;
    }

    setData(updateTree(data, parentId, (node) => {
      return {
        ...node,
        replies: [...(node.replies || []), newReply]
      };
    }));
  };

  const handleEdit = (nodeId: string, newText: string) => {
    setData(updateTree(data, nodeId, (node) => ({ ...node, content: newText })));
  };

  const handleDelete = (nodeId: string) => {
    setData(updateTree(data, nodeId, () => null));
  };

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-4">Message Trees</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          A generic, highly-recursive component for structuring comments, threaded messages, and conversational UI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-white">Interactive Thread Preview</h2>
            <GlassPanel variant="subtle" className="p-6 md:p-8">
              <MessageTree 
                data={data} 
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </GlassPanel>
            
            <CodePreview code={`<MessageTree 
  data={treeData} 
  onReply={(nodeId, text) => handleReply(nodeId, text)}
  onEdit={(nodeId, newText) => handleEdit(nodeId, newText)}
  onDelete={(nodeId) => handleDelete(nodeId)}
  hideRootInput={false} // optional
/>`} />
          </section>

        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Features</h3>
            <ul className="space-y-4 text-sm text-noctvm-silver leading-relaxed list-disc list-inside">
              <li>Supports infinite recursive depth.</li>
              <li>Purely presentational (bring your own state/database).</li>
              <li>Calculates visual &quot;elbows&quot; and &quot;stems&quot; using CSS absolute positioning to perfectly link replies to their parents.</li>
              <li>Built-in inline Edit modes and floating Option popovers.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
