export type ChatMessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ChatMessageStatusEntity {
    status_id: number;
    message_id: number;
    status: ChatMessageStatus;
    occurred_at: Date;
}

export interface ChatMessageStatusCreateDTO {
    message_id: number;
    status: ChatMessageStatus;
}

export interface ChatMessageStatusQueryParams {
    page?: number;
    limit?: number;
    messageId?: number;
    status?: ChatMessageStatus;
}

export interface ChatMessageStatusResponse {
    id: number;
    messageId: number;
    status: ChatMessageStatus;
    occurredAt: Date;
    contactName?: string;
    messageContent?: string;
}

export interface ChatMessageStatusPaginatedResponse {
    items: ChatMessageStatusResponse[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}
