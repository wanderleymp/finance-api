import axios, { AxiosInstance } from 'axios';
import { Logger } from '../../utils/logger';

// Interfaces
export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export interface SendMessageResponse {
  messageId: string;
  status: string;
  providerResponse: any;
}

export class IntegrationError extends Error {
  constructor(public details: {
    provider: string;
    message: string;
    status?: number;
    originalError?: any;
    data?: any;
  }) {
    super(details.message);
    this.name = 'IntegrationError';
  }
}

export interface IntegrationProviderInterface {
  send(params: { 
    to: string, 
    content: string, 
    metadata?: any 
  }): Promise<SendMessageResponse>;
}

export class EvolutionApiClient {
  private httpClient: AxiosInstance;
  private logger: Logger;

  constructor(private config: EvolutionApiConfig) {
    this.logger = new Logger('EvolutionApiClient');
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Método para enviar mensagem de texto
  async sendTextMessage(to: string, message: string): Promise<SendMessageResponse> {
    try {
      const response = await this.httpClient.post('/message/send', {
        number: this.formatPhoneNumber(to),
        message: message,
        instance: this.config.instance
      });

      return {
        messageId: response.data.id,
        status: 'SENT',
        providerResponse: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Método para enviar mídia
  async sendMediaMessage(to: string, mediaUrl: string, caption?: string): Promise<SendMessageResponse> {
    try {
      const response = await this.httpClient.post('/message/sendMedia', {
        number: this.formatPhoneNumber(to),
        mediaUrl: mediaUrl,
        caption: caption,
        instance: this.config.instance
      });

      return {
        messageId: response.data.id,
        status: 'SENT',
        providerResponse: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Formata número de telefone
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não existir
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  }

  // Tratamento de erros
  private handleError(error: any): never {
    const errorDetails = {
      message: error.response?.data?.message || 'Erro desconhecido',
      status: error.response?.status,
      data: error.response?.data
    };

    this.logger.error('Erro na Evolution API', errorDetails);

    throw new IntegrationError({
      provider: 'EVOLUTION_API',
      originalError: error,
      ...errorDetails
    });
  }
}

export class EvolutionIntegrationProvider implements IntegrationProviderInterface {
  private apiClient: EvolutionApiClient;

  constructor(credentials: any) {
    // Valida credenciais
    this.validateCredentials(credentials);

    this.apiClient = new EvolutionApiClient({
      baseUrl: credentials.server_url,
      apiKey: credentials.apikey,
      instance: credentials.instance
    });
  }

  async send(params: { 
    to: string, 
    content: string, 
    metadata?: any 
  }): Promise<SendMessageResponse> {
    // Verifica tipo de conteúdo
    if (params.metadata?.contentType === 'MEDIA') {
      return this.apiClient.sendMediaMessage(
        params.to, 
        params.content, 
        params.metadata?.caption
      );
    }

    // Padrão para mensagem de texto
    return this.apiClient.sendTextMessage(params.to, params.content);
  }

  // Validação de credenciais
  private validateCredentials(credentials: any) {
    const requiredFields = ['server_url', 'apikey', 'instance'];
    requiredFields.forEach(field => {
      if (!credentials[field]) {
        throw new Error(`Credencial obrigatória ausente: ${field}`);
      }
    });
  }
}
