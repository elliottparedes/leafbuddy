import { Auth } from '@auth/core';
import type { RequestHandler } from './$types';
import { authConfig } from '../../../auth';

const authHandler: RequestHandler = ({ request }) => Auth(request, authConfig);

export const GET = authHandler;
export const POST = authHandler;