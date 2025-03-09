import PocketBase from 'pocketbase';

// 从环境变量获取 PocketBase URL，如果未设置则使用默认值
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL); 