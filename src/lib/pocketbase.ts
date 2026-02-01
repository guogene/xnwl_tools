import PocketBase from 'pocketbase';

// 从环境变量获取 PocketBase URL，如果未设置则使用默认值
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://206.237.5.59:8009';

export const pb = new PocketBase(POCKETBASE_URL); 