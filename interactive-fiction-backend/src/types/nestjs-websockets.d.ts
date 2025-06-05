declare module '@nestjs/websockets' {
  export const WebSocketGateway: (...args: any[]) => ClassDecorator;
  export const WebSocketServer: () => PropertyDecorator;
  export const SubscribeMessage: (event: string) => MethodDecorator;
  export const MessageBody: () => ParameterDecorator;
  export const ConnectedSocket: () => ParameterDecorator;
  export interface OnGatewayConnection {
    handleConnection(client: any, ...args: any[]): any;
  }
  export interface OnGatewayDisconnect {
    handleDisconnect(client: any): any;
  }
}
