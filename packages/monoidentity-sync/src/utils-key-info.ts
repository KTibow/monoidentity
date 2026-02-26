export const keyIsLocal = (key: string) => key.startsWith('.cache/') || key.startsWith('.local/');
export const keyIsPlainText = (key: string) => key.endsWith('.md') || key.endsWith('.devalue');
