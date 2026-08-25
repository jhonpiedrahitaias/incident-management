export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    readonly id: number;
    message: string;
    type: NotificationType;
    dateCreated: Date;
}