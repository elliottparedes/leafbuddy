import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';

export const handle = sequence(authHandle);