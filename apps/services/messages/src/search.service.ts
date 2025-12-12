import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { MessageDocument } from './schemas/message.schema';

const INDEX_NAME = 'ultrachat_messages';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      node: config.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
    });
  }

  async onModuleInit() {
    await this.createIndex();
  }

  private async createIndex() {
    const exists = await this.client.indices.exists({ index: INDEX_NAME });

    if (!exists) {
      await this.client.indices.create({
        index: INDEX_NAME,
        body: {
          settings: {
            analysis: {
              analyzer: {
                message_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
            },
          },
          mappings: {
            properties: {
              chatId: { type: 'keyword' },
              senderId: { type: 'keyword' },
              content: {
                type: 'text',
                analyzer: 'message_analyzer',
              },
              type: { type: 'keyword' },
              createdAt: { type: 'date' },
              mentions: { type: 'keyword' },
            },
          },
        },
      });
    }
  }

  async indexMessage(message: MessageDocument): Promise<void> {
    try {
      await this.client.index({
        index: INDEX_NAME,
        id: message._id.toString(),
        body: {
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          mentions: message.mentions,
        },
      });
    } catch (error) {
      console.error('Failed to index message:', error);
    }
  }

  async updateMessage(message: MessageDocument): Promise<void> {
    try {
      await this.client.update({
        index: INDEX_NAME,
        id: message._id.toString(),
        body: {
          doc: {
            content: message.content,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update message in index:', error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.delete({
        index: INDEX_NAME,
        id: messageId,
      });
    } catch (error) {
      console.error('Failed to delete message from index:', error);
    }
  }

  async search(
    query: string,
    options: {
      chatIds?: string[];
      senderId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ hits: any[]; total: number }> {
    const { chatIds, senderId, limit = 20, offset = 0 } = options;

    const must: any[] = [
      {
        match: {
          content: {
            query,
            fuzziness: 'AUTO',
          },
        },
      },
    ];

    if (chatIds?.length) {
      must.push({ terms: { chatId: chatIds } });
    }

    if (senderId) {
      must.push({ term: { senderId } });
    }

    const result = await this.client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: { must },
        },
        highlight: {
          fields: {
            content: {},
          },
        },
        from: offset,
        size: limit,
        sort: [{ createdAt: 'desc' }],
      },
    });

    return {
      hits: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        highlights: hit.highlight?.content || [],
      })),
      total: typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0,
    };
  }
}
